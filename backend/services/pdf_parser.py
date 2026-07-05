import fitz  # pymupdf
import re

def parse_pdf(file_bytes: bytes):
    """
    Parses the AKTU Result PDF and extracts structured data.
    Accepts raw PDF bytes directly (no temp file needed).
    """
    data = {
        "student": {},
        "semesters": [],
        "overall": {}
    }

    # Extract all text using pymupdf (5-10x faster than pdfplumber)
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text() + "\n"
    doc.close()

    # 2. Extract header block
    name_match = re.search(r"Name\s*:\s*([^\n]+)", text, re.IGNORECASE)
    if name_match:
        data["student"]["name"] = name_match.group(1).strip()
        
    roll_match = re.search(r"Roll\s*(?:No\.?)?\s*:\s*(\d+)", text, re.IGNORECASE)
    if roll_match:
        data["student"]["roll_number"] = roll_match.group(1).strip()
        
    enr_match = re.search(r"Enrollment\s*(?:No\.?)?\s*:\s*([A-Z0-9]+)", text, re.IGNORECASE)
    if enr_match:
        data["student"]["enrollment_number"] = enr_match.group(1).strip()
        
    father_match = re.search(r"Father['\s]?s\s*Name\s*:\s*([^\n]+)", text, re.IGNORECASE)
    if father_match:
        data["student"]["father_name"] = father_match.group(1).strip()
        
    branch_match = re.search(r"Branch\s*(?:Code\s*&\s*Name)?\s*:\s*([^\n]+)", text, re.IGNORECASE)
    if branch_match:
        data["student"]["branch"] = branch_match.group(1).strip()
        
    gender_match = re.search(r"Gender\s*:\s*([A-Z]+)", text, re.IGNORECASE)
    if gender_match:
        data["student"]["gender"] = gender_match.group(1).strip()
        
    # Overall result status
    overall_res_match = re.search(r"Result\s*Status\s*:\s*([^\n]+)", text, re.IGNORECASE)
    if overall_res_match:
        data["overall"]["result_status"] = overall_res_match.group(1).strip()

    # Search for UFM remarks
    ufm_match = re.search(r"Remarks\s*:\s*([^\n]*UFM[^\n]*)", text, re.IGNORECASE)
    if ufm_match:
        ufm_text = ufm_match.group(1).strip()
        if "result_status" in data["overall"]:
            data["overall"]["result_status"] += f" | UFM_FLAG: {ufm_text}"
        else:
            data["overall"]["result_status"] = f"UFM_FLAG: {ufm_text}"

    # 4. Split into semesters
    sem_blocks = re.split(r"(?i)\bSemester\s*:\s*(\d+)", text)
    
    semesters_dict = {}
    if len(sem_blocks) > 1:
        for i in range(1, len(sem_blocks), 2):
            sem_num = int(sem_blocks[i])
            block = sem_blocks[i+1]
            
            # 5a. Extract sem info
            sgpa_match = re.search(r"SGPA\s*:\s*([\d\.]+)", block)
            sgpa = float(sgpa_match.group(1)) if sgpa_match else None
            
            status_match = re.search(r"Result\s*Status\s*:\s*([^\n]+)", block)
            result_status = status_match.group(1).strip() if status_match else None
            
            total_marks_match = re.search(r"Total\s*Marks(?:\s*Obt\.?)?\s*:\s*(\d+)", block, re.IGNORECASE)
            total_marks = int(total_marks_match.group(1)) if total_marks_match else None
            
            dod_match = re.search(r"Date\s*of\s*Declaration\s*:\s*([\d\/-]+)", block)
            dod = None
            if dod_match:
                raw_dod = dod_match.group(1).strip()
                try:
                    parts = re.split(r'[/-]', raw_dod)
                    if len(parts) == 3:
                        p0, p1, p2 = parts[0].strip(), parts[1].strip(), parts[2].strip()
                        # If year is at the end (e.g. DD/MM/YY or DD/MM/YYYY)
                        if len(p2) in (2, 4):
                            year = p2 if len(p2) == 4 else f"20{p2}"
                            month = f"{int(p1):02d}"
                            day = f"{int(p0):02d}"
                            dod = f"{year}-{month}-{day}"
                        # If year is at the beginning (e.g. YY/MM/DD or YYYY/MM/DD)
                        elif len(p0) in (2, 4):
                            year = p0 if len(p0) == 4 else f"20{p0}"
                            month = f"{int(p1):02d}"
                            day = f"{int(p2):02d}"
                            dod = f"{year}-{month}-{day}"
                        else:
                            dod = raw_dod
                    else:
                        dod = raw_dod
                except Exception:
                    dod = raw_dod
            
            sem_data = {
                "semester": sem_num,
                "sgpa": sgpa,
                "result_status": result_status,
                "total_marks": total_marks,
                "date_of_declaration": dod,
                "subjects": [],
                "backs_in_sem": 0
            }
            
            # Subject line matching
            subject_lines_raw = re.findall(r"^([A-Z0-9]+)\s+(.+)\s+(Theory|Practical|CA)\s+(.*)$", block, re.MULTILINE)
            for sub in subject_lines_raw:
                code, name, sub_type, rest = sub
                parts = rest.split()
                
                internal = parts[0] if len(parts) > 0 and parts[0] != '--' else '0'
                external = parts[1] if len(parts) > 1 and parts[1] != '--' else '0'
                grade = parts[-1] if len(parts) > 0 and re.match(r'^[A-Z\+]+$', parts[-1]) else ''
                back_paper = parts[2] if len(parts) >= 4 else '--'
                
                # Active back is when they have failed (grade F)
                is_back = (grade == 'F')
                if is_back:
                    sem_data["backs_in_sem"] += 1
                    
                int_val = int(internal) if internal.isdigit() else 0
                
                # If they gave a back paper, the updated mark is in the back_paper column
                if back_paper != '--':
                    bp_mark = back_paper.replace('*', '')
                    ext_val = int(bp_mark) if bp_mark.isdigit() else 0
                else:
                    ext_val = int(external) if external.isdigit() else 0
                    
                sem_data["subjects"].append({
                    "subject_code": code.strip(),
                    "subject_name": name.strip(),
                    "subject_type": sub_type.strip(),
                    "internal_marks": int_val,
                    "external_marks": ext_val,
                    "total_marks": int_val + ext_val,
                    "grade": grade,
                    "is_back": is_back
                })
            
            if not sem_data["subjects"] and sgpa is None:
                continue
                
            semesters_dict[sem_num] = sem_data
            
    data["semesters"] = [semesters_dict[k] for k in sorted(semesters_dict.keys())]
    return data

if __name__ == "__main__":
    # Test locally
    print("Testing parser...")
    # print(parse_pdf("sample.pdf"))
