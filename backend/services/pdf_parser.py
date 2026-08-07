import fitz  # pymupdf
import re
import sys
from typing import Optional

# ── Pre-compiled regexes (compiled once at import, ~15% faster per call) ──────
_RE_NAME   = re.compile(r"Name\s*:\s*([^\n]+)", re.IGNORECASE)
_RE_ROLL   = re.compile(r"Roll\s*(?:No\.?)?\s*:\s*([A-Za-z0-9]+)", re.IGNORECASE)
_RE_ENR    = re.compile(r"Enrollment\s*(?:No\.?)?\s*:\s*([A-Z0-9]+)", re.IGNORECASE)
_RE_FATHER = re.compile(r"Father['\s]?s?\s*Name\s*:\s*([^\n]+)", re.IGNORECASE)
_RE_BRANCH = re.compile(r"Branch\s*(?:Code\s*&\s*Name)?\s*:\s*([^\n]+)", re.IGNORECASE)
_RE_GENDER = re.compile(r"Gender\s*:\s*([A-Za-z]+)", re.IGNORECASE)
_RE_RESULT = re.compile(r"Result\s*Status\s*:\s*([^\n]+)", re.IGNORECASE)
_RE_UFM    = re.compile(r"Remarks\s*:\s*([^\n]*UFM[^\n]*)", re.IGNORECASE)
_RE_SEM    = re.compile(r"(?i)\bSemester\s*:\s*(\d+)")
_RE_SGPA   = re.compile(r"SGPA\s*:\s*([\d.]+)")
_RE_STATUS = re.compile(r"Result\s*Status\s*:\s*([^\n]+)")
_RE_MARKS  = re.compile(r"Total\s*Marks(?:\s*Obt\.?)?\s*:\s*(\d+)", re.IGNORECASE)
_RE_DOD    = re.compile(r"Date\s*of\s*Declaration\s*:\s*([\d\/-]+)")

# Subject line regex — non-greedy name (.+?) prevents consuming the type token.
# Handles full names (Theory/Practical/CA) and AKTU abbreviations (TH/PR/IA).
_RE_SUBJECT = re.compile(
    r"^([A-Z0-9]{3,})\s+(.+?)\s+(Theory|Practical|CA|TH|PR|IA)\s*(.*?)$",
    re.MULTILINE,
)

# Valid grade: one or more uppercase letters, optionally followed by '+', and optionally ending in '*'
_RE_GRADE = re.compile(r"^[A-Z][A-Z+]*\*?$")


# ── Small helpers ──────────────────────────────────────────────────────────────

def _safe_int(s: str) -> int:
    """Convert a string to int, stripping asterisks (back-paper marks). Returns 0 on failure."""
    s = s.strip().replace("*", "")
    return int(s) if s.isdigit() else 0


def _parse_date(raw: str) -> Optional[str]:
    """Normalise AKTU date strings (DD/MM/YY, DD/MM/YYYY, YYYY/MM/DD, etc.) → ISO 8601."""
    try:
        parts = re.split(r"[/\-]", raw.strip())
        if len(parts) == 3:
            p0, p1, p2 = parts[0].strip(), parts[1].strip(), parts[2].strip()
            if len(p2) in (2, 4):            # DD/MM/YY or DD/MM/YYYY
                year  = p2 if len(p2) == 4 else f"20{p2}"
                return f"{year}-{int(p1):02d}-{int(p0):02d}"
            elif len(p0) in (2, 4):          # YYYY/MM/DD or YY/MM/DD
                year  = p0 if len(p0) == 4 else f"20{p0}"
                return f"{year}-{int(p1):02d}-{int(p2):02d}"
    except Exception:
        pass
    return raw


def _parse_subject_rest(rest: str):
    """
    Parse the trailing columns after the subject-type token:
        internal  external  [back_paper]  grade

    Returns (internal_marks, external_marks, grade).
    """
    parts = [p for p in rest.split() if p]

    internal   = 0
    external   = 0
    grade      = ""
    back_paper = "--"

    if len(parts) >= 1 and parts[0] != "--":
        internal = _safe_int(parts[0])
    if len(parts) >= 2 and parts[1] != "--":
        external = _safe_int(parts[1])
    # Third token: could be a back-paper numeric mark or grade
    if len(parts) >= 3:
        tok = parts[2].replace("*", "")
        if tok.isdigit():
            back_paper = parts[2]   # numeric → back-paper attempt score
        elif _RE_GRADE.match(tok):
            grade = tok             # letter → this is the grade early (3-col format)
    # Last token: usually the grade letter
    if parts and _RE_GRADE.match(parts[-1]):
        grade = parts[-1]

    # Back-paper mark supersedes the originally extracted external mark
    if back_paper != "--":
        external = _safe_int(back_paper)

    return internal, external, grade


