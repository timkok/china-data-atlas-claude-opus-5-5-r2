"""Parse 第七次全国人口普查公报（第五号）表5-2 (official HTML on stats.gov.cn, saved in
data/raw/census2020/bulletin5.html) into a machine-readable CSV of 65+ shares by province."""
import csv, html, os, re
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC = os.path.join(ROOT, "data/raw/census2020/bulletin5.html")
URL = "https://www.stats.gov.cn/sj/zxfb/202302/t20230203_1901085.html"
t = open(SRC, encoding="utf-8", errors="ignore").read()
out, seen = [], set()
for r in re.findall(r"<tr[^>]*>(.*?)</tr>", t, flags=re.S):
    cells = [re.sub(r"\s+", "", html.unescape(re.sub(r"<[^>]+>", "", c))) for c in re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", r, flags=re.S)]
    if len(cells) == 5 and re.fullmatch(r"\d+\.\d+", cells[4]) and cells[0] not in seen:
        seen.add(cells[0])
        out.append({"geo_short_zh": cells[0], "share_0_14": cells[1], "share_15_59": cells[2], "share_60plus": cells[3], "share_65plus": cells[4], "source_url": URL, "table": "第七次全国人口普查公报（第五号）表5-2 各地区人口年龄构成"})
assert len(out) == 32, len(out)
with open(os.path.join(ROOT, "data/raw/census2020/census2020_age_by_province.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(out[0].keys())); w.writeheader(); w.writerows(out)
print("parsed", len(out))
