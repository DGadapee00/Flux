#!/usr/bin/env python3
"""
Canvas ingest: copy the course's new or changed files into incoming/<year>-wk<week>/.

Run weekly by .github/workflows/canvas-ingest.yml; runnable by hand with the same variables.
Standard library only, so the Action needs no installs.

  CANVAS_TOKEN      a Canvas access token (Account > Settings > New Access Token; 90 days at most)
  CANVAS_BASE_URL   e.g. https://unf.instructure.com
  CANVAS_COURSE_ID  the number in the course's URL, /courses/<id>
  INGEST_EXT        optional, comma-separated extensions to keep (default pdf,docx,pptx,doc,ppt)

What it has already taken is recorded in incoming/.canvas-state.json by Canvas file id and
modification time, not by the date of the last run: a run that fails or is skipped loses nothing,
and a file the instructor replaces is fetched again. Files come from the course's Files list (if the instructor
has not hidden that tab) and from every module: file items, files linked from pages, assignments
and quizzes, and the pages themselves, saved as .html. Links and external tools can't be
downloaded; they, and everything else the run passes over, are listed in its summary.

The token never leaves the Canvas host. Canvas answers a download with a redirect to its file
store, which is fetched without the Authorization header.
"""
import datetime as dt
import html as htmllib
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INCOMING = os.path.join(ROOT, "incoming")
STATE = os.path.join(INCOMING, ".canvas-state.json")
MAX_BYTES = 90 * 1024 * 1024  # GitHub refuses files over 100 MB


def env(name, required=True):
    v = os.environ.get(name, "").strip()
    if required and not v:
        sys.exit(f"canvas-ingest: {name} is not set")
    return v


TOKEN = env("CANVAS_TOKEN")
BASE = env("CANVAS_BASE_URL").rstrip("/")
COURSE = env("CANVAS_COURSE_ID")
EXT = {e.strip().lower().lstrip(".") for e in (env("INGEST_EXT", False) or "pdf,docx,pptx,doc,ppt").split(",") if e.strip()}
HOST = urllib.parse.urlparse(BASE).netloc


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


OPENER = urllib.request.build_opener(NoRedirect)


def fetch(url, auth=True, hops=5):
    """GET url; send the token only to the Canvas host, and follow redirects by hand."""
    headers = {"User-Agent": "flux-canvas-ingest"}
    if auth and urllib.parse.urlparse(url).netloc == HOST:
        headers["Authorization"] = f"Bearer {TOKEN}"
    req = urllib.request.Request(url, headers=headers)
    try:
        return OPENER.open(req, timeout=60)
    except urllib.error.HTTPError as err:
        if err.code in (301, 302, 303, 307, 308) and hops > 0:
            nxt = urllib.parse.urljoin(url, err.headers["Location"])
            return fetch(nxt, auth=urllib.parse.urlparse(nxt).netloc == HOST, hops=hops - 1)
        raise


def api(path):
    """Every page of a Canvas list endpoint."""
    url = f"{BASE}/api/v1/{path}"
    out = []
    while url:
        with fetch(url) as res:
            data = json.load(res)
            link = res.headers.get("Link", "")
        out.extend(data if isinstance(data, list) else [data])
        nxt = re.search(r'<([^>]+)>;\s*rel="next"', link)
        url = nxt.group(1) if nxt else None
    return out


FILE_LINK = re.compile(r"/courses/\d+/files/(\d+)")
IMAGE_EXT = {"png", "jpg", "jpeg", "gif", "svg", "webp", "bmp"}


def gather():
    """Everything the course offers: (files, docs, notes, source).

    files: Canvas file objects by id. docs: pages and assignment descriptions, as
    {key, name, stamp, html, _module}. notes: what can't be downloaded, with the reason.
    """
    files, docs, notes = {}, [], []
    source = "files"
    try:
        for f in api(f"courses/{COURSE}/files?per_page=100"):
            files[f["id"]] = f
    except urllib.error.HTTPError as err:
        if err.code not in (401, 403, 404):
            raise
        source = "modules"

    def add_file(fid, module, via):
        fid = int(fid)
        if fid in files:
            files[fid].setdefault("_module", module)
            return
        try:
            f = api(f"courses/{COURSE}/files/{fid}")[0]
        except urllib.error.HTTPError as err:
            notes.append(f"file {fid} in {via} ({module}): Canvas refused it, HTTP {err.code} (locked or unpublished?)")
            return
        f["_module"] = module
        files[fid] = f

    def add_links(html, module, via):
        for fid in dict.fromkeys(FILE_LINK.findall(html or "")):
            add_file(fid, module, via)

    for mod in api(f"courses/{COURSE}/modules?per_page=50"):
        module = mod.get("name", "")
        for item in api(f"courses/{COURSE}/modules/{mod['id']}/items?per_page=100"):
            kind, title = item.get("type"), item.get("title", "")
            via = f"{kind} \"{title}\""
            try:
                if kind == "File" and item.get("content_id"):
                    add_file(item["content_id"], module, via)
                elif kind == "Page" and item.get("page_url"):
                    page = api(f"courses/{COURSE}/pages/{urllib.parse.quote(item['page_url'])}")[0]
                    if page.get("locked_for_user") or page.get("body") is None:
                        notes.append(f"{via} ({module}): locked")
                        continue
                    docs.append({"key": f"page:{page.get('page_id') or item['page_url']}", "name": title or page.get("title", ""),
                                 "stamp": page.get("updated_at") or "", "html": page["body"], "_module": module})
                    add_links(page["body"], module, via)
                elif kind == "Assignment" and item.get("content_id"):
                    a = api(f"courses/{COURSE}/assignments/{item['content_id']}")[0]
                    body = a.get("description") or ""
                    if body.strip():
                        docs.append({"key": f"assignment:{a['id']}", "name": title or a.get("name", ""),
                                     "stamp": a.get("updated_at") or "", "html": body, "_module": module})
                        add_links(body, module, via)
                elif kind == "Quiz" and item.get("content_id"):
                    q = api(f"courses/{COURSE}/quizzes/{item['content_id']}")[0]
                    add_links(q.get("description"), module, via)
                    notes.append(f"{via} ({module}): a quiz; only files linked from its description are fetched")
                elif kind in ("ExternalUrl", "ExternalTool"):
                    notes.append(f"{via} ({module}): a link, not a file: {item.get('external_url') or item.get('html_url', '')}")
                elif kind != "SubHeader":
                    notes.append(f"{via} ({module}): not fetched")
            except urllib.error.HTTPError as err:
                notes.append(f"{via} ({module}): Canvas refused it, HTTP {err.code}")
    return list(files.values()), docs, notes, source


