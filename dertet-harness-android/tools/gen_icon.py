import math
from PIL import Image, ImageDraw, ImageOps

SS = 4  # supersample factor
BASE = 432  # target xxxhdpi foreground size (dp*4)
SIZE = BASE * SS

TEAL = (43, 224, 198)      # #2BE0C6
VIOLET = (139, 108, 255)   # #8B6CFF
BG = (18, 16, 22, 255)     # #121016 (not used, background handled via XML color)

def rounded_rect(draw, box, radius, fill):
    draw.rounded_rectangle(box, radius=radius, fill=fill)

def main():
    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))

    # ---- shape mask: chat-bubble body (rounded square) + tail, minus a cutout circle -> crescent "D" mark
    mask = Image.new("L", (SIZE, SIZE), 0)
    mdraw = ImageDraw.Draw(mask)

    cx, cy = SIZE // 2, SIZE // 2
    body_half = int(SIZE * 0.30)
    body_box = [cx - body_half, cy - body_half, cx + body_half, cy + body_half]
    radius = int(body_half * 0.62)
    mdraw.rounded_rectangle(body_box, radius=radius, fill=255)

    # speech-bubble tail: a clean rounded-corner triangle, bottom-left of the body
    tail_w = int(SIZE * 0.13)
    tail_h = int(SIZE * 0.12)
    tail_base_x = cx - int(body_half * 0.55)
    tail_base_y = cy + body_half - int(SIZE * 0.01)
    tail_pts = [
        (tail_base_x - tail_w // 2, tail_base_y),
        (tail_base_x + tail_w // 2, tail_base_y),
        (tail_base_x - int(tail_w * 0.18), tail_base_y + tail_h),
    ]
    mdraw.polygon(tail_pts, fill=255)
    # round the two top corners of the tail so it fuses smoothly into the body
    corner_r = int(tail_w * 0.30)
    for (px, py) in tail_pts[:2]:
        mdraw.ellipse([px - corner_r, py - corner_r, px + corner_r, py + corner_r], fill=255)

    # cutout circle -> turns the rounded square into a crescent / "D" negative-space mark
    cut_r = int(body_half * 0.86)
    cut_cx = cx + int(body_half * 0.62)
    cut_cy = cy - int(body_half * 0.10)
    mdraw.ellipse(
        [cut_cx - cut_r, cut_cy - cut_r, cut_cx + cut_r, cut_cy + cut_r],
        fill=0,
    )

    # ---- gradient fill (diagonal-ish: emulate via vertical gradient then slight rotate not needed, vertical looks clean)
    grad_l = Image.linear_gradient("L").resize((SIZE, SIZE))
    grad_rgb = ImageOps.colorize(grad_l, black=TEAL, white=VIOLET).convert("RGBA")
    grad_rgb.putalpha(255)

    transparent = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    shape_layer = Image.composite(grad_rgb, transparent, mask)

    # ---- sparkle accent: small 4-point star, sitting inside the crescent's negative space
    spark_layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(spark_layer)
    spark_cx = cut_cx - int(cut_r * 0.62)
    spark_cy = cut_cy - int(cut_r * 0.05)
    spark_r_out = int(SIZE * 0.048)
    spark_r_in = int(spark_r_out * 0.34)
    points = []
    for i in range(8):
        ang = math.pi / 4 * i
        r = spark_r_out if i % 2 == 0 else spark_r_in
        points.append((spark_cx + r * math.cos(ang), spark_cy + r * math.sin(ang)))
    sdraw.polygon(points, fill=(255, 255, 255, 255))

    final = Image.alpha_composite(canvas, shape_layer)
    final = Image.alpha_composite(final, spark_layer)

    final = final.resize((BASE, BASE), Image.LANCZOS)
    return final


if __name__ == "__main__":
    fg = main()
    out_dir_map = {
        "mipmap-mdpi": 108,
        "mipmap-hdpi": 162,
        "mipmap-xhdpi": 216,
        "mipmap-xxhdpi": 324,
        "mipmap-xxxhdpi": 432,
    }
    res_root = "app/src/main/res"
    import os
    for folder, px in out_dir_map.items():
        path = os.path.join(res_root, folder)
        os.makedirs(path, exist_ok=True)
        resized = fg.resize((px, px), Image.LANCZOS)
        resized.save(os.path.join(path, "ic_launcher_foreground.png"))
        # also save a plain square legacy icon variant sized to full canvas (used as fallback ic_launcher.png)
    # play-store / preview asset
    preview = fg.resize((512, 512), Image.LANCZOS)
    preview.save("tools/icon_preview_512.png")

    # preview composited over the real background color, both square and circle-masked (adaptive icon simulation)
    bg_color = (18, 16, 22, 255)
    composed = Image.new("RGBA", (512, 512), bg_color)
    composed.alpha_composite(preview)
    composed.convert("RGB").save("tools/icon_preview_on_bg.png")

    circle_mask = Image.new("L", (512, 512), 0)
    ImageDraw.Draw(circle_mask).ellipse([0, 0, 512, 512], fill=255)
    circle_preview = Image.composite(composed, Image.new("RGBA", (512, 512), (0, 0, 0, 0)), circle_mask)
    circle_preview.save("tools/icon_preview_circle.png")

    print("Icon foreground generated.")
