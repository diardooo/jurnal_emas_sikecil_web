import { describe, expect, it } from "vitest";
import { t, type MessageKey } from "@/lib/i18n";

describe("t() — i18n layer (JES-113)", () => {
  it("returns the Indonesian string for a known key", () => {
    expect(t("upload.notImage")).toBe("Berkas bukan gambar yang valid (JPG/PNG/GIF/WebP)");
  });

  it("interpolates {param} placeholders", () => {
    expect(t("upload.tooLarge", { mb: 5 })).toBe("Ukuran maksimum 5 MB");
    expect(t("upload.tooLarge", { mb: "10" })).toBe("Ukuran maksimum 10 MB");
  });

  it("leaves a placeholder intact when its param is missing", () => {
    expect(t("upload.tooLarge", {})).toBe("Ukuran maksimum {mb} MB");
    expect(t("upload.tooLarge", { other: 1 })).toBe("Ukuran maksimum {mb} MB");
  });

  it("returns a template unchanged when no params are given", () => {
    expect(t("upload.premiumOnly")).toContain("Premium");
  });

  it("falls back to the key itself for an unknown key (visible typo)", () => {
    // Cast simulates a bad key slipping past the type checker.
    expect(t("upload.doesNotExist" as MessageKey)).toBe("upload.doesNotExist");
  });
});
