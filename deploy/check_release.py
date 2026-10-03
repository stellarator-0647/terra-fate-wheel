"""Verify public static files against a local release manifest; no credentials."""
import argparse
import concurrent.futures
import hashlib
import json
import pathlib
import time
import urllib.parse
import urllib.request


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("url")
    parser.add_argument("manifest", type=pathlib.Path)
    parser.add_argument("output", type=pathlib.Path)
    parser.add_argument("--proxy", default="")
    args = parser.parse_args()
    base = args.url.rstrip("/") + "/"
    parsed = urllib.parse.urlsplit(base)
    if parsed.scheme != "https" or parsed.username or parsed.password:
        raise SystemExit("Provide a public HTTPS URL without credentials")
    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    entries = [e for e in manifest["files"] if e["path"] != "_headers"]

    def check(entry):
        start = time.perf_counter()
        url = base + urllib.parse.quote(entry["path"])
        handler = urllib.request.ProxyHandler({"https": args.proxy} if args.proxy else {})
        opener = urllib.request.build_opener(handler)
        result = {"path": entry["path"]}
        try:
            request = urllib.request.Request(url, headers={"User-Agent": "Terra-Release-Check/1.0"})
            with opener.open(request, timeout=25) as response:
                data = response.read()
                content_type = response.headers.get_content_type()
                cache = response.headers.get("Cache-Control", "")
                result.update(status=response.status, bytes=len(data), content_type=content_type,
                              sha256_matches=hashlib.sha256(data).hexdigest() == entry["sha256"],
                              cache_control=cache)
                if entry["path"].endswith(".js"):
                    result["mime_valid"] = content_type in {"text/javascript", "application/javascript"}
                elif entry["path"].endswith(".css"):
                    result["mime_valid"] = content_type == "text/css"
                elif entry["path"].endswith(".mp3"):
                    result["mime_valid"] = content_type in {"audio/mpeg", "audio/mp3"}
                else:
                    result["mime_valid"] = True
                result["ok"] = response.status == 200 and result["sha256_matches"] and result["mime_valid"]
                if entry["path"] == "index.html":
                    result["ok"] = result["ok"] and "no-cache" in cache
        except Exception as error:
            result.update(ok=False, error=str(error))
        result["seconds"] = round(time.perf_counter() - start, 3)
        return result

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        rows = list(pool.map(check, entries))
    report = {"url": base, "version": manifest["version"], "network_route": "configured_proxy" if args.proxy else "proxy_disabled",
              "checked_files": len(rows), "passed_files": sum(r["ok"] for r in rows), "ok": all(r["ok"] for r in rows), "files": rows}
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({k: v for k, v in report.items() if k != "files"}, ensure_ascii=False))
    for row in rows:
        if not row["ok"]:
            print(json.dumps(row, ensure_ascii=False))
    raise SystemExit(0 if report["ok"] else 1)


if __name__ == "__main__":
    main()
