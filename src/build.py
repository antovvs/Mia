import base64
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
ASSETS = ROOT / "assets"

SLOTS = ["hero", "avatar", "cta", "instagram", "x", "reddit", "threads"]


def data_uri(name):
    raw = (ASSETS / f"{name}.webp").read_bytes()
    return "data:image/webp;base64," + base64.b64encode(raw).decode("ascii")


def supabase_config():
    path = SRC / "config.json"
    cfg = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
    url = (cfg.get("supabase_url") or "").strip().rstrip("/")
    key = (cfg.get("supabase_anon_key") or "").strip()
    if url and not re.fullmatch(r"https://[A-Za-z0-9.-]+", url):
        raise SystemExit(f"supabase_url invalide : {url!r}")
    if key and not re.fullmatch(r"[A-Za-z0-9._-]+", key):
        raise SystemExit("supabase_anon_key invalide")
    if key.startswith("sb_secret_"):
        raise SystemExit("Clé secrète refusée : seule la clé publishable / anon peut aller dans le site.")
    if key.count(".") == 2:
        try:
            payload = key.split(".")[1]
            payload += "=" * (-len(payload) % 4)
            role = json.loads(base64.urlsafe_b64decode(payload)).get("role")
        except ValueError:
            role = None
        if role and role != "anon":
            raise SystemExit(f"Cette clé a le rôle {role!r} : seule la clé anon/public peut aller dans le site.")
    return url, key


def fill(html, url, key):
    html = html.replace("__SB_URL__", url).replace("__SB_KEY__", key)
    left = re.findall(r"__[A-Z_]+__", html)
    assert not left, left
    return html


def build():
    url, key = supabase_config()

    landing = (SRC / "template.html").read_text(encoding="utf-8")
    landing = landing.replace("__LANDING_JS__", (SRC / "landing.js").read_text(encoding="utf-8").strip())
    for slot in SLOTS:
        token = f"__{slot.upper()}__"
        assert token in landing, token
        landing = landing.replace(token, data_uri(slot))
    out = ROOT / "index.html"
    out.write_text(fill(landing, url, key), encoding="utf-8")
    print(f"index.html: {out.stat().st_size // 1024} KB")

    dash = (SRC / "dashboard.html").read_text(encoding="utf-8")
    for token, name, mime in (("__RISE_MARK__", "rise-mark.png", "image/png"),
                              ("__RISE_METAL__", "rise-metal.webp", "image/webp"),
                              ("__RISE_ICON__", "rise-icon.png", "image/png")):
        raw = (ASSETS / name).read_bytes()
        dash = dash.replace(token, f"data:{mime};base64," + base64.b64encode(raw).decode("ascii"))
    out = ROOT / "dashboard" / "index.html"
    out.parent.mkdir(exist_ok=True)
    out.write_text(fill(dash, url, key), encoding="utf-8")
    print(f"dashboard/index.html: {out.stat().st_size // 1024} KB")
    print("mode:", "Supabase" if url and key else "local (src/config.json vide)")


if __name__ == "__main__":
    build()
