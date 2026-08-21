import { describe, it, expect } from "vitest";
import { menuItemFormSchema } from "./itemSchema.js";

const validBase = {
  name: "Laporan Bulanan",
  url: "https://docs.google.com/spreadsheets/d/abc123",
  type: "spreadsheet",
  folder_id: null,
};

describe("menuItemFormSchema", () => {
  it("accepts a minimal valid payload", () => {
    const result = menuItemFormSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it("accepts a valid folder_id UUID instead of null", () => {
    const result = menuItemFormSchema.safeParse({
      ...validBase,
      folder_id: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = menuItemFormSchema.safeParse({ ...validBase, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a name longer than 255 characters", () => {
    const result = menuItemFormSchema.safeParse({ ...validBase, name: "a".repeat(256) });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid URL", () => {
    const result = menuItemFormSchema.safeParse({ ...validBase, url: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("rejects a type outside the allowed enum", () => {
    const result = menuItemFormSchema.safeParse({ ...validBase, type: "video" });
    expect(result.success).toBe(false);
  });

  it("rejects folder_id that isn't a UUID or null", () => {
    const result = menuItemFormSchema.safeParse({ ...validBase, folder_id: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("accepts an optional description under 500 chars", () => {
    const result = menuItemFormSchema.safeParse({ ...validBase, description: "Ringkas" });
    expect(result.success).toBe(true);
  });

  it("rejects a description over 500 chars", () => {
    const result = menuItemFormSchema.safeParse({ ...validBase, description: "a".repeat(501) });
    expect(result.success).toBe(false);
  });
});