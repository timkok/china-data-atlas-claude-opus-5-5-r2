"""Import every accessible Round 1 observations file into one long table WITHOUT modifying inputs.
Output: data/processed/r1_long.csv (one row per source record) + data/input_manifest/manifest.csv (sha256)."""
import csv, hashlib, json, os, re
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
IN = os.path.join(ROOT, "data/input_r1")
SRC = {  # model -> (relative file, field map)
 "claude_r1run3": ("claude_r1run3/observations.csv", "std"),
 "gemini4neon": ("gemini4neon/observations.csv", "std"),
 "astra": ("astra/observations.csv", "std"),
 "muse": ("muse/observations.csv", "std"),
 "codex_gpt6": ("codex_gpt6/observations_B_1E_Wxw.csv", "std"),
 "gpt62": ("gpt62/unzipped/China-Data-Atlas-GPT-6.2-R1/data/normalized/observations.csv", "std"),
 "gemini": ("gemini/observations_sheet_export.csv", "gemini"),
 "claude_r1a": ("claude_r1a/observations.csv", "claude_r1a"),
}
DRIVE = {"claude_r1run3": "1tDCCDjIACUT9gZiF42bMg7IKXs2fpGHh", "gemini4neon": "1uBBDjBYJdymWOQ2M44QJ0AhMzSYWQ1aF", "astra": "1yjeC7ylxdbXs_3fE7Xh30dD6g8BCqip9",
         "muse": "19E8CkHdBLZOP5E8rJwuhmWZT7MILd5K4", "codex_gpt6": "1E_WxwuudRLgGDD2BJ3-K0bgLA5kHvP_v", "gpt62": "1WEGiJpo80W_w3MsEkX13tAYcgJTAHL3r (zip)",
         "gemini": "1aSz6AT31mEPtZV7ne3bZZVTJwtKvLpDG2uzeBr4t9CM (Google Sheet export)", "claude_r1a": "1YrqogAUTDnZEYjyTv1I0y8uGkhr4JF6e"}
cw = {}
for r in csv.DictReader(open(os.path.join(ROOT, "data/metadata/indicator_crosswalk.csv"), encoding="utf-8")):
    cw[(r["source_model"], r["source_indicator_id"])] = r
def canon(model, iid):
    r = cw.get((model, iid)) or cw.get((model, "*"))
    if not r: return None, 1.0
    return (iid if r["canonical_indicator_id"] == "=" else r["canonical_indicator_id"]), float(r["unit_factor"])
ISO = {"BJ":"110000","TJ":"120000","HE":"130000","SX":"140000","NM":"150000","LN":"210000","JL":"220000","HL":"230000","SH":"310000","JS":"320000","ZJ":"330000","AH":"340000","FJ":"350000","JX":"360000","SD":"370000","HA":"410000","HB":"420000","HN":"430000","GD":"440000","GX":"450000","HI":"460000","CQ":"500000","SC":"510000","GZ":"520000","YN":"530000","XZ":"540000","SN":"610000","GS":"620000","QH":"630000","NX":"640000","XJ":"650000"}
def geo6(g):
    gs = str(g or "").strip().upper()
    if gs in ("CN", "CHN"): return "000000"
    if gs.startswith("CN-") and gs[3:] in ISO: return ISO[gs[3:]]
    g = re.sub(r"\D", "", str(g or ""))
    if g in ("", "0", "000000", "100000", "000000000000", "86"): return "000000"
    return g[:6].ljust(6, "0")
def num(v):
    try: return float(str(v).replace(",", "").strip())
    except: return None
out, man = [], []
for model, (rel, kind) in SRC.items():
    fp = os.path.join(IN, rel)
    man.append({"model": model, "file": rel, "drive_file_id": DRIVE[model], "sha256": hashlib.sha256(open(fp, "rb").read()).hexdigest(), "bytes": os.path.getsize(fp)})
    for i, r in enumerate(csv.DictReader(open(fp, encoding="utf-8-sig")), 2):
        if kind == "std":
            iid, g, y, v, u = r["indicator_id"], r["geo_code"], r["year"], r["value"], r.get("unit", "")
            vs, ds, url, tab = r.get("verification_status", ""), r.get("data_status", ""), r.get("source_url", ""), r.get("source_table", "")
        elif kind == "gemini":
            iid, g, y, v, u = r["indicator_id"], r["geo_code"], r["year"], r["value"], r.get("unit", "")
            vs, ds, url, tab = "", r.get("data_status", ""), r.get("source_url", ""), r.get("source_table", "")
        else:
            iid, g, y, v, u = r["indicator"], r["region_code"], r["year"], r["value"], r.get("unit", "")
            vs, ds, url, tab = r.get("method", ""), r.get("status", ""), r.get("source_url", ""), (r.get("source_publication", "") + " " + r.get("source_table", "")).strip()
        cid, f = canon(model, iid)
        val = num(v)
        yy = re.match(r"\d{4}", str(y))
        out.append({"model": model, "row": i, "src_indicator_id": iid, "indicator_id": cid or "", "geo_code": geo6(g), "year": yy.group(0) if yy else "",
                    "value": "" if val is None else val * f, "src_unit": u, "src_verification": vs, "src_data_status": ds, "source_url": url, "source_table": tab})
os.makedirs(os.path.join(ROOT, "data/processed"), exist_ok=True)
with open(os.path.join(ROOT, "data/processed/r1_long.csv"), "w", newline="", encoding="utf-8") as fh:
    w = csv.DictWriter(fh, fieldnames=list(out[0].keys())); w.writeheader(); w.writerows(out)
with open(os.path.join(ROOT, "data/input_manifest/manifest.csv"), "w", newline="", encoding="utf-8") as fh:
    w = csv.DictWriter(fh, fieldnames=list(man[0].keys())); w.writeheader(); w.writerows(man)
from collections import Counter
print(Counter(r["model"] for r in out)); print("unmapped", Counter((r["model"], r["src_indicator_id"]) for r in out if not r["indicator_id"]))
print("geo codes", sorted(Counter(r["geo_code"] for r in out).items())[:5], len(set(r["geo_code"] for r in out)))
