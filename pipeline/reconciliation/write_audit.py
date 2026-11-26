"""Writes audit/round1_inventory.csv, audit/model_comparison.csv and audit/findings.csv.
Self-reported numbers come from each model's EVALUATION.json; 'recomputed_*' columns are computed here from the imported data."""
import csv, json, os
from collections import Counter, defaultdict
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
P = lambda p: os.path.join(ROOT, p)
L = list(csv.DictReader(open(P("data/processed/r1_long.csv"), encoding="utf-8")))
C = list(csv.DictReader(open(P("data/reconciliation/conflicts.csv"), encoding="utf-8")))
KC = list(csv.DictReader(open(P("data/reconciliation/key_classification.csv"), encoding="utf-8")))
DRIVE = "https://drive.google.com/drive/folders/"
INV = [
 # model, folder id, model identity (as labelled), observations file, deployment, site, notes
 ("grok", "1Myux8GqrLiP0IyAX5wHJkjF0FTUHCsMR", "Grok Bot (Model Version Unavailable)", "unavailable: only inside China-Data-Atlas-Grok-Bot-R1.zip (21.4 MB > 10 MB Drive-connector limit); EVALUATION, DELIVERY_REPORT, data_validation_samples, coverage_matrix read", "local static build only (self-reported); no public URL", ""),
 ("gemini4neon", "1QRtc23mP3sGLekDyMqWw_Te7jC9Y0T3G", "Gemini 4 Neon", "observations.csv (1uBBDjBYJdymWOQ2M44QJ0AhMzSYWQ1aF) + R1.zip", "Vercel public", "https://china-data-atlas-gemini-4-neon-r1.vercel.app"),
 ("claude_r1a", "103Q9txnKYcPiXz_DApN_zOJdjEebb30P", "Claude Opus 5.5 (first R1 run)", "observations.csv (1YrqogAUTDnZEYjyTv1I0y8uGkhr4JF6e) + quality_report.json", "not checked (no EVALUATION found in folder search)", ""),
 ("claude_r1run3", "1vGwrABTN7SaRX31Fet0A8ekE6MmTPUfd", "Claude Opus 5.5 (run 3 — this model's own R1)", "observations.csv (local + Drive 1tDCCDjIACUT9gZiF42bMg7IKXs2fpGHh)", "Vercel public", "https://china-data-atlas-claude-opus-5-5-r1-run3.vercel.app"),
 ("astra", "1Q6Y3Je7xmmfAh3wADcp_UWxeyjbrLA4V", "GPT-6 Astra Pro", "observations.csv (1yjeC7ylxdbXs_3fE7Xh30dD6g8BCqip9) + R1.zip", "self-reported public site; Vercel preview blocked", ""),
 ("gemini", "1zN44CCnW8IfJ1Elmk48gZL1YhF900nUP", "Gemini (Model Version Unavailable)", "observations Google Sheet (exported CSV) + R1.zip", "not verified", ""),
 ("muse", "1TOZVhWJW8Oxc-_ga1e6oZkkL9CPWSG-P", "Muse Spark 1.3", "observations.csv (19E8CkHdBLZOP5E8rJwuhmWZT7MILd5K4) + R1.zip", "not deployed (self-reported)", ""),
 ("codex_gpt6", "1cAjfXt2ZdTd3TAisIV_Gm61Ot7lbQp5n", "Codex GPT-6", "observations.csv ×2 differing copies (11gUjh… 3,813 rows, 1E_Wxw… 3,825 rows; the latter used) + R1.zip; files modified 2026-11-24 14:19 UTC", "Vercel public", "https://china-data-atlas-codex-r1-1123.vercel.app"),
 ("gpt62", "1HmG5Kbn0J-GLug2mS3D91-ZHdRJhOGVt", "GPT-6.2", "only China-Data-Atlas-GPT-6.2-R1.zip (observations inside)", "not deployed (self-reported)", ""),
 ("codex_mvu", "11hyv6PNMhkPspFFrIPlHBlFFfR0yFnd_", "Codex (Model Version Unavailable) R1-20261124-1250", "none: folder contains only a checkpoint Google Doc ('研究检查点与未完成事项')", "none", ""),
]
EVAL = {"grok": "grok/EVALUATION.json", "gemini4neon": "gemini4neon/EVALUATION.json", "astra": "astra/EVALUATION.json", "muse": "muse/EVALUATION.json", "codex_gpt6": "codex_gpt6/EVALUATION.json",
        "gpt62": "gpt62/unzipped/China-Data-Atlas-GPT-6.2-R1/EVALUATION.json", "gemini": "gemini/EVALUATION.json"}
