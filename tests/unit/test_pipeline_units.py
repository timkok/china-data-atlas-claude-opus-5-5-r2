"""Unit tests for pipeline helpers."""
import os, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "pipeline", "ingestion"))
from groups import split_id, build_groups

def test_split_id_default_and_cross_catalog():
    assert split_id("A", "x") == ("A", "x")
    assert split_id("A", "B:y") == ("B", "y")

def test_build_groups_merges_ids():
    cfg = {"indicators": [{"province": {"cid": "C1", "ids": {"a": "i1", "b": "C2:i2"}}, "national": {"cid": "N", "ids": {"v": "n1"}}},
                          {"province": {"cid": "C1", "ids": {"v": "i3"}}, "national": {"cid": "N", "ids": {"v": "n1"}}}]}
    g = build_groups(cfg)
    assert g[("province", "C1")] == {"i1", "i3"} and g[("province", "C2")] == {"i2"} and g[("national", "N")] == {"n1"}

def test_competition_ranking_rule():
    # mirrors the site's ranking rule: ties share rank, next rank skips
    vals = {"a": 10, "b": 8, "c": 8, "d": 5}
    s = sorted(vals.items(), key=lambda x: -x[1]); r = {}
    for i, (k, v) in enumerate(s, 1):
        r[k] = r[s[i - 2][0]] if i > 1 and v == s[i - 2][1] else i
    assert r == {"a": 1, "b": 2, "c": 2, "d": 4}
