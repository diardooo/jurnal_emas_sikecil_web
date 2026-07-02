import { describe, expect, it } from "vitest";
import { sniffImageMime } from "@/lib/image-sniff";

const bytes = (...n: number[]) => new Uint8Array(n);

describe("sniffImageMime (JES-110)", () => {
  it("detects JPEG (FF D8 FF)", () => {
    expect(sniffImageMime(bytes(0xff, 0xd8, 0xff, 0xe0, 0x00))).toBe("image/jpeg");
  });

  it("detects PNG (89 50 4E 47 0D 0A 1A 0A)", () => {
    expect(sniffImageMime(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe("image/png");
  });

  it("detects GIF (GIF8)", () => {
    expect(sniffImageMime(bytes(0x47, 0x49, 0x46, 0x38, 0x39, 0x61))).toBe("image/gif");
  });

  it("detects WebP (RIFF....WEBP)", () => {
    expect(
      sniffImageMime(bytes(0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50)),
    ).toBe("image/webp");
  });

  it("rejects a PDF disguised as an image", () => {
    // "%PDF"
    expect(sniffImageMime(bytes(0x25, 0x50, 0x44, 0x46, 0x2d))).toBeNull();
  });

  it("rejects plain text / arbitrary bytes", () => {
    expect(sniffImageMime(bytes(0x68, 0x65, 0x6c, 0x6c, 0x6f))).toBeNull();
  });

  it("rejects truncated / empty input", () => {
    expect(sniffImageMime(bytes())).toBeNull();
    expect(sniffImageMime(bytes(0xff, 0xd8))).toBeNull(); // 2 of 3 JPEG bytes
    expect(sniffImageMime(bytes(0x52, 0x49, 0x46, 0x46))).toBeNull(); // RIFF but no WEBP
  });
});