def ev(m):
    p = P("data/input_r1/" + EVAL[m]) if m in EVAL else None
    if m == "claude_r1run3": p = "/Users/tian/Claude Code/china-data-atlas-claude-opus-5-5-r1-run3/EVALUATION.json"
    try: return json.load(open(p))
    except Exception: return {}
by = defaultdict(list)
for r in L: by[r["model"]].append(r)
cat_by = defaultdict(Counter)
for c in C: cat_by[c["r1_model"]][c["category"]] += 1
inv = []
for m, fid, name, files, dep, site in INV:
    e = ev(m); rows = by.get(m, [])
    valid = [r for r in rows if r["value"] != "" and r["indicator_id"]]
    keys = {(r["indicator_id"], r["geo_code"], r["year"]) for r in valid}
    core = {"population", "birth_rate", "urbanization_rate", "population_65plus", "gdp", "gdp_per_capita", "disposable_income", "retail_sales", "higher_education_students", "higher_education_institutions", "physicians_per_1000", "hospital_beds_per_1000"}
    latest = max((int(r["year"]) for r in valid), default=None)
    prov_latest = defaultdict(set)
    for r in valid:
        if r["geo_code"] != "000000": prov_latest[(r["indicator_id"], r["year"])].add(r["geo_code"])
    full31 = sorted({i for (i, y), g in prov_latest.items() if len(g) == 31 and i in core})
    verif = Counter(r["src_verification"] for r in valid)
    inv.append({"model_key": m, "model_identity": name, "drive_folder": DRIVE + fid, "files_used": files, "accessible": "partial" if m in ("grok",) else ("no data" if m == "codex_mvu" else "yes"),
                "self_reported_observations": e.get("unique_valid_observations") or (e.get("data_metrics", {}) or {}).get("total_observations"), "recomputed_source_rows": len(rows), "recomputed_unique_valid_keys": len(keys),
                "recomputed_core_indicators_present": len({i for i, g, y in keys if i in core}), "core_indicators_with_some_full_31_year": len(full31),
                "latest_year": latest, "self_reported_verified": e.get("verified_observations"), "verification_labels": "; ".join(f"{k}:{v}" for k, v in verif.most_common(4)),
                "deployment": dep, "site": site,
                "diffs_vs_canonical": sum(cat_by[m].values()), "diff_categories": "; ".join(f"{k}:{v}" for k, v in cat_by[m].most_common())})
