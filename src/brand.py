from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
BRAND = ROOT / "brand"
OUT = ROOT / "assets"


def run():
    flat = Image.open(BRAND / "Rise_logo_2.png").convert("L")
    mark = flat.crop((262, 350, 572, 606))
    alpha = ImageOps.invert(mark).point(lambda v: 0 if v < 24 else min(255, int(v * 1.08)))
    white = Image.new("RGBA", mark.size, (255, 255, 255, 0))
    white.putalpha(alpha)
    white = white.crop(white.getbbox())
    h = 64
    white = white.resize((round(white.width * h / white.height), h), Image.LANCZOS)
    white.save(OUT / "rise-mark.png", optimize=True)

    metal = Image.open(BRAND / "RISE_LOGO_METALIQUE.png").convert("RGB")
    login = metal.crop((222, 340, 1014, 890))
    login = login.resize((round(login.width * 160 / login.height), 160), Image.LANCZOS)
    rgba = []
    for r, g, b in getattr(login, "get_flattened_data", login.getdata)():
        a = max(r, g, b)
        rgba.append((255, 255, 255, 0) if a < 6 else (round(r * 255 / a), round(g * 255 / a), round(b * 255 / a), a))
    login = Image.new("RGBA", login.size)
    login.putdata(rgba)
    login.save(OUT / "rise-metal.webp", "WEBP", quality=90, method=6)

    icon = metal.crop((238, 235, 998, 995)).resize((64, 64), Image.LANCZOS)
    icon.save(OUT / "rise-icon.png", optimize=True)

    for f in ("rise-mark.png", "rise-metal.webp", "rise-icon.png"):
        p = OUT / f
        print(f, Image.open(p).size, p.stat().st_size // 1024 + 1, "KB")


if __name__ == "__main__":
    run()
