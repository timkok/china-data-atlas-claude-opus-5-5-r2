"""Shared request grouping so fetch and build use identical cache keys.
An indicator id may be written as "cid:indicatorId" to reference another catalog."""

def split_id(default_cid, v):
    return tuple(v.split(":", 1)) if ":" in v else (default_cid, v)


def build_groups(cfg):
    groups = {}
    for ind in cfg["indicators"]:
        for scope in ("province", "national"):
            s = ind.get(scope)
            if not s:
                continue
            for v in s["ids"].values():
                cid, iid = split_id(s["cid"], v)
                groups.setdefault((scope, cid), set()).add(iid)
    return groups