os.makedirs(P("audit"), exist_ok=True)
with open(P("audit/round1_inventory.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(inv[0].keys())); w.writeheader(); w.writerows(inv)

# ---- findings (each backed by a reproducible check) ----
F = []
def add(model, sev, cat, status, desc, repro, fix, ind="", geo="", year="", file="", rep="", obs="", exp="", url="", loc=""):
    F.append({"finding_id": f"R2-F{len(F)+1:03d}", "audited_model": model, "severity": sev, "category": cat, "indicator_id": ind, "geo_code": geo, "year": year,
              "affected_file_or_url": file, "reported_value": rep, "observed_value": obs, "expected_value": exp, "evidence_url": url, "evidence_locator": loc,
              "description": desc, "reproduction_steps": repro, "recommended_fix": fix, "verification_status": status})
gem = by["gemini"]
wiki = [r for r in gem if "wikipedia" in (r["source_url"] or "").lower()]; agg = [r for r in gem if "聚汇" in (r["source_table"] + r["source_url"]) or "jhshuju" in r["source_url"].lower()]
add("Gemini (Model Version Unavailable)", "P0", "source_not_official", "Confirmed Issue",
    f"{len(wiki)} of {len(gem)} observations cite Wikipedia (source_agency '国家统计局（维基百科汇编）') as their source URL — GDP (256), GDP per capita (224), population (61). R1 rules forbid non-official sources as the sole source of a final figure. Many values are also third-party aggregator compilations.",
    "Open the Gemini observations sheet; filter source_url contains 'wikipedia.org'. Script: pipeline/reconciliation/import_r1.py + audit counts in write_audit.py.", "Re-source from NBS 国家数据 / yearbooks; mark Wikipedia rows E0 (not publishable).",
    ind="gdp|gdp_per_capita|population", file="Drive 1aSz6AT31mEPtZV7ne3bZZVTJwtKvLpDG2uzeBr4t9CM (observations)", url="https://zh.wikipedia.org/zh-cn/中华人民共和国省级行政区地区生产总值列表", loc="source_url column", obs=f"{len(wiki)} Wikipedia rows")
g4 = by["gemini4neon"]
add("Gemini 4 Neon", "P1", "unsupported_verification_claim", "Confirmed Issue",
    f"All {len(g4)} observations carry verification_status='verified' and EVALUATION.json reports verified_observations = {len(g4)}, but the delivered data_validation_samples.csv contains 60 independent checks. The remaining rows were obtained from the same NBS database and never independently checked; this model's data also agrees 99.4% with another model that used the same database (shared provenance, not independent verification).",
    "Count verification_status in Gemini 4 Neon observations.csv (9110×'verified'); count rows in its reports/data_validation_samples.csv (60).", "Label as E2 (direct official read) except the 60 sampled rows (E3).",
    file="observations.csv 1uBBDjBYJdymWOQ2M44QJ0AhMzSYWQ1aF; EVALUATION.json 1EeWF2dTn_MfiwX4JtnQB-HJ5OSp-SQ9a", rep="verified_observations=9110", obs="60 independent samples")
cx = [c for c in C if c["r1_model"] == "codex_gpt6" and c["indicator_id"] in ("gdp", "gdp_per_capita") and c["category"] == "Official Revision"]
add("Codex GPT-6", "P1", "vintage_mixing", "Confirmed Issue",
    f"{len(cx)} GDP / GDP-per-capita values are superseded first-release vintages taken from Jiangsu Statistical Yearbook appendices (one edition per year), e.g. national 2023 GDP 1,260,582 亿元 (pre-revision) vs official revised 1,294,272 (NBS notice 2024-12-27) and 2024 1,349,084 (preliminary) vs final 1,348,066 (NBS notice 2025-12-26). Mixing vintages in one series distorts growth: 2023→2024 nominal growth computes as 7.0% instead of 4.2%. data_status is 'unknown'/'preliminary', not 'superseded'.",
    "Filter Codex observations: indicator_id=gdp, geo_level=national; compare with NBS 国家数据 年度数据 > 国内生产总值.", "Use the current official vintage for every year; keep earlier vintages in a separate vintage table.",
    ind="gdp", geo="000000", year="2023", rep="1260582", exp="1294271.7", url="https://www.stats.gov.cn/sj/zxfb/202412/t20241227_1957915.html", loc="公告正文：修订后2023年GDP为1294272亿元", file="Codex observations.csv 1E_WxwuudRLgGDD2BJ3-K0bgLA5kHvP_v")
cr = [c for c in C if c["r1_model"] == "codex_gpt6" and c["indicator_id"] == "retail_sales" and c["category"] == "Official Revision"]
add("Codex GPT-6", "P2", "vintage_mixing", "Official Revision",
    f"{len(cr)} retail-sales values (2015–2023) are first-release figures (e.g. national 2015 300,931 亿元) while the current NBS database gives revised values (286,587.8). Not wrong at publication time, but superseded; mixing makes growth rates inconsistent.",
    "Compare Codex retail_sales with NBS 国家数据 社会消费品零售总额 (current).", "Adopt current official vintage; document revisions.", ind="retail_sales", geo="000000", year="2015", rep="300931", exp="286587.8")
cb = [c for c in C if c["r1_model"] == "codex_gpt6" and c["indicator_id"] == "birth_rate" and "卫生健康" in c["r1_source"]]
add("Codex GPT-6", "P2", "definition_difference", "Definition Difference",
    f"{len(cb)} provincial 2000 birth-rate values come from 中国卫生健康统计年鉴 (NHC system) and are mixed into the NBS 人口出生率 series; e.g. Beijing 2000: 8.39‰ (NHC table) vs 6.2‰ (NBS). Different statistical systems should not be spliced into one series.",
    "Filter Codex birth_rate year=2000; compare with NBS 分省年度数据 人口出生率.", "Keep one statistical system per series or split into separate indicators.", ind="birth_rate", geo="110000", year="2000", rep="8.39", exp="6.2")
add("Codex GPT-6", "P3", "deliverable_integrity", "Confirmed Issue", "Two different observations.csv files are present in the R1 Drive folder (3,813 vs 3,825 rows, different hashes, both modified 2026-11-24 14:19 UTC) without explanation of which is canonical.",
    "Download both files (11gUjhBbuBwT2x30h00KGAD2OS1howiWN, 1E_WxwuudRLgGDD2BJ3-K0bgLA5kHvP_v) and compare sha256 (see data/input_manifest).", "Keep one canonical file; version the other explicitly.")
mu = [c for c in C if c["r1_model"] == "muse" and c["indicator_id"] in ("birth_rate", "urbanization_rate") and c["category"] == "Official Revision"]
add("Muse Spark 1.3", "P2", "superseded_vintage", "Official Revision",
    f"{len(mu)} national birth-rate / urbanization values for 2015–2019 are pre-7th-census figures (e.g. 2015 urbanization 56.10%, current official 57.33%; 2016 birth rate 12.95‰, current 13.57‰) without being labelled as superseded.",
    "Compare Muse national series with 《中国统计年鉴2025》表2-6 / NBS current database.", "Use the back-revised official series; keep old values as earlier vintages.", ind="urbanization_rate", geo="000000", year="2015", rep="56.1", exp="57.33",
    url="https://www.stats.gov.cn/sj/ndsj/2025/html/C02-06.jpg", loc="表2-6 全国 2015")
add("Muse Spark 1.3", "P2", "definition_difference", "Definition Difference",
    "Muse's higher_education_students (national) is defined as 普通本专科 + 在学研究生 (documented in its notes) — the same indicator_id as other models' 本专科-only series. Correctly documented, but not comparable under the shared ID; R2 crosswalk maps it to he_students_incl_postgrad.",
    "Read Muse notes for higher_education_students.", "Use a distinct indicator_id for the broader scope.", ind="higher_education_students", geo="000000", year="2015", rep="28164100", exp="26253000 (本专科 only)")
c1a = [c for c in C if c["r1_model"] == "claude_r1a" and c["indicator_id"] == "gdp_per_capita" and c["year"] in ("2011", "2012")]
add("Claude Opus 5.5 (first R1 run)", "P2", "superseded_vintage", "Official Revision",
    f"{len(c1a)} GDP-per-capita values for 2011–2012 come from 《中国统计年鉴2016》 and pre-date later economic-census revisions; differences are large for some provinces (Tianjin 2011: 85,213 vs current 62,430 元, −27%). Values were correct for that edition but are superseded.",
    "Compare claude_r1a gdp-per-capita 2011–2012 with NBS 国家数据 分省年度数据 人均地区生产总值.", "Prefer the current official vintage; store yearbook-edition values as vintages.", ind="gdp_per_capita", geo="120000", year="2011", rep="85213", exp="62430")
add("Claude Opus 5.5 (first R1 run)", "P3", "audit_note", "Not Independently Verified",
    "quality_report.json lists 5,488 single_reading_ocr and 555 revised_vs_earlier_edition soft warnings. These concern the raw cell set (7,868 cells); published observations are labelled 双重OCR一致 (3,849) / Excel (286) / manual (108) etc. After R2 reconciliation only 4 of its published values remain unexplained, so the warnings do not translate into confirmed errors in published data; revised_vs_earlier_edition reflects genuine official revisions.",
    "Read claude_r1a quality_report.json; compare its observations with the canonical candidate (data/reconciliation/conflicts.csv, r1_model=claude_r1a).", "Publish a per-row OCR-reading flag so reviewers can filter single-reading cells.")
mine_he = [c for c in C if c["indicator_id"] == "higher_education_students" and c["category"] == "Match Within Official Rounding"]
add("Claude Opus 5.5 (run 3, own R1)", "P2", "precision_loss", "Confirmed Issue",
    "Own R1: student counts were taken from the NBS database in 万人 (2 decimals) and multiplied by 10,000, losing precision (±50 persons; e.g. Guangdong 2024 2,687,600 vs yearbook 2,687,595). Several other models carry exact person counts from yearbooks. R2 keeps the API value but records the rounding bound and classifies these as 'Match Within Official Rounding'.",
    "Compare claude_r1run3 higher_education_students with 《中国统计年鉴2025》表21-14.", "Prefer an exact-count official table when available (planned: MOE/yearbook ingestion).", ind="higher_education_students", geo="440000", year="2024", rep="2687600", exp="2687595")
add("Claude Opus 5.5 (run 3, own R1)", "P2", "over_exclusion", "Confirmed Issue",
    "Own R1 dropped the official NBS 2000 and 2005–2012 全体居民人均可支配收入 values (288 rows) because of the 2013 survey change, while Gemini 4 Neon kept them with a clear note. R2 restores them under methodology_version '2.0.0-pre2013-backcast' and marks the 2013 break on charts.", "Compare R1 run3 vs Gemini 4 Neon disposable_income key sets.", "Keep official data; flag methodology breaks rather than delete.", ind="disposable_income", year="2000–2012")
add("Claude Opus 5.5 (run 3, own R1)", "P3", "derived_rounding", "Definition Difference",
    "Own R1 physicians-per-1000 for ≤2020 uses the post-census revised population as denominator; yearbook prints use pre-revision population (national 2019: 2.74 vs 2.77). Documented in R1; kept.", "See data/reconciliation/conflicts.csv rows physicians_per_1000, Definition Difference.", "Keep and document; optionally publish both denominators.", ind="physicians_per_1000", geo="000000", year="2019", rep="2.74", exp="2.77 (yearbook)")
add("Grok Bot (Model Version Unavailable)", "P3", "deliverable_access", "Environment Limitation",
    "Grok's observations are only available inside a 21.4 MB ZIP, which exceeds the 10 MB limit of the Drive connector used in this audit; its dataset could not be imported. Its own validation file lists 122 samples (107 yes, 12 no_revision, 3 not_comparable) consistent with its claim of 106 verified rows. The prompt's 125-record physician difference vs Gemini 4 Neon could therefore not be reproduced.",
    "Attempt download of Drive file 1DvvC7Vvcq5K52gImOJ-K5qv4FaTSdWrV via connector → size-limit error.", "Publish observations.csv separately (uncompressed or split) in the R1 folder.", file="China-Data-Atlas-Grok-Bot-R1.zip")
add("Codex (Model Version Unavailable) R1-20261124-1250", "P2", "deliverable_missing", "Confirmed Issue", "The folder contains only one checkpoint Google Doc listing unfinished items; no observations, code or reports.", "List the folder contents.", "N/A")
cs = [c for c in C if c["r1_model"] in ("muse", "gpt62") and c["indicator_id"] == "retail_sales" and c["year"] == "2024"]
add("Muse Spark 1.3 / GPT-6.2", "P3", "superseded_vintage", "Official Revision",
    "National 2024 retail sales 487,895 亿元 is the first-release communiqué figure; the current NBS database and Yearbook 2025 table 15-12 give 483,344.7. Not labelled as superseded.", "Compare with 《中国统计年鉴2025》表15-12.", "Use the revised value; keep first release as a vintage.",
    ind="retail_sales", geo="000000", year="2024", rep="487895", exp="483344.7", url="https://www.stats.gov.cn/sj/ndsj/2025/html/C15-12.jpg", loc="表15-12 全国 2024")
gr = [c for c in C if c["r1_model"] == "gemini" and c["category"] == "Conflicting Value" and "contradicted" in c["resolution"]]
add("Gemini (Model Version Unavailable)", "P1", "wrong_value", "Confirmed Issue",
    f"{len(gr)} values contradict both the NBS database and an independent official publication, mainly 2024 provincial retail sales labelled '2024年主要消费大省社零总额': Zhejiang 33,900 vs 37,707.7 亿元, Guangdong 47,872.8 vs 45,029.2, Jiangsu 47,662.3 vs 44,922.1 (Yearbook 2025 table 15-12); also Hubei 2024 65+ share 16.12% vs 17.29% (table 2-11) and Xinjiang 2024 physicians/beds per 1000.",
    "Filter data/reconciliation/conflicts.csv: r1_model=gemini, category=Conflicting Value; compare with the yearbook images listed in reports/data_validation_samples.csv.", "Replace with official values; never use aggregator summaries as the source.",
    ind="retail_sales", geo="330000", year="2024", rep="33900", exp="37707.7", url="https://www.stats.gov.cn/sj/ndsj/2025/html/C15-12.jpg", loc="表15-12 浙江 2024")
add("Codex GPT-6", "P2", "wrong_value", "Confirmed Issue",
    "Jiangsu 2023 retail sales 45,547.5 亿元 (from Jiangsu Statistical Yearbook appendix) contradicts the NBS database and Yearbook 2025 table 15-12 (42,940.6). Shanghai 2016 disposable income 54,032 vs NBS 54,305 remains unresolved (no independent official source found for 2016).",
    "conflicts.csv rows retail_sales/320000/2023 and disposable_income/310000/2016.", "Use NBS unified provincial figures for cross-province series.", ind="retail_sales", geo="320000", year="2023", rep="45547.5", exp="42940.6", url="https://www.stats.gov.cn/sj/ndsj/2025/html/C15-12.jpg", loc="表15-12 江苏 2023")
add("Codex GPT-6 (site)", "P3", "ux_stale_headline", "Confirmed Issue", "Homepage feature chart 'Which provinces have the most residents' shows 2024 although the site's own data include 2025 provincial population.", "Open https://china-data-atlas-codex-r1-1123.vercel.app/ (observed 2026-11-24).", "Headline the latest complete year.", ind="population", year="2024", file="https://china-data-atlas-codex-r1-1123.vercel.app/")
with open(P("audit/findings.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(F[0].keys())); w.writeheader(); w.writerows(F)
# ---- model comparison (judgement summary; evidence in findings + inventory) ----
MC = [
 ("Grok Bot", "large NBS-database extraction, 15 indicators, honest verified/partially split (self-report)", "dataset not importable here (ZIP size); no deployment", "verification labelling discipline", "n/a (not inspected)", "medium (unverified here)"),
 ("Gemini 4 Neon", "same NBS database, full 12/12 coverage, public deployment with 7-region matrix & provenance cards; documented pre-2013 income", "all rows labelled 'verified' (only 60 independent checks)", "public-endpoint ingestion; region-matrix homepage", "homepage interactive matrix with provenance", "low for values (matches NBS), high for verification claims"),
 ("Claude Opus 5.5 (first run)", "yearbook OCR with cross-edition checks and source_cell locators, raw-file hashing", "edition-vintage values (e.g. GDP pc 2011–12) not reconciled with later revisions", "source_cell-level locators; double-OCR", "-", "low–medium"),
 ("Claude Opus 5.5 (run 3)", "NBS API + independent yearbook/communiqué verification (83 points), revision handling, tests 36/36 live", "precision loss in 万人-based counts; over-excluded pre-2013 income", "validation-sample design; caliber notes", "indicator pages with provenance dialog", "low"),
 ("GPT-6 Astra Pro", "evidence ledger with evidence_file per row; high agreement with yearbooks (99.5% with claude_r1a)", "small coverage (1,416)", "evidence_file per observation", "-", "low"),
 ("Codex GPT-6", "multi-source (90 sources) incl. provincial yearbooks, exact counts", "vintage mixing (first-release GDP/retail), NHC birth rates spliced into NBS series", "exact-count yearbook tables", "editorial homepage design", "medium–high for time series"),
 ("Muse Spark 1.3", "small, carefully annotated dataset, test-fix log", "superseded vintages; broader HE-student definition under shared ID", "-", "-", "medium"),
 ("Gemini (MVU)", "MOE sources for education", "Wikipedia / aggregator as sole source for GDP & population", "-", "-", "high"),
 ("GPT-6.2", "transcribed facts with locators", "184 observations only", "transcribed_facts.csv format", "-", "low (small)"),
]
with open(P("audit/model_comparison.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f); w.writerow(["model", "strengths", "main_issues", "reusable_data_engineering", "reusable_product_feature", "statistical_risk"]); w.writerows(MC)
print("inventory", len(inv), "findings", len(F), Counter(x["severity"] for x in F))
