import { describe, it, expect } from "vitest";
import { shouldSkipDrop } from "./dragDrop.js";

describe("shouldSkipDrop", () => {
  it("skips when source is missing", () => {
    expect(shouldSkipDrop(null, { type: "folder", id: "f1" })).toBe(true);
  });

  it("skips when target is missing (dropped outside any card)", () => {
    expect(shouldSkipDrop({ type: "item", id: "i1", currentParentId: "f1" }, null)).toBe(true);
  });

  it("skips when target is not a folder", () => {
    const source = { type: "folder", id: "f1", currentParentId: null };
    const target = { type: "item", id: "i1" };
    expect(shouldSkipDrop(source, target)).toBe(true);
  });

  it("skips when a folder is dropped onto itself", () => {
    const source = { type: "folder", id: "f1", currentParentId: "root" };
    const target = { type: "folder", id: "f1" };
    expect(shouldSkipDrop(source, target)).toBe(true);
  });

  it("skips when dropped back into its current parent", () => {
    const source = { type: "item", id: "i1", currentParentId: "f2" };
    const target = { type: "folder", id: "f2" };
    expect(shouldSkipDrop(source, target)).toBe(true);
  });

  it("allows moving a folder into an unrelated folder", () => {
    const source = { type: "folder", id: "f1", currentParentId: "root" };
    const target = { type: "folder", id: "f2" };
    expect(shouldSkipDrop(source, target)).toBe(false);
  });

  it("allows moving an item into a different folder", () => {
    const source = { type: "item", id: "i1", currentParentId: "f1" };
    const target = { type: "folder", id: "f2" };
    expect(shouldSkipDrop(source, target)).toBe(false);
  });

  it("allows moving an item currently at root (currentParentId null) into a folder", () => {
    const source = { type: "item", id: "i1", currentParentId: null };
    const target = { type: "folder", id: "f2" };
    expect(shouldSkipDrop(source, target)).toBe(false);
  });
});