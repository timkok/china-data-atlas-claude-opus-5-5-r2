"""Write data/metadata/{indicators,regions,sources}.csv and data dictionary from config + evidence."""
import csv, json, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
cfg = json.load(open(os.path.join(ROOT, "config/indicators.json"), encoding="utf-8"))
regions = json.load(open(os.path.join(ROOT, "config/regions.json"), encoding="utf-8"))
M = os.path.join(ROOT, "data/metadata"); os.makedirs(M, exist_ok=True)
def w(name, rows):
    with open(os.path.join(M, name), "w", newline="", encoding="utf-8") as f:
        d = csv.DictWriter(f, fieldnames=list(rows[0].keys())); d.writeheader(); d.writerows(rows)
w("indicators.csv", [{"indicator_id": i["id"], "core": i["core"], "category": i["category"], "name_zh": i["name_zh"], "name_en": i["name_en"], "unit": i["unit"],
    "official_name_zh": i["official_name_zh"], "definition_zh": i["definition_zh"], "regional_aggregation": i["agg"],
    "province_source_table": (i.get("province") or {}).get("table", ""), "province_formula": (i.get("province") or {}).get("formula", ""), "province_original_unit": (i.get("province") or {}).get("orig_unit", ""),
    "national_source_table": (i.get("national") or {}).get("table", ""), "national_formula": (i.get("national") or {}).get("formula", ""), "national_original_unit": (i.get("national") or {}).get("orig_unit", "")} for i in cfg["indicators"]])
w("regions.csv", [{"geo_code": r["geo_code"], "nbs_code": r["nbs_code"], "geo_level": r["level"], "name_zh": r["name_zh"], "short_zh": r["short_zh"], "name_en": r["name_en"],
    "region7": r["region7"] or "", "nbs_zone4": r["zone4"] or ""} for r in regions])
w("sources.csv", [
 {"source_id": "NBS-FSND", "agency": "国家统计局 NBS", "title": "国家数据·分省年度数据", "url": "https://data.stats.gov.cn/dg/website/page.html#/pc/national/fsYearData", "access": "public JSON endpoints used by the page (publicrelease/web/external/*); no login", "format": "JSON", "use_in_project": "primary (provinces)", "terms_note": "Official public statistics; cite 国家统计局 as source. No explicit open-data licence found; redistribution status: pending review (see LIMITATIONS.md)."},
 {"source_id": "NBS-HGND", "agency": "国家统计局 NBS", "title": "国家数据·年度数据", "url": "https://data.stats.gov.cn/dg/website/page.html#/pc/national/yearData", "access": "public JSON endpoints", "format": "JSON", "use_in_project": "primary (national)", "terms_note": "same as above"},
 {"source_id": "NBS-CSY2025", "agency": "国家统计局 NBS / 中国统计出版社", "title": "中国统计年鉴2025", "url": "https://www.stats.gov.cn/sj/ndsj/2025/indexch.htm", "access": "public web (table images)", "format": "JPG", "use_in_project": "independent verification; urbanization 2015-2024 (table 2-6, manual transcription)", "terms_note": "© 中国统计出版社; images kept as local evidence only, not redistributed on the website"},
 {"source_id": "NBS-COMM2025", "agency": "国家统计局 NBS", "title": "中华人民共和国2025年国民经济和社会发展统计公报 (2026-02-28)", "url": "https://www.stats.gov.cn/sj/zxfb/202602/t20260228_1962662.html", "access": "public web", "format": "HTML", "use_in_project": "verification of 2025 national values", "terms_note": "official release"},
 {"source_id": "NBS-GDP2024-FINAL", "agency": "国家统计局 NBS", "title": "关于2024年国内生产总值最终核实的公告 (2025-12-26)", "url": "https://www.stats.gov.cn/sj/zxfb/202512/t20251226_1962144.html", "access": "public web", "format": "HTML", "use_in_project": "explains 2024 GDP revision", "terms_note": "official release"},
 {"source_id": "NBS-CENSUS7-B5", "agency": "国家统计局 NBS / 国务院第七次全国人口普查领导小组办公室", "title": "第七次全国人口普查公报（第五号）人口年龄构成情况 (2021-05-11)", "url": "https://www.stats.gov.cn/sj/zxfb/202302/t20230203_1901085.html", "access": "public web", "format": "HTML table", "use_in_project": "population_65plus provinces 2020", "terms_note": "official release"},
 {"source_id": "PROV-COMM2025", "agency": "北京市统计局 / 浙江省统计局 / 山东省统计局", "title": "2025年国民经济和社会发展统计公报（北京、浙江、山东）", "url": "https://tjj.beijing.gov.cn/tjsj_31433/tjgb_31445/ndgb_31446/202603/t20260326_4566469.html ; https://tjj.zj.gov.cn/col/col1229129205/art/2026/art_724c5ad52b8c4ac89def939cb9dee18c.html ; http://tjj.shandong.gov.cn/art/2026/3/3/art_104039_10322510.html", "access": "public web", "format": "HTML", "use_in_project": "verification of 2025 provincial GDP / per-capita GDP / income", "terms_note": "official releases; Henan bureau site returned 403 and was not used"},
])
dd = [("indicator_id","string","Indicator key, see indicators.csv"),("indicator_name_zh","string","Chinese name"),("indicator_name_en","string","English name"),
 ("geo_code","string","6-digit GB/T 2260 province code; 000000 = national total"),("geo_name_zh","string",""),("geo_name_en","string",""),("geo_level","enum","national | province"),
 ("year","int","Statistical (reference) year, not publication year"),("value","number|empty","Machine-readable value in `unit`; empty = missing in official source (never 0)"),
 ("unit","string","Standard unit"),("source_id","string","See sources.csv prefix"),("source_agency","string",""),("source_url","url","Official page where the value can be looked up"),
 ("source_table","string","Official table path / name"),("source_locator","string","API cid / indicator ids / region code / year, or table row/column"),
 ("publication_date","date|empty","ISO date when known; empty when the database does not state it"),("retrieved_at","datetime","ISO 8601 UTC retrieval time"),
 ("data_status","enum","final | preliminary | revised | unknown"),("methodology_version","string","config/indicators.json version"),
 ("transformation","string","Formula applied to original values (v = original value)"),("verification_status","enum","verified_direct (E2) | verified_independent (E3) | verified_revision (E4) | unverified (E0/E1)"),("evidence_level","enum","E0 no verifiable source | E1 R1-import with locator only | E2 read directly from official source by this pipeline | E3 E2 + matched independent official publication | E4 conflict resolved by explicit official revision notice"),("extraction_method","enum","API | HTML | Manual | Derived | R1-import"),("vintage","string","dataset vintage, e.g. NBS-DB@2026-11-24 or R1:<model>"),("publish_default","bool","true only for E2+ rows; E0/E1 never shown in default views"),("r1_models_same_value","string","R1 models whose value equals (or ~ within rounding) the canonical value — provenance info only, NOT independent verification"),
 ("notes","string",""),("original_value","string","Original value(s) before transformation, key=value"),("original_unit","string","Unit in the source")]
with open(os.path.join(M, "data_dictionary.csv"), "w", newline="", encoding="utf-8") as f:
    d = csv.writer(f); d.writerow(["field", "type", "description"]); d.writerows(dd)
print("metadata written")
