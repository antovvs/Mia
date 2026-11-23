from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "photos-source"
OUT = ROOT / "assets"

# name: (source file, rotate clockwise degrees, crop box, output size, webp quality)
CROPS = {
    "hero":      ("27.webp",  0,  (120, 420, 900, 1432),   (780, None), 82),
    "cta":       ("182.webp", 0,  (0, 350, 784, 840),      (784, None), 82),
    "avatar":    ("182.webp", 0,  (110, 430, 410, 730),    (144, 144),  85),
    "instagram":("138.jpg",  0,  (100, 330, 800, 1030),   (480, 480),  78),
    "x":         ("threads-new.jpg", 0, (12, 0, 288, 276), (276, 276),  88),
    "reddit":    ("36.webp",  90, (480, 60, 1280, 860),    (480, 480),  78),
    "threads":   ("9.webp",   0,  (480, 300, 1125, 945),   (480, 480),  78),
}


def run():
    OUT.mkdir(exist_ok=True)
    for name, (src, rot, box, size, q) in CROPS.items():
        im = Image.open(SRC / src).convert("RGB")
        if rot:
            im = im.rotate(-rot, expand=True)
        im = im.crop(box)
        w, h = size
        if h is None:
            h = round(im.height * w / im.width)
        im = im.resize((w, h), Image.LANCZOS)
        im.save(OUT / f"{name}.webp", "WEBP", quality=q, method=6)
        print(name, im.size, (OUT / f"{name}.webp").stat().st_size // 1024, "KB")


if __name__ == "__main__":
    run()
