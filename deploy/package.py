"""Build a standalone static release using only the Python standard library."""
import argparse
import hashlib
import json
import pathlib
import shutil
import subprocess
import zipfile


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("output", type=pathlib.Path, help="New release directory")
    parser.add_argument("--cloudflare", action="store_true", help="Include Cloudflare Pages headers")
    args = parser.parse_args()
    root = pathlib.Path(__file__).resolve().parents[1]
    output = args.output.resolve()
    source = root / "dist"
    if output.exists():
        raise SystemExit(f"Refusing to overwrite an existing release: {output}")
    if output == source or source in output.parents:
        raise SystemExit("Output must be outside dist")
    files = sorted(p for p in source.rglob("*") if p.is_file())
    if not (source / "index.html").is_file():
        raise SystemExit("Missing index.html")
    try:
        commit = subprocess.check_output(
            ["git", "rev-parse", "HEAD"], cwd=root, text=True
        ).strip()
    except (OSError, subprocess.CalledProcessError):
        commit = "unavailable"
    version = json.loads((root / "package.json").read_text(encoding="utf-8"))["version"]
    output.mkdir(parents=True)
    shutil.copytree(source, output / "www")
    shutil.copy2(root / "deploy" / "nginx.conf.example", output)
    shutil.copy2(root / "deploy" / "README.md", output / "部署说明.md")
    if args.cloudflare:
        shutil.copy2(root / "deploy" / "cloudflare" / "_headers", output / "www" / "_headers")
        shutil.copy2(root / "deploy" / "cloudflare" / "README.md", output / "Cloudflare部署说明.md")
    manifest = []
    for file in files:
        relative = file.relative_to(source).as_posix()
        data = file.read_bytes()
        copied = (output / "www" / relative).read_bytes()
        if copied != data:
            raise SystemExit(f"Copy verification failed: {relative}")
        manifest.append({"path": relative, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()})
    if args.cloudflare:
        data = (output / "www" / "_headers").read_bytes()
        manifest.append({"path": "_headers", "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()})
    archive = output / "static-site.zip"
    with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as bundle:
        for entry in manifest:
            bundle.write(output / "www" / entry["path"], arcname=entry["path"])
    with zipfile.ZipFile(archive) as bundle:
        if bundle.testzip() is not None or set(bundle.namelist()) != {e["path"] for e in manifest}:
            raise SystemExit("Archive verification failed")
        for entry in manifest:
            if hashlib.sha256(bundle.read(entry["path"])).hexdigest() != entry["sha256"]:
                raise SystemExit(f"Archive hash mismatch: {entry['path']}")
    report = {"version": version, "source_commit": commit, "hosting_target": "cloudflare-pages" if args.cloudflare else "static-host", "deployment_status": "prepared_not_deployed", "files": manifest,
              "file_count": len(manifest), "total_bytes": sum(e["bytes"] for e in manifest),
              "archive_sha256": hashlib.sha256(archive.read_bytes()).hexdigest()}
    (output / "manifest.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (output / "SHA256SUMS").write_text("".join(f"{e['sha256']}  www/{e['path']}\n" for e in manifest) + f"{report['archive_sha256']}  static-site.zip\n", encoding="utf-8")
    print(json.dumps({"version": version, "output": str(output), "files": len(manifest), "bytes": report["total_bytes"], "archive_bytes": archive.stat().st_size, "verified": True}, ensure_ascii=False))


if __name__ == "__main__":
    main()
