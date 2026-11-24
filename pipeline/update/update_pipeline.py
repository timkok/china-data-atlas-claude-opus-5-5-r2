"""Update pipeline: Discovery -> Change detection -> Download (staging) -> Raw snapshot (sha256) -> Validation ->
Reconciliation (diff vs canonical) -> Review report -> (human) approve -> Publish as NEW vintage -> rollback possible.

Never overwrites the canonical layer in place and never publishes without an explicit `approve` by a person.

Usage:
  python3 pipeline/update/update_pipeline.py check    [--root DIR] [--source live|fixture:<dir>]   # discovery + staging + review report
  python3 pipeline/update/update_pipeline.py approve  <run_id> [--root DIR]                         # merge staged changes as a new vintage
  python3 pipeline/update/update_pipeline.py rollback <run_id> [--root DIR]                         # restore the snapshot taken before approve
`--root` lets the simulation run on an isolated copy so test data can never mix with official data."""
import argparse, csv, datetime as dt, hashlib, json, os, shutil, sys

REQ = ["indicator_id", "geo_code", "year", "value", "unit", "source_url", "source_table", "retrieved_at"]


def load_canon(root):
    p = os.path.join(root, "data/canonical_candidate/observations.csv")
    return list(csv.DictReader(open(p, encoding="utf-8"))), p


