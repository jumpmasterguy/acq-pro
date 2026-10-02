#!/usr/bin/env python3
"""Dispatch a GitHub Actions workflow (or poll its runs) from the repo folder.

  python3 scripts/video/gh_dispatch.py run video-pipeline.yml stage=assemble slug=hank-heist
  python3 scripts/video/gh_dispatch.py run video-upload.yml 'pairs=video/x/vo/pad/02.mp3=https://...'
  python3 scripts/video/gh_dispatch.py status video-pipeline.yml        # last 5 runs
  python3 scripts/video/gh_dispatch.py wait <run_id>                     # block until it finishes

Token: $GITHUB_TOKEN, else the github.com line of .git/credentials-claude (never printed).
Repo: $GITHUB_REPO or jumpmasterguy/acq-pro.
"""
import json, os, re, subprocess, sys, time, urllib.request, urllib.error
from pathlib import Path

REPO = os.environ.get("GITHUB_REPO", "jumpmasterguy/acq-pro")


def token():
    t = os.environ.get("GITHUB_TOKEN")
    if t: return t
    # in a worktree, .git is a file pointing at the main repo's .git dir
    common = subprocess.run(["git", "rev-parse", "--git-common-dir"], capture_output=True, text=True).stdout.strip() or ".git"
    cred = Path(common, "credentials-claude")
    if not cred.exists(): sys.exit(f"no GitHub token: set GITHUB_TOKEN or create {cred}")
    for line in cred.read_text().splitlines():
        m = re.match(r"https://(?:[^:@]+:)?([^@]+)@github\.com", line.strip())
        if m: return m.group(1)
    sys.exit("no GitHub token found")


def api(method, path, body=None):
    req = urllib.request.Request(f"https://api.github.com{path}", data=json.dumps(body).encode() if body else None, method=method,
                                 headers={"Authorization": f"token {token()}", "Accept": "application/vnd.github+json", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, (json.loads(r.read() or b"{}") if r.status != 204 else {})
    except urllib.error.HTTPError as e:
        return e.code, {"error": e.read().decode()[:500]}


def main():
    if len(sys.argv) < 3: sys.exit(__doc__)
    cmd, wf = sys.argv[1], sys.argv[2]
    if cmd == "run":
        inputs = dict(kv.split("=", 1) for kv in sys.argv[3:])
        code, js = api("POST", f"/repos/{REPO}/actions/workflows/{wf}/dispatches", {"ref": os.environ.get("GITHUB_REF", "main"), "inputs": inputs})
        print("dispatched" if code == 204 else f"failed {code}: {js}")
        if code == 204:
            time.sleep(4); print(json.dumps(runs(wf, 1), indent=1))
    elif cmd == "status":
        print(json.dumps(runs(wf, 5), indent=1))
    elif cmd == "wait":
        rid = wf
        while True:
            code, js = api("GET", f"/repos/{REPO}/actions/runs/{rid}")
            print(js.get("status"), js.get("conclusion") or "", flush=True)
            if js.get("status") == "completed": break
            time.sleep(30)
        code, js = api("GET", f"/repos/{REPO}/actions/runs/{rid}/jobs")
        for j in js.get("jobs", []):
            for s in j.get("steps", []):
                if s.get("conclusion") not in (None, "success", "skipped"): print("  step failed:", s["name"])
    else:
        sys.exit(__doc__)


def runs(wf, n):
    code, js = api("GET", f"/repos/{REPO}/actions/workflows/{wf}/runs?per_page={n}")
    return [{"id": r["id"], "status": r["status"], "conclusion": r["conclusion"], "created": r["created_at"], "url": r["html_url"]} for r in js.get("workflow_runs", [])]


if __name__ == "__main__":
    main()
