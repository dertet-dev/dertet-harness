import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "dertet-harness-android", "tools"))
from gen_icon import main as build_foreground  # reuses the exact same mark

from PIL import Image

BG = (18, 16, 22, 255)  # #121016

if __name__ == "__main__":
    fg = build_foreground()  # 432x432 RGBA foreground, same crescent/spark mark
    size = 1024
    fg_big = fg.resize((size, size), Image.LANCZOS)

    # iOS App Store icon must be fully opaque (no alpha channel) and has no
    # system-applied mask/safe-zone shrink like Android adaptive icons, so the
    # mark is scaled down a bit and centered to avoid corner clipping when the
    # OS applies its own rounded-square mask on the home screen.
    canvas = Image.new("RGBA", (size, size), BG)
    inset = int(size * 0.09)
    inner = size - inset * 2
    fg_scaled = fg_big.resize((inner, inner), Image.LANCZOS)
    canvas.alpha_composite(fg_scaled, (inset, inset))

    flattened = canvas.convert("RGB")
    out_dir = os.path.join(os.path.dirname(__file__), "DertetHarness", "Resources", "AppIcon.appiconset")
    os.makedirs(out_dir, exist_ok=True)
    flattened.save(os.path.join(out_dir, "icon-1024.png"))
    print("iOS App Store icon generated at", out_dir)
