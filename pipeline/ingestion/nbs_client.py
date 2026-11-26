"""Minimal, polite client for the public JSON endpoints used by the NBS
national data portal (https://data.stats.gov.cn/dg/website/page.html).
No login, cookies, captcha or access-control circumvention is involved:
these are the same anonymous GET/POST calls the public web page makes.
Requests are rate-limited (>=1.2 s apart) and cached on disk."""
import hashlib, json, os, subprocess, time

BASE = "https://data.stats.gov.cn/dg/website/publicrelease/web/external/"
UA = "ChinaDataAtlas-research-pipeline/0.1 (+non-commercial statistics research)"
CACHE = os.path.join(os.path.dirname(__file__), "..", "..", "data", "raw", "nbs_api_cache")
_last = [0.0]

def _wait():
    d = time.time() - _last[0]
    if d < 1.2:
        time.sleep(1.2 - d)
    _last[0] = time.time()


def call(path, body=None, use_cache=True):
    key = hashlib.sha1((path + json.dumps(body, sort_keys=True, ensure_ascii=False)).encode()).hexdigest()
    os.makedirs(CACHE, exist_ok=True)
    fp = os.path.join(CACHE, key + ".json")
    if use_cache and os.path.exists(fp):
        return json.load(open(fp, encoding="utf-8"))["response"]
    _wait()
    url = BASE + path
    data = json.dumps(body, ensure_ascii=False).encode() if body is not None else None
    # curl is used because urllib stalls on this chunked "stream" endpoint
    cmd = ["curl", "-s", "--fail", "-m", "60", "-A", UA, "-H", "Content-Type: application/json", "-H", "client: pc"]
    if data is not None:
        cmd += ["-X", "POST", "--data-binary", "@-"]
    cmd.append(url)
    for attempt in range(3):
        p = subprocess.run(cmd, input=data, capture_output=True)
        if p.returncode == 0:
            resp = json.loads(p.stdout.decode("utf-8"))
            break
        if attempt == 2:
            raise RuntimeError(f"request failed rc={p.returncode} {url}")
        time.sleep(5 * (attempt + 1))
    json.dump({"url": url, "body": body, "retrieved_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"), "response": resp},
              open(fp, "w", encoding="utf-8"), ensure_ascii=False)
    return resp


def tree(pid="", code="6"):
    return call(f"new/queryIndexTreeAsync?pid={pid}&code={code}")["data"]


def indicators(cid, dt="2000-2025"):
    return call(f"new/queryIndicatorsByCid?cid={cid}&dt={dt}&name=")["data"]["list"]


def series(cid, indicator_ids, da_value, da_text, root_id, dts="2000YY-2025YY"):
    body = {"cid": cid, "indicatorIds": indicator_ids, "daCatalogId": "",
            "das": [{"text": da_text, "value": da_value}], "showType": "1",
            "dts": [dts], "rootId": root_id}
    return call("stream/esData", body)["data"]
