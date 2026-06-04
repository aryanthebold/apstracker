import pdfplumber
import os

pdf_path = os.path.join(os.path.dirname(__file__), "..", "backend", "last_uploaded.pdf")
with pdfplumber.open(pdf_path) as pdf:
    text = ""
    for page in pdf.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted + "\n"

out_path = os.path.join(os.path.dirname(__file__), "..", "backend", "extracted_text.txt")
with open(out_path, "w", encoding="utf-8") as f:
    f.write(text)

print("Saved raw text to", out_path)