# ── Main parser ────────────────────────────────────────────────────────────────

def parse_pdf(file_bytes: bytes) -> dict:
    """
    Parse raw AKTU Result PDF bytes → structured dict.
    No temp file is created; bytes are passed directly to PyMuPDF.
    """
    data: dict = {"student": {}, "semesters": [], "overall": {}}

    # 1. Extract full text ─────────────────────────────────────────────────────
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        pages = [page.get_text() for page in doc]
        doc.close()
    except Exception as exc:
        print(f"[pdf_parser] fitz extraction failed: {exc}", file=sys.stderr)
        return data   # return empty structure; caller validates

    text = "\n".join(pages)

    # 2. Student header fields ─────────────────────────────────────────────────
    if m := _RE_NAME.search(text):
        data["student"]["name"] = m.group(1).strip()
    if m := _RE_ROLL.search(text):
        data["student"]["roll_number"] = m.group(1).strip()
    if m := _RE_ENR.search(text):
        data["student"]["enrollment_number"] = m.group(1).strip()
    if m := _RE_FATHER.search(text):
        data["student"]["father_name"] = m.group(1).strip()
    if m := _RE_BRANCH.search(text):
        data["student"]["branch"] = m.group(1).strip()
    if m := _RE_GENDER.search(text):
        data["student"]["gender"] = m.group(1).strip()

    # 3. Overall result status + UFM flag ──────────────────────────────────────
    if m := _RE_RESULT.search(text):
        data["overall"]["result_status"] = m.group(1).strip()
    if m := _RE_UFM.search(text):
        ufm_text = m.group(1).strip()
        existing = data["overall"].get("result_status", "")
        data["overall"]["result_status"] = (
            f"{existing} | UFM_FLAG: {ufm_text}" if existing else f"UFM_FLAG: {ufm_text}"
        )

    # 4. Split text into per-semester blocks ───────────────────────────────────
    sem_blocks = _RE_SEM.split(text)
    semesters_dict: dict[int, dict] = {}

    if len(sem_blocks) > 1:
        for i in range(1, len(sem_blocks), 2):
            try:
                sem_num = int(sem_blocks[i])
                block   = sem_blocks[i + 1]
            except (IndexError, ValueError):
                continue

            # Per-semester scalars
            sgpa          = float(m.group(1)) if (m := _RE_SGPA.search(block)) else None
            result_status = m.group(1).strip() if (m := _RE_STATUS.search(block)) else None
            total_marks   = int(m.group(1))    if (m := _RE_MARKS.search(block)) else None
            dod           = _parse_date(m.group(1).strip()) if (m := _RE_DOD.search(block)) else None

            sem_data: dict = {
                "semester":            sem_num,
                "sgpa":                sgpa,
                "result_status":       result_status,
                "total_marks":         total_marks,
                "date_of_declaration": dod,
                "subjects":            [],
                "backs_in_sem":        0,
            }

            # Subject rows
            for code, name, sub_type, rest in _RE_SUBJECT.findall(block):
                try:
                    internal, external, grade = _parse_subject_rest(rest)
                except Exception as exc:
                    print(f"[pdf_parser] subject parse error sem={sem_num} code={code}: {exc}",
                          file=sys.stderr)
                    internal = external = 0
                    grade = ""

                grade_clean = grade.replace("*", "")
                is_back = (grade_clean == "F" or grade_clean == "ABS")
                if is_back:
                    sem_data["backs_in_sem"] += 1

                sem_data["subjects"].append({
                    "subject_code":  code.strip(),
                    "subject_name":  name.strip(),
                    "subject_type":  sub_type.strip(),
                    "internal_marks": internal,
                    "external_marks": external,
                    "total_marks":    internal + external,
                    "grade":          grade,
                    "is_back":        is_back,
                })

            # Skip placeholder blocks with no usable data
            if not sem_data["subjects"] and sgpa is None:
                continue

            semesters_dict[sem_num] = sem_data

    data["semesters"] = [semesters_dict[k] for k in sorted(semesters_dict.keys())]
    return data


if __name__ == "__main__":
    print("Testing parser — pass a path as argument")
    import sys as _sys
    if len(_sys.argv) > 1:
        with open(_sys.argv[1], "rb") as fh:
            result = parse_pdf(fh.read())
        import json
        print(json.dumps(result, indent=2, default=str))
