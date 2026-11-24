"""Step 1 (Raw evidence): fetch every configured indicator from the NBS
public data portal for 31 provinces + national, 2000-2025. Raw responses are
cached under data/raw/nbs_api_cache/ (one JSON per request, with URL, body
and retrieval timestamp) so the whole dataset can be regenerated offline."""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
import nbs_client as c

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
cfg = json.load(open(os.path.join(ROOT, "config", "indicators.json"), encoding="utf-8"))
regions = [r for r in json.load(open(os.path.join(ROOT, "config", "regions.json"), encoding="utf-8")) if r["level"] == "province"]
nat_root = c.tree("", "3")[0]["_id"]
prov_root = cfg["roots"]["province"]

from groups import build_groups
groups = build_groups(cfg)

manifest = []
for (scope, cid), ids in sorted(groups.items()):
    ids = sorted(ids)
    targets = [("000000000000", "全国")] if scope == "national" else [(r["nbs_code"], r["name_zh"]) for r in regions]
    for code, name in targets:
        root = nat_root if scope == "national" else prov_root
        data = c.series(cid, ids, code, name, root)
        manifest.append({"scope": scope, "cid": cid, "da": code, "n_years": len(data)})
        print(scope, cid[:8], name, len(data), flush=True)
json.dump({"national_root": nat_root, "requests": manifest}, open(os.path.join(ROOT, "data", "raw", "fetch_manifest.json"), "w"), ensure_ascii=False, indent=1)
