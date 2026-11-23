import base64
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TEMPLATE = ROOT / "src" / "template.html"
OUTPUT = ROOT / "index.html"
ASSETS = ROOT / "assets"

SLOTS = ["hero", "avatar", "cta", "instagram", "x", "reddit", "threads"]


def data_uri(name):
    raw = (ASSETS / f"{name}.webp").read_bytes()
    return "data:image/webp;base64," + base64.b64encode(raw).decode("ascii")


def build():
    html = TEMPLATE.read_text(encoding="utf-8")
    for slot in SLOTS:
        token = f"__{slot.upper()}__"
        assert token in html, token
        html = html.replace(token, data_uri(slot))
    OUTPUT.write_text(html, encoding="utf-8")
    print(f"index.html: {OUTPUT.stat().st_size // 1024} KB")


if __name__ == "__main__":
    build()
