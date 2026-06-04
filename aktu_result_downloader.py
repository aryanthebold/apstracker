"""
AKTU One View Bulk Result Downloader
======================================
Portal : https://oneview.aktu.ac.in/WebPages/AKTU/OneView.aspx

The trick used here:
  - First search roll number 1305650004 → this sets a server session token
  - Then use browser Back (not refresh) → DOB field & CAPTCHA no longer required
  - Now all subsequent roll numbers can be searched freely with just the roll no.

Requirements:
    pip install selenium webdriver-manager

Usage:
    python aktu_result_downloader.py
    python aktu_result_downloader.py --start 2300001 --end 2300440 --output ./results
"""

import sys
import time
import base64
import argparse
import logging
from pathlib import Path

try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.chrome.service import Service
    from selenium.common.exceptions import TimeoutException, NoSuchElementException
    from webdriver_manager.chrome import ChromeDriverManager
except ImportError:
    print("\n❌  Missing dependencies. Run:\n\n    pip install selenium webdriver-manager\n")
    sys.exit(1)


# ─────────────────────────────────────────────────────────────
#  CONFIGURATION  ← Edit these before running
# ─────────────────────────────────────────────────────────────

ROLL_START  = "2405110100001"       # First roll number of your batch (inclusive)
ROLL_END    = "2405110100010"       # Last  roll number of your batch (inclusive)
OUTPUT_DIR  = "./aktu_results" # Folder where PDFs will be saved

# The "magic" roll number that unlocks the session (skips DOB for subsequent searches)
UNLOCK_ROLL = "1305650004"

PAGE_WAIT   = 15   # seconds to wait for page elements
DELAY       = 2    # seconds between each roll number (be polite to server)
MAX_RETRIES = 2    # retries before skipping a roll number

# ─────────────────────────────────────────────────────────────

PORTAL_URL = "https://oneview.aktu.ac.in/WebPages/AKTU/OneView.aspx"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("aktu_downloader.log", encoding="utf-8"),
    ]
)
log = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────
#  BROWSER SETUP
# ─────────────────────────────────────────────────────────────

def build_driver() -> webdriver.Chrome:
    options = Options()

    # Browser stays visible — uncomment below for headless (no window)
    # options.add_argument("--headless=new")

    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1280,900")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)

    service = Service(ChromeDriverManager().install())
    driver  = webdriver.Chrome(service=service, options=options)
    driver.execute_script(
        "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
    )
    return driver


# ─────────────────────────────────────────────────────────────
#  HELPERS
# ─────────────────────────────────────────────────────────────

def wait_for(driver, by, value, timeout=PAGE_WAIT):
    return WebDriverWait(driver, timeout).until(
        EC.presence_of_element_located((by, value))
    )

def wait_clickable(driver, by, value, timeout=PAGE_WAIT):
    return WebDriverWait(driver, timeout).until(
        EC.element_to_be_clickable((by, value))
    )

def find_roll_input(driver):
    """Try multiple selectors to locate the roll number input field."""
    for by, val in [
        (By.NAME,  "txtrno"),
        (By.ID,    "txtrno"),
        (By.NAME,  "txtrollno"),
        (By.ID,    "txtrollno"),
        (By.XPATH, "//input[contains(translate(@id,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'roll')]"),
        (By.XPATH, "//input[@type='text'][1]"),
    ]:
        try:
            el = wait_for(driver, by, val, timeout=6)
            return el
        except TimeoutException:
            continue
    return None

def find_submit_btn(driver):
    """Try multiple selectors to locate the Next/Proceed/Submit button."""
    for by, val in [
        (By.XPATH, "//input[@type='submit']"),
        (By.XPATH, "//button[@type='submit']"),
        (By.XPATH, "//input[@type='button']"),
        (By.XPATH, "//button[contains(text(),'आगे') or contains(text(),'Next') or contains(text(),'Proceed') or contains(text(),'खोज') or contains(text(),'Find')]"),
    ]:
        try:
            el = wait_clickable(driver, by, val, timeout=5)
            return el
        except TimeoutException:
            continue
    return None

