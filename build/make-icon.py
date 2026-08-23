"""Rasterize a 256x256 Helix mark as PNG (no third-party libs)."""
from __future__ import annotations

import math
import struct
import zlib
from pathlib import Path

W = 256
H = 256


def chunk(tag: bytes, data: bytes) -> bytes:
    return (
        struct.pack(">I", len(data))
        + tag
        + data
        + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
    )


def write_png(path: Path, buf: bytearray) -> None:
    raw = bytearray()
    stride = W * 4
    for y in range(H):
        raw.append(0)
        raw.extend(buf[y * stride : (y + 1) * stride])
    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", W, H, 8, 6, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
        + chunk(b"IEND", b"")
    )
    path.write_bytes(png)


def rounded_mask(x: float, y: float, rad: float = 44.0) -> float:
    cx = min(max(x, rad), W - rad)
    cy = min(max(y, rad), H - rad)
    d = math.hypot(x - cx, y - cy) - rad
    if d <= -1:
        return 1.0
    if d >= 1:
        return 0.0
    return 0.5 - d / 2.0


def strand_dist(x: float, y: float, phase: float) -> float:
    t = (y - 28.0) / 200.0
    if t < -0.02 or t > 1.02:
        return 99.0
    t = min(1.0, max(0.0, t))
    px = 128.0 + math.sin(t * math.pi * 2.0 + phase) * 46.0
    # sine slope correction so the stroke width stays even
    slope = math.cos(t * math.pi * 2.0 + phase) * 46.0 * (math.pi * 2.0 / 200.0)
    return abs(x - px) / math.hypot(1.0, slope)


def mix(a, b, t: float):
    t = min(1.0, max(0.0, t))
    return tuple(int(a[i] * (1 - t) + b[i] * t) for i in range(4))


def main() -> None:
    bg = (11, 10, 9, 255)
    copper = (212, 160, 106, 255)
    ice = (126, 207, 196, 255)
    pearl = (244, 237, 225, 255)
    buf = bytearray(W * H * 4)
    for y in range(H):
        for x in range(W):
            m = rounded_mask(x + 0.5, y + 0.5)
            i = (y * W + x) * 4
            if m <= 0:
                continue
            pix = bg
            d1 = strand_dist(x + 0.5, y + 0.5, 0.0)
            d2 = strand_dist(x + 0.5, y + 0.5, math.pi)
            if d1 < 6.5:
                pix = mix(copper, pix, (d1 / 6.5) ** 1.5)
            if d2 < 6.5:
                pix = mix(ice, pix, (d2 / 6.5) ** 1.5)
            for cy in (86.0, 128.0, 170.0):
                if math.hypot(x + 0.5 - 128.0, y + 0.5 - cy) < 5.2:
                    pix = pearl
            a = int(pix[3] * m)
            buf[i : i + 4] = bytes((pix[0], pix[1], pix[2], a))
    out = Path(__file__).parent / "icon.png"
    write_png(out, buf)
    print(f"wrote {out} ({out.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
