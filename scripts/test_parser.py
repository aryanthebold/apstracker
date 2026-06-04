import sys
import os
import json

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from services.pdf_parser import parse_pdf

def test():
    pdf_path = os.path.join(os.path.dirname(__file__), "..", "backend", "last_uploaded.pdf")
    if not os.path.exists(pdf_path):
        print(f"File not found: {pdf_path}")
        return
        
    print(f"Parsing {pdf_path}...")
    res = parse_pdf(pdf_path)
    print(json.dumps(res, indent=2))

if __name__ == "__main__":
    test()
