from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, Request
from services.pdf_parser import parse_pdf
from services.db import get_student_by_roll, save_parsed_result
from routers.rate_limit import upload_limiter
import os
import hmac
import asyncio
import sys

router = APIRouter(prefix="/upload", tags=["Upload"])

INVITE_CODE = os.environ.get("INVITE_CODE")
if not INVITE_CODE:
    raise RuntimeError("INVITE_CODE environment variable must be set.")

# 5 MB file size cap
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

PDF_MAGIC = b"%PDF"

# Allowed content-type values (browsers send this for PDFs)
ALLOWED_CONTENT_TYPES = {"application/pdf", "application/x-pdf"}

# Per-file processing timeout: parse (CPU-bound) + DB writes should finish well under this
PROCESS_TIMEOUT_SECONDS = 25


@router.post("/", dependencies=[Depends(upload_limiter)])
async def upload_result(
    request: Request,
    file: UploadFile = File(...),
    invite_code: str = Form(...),
):
    # 1. Validate Invite Code (constant-time)
    if not hmac.compare_digest(invite_code, INVITE_CODE):
        raise HTTPException(status_code=401, detail="Invalid invite code")

    # 2. Validate filename extension
    if not (file.filename or "").lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    # 3. Validate MIME type reported by the client (not a substitute for magic-byte
    #    check, but adds one more hurdle)
    if file.content_type and file.content_type.lower() not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    # 4. Read content with size guard
    content = await file.read(MAX_FILE_SIZE_BYTES + 1)
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 5 MB.")

    # 5. Validate PDF magic bytes (not just filename)
    if not content.startswith(PDF_MAGIC):
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid PDF.")

    # 6. Parse + save, wrapped in a hard timeout so a slow PDF or DB call can't
    #    stall the worker indefinitely and cause silent connection drops.
    try:
        async def _process():
            loop = asyncio.get_event_loop()

            # Parse PDF in a thread pool (CPU-bound) — keeps the event loop free
            parsed_data = await loop.run_in_executor(None, parse_pdf, content)

            student_info = parsed_data.get("student", {})
            roll_number  = student_info.get("roll_number")

            if not roll_number:
                raise HTTPException(
                    status_code=400,
                    detail="Could not extract roll number from PDF",
                )

            if not parsed_data.get("semesters"):
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "The PDF does not contain semester details. "
                        "Expand all semesters in AKTU One View before saving as PDF."
                    ),
                )

            # 7. Check if student belongs to the tracked batch
            student = get_student_by_roll(roll_number)
            if not student:
                raise HTTPException(
                    status_code=404,
                    detail="Roll number not found in the batch. You cannot upload results for other batches.",
                )

            # 8. Persist to DB (parallelised inside save_parsed_result)
            await save_parsed_result(student["id"], roll_number, parsed_data)

            return {"message": "Result uploaded and parsed successfully", "roll_number": roll_number}

        return await asyncio.wait_for(_process(), timeout=PROCESS_TIMEOUT_SECONDS)

    except asyncio.TimeoutError:
        print(
            f"[upload] Processing timeout for file={file.filename!r}",
            file=sys.stderr,
        )
        raise HTTPException(
            status_code=504,
            detail=(
                "PDF processing timed out. The server took too long — "
                "please try again. If the problem persists, try uploading fewer files at once."
            ),
        )
    except HTTPException:
        raise
    except Exception as exc:
        # Log to stderr so errors show in server logs without leaking to clients
        print(f"[upload] Unexpected error for file={file.filename!r}: {exc}", file=sys.stderr)
        raise HTTPException(
            status_code=500,
            detail="An internal error occurred while processing the PDF.",
        )
