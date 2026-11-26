"""Record-by-record comparison of Round 1 datasets on key (indicator_id, geo_code, year).
Writes data/reconciliation/conflicts.csv (every key where >=2 models disagree beyond rounding),
data/reconciliation/key_classification.csv and audit/data_overlap_matrix.csv."""
import csv, os, math, itertools, json
from collections import defaultdict, Counter
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
rows = [r for r in csv.DictReader(open(os.path.join(ROOT, "data/processed/r1_long.csv"), encoding="utf-8")) if r["indicator_id"] and r["year"]]
MODELS = ["claude_r1run3", "gemini4neon", "codex_gpt6", "claude_r1a", "gemini", "astra", "muse", "gpt62"]
by = defaultdict(dict)   # key -> model -> (value, row)
for r in rows:
    if r["value"] == "": continue
    k = (r["indicator_id"], r["geo_code"], int(r["year"]))
    by[k].setdefault(r["model"], (float(r["value"]), r))
def decimals(x):
    s = repr(float(x)); return 0 if s.endswith(".0") else len(s.split(".")[1]) if "." in s else 0
def classify(vals):
    vs = [v for v, _ in vals.values()]
    if len(vs) == 1: return "single_model"
    if max(vs) - min(vs) <= 1e-9 * max(1, abs(max(vs))): return "exact_match"
    d = min(decimals(v) for v in vs); tol = 0.5 * 10 ** (-d) + 1e-9
    if max(vs) - min(vs) <= tol * 2: return "match_within_rounding"
    lo, hi = min(vs), max(vs)
    if lo > 0:
        r = hi / lo
        for f in (10, 100, 1000, 10000):
            if abs(r / f - 1) < 0.02: return "unit_conversion_difference"
    return "conflicting_value"
cls = {k: classify(v) for k, v in by.items()}
out_cls, conflicts = [], []
for k, v in sorted(by.items()):
    c = cls[k]
    out_cls.append({"indicator_id": k[0], "geo_code": k[1], "year": k[2], "n_models": len(v), "models": "|".join(sorted(v)), "classification": c,
                    "values": json.dumps({m: x for m, (x, _) in sorted(v.items())}, ensure_ascii=False)})
    if c in ("conflicting_value", "unit_conversion_difference"):
        vals = {m: x for m, (x, _) in v.items()}
        conflicts.append({"indicator_id": k[0], "geo_code": k[1], "year": k[2], "classification": c, "n_models": len(v),
                          **{f"value_{m}": vals.get(m, "") for m in MODELS},
                          "spread_rel": round((max(vals.values()) - min(vals.values())) / (abs(max(vals.values())) or 1), 6),
                          "sources": " || ".join(f"{m}: {r['source_table'][:80]} ({r['src_verification']})" for m, (_, r) in sorted(v.items()))})
D = os.path.join(ROOT, "data/reconciliation"); os.makedirs(D, exist_ok=True)
with open(os.path.join(D, "key_classification.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(out_cls[0].keys())); w.writeheader(); w.writerows(out_cls)
with open(os.path.join(D, "conflicts_raw.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(conflicts[0].keys())); w.writeheader(); w.writerows(conflicts)
# overlap matrix
ov = []
for a, b in itertools.product(MODELS, MODELS):
    shared = [k for k, v in by.items() if a in v and b in v]
    agree = 0
    for k in shared:
        x, y = by[k][a][0], by[k][b][0]
        d = min(decimals(x), decimals(y)); tol = 0.5 * 10 ** (-d) * 2 + 1e-9
        agree += abs(x - y) <= tol
    ov.append({"model_a": a, "model_b": b, "shared_keys": len(shared), "agree_within_rounding": agree, "agreement_rate": round(agree / len(shared), 4) if shared else ""})
os.makedirs(os.path.join(ROOT, "audit"), exist_ok=True)
with open(os.path.join(ROOT, "audit/data_overlap_matrix.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(ov[0].keys())); w.writeheader(); w.writerows(ov)
print("keys", len(by), Counter(cls.values()))
print("conflicts by indicator", Counter(c["indicator_id"] for c in conflicts).most_common())
for m in MODELS:
    print(m, "valid keys", sum(1 for v in by.values() if m in v), "unique-to-model", sum(1 for v in by.values() if list(v) == [m]))
