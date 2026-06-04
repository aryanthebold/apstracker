from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, Request
from services.pdf_parser import parse_pdf
from services.db import get_student_by_roll, save_parsed_result
from routers.rate_limit import upload_limiter
import os
import tempfile
import hmac

router = APIRouter(prefix="/upload", tags=["Upload"])

INVITE_CODE = os.environ.get("INVITE_CODE")
if not INVITE_CODE:
    raise RuntimeError("INVITE_CODE environment variable must be set.")

# 5 MB file size cap
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

PDF_MAGIC = b"%PDF"

# Allowed content-type values (browsers send this for PDFs)
ALLOWED_CONTENT_TYPES = {"application/pdf", "application/x-pdf"}


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

    # 6. Parse PDF from temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        parsed_data = parse_pdf(tmp_path)

        student_info = parsed_data.get("student", {})
        roll_number = student_info.get("roll_number")

        if not roll_number:
            raise HTTPException(status_code=400, detail="Could not extract roll number from PDF")

        if not parsed_data.get("semesters"):
            raise HTTPException(
                status_code=400,
                detail="The PDF does not contain semester details. Expand all semesters in AKTU One View before saving as PDF.",
            )

        # 7. Check if student belongs to the tracked batch
        student = get_student_by_roll(roll_number)
        if not student:
            raise HTTPException(
                status_code=404,
                detail="Roll number not found in the batch. You cannot upload results for other batches.",
            )

        # 8. Save parsed data to DB
        save_parsed_result(student["id"], roll_number, parsed_data)

        return {"message": "Result uploaded and parsed successfully", "roll_number": roll_number}

    except HTTPException:
        raise
    except Exception:
        # Never leak internal error details to the client
        raise HTTPException(status_code=500, detail="An internal error occurred while processing the PDF.")
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