def page_html(title, body):
    title = htmllib.escape(title)
    return (f"<!doctype html>\n<meta charset=\"utf-8\">\n<title>{title}</title>\n"
            f"<h1>{title}</h1>\n{body}\n")


def safe_name(name):
    name = re.sub(r"[^\w.\- ()&,+]", "_", name).strip(" .")
    return name or "file"


def main():
    # One check up front, so an expired token says so rather than looking like an empty course.
    try:
        course = api(f"courses/{COURSE}")[0]
    except urllib.error.HTTPError as err:
        if err.code == 401:
            sys.exit(
                "canvas-ingest: Canvas refused the token (401). It has probably expired — tokens last 90 days "
                "at most. Make a new one (Account > Settings > New Access Token) and replace the CANVAS_TOKEN secret."
            )
        sys.exit(f"canvas-ingest: could not read course {COURSE}: HTTP {err.code}")

    state = {}
    if os.path.exists(STATE):
        with open(STATE) as fh:
            state = json.load(fh)
    seen = state.setdefault("files", {})

    files, docs, notes, source = gather()
    today = dt.date.today()
    year, week, _ = today.isocalendar()
    folder = os.path.join(INCOMING, f"{year}-wk{week:02d}")
    taken, skipped = [], []

    def place(name, key):
        os.makedirs(folder, exist_ok=True)
        dest = os.path.join(folder, safe_name(name))
        if os.path.exists(dest):
            stem, dot, tail = dest.rpartition(".")
            safe_key = re.sub(r"\W", "_", key)
            dest = f"{stem}-{safe_key}{dot}{tail}" if dot else f"{dest}-{safe_key}"
        return dest

    def record(key, stamp, name, dest, module):
        rel = os.path.relpath(dest, ROOT)
        seen[key] = {"stamp": stamp, "name": name, "path": rel, "module": module, "fetched": today.isoformat()}
        taken.append(rel)

    for f in sorted(files, key=lambda x: x.get("updated_at") or ""):
        name = f.get("display_name") or f.get("filename") or str(f["id"])
        ext = name.rsplit(".", 1)[-1].lower() if "." in name else ""
        stamp = f.get("modified_at") or f.get("updated_at") or ""
        key = str(f["id"])
        if ext not in EXT:
            if ext not in IMAGE_EXT:
                skipped.append(f"{name} (.{ext} is not in INGEST_EXT)")
            continue
        if seen.get(key, {}).get("stamp") == stamp:
            continue
        if f.get("locked_for_user") or not f.get("url"):
            skipped.append(f"{name} (locked)")
            continue
        if (f.get("size") or 0) > MAX_BYTES:
            skipped.append(f"{name} (too large: {f['size'] // 2**20} MB)")
            continue
        dest = place(name, key)
        with fetch(f["url"]) as res, open(dest, "wb") as out:
            out.write(res.read())
        record(key, stamp, name, dest, f.get("_module", ""))

    for d in docs:
        if seen.get(d["key"], {}).get("stamp") == d["stamp"]:
            continue
        dest = place(d["name"] + ".html", d["key"])
        with open(dest, "w", encoding="utf-8") as out:
            out.write(page_html(d["name"], d["html"]))
        record(d["key"], d["stamp"], d["name"], dest, d["_module"])

    state["course"] = {"id": COURSE, "name": course.get("name", "")}
    state["last_run"] = {"date": today.isoformat(), "source": source, "taken": len(taken)}
    os.makedirs(INCOMING, exist_ok=True)
    with open(STATE, "w") as fh:
        json.dump(state, fh, indent=1, sort_keys=True)
        fh.write("\n")

    lines = [f"Canvas ingest · {course.get('name', COURSE)} · from {source}", f"{len(taken)} new or changed file(s)"]
    lines += [f"  + {p}" for p in taken] + [f"  - skipped {s}" for s in skipped] + [f"  · {n}" for n in notes]
    print("\n".join(lines))
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a") as fh:
            fh.write("\n".join(["### " + lines[0], lines[1], ""] + [f"- `{p}`" for p in taken] + [f"- skipped {s}" for s in skipped]
                               + ([f"\nNot fetched ({len(notes)}):"] + [f"- {n}" for n in notes] if notes else [])) + "\n")
    count = os.environ.get("GITHUB_OUTPUT")
    if count:
        with open(count, "a") as fh:
            fh.write(f"taken={len(taken)}\n")


if __name__ == "__main__":
    main()