def save_pdf(driver, path: str):
    """Silently save the current page as PDF using Chrome DevTools Protocol."""
    result = driver.execute_cdp_cmd("Page.printToPDF", {
        "printBackground":     True,
        "paperWidth":          8.27,   # A4
        "paperHeight":         11.69,
        "marginTop":           0.4,
        "marginBottom":        0.4,
        "marginLeft":          0.4,
        "marginRight":         0.4,
        "displayHeaderFooter": False,
        "scale":               0.9,
    })
    with open(path, "wb") as f:
        f.write(base64.b64decode(result["data"]))


# ─────────────────────────────────────────────────────────────
#  SESSION UNLOCK
# ─────────────────────────────────────────────────────────────

def unlock_session(driver) -> bool:
    """
    Search the unlock roll number first.
    This sets a server-side session token that lets all subsequent
    searches skip the DOB requirement and CAPTCHA gate.
    """
    log.info(f"🔓  Unlocking session with roll number: {UNLOCK_ROLL} ...")
    try:
        driver.get(PORTAL_URL)
        time.sleep(2)

        roll_input = find_roll_input(driver)
        if not roll_input:
            log.error("Could not find roll number field on the portal. Check if the URL is correct.")
            return False

        roll_input.clear()
        roll_input.send_keys(UNLOCK_ROLL)

        btn = find_submit_btn(driver)
        if not btn:
            log.error("Could not find the submit button.")
            return False
        btn.click()

        # Wait for result page to load
        time.sleep(3)
        WebDriverWait(driver, PAGE_WAIT).until(
            lambda d: len(d.page_source) > 5000 and d.execute_script("return document.readyState") == "complete"
        )

        log.info("✅  Session unlocked! DOB gate is now bypassed for this session.")
        return True

    except Exception as e:
        log.error(f"Session unlock failed: {e}")
        return False


# ─────────────────────────────────────────────────────────────
#  FETCH ONE RESULT
# ─────────────────────────────────────────────────────────────

def fetch_result(driver, roll_no: str, out_dir: str) -> bool:
    """
    Go back to the search page (using browser Back — NOT refresh),
    enter roll_no, submit, wait for result, save as PDF.
    """
    try:
        # Use Back button to return to search form (preserves session token)
        driver.back()
        time.sleep(1.5)

        # Make sure we're on the search page; if not, go there directly
        if "OneView" not in driver.current_url and "oneview" not in driver.current_url.lower():
            driver.get(PORTAL_URL)
            time.sleep(2)

        # ── Fill roll number ─────────────────────────────────────────
        roll_input = find_roll_input(driver)
        if not roll_input:
            log.warning(f"  Roll input not found for {roll_no} — reloading page")
            driver.get(PORTAL_URL)
            time.sleep(2)
            roll_input = find_roll_input(driver)
            if not roll_input:
                log.error(f"  Still can't find roll input for {roll_no}")
                return False

        roll_input.clear()
        roll_input.send_keys(roll_no)
        time.sleep(0.3)

        # ── Click submit ─────────────────────────────────────────────
        btn = find_submit_btn(driver)
        if not btn:
            log.error(f"  Submit button not found for {roll_no}")
            return False
        btn.click()

        # ── Wait for result to load ──────────────────────────────────
        # Result page usually has a table with marks/grades
        result_found = False
        for by, val in [
            (By.XPATH, "//table[.//td]"),
            (By.XPATH, "//*[contains(@class,'result') or contains(@id,'result') or contains(@id,'Result')]"),
            (By.XPATH, "//td[contains(text(),'Subject') or contains(text(),'Marks') or contains(text(),'SGPA') or contains(text(),'Grade')]"),
        ]:
            try:
                WebDriverWait(driver, PAGE_WAIT).until(
                    EC.presence_of_element_located((by, val))
                )
                result_found = True
                break
            except TimeoutException:
                continue

        # Fallback: if page loaded with decent content, save it anyway
        if not result_found:
            time.sleep(3)
            page_len = len(driver.page_source)
            if page_len > 8000:
                result_found = True
                log.warning(f"  ⚠  Result element not detected for {roll_no} but page has content — saving anyway")
            else:
                log.warning(f"  ✗  No result found for {roll_no} (roll may not exist or session expired)")
                return False

        time.sleep(0.8)  # let page fully render before printing

        # ── Save PDF ─────────────────────────────────────────────────
        pdf_path = str(Path(out_dir).resolve() / f"{roll_no}.pdf")
        save_pdf(driver, pdf_path)
        log.info(f"  ✅  Saved → {roll_no}.pdf")
        return True

    except TimeoutException:
        log.warning(f"  ⏱  Timeout for {roll_no}")
        return False
    except Exception as e:
        log.error(f"  ❌  Error for {roll_no}: {e}")
        return False


