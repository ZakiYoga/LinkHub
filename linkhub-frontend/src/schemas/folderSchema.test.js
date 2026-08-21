import { describe, it, expect } from "vitest";
import { folderFormSchema } from "./folderSchema.js";

describe("folderFormSchema", () => {
  it("accepts a valid name with parent_id null (root folder)", () => {
    const result = folderFormSchema.safeParse({ name: "Marketing", parent_id: null });
    expect(result.success).toBe(true);
  });

  it("accepts a valid name with a UUID parent_id", () => {
    const result = folderFormSchema.safeParse({
      name: "Marketing",
      parent_id: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = folderFormSchema.safeParse({ name: "", parent_id: null });
    expect(result.success).toBe(false);
  });

  it("rejects a name longer than 255 characters", () => {
    const result = folderFormSchema.safeParse({ name: "a".repeat(256), parent_id: null });
    expect(result.success).toBe(false);
  });

  it("rejects a parent_id that isn't a UUID or null", () => {
    const result = folderFormSchema.safeParse({ name: "Marketing", parent_id: "abc" });
    expect(result.success).toBe(false);
  });
});