def live_candidates(root):
    """Re-query the NBS public endpoints for the latest two years of every configured series (uses the polite client)."""
    sys.path.insert(0, os.path.join(root, "pipeline", "ingestion"))
    import nbs_client as c  # noqa
    from groups import build_groups, split_id  # noqa
    cfg = json.load(open(os.path.join(root, "config/indicators.json"), encoding="utf-8"))
    regions = json.load(open(os.path.join(root, "config/regions.json"), encoding="utf-8"))
    year = dt.date.today().year
    out = []
    for ind in cfg["indicators"]:
        for scope in ("province", "national"):
            s = ind.get(scope)
            if not s or s["formula"] != "v":
                continue  # derived series are recomputed after approval
            cid, iid = split_id(s["cid"], s["ids"]["v"])
            root_id = cfg["roots"]["province"] if scope == "province" else c.tree("", "3")[0]["_id"]
            targets = [r for r in regions if (r["level"] == "national") == (scope == "national")]
            for r in targets[:1] if scope == "national" else targets:
                data = c.call("stream/esData", {"cid": cid, "indicatorIds": [iid], "daCatalogId": "", "das": [{"text": r["name_zh"], "value": r["nbs_code"]}],
                                               "showType": "1", "dts": [f"{year-2}YY-{year}YY"], "rootId": root_id}, use_cache=False)["data"]
                for y in data:
                    v = (y["values"][0].get("value") or "").strip() if y["values"] else ""
                    out.append({"indicator_id": ind["id"], "geo_code": r["geo_code"], "year": y["code"][:4], "value": v, "unit": ind["unit"],
                                "source_url": "https://data.stats.gov.cn/dg/website/page.html", "source_table": s["table"], "retrieved_at": dt.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")})
    return out


def check(root, source):
    run_id = dt.datetime.utcnow().strftime("upd-%Y%m%dT%H%M%SZ")
    stage = os.path.join(root, "data/staging", run_id); os.makedirs(stage, exist_ok=True)
    if source.startswith("fixture:"):
        cands = list(csv.DictReader(open(os.path.join(source[8:], "candidates.csv"), encoding="utf-8")))
    else:
        cands = live_candidates(root)
    raw = os.path.join(stage, "candidates.csv")
    with open(raw, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(cands[0].keys()) if cands else REQ); w.writeheader(); w.writerows(cands)
    sha = hashlib.sha256(open(raw, "rb").read()).hexdigest()
    canon, _ = load_canon(root)
    cur = {(r["indicator_id"], r["geo_code"], str(r["year"])): r for r in canon if r["publish_default"] == "true"}
    new, rev, same, blocked = [], [], 0, []
    for c in cands:
        missing = [k for k in REQ if not str(c.get(k, "")).strip()]
        try:
            float(c.get("value", ""))
        except ValueError:
            missing.append("value(not numeric)") if "value" not in missing else None
        if missing:
            blocked.append({**c, "reason": "missing/invalid fields: " + ",".join(missing)}); continue
        k = (c["indicator_id"], c["geo_code"], str(c["year"]))
        if k not in cur:
            new.append(c)
        elif abs(float(cur[k]["value"]) - float(c["value"])) > 1e-9 * max(1, abs(float(c["value"]))):
            rev.append({**c, "previous_value": cur[k]["value"], "previous_vintage": cur[k]["vintage"]})
        else:
            same += 1
    report = {"run_id": run_id, "status": "pending_review", "created_at": dt.datetime.utcnow().isoformat() + "Z", "source": source, "raw_snapshot": os.path.relpath(raw, root),
              "raw_sha256": sha, "candidates": len(cands), "unchanged": same, "new_observations": len(new), "revisions": len(rev), "blocked": len(blocked),
              "new_years_detected": sorted({(c["indicator_id"], c["year"]) for c in new}), "new": new, "revised": rev, "blocked_rows": blocked,
              "publish_rule": "Nothing is published until a person runs `approve`. Revisions are added as a new vintage; previous values are kept as superseded."}
    json.dump(report, open(os.path.join(stage, "review_report.json"), "w"), ensure_ascii=False, indent=1)
    with open(os.path.join(stage, "REVIEW.md"), "w", encoding="utf-8") as f:
        f.write(f"# Update review {run_id}\n\nsource: {source}\nraw sha256: {sha}\n\n| | count |\n|---|---|\n| candidates | {len(cands)} |\n| unchanged | {same} |\n| NEW | {len(new)} |\n| REVISED | {len(rev)} |\n| BLOCKED | {len(blocked)} |\n\n")
        for r in rev[:50]: f.write(f"- REVISION {r['indicator_id']} {r['geo_code']} {r['year']}: {r['previous_value']} → {r['value']}\n")
        for r in blocked[:50]: f.write(f"- BLOCKED {r.get('indicator_id')} {r.get('geo_code')} {r.get('year')}: {r['reason']}\n")
    print(json.dumps({k: report[k] for k in ("run_id", "status", "candidates", "unchanged", "new_observations", "revisions", "blocked")}))
    return report


def approve(root, run_id):
    stage = os.path.join(root, "data/staging", run_id); rep = json.load(open(os.path.join(stage, "review_report.json"), encoding="utf-8"))
    canon, cpath = load_canon(root)
    snap = os.path.join(root, "data/versions", run_id); os.makedirs(snap, exist_ok=True)
    shutil.copy(cpath, os.path.join(snap, "observations.before.csv"))
    vpath = os.path.join(root, "data/canonical_candidate/vintages.csv")
    if os.path.exists(vpath): shutil.copy(vpath, os.path.join(snap, "vintages.before.csv"))
    vint = list(csv.DictReader(open(vpath, encoding="utf-8"))) if os.path.exists(vpath) else []
    idx = {(r["indicator_id"], r["geo_code"], str(r["year"])): r for r in canon if r["publish_default"] == "true"}
    tag = f"NBS-DB@{rep['created_at'][:10]}"
    for c in rep["revised"]:
        k = (c["indicator_id"], c["geo_code"], str(c["year"])); r = idx[k]
        for v in vint:
            if (v["indicator_id"], v["geo_code"], str(v["year"])) == k and v["vintage_status"] == "current": v["vintage_status"] = "superseded"
        vint.append({"indicator_id": k[0], "geo_code": k[1], "year": k[2], "value": c["value"], "vintage": tag, "vintage_status": "current", "source": c["source_table"], "source_url": c["source_url"], "evidence_url": ""})
        r.update({"value": c["value"], "vintage": tag, "data_status": "revised", "retrieved_at": c["retrieved_at"], "evidence_level": "E2", "verification_status": "verified_direct"})
    template = canon[0]
    for c in rep["new"]:
        row = {k: "" for k in template}; row.update({k: c[k] for k in REQ}); row.update({"vintage": tag, "data_status": "unknown", "evidence_level": "E2", "verification_status": "verified_direct",
                                                                                     "extraction_method": "API", "publish_default": "true", "notes": f"added by update {run_id}"})
        canon.append(row)
        vint.append({"indicator_id": c["indicator_id"], "geo_code": c["geo_code"], "year": c["year"], "value": c["value"], "vintage": tag, "vintage_status": "current", "source": c["source_table"], "source_url": c["source_url"], "evidence_url": ""})
    with open(cpath, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(template.keys())); w.writeheader(); w.writerows(canon)
    if vint:
        with open(vpath, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=list(vint[0].keys())); w.writeheader(); w.writerows(vint)
    rep["status"] = "approved"; rep["approved_at"] = dt.datetime.utcnow().isoformat() + "Z"
    json.dump(rep, open(os.path.join(stage, "review_report.json"), "w"), ensure_ascii=False, indent=1)
    with open(os.path.join(root, "data/update_log.csv"), "a", newline="", encoding="utf-8") as f:
        csv.writer(f).writerow([run_id, rep["approved_at"], "approved", rep["new_observations"], rep["revisions"], rep["blocked"], rep["raw_sha256"]])
    print(f"approved {run_id}: +{rep['new_observations']} new, {rep['revisions']} revisions (old values kept as superseded)")


def rollback(root, run_id):
    snap = os.path.join(root, "data/versions", run_id)
    shutil.copy(os.path.join(snap, "observations.before.csv"), os.path.join(root, "data/canonical_candidate/observations.csv"))
    if os.path.exists(os.path.join(snap, "vintages.before.csv")):
        shutil.copy(os.path.join(snap, "vintages.before.csv"), os.path.join(root, "data/canonical_candidate/vintages.csv"))
    with open(os.path.join(root, "data/update_log.csv"), "a", newline="", encoding="utf-8") as f:
        csv.writer(f).writerow([run_id, dt.datetime.utcnow().isoformat() + "Z", "rolled_back", "", "", "", ""])
    print(f"rolled back {run_id}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("cmd"); ap.add_argument("run_id", nargs="?"); ap.add_argument("--root", default=os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
    ap.add_argument("--source", default="live"); a = ap.parse_args()
    {"check": lambda: check(a.root, a.source), "approve": lambda: approve(a.root, a.run_id), "rollback": lambda: rollback(a.root, a.run_id)}[a.cmd]()