# ─────────────────────────────────────────────────────────────
#  ROLL NUMBER GENERATOR
# ─────────────────────────────────────────────────────────────

def generate_roll_numbers(start: str, end: str):
    """Yield sequential roll numbers preserving zero-padding and letter prefix."""
    prefix = ""
    for ch in start:
        if ch.isalpha():
            prefix += ch
        else:
            break
    width     = len(start) - len(prefix)
    num_start = int(start[len(prefix):])
    num_end   = int(end[len(prefix):])
    for n in range(num_start, num_end + 1):
        yield f"{prefix}{str(n).zfill(width)}"


# ─────────────────────────────────────────────────────────────
#  MAIN
# ─────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="AKTU One View Bulk Result Downloader")
    parser.add_argument("--start",  default=ROLL_START, help="First roll number")
    parser.add_argument("--end",    default=ROLL_END,   help="Last roll number")
    parser.add_argument("--output", default=OUTPUT_DIR, help="Output folder for PDFs")
    args = parser.parse_args()

    out_dir = args.output
    Path(out_dir).mkdir(parents=True, exist_ok=True)

    roll_list = list(generate_roll_numbers(args.start, args.end))
    total     = len(roll_list)

    log.info(f"Batch: {args.start} → {args.end}  ({total} roll numbers)")
    log.info(f"Output: {Path(out_dir).resolve()}\n")

    # Skip already-downloaded PDFs so you can resume safely
    done = {p.stem for p in Path(out_dir).glob("*.pdf")}
    if done:
        log.info(f"▶  Resuming — {len(done)} already downloaded, skipping those.\n")

    driver  = build_driver()
    success = 0
    failed  = []

    try:
        # ── Step 0: Unlock the session ───────────────────────────────
        if not unlock_session(driver):
            log.error("Failed to unlock session. Exiting.")
            driver.quit()
            sys.exit(1)

        # ── Step 1: Download each result ─────────────────────────────
        for idx, roll in enumerate(roll_list, 1):
            if roll in done:
                log.info(f"[{idx}/{total}] Skip {roll} (already saved)")
                success += 1
                continue

            log.info(f"[{idx}/{total}] Fetching {roll} ...")

            for attempt in range(1, MAX_RETRIES + 2):
                ok = fetch_result(driver, roll, out_dir)
                if ok:
                    success += 1
                    break
                elif attempt <= MAX_RETRIES:
                    log.warning(f"  Retry {attempt}/{MAX_RETRIES} ...")
                    time.sleep(2)
                    # If session may have expired, re-unlock
                    if attempt == MAX_RETRIES:
                        log.info("  Re-unlocking session ...")
                        unlock_session(driver)
                else:
                    failed.append(roll)
                    log.error(f"  Giving up on {roll}")

            time.sleep(DELAY)

    except KeyboardInterrupt:
        log.warning("\n⚠  Interrupted. Re-run to resume from where you left off.")

    finally:
        driver.quit()

    # ── Summary ───────────────────────────────────────────────────────
    log.info("\n" + "═" * 55)
    log.info(f"  DONE  ✅  {success}/{total} PDFs saved")
    log.info(f"  Folder: {Path(out_dir).resolve()}")
    if failed:
        log.info(f"  ❌  Failed ({len(failed)}): {', '.join(failed)}")
        fail_path = Path(out_dir) / "_failed_rolls.txt"
        fail_path.write_text("\n".join(failed), encoding="utf-8")
        log.info(f"  Failed list saved → {fail_path}")
    log.info("═" * 55 + "\n")


if __name__ == "__main__":
    main()