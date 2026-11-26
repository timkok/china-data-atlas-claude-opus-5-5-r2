"""Compile reports/acceptance_test_results.csv (from Playwright acceptance JSONs) and
reports/source_access_log.csv (from the raw request cache + evidence files)."""
import csv, glob, json, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
rows = []
for f in sorted(glob.glob(os.path.join(ROOT, "reports/acceptance/*.json"))):
    rows.append(json.load(open(f, encoding="utf-8")))
rows.sort(key=lambda r: (r["environment"], r["task"]))
with open(os.path.join(ROOT, "reports/acceptance_test_results.csv"), "w", newline="", encoding="utf-8") as fh:
    w = csv.DictWriter(fh, fieldnames=["task", "environment", "result", "steps", "clicks", "data_year", "verification", "evidence", "failure_reason"])
    w.writeheader(); w.writerows(rows)
log = []
for f in sorted(glob.glob(os.path.join(ROOT, "data/raw/nbs_api_cache/*.json"))):
    j = json.load(open(f, encoding="utf-8"))
    log.append({"retrieved_at": j["retrieved_at"], "method": "POST" if j["body"] else "GET", "url": j["url"], "request_body": json.dumps(j["body"], ensure_ascii=False) if j["body"] else "",
                "result": "ok" if j["response"].get("success", True) else "error", "evidence_file": os.path.relpath(f, ROOT), "purpose": "NBS public data portal query"})
extra = [("https://www.stats.gov.cn/sj/ndsj/2025/left.htm", "data/raw/nbs_yearbook_2025/left.htm", "yearbook table index"),
         ("https://www.stats.gov.cn/sj/ndsj/2025/html/*.jpg (14 tables)", "data/raw/nbs_yearbook_2025/", "yearbook table images for verification"),
         ("https://www.stats.gov.cn/sj/zxfb/202602/t20260228_1962662.html", "data/raw/nbs_communique/communique_2025.html", "2025 statistical communiqué"),
         ("https://www.stats.gov.cn/sj/zxfb/202512/t20251226_1962144.html", "data/raw/nbs_communique/gdp2024_final.html", "2024 GDP final verification"),
         ("https://www.stats.gov.cn/sj/zxfb/202302/t20230203_1901085.html", "data/raw/census2020/bulletin5.html", "7th census bulletin no.5"),
         ("https://data.stats.gov.cn/easyquery.htm?m=QueryData&dbcode=fsnd...", "", "legacy API — HTTP 403, NOT used, not bypassed"),
         ("https://www.stats.gov.cn/sj/ndsj/2026/indexch.htm", "", "HTTP 404 — Yearbook 2026 not yet published")]
for u, e, p in extra:
    log.append({"retrieved_at": "2026-11-24", "method": "GET", "url": u, "request_body": "", "result": "403" if "403" in p else "404" if "404" in p else "ok", "evidence_file": e, "purpose": p})
with open(os.path.join(ROOT, "reports/source_access_log.csv"), "w", newline="", encoding="utf-8") as fh:
    w = csv.DictWriter(fh, fieldnames=list(log[0].keys())); w.writeheader(); w.writerows(log)
print("acceptance rows", len(rows), "access log rows", len(log))
