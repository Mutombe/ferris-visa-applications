#!/usr/bin/env python
"""Build web images from the licensed iStock originals.

    python tools/build-images.py <folder of iStock-<id>.jpg originals>

Every image is converted to sRGB (two of the originals ship in Adobe RGB,
which renders washed out if the profile is dropped), downscaled with a light
unsharp mask, given the site's warm grade, and saved as progressive JPEG.

Hero slides also get 2560px and 1024px variants for srcset, so a large or
high-density screen gets a sharp picture and a phone does not download one.
"""

import io
import pathlib
import sys

from PIL import Image, ImageCms, ImageEnhance, ImageFilter, ImageOps

OUT = pathlib.Path("assets/img")

# iStock id -> file name used by the site
MAP = {
    "1195971216": "travel-desk",
    "1289269848": "traveller-platform",
    "159738483":  "visa-approved",
    "1617691566": "insurance",
    "2213782340": "train-window",
    "2224116240": "paperwork",
    "2257006282": "station-wave",
    "2258881323": "road-trip",
    "2262674152": "rome-breakfast",
}

HERO = {"station-wave", "rome-breakfast", "visa-approved"}

SRGB = ImageCms.createProfile("sRGB")


def to_srgb(im: Image.Image) -> Image.Image:
    icc = im.info.get("icc_profile")
    if not icc:
        return im.convert("RGB")
    src = ImageCms.ImageCmsProfile(io.BytesIO(icc))
    if "sRGB" in ImageCms.getProfileDescription(src):
        return im.convert("RGB")
    return ImageCms.profileToProfile(im, src, SRGB, outputMode="RGB")


def grade(im: Image.Image) -> Image.Image:
    # the same warm grade the rest of the site was built around
    r, g, b = im.split()
    r = r.point(lambda v: min(255, int(v * 1.045)))
    b = b.point(lambda v: int(v * 0.972))
    im = Image.merge("RGB", (r, g, b))
    im = ImageEnhance.Color(im).enhance(1.07)
    return ImageEnhance.Contrast(im).enhance(1.04)


def render(src: Image.Image, width: int) -> Image.Image:
    h = round(src.height * width / src.width)
    im = src.resize((width, h), Image.LANCZOS)
    return im.filter(ImageFilter.UnsharpMask(radius=1.1, percent=55, threshold=3))


def main(folder: str) -> None:
    src_dir = pathlib.Path(folder)
    total = 0
    for iid, name in MAP.items():
        path = src_dir / f"iStock-{iid}.jpg"
        if not path.exists():
            print(f"missing {path.name}")
            continue
        im = Image.open(path)
        im.draft("RGB", (2560 * 2, 2560 * 2))       # decode big originals at reduced scale
        im = ImageOps.exif_transpose(im)
        im = grade(to_srgb(im))

        widths = [(1920, "", 84)]
        if name in HERO:
            widths += [(2560, "-2560", 80), (1024, "-1024", 82)]

        for w, suffix, q in widths:
            out = OUT / f"{name}{suffix}.jpg"
            render(im, w).save(out, "JPEG", quality=q, optimize=True, progressive=True)
            kb = out.stat().st_size / 1024
            total += kb
            print(f"  {out.name:28s} {w}w  {kb:5.0f} KB")
    print(f"total {total/1024:.1f} MB")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
