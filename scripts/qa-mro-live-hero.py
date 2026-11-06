# -*- coding: utf-8 -*-
"""MRO public landing acceptance on Windows; only reads public pages."""
from pathlib import Path
import json
import sys

# Authorized production machine already has Playwright installed in this isolated QA path.
qa_deps = Path(r"C:\deploy\portal-wiki-qa\pydeps")
if qa_deps.exists():
    sys.path.insert(0, str(qa_deps))
from playwright.sync_api import sync_playwright

base = "https://platform.itpmining.kz/mro/"
checks = []
errors = []
with sync_playwright() as p:
    browsers = list(Path("C:/Users").glob("*/AppData/Local/ms-playwright/chromium-*/chrome-win/chrome.exe"))
    if not browsers:
        raise SystemExit("PLAYWRIGHT_CHROME_NOT_INSTALLED")
    browser = p.chromium.launch(executable_path=str(browsers[-1]), headless=True, args=["--no-sandbox"])
    page = browser.new_page(ignore_https_errors=True, service_workers="block")
    page.on("pageerror", lambda error: errors.append(str(error)[:180]))
    for width in (320, 390, 768, 1440):
        page.set_viewport_size({"width": width, "height": 900})
        response = page.goto(base, wait_until="domcontentloaded", timeout=25000)
        page.locator("[data-mro-live-demo]").wait_for(state="visible", timeout=10000)
        state = page.evaluate("""() => ({
          overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 5,
          demo: !!document.querySelector('[data-mro-live-demo]'),
          oldImage: document.querySelectorAll('.portal-hero__panorama,.portal-hero__diamond').length,
          gears: document.querySelectorAll('.mro-live svg').length,
        })""")
        if response.status != 200 or not state["demo"] or state["overflow"] or state["oldImage"] or state["gears"] < 5:
            errors.append("INVALID_HERO_WIDTH_%s: %s" % (width, state))
        checks.append({"width": width, "status": response.status, **state})

    # At mobile width all examples are navigable without a static screenshot.
    page.set_viewport_size({"width": 390, "height": 900})
    page.goto(base, wait_until="domcontentloaded", timeout=25000)
    page.locator("[data-mro-live-demo]").wait_for(state="visible")
    page.locator(".mro-live__screen-tabs button").nth(1).click()
    page.locator(".mro-live__view-tabs button").nth(1).click()
    if page.locator("[data-mro-demo-schedule]").count() != 1:
        errors.append("MAINTENANCE_SCHEDULE_NOT_INTERACTIVE")
    page.locator(".mro-live__view-tabs button").nth(2).click()
    if page.locator("[data-mro-demo-risks]").count() != 1:
        errors.append("RISK_VIEW_NOT_INTERACTIVE")
    page.locator(".mro-live__view-tabs button").nth(0).click()
    page.locator(".mro-live__equipment-list button").first.click()
    if page.locator(".mro-live__equipment-list button.is-selected").count() != 1:
        errors.append("ASSET_SELECTION_NOT_INTERACTIVE")
    page.locator(".mro-live__screen-tabs button").nth(2).click()
    page.locator(".mro-live__order-filters button").nth(2).click()
    rows = page.locator(".mro-live__order-row").count()
    if rows != 1:
        errors.append("ORDER_FILTER_NOT_INTERACTIVE")

    # Public locale switcher must immediately translate all demo headings.
    headings = []
    for locale in ("ru", "en", "ka", "de", "fr", "es"):
        page.goto(base, wait_until="domcontentloaded", timeout=25000)
        page.locator('select[aria-label="Language / Язык"]').first.select_option(locale)
        title = page.locator(".mro-live__screen-tabs button").nth(1).inner_text().strip()
        heading = page.locator(".mro-live__app-head strong").first.inner_text().strip()
        headings.append({"locale": locale, "tab": title, "heading": heading})
        if not title or not heading:
            errors.append("MISSING_LANGUAGE_" + locale)
    if len({p["tab"] for p in headings}) != 6:
        errors.append("LOCALIZATION_NOT_DISTINCT")
    browser.close()

result = {"checks": checks, "locales": headings, "orderFilterRows": rows, "errors": errors}
out = Path(r"C:\deploy\toir-portal-port-20261105\qa\mro-live-hero-qa.json")
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
sys.stdout.reconfigure(encoding="utf-8", errors="backslashreplace")
print(json.dumps(result, ensure_ascii=False, indent=2))
if errors:
    raise SystemExit(2)
