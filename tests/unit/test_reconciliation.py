import importlib.util, os, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
def load():
    spec = importlib.util.spec_from_file_location("bc", os.path.join(ROOT, "pipeline/reconciliation/build_canonical.py"))
    src = open(spec.origin, encoding="utf-8").read().split("# ---------- assemble ----------")[0]
    ns = {"__file__": spec.origin}; exec(compile(src, spec.origin, "exec"), ns); return ns
NS = load()
def row(ind, val, tr="none", orig="v=1"):
    return {"indicator_id": ind, "value": str(val), "transformation": tr, "original_value": orig, "source_url": "u"}
def x(src="NBS"): return {"source_table": src, "source_url": "", "model": "m"}
def test_rounding_match_for_wan_ren():
    c = NS["classify"]("higher_education_students", "440000", 2024, 2687600, row("higher_education_students", 2687600, "v*10000; round(0)", "v=268.76"), 2687595, x())
    assert c[0] == "Match Within Official Rounding"
def test_wikipedia_rejected():
    c = NS["classify"]("gdp", "440000", 2020, 100, row("gdp", 100), 101, {"source_table": "x", "source_url": "https://zh.wikipedia.org/x", "model": "m"})
    assert c[0] == "Source Not Verifiable"
def test_gdp_2024_revision():
    assert NS["classify"]("gdp", "440000", 2024, 141488.9, row("gdp", 141488.9), 141633.8, x())[0] == "Official Revision"
def test_unit_error():
    assert NS["classify"]("population", "440000", 2015, 11678, row("population", 11678), 116780000, x())[0] == "Unit Conversion Difference"
def test_unexplained_stays_unresolved():
    c = NS["classify"]("hospital_beds_per_1000", "440000", 2024, 5.04, row("hospital_beds_per_1000", 5.04), 6.5, x())
    assert c[0] == "Conflicting Value" and c[1] == "unresolved"
