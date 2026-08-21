import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DndContext } from "@dnd-kit/core";
import ItemCard from "./ItemCard.jsx";

// useDraggable (used inside ItemCard) reads dnd-kit's internal
// context, so every render needs a real <DndContext> ancestor even
// though these tests never actually perform a drag.
function renderWithDnd(ui) {
  return render(<DndContext>{ui}</DndContext>);
}

const baseItem = {
  id: "item-1",
  name: "Laporan Q3",
  url: "https://docs.google.com/spreadsheets/d/xyz",
  type: "spreadsheet",
  folder_id: null,
  description: "Rekap penjualan kuartal 3",
  tags: [{ id: "tag-1", name: "Finance" }],
};

describe("ItemCard", () => {
  it("renders the item name, description, and tags", () => {
    renderWithDnd(<ItemCard item={baseItem} canEdit={false} />);
    expect(screen.getByText("Laporan Q3")).toBeInTheDocument();
    expect(screen.getByText("Rekap penjualan kuartal 3")).toBeInTheDocument();
    expect(screen.getByText("Finance")).toBeInTheDocument();
  });

  it("links to the item's URL and opens in a new tab", () => {
    renderWithDnd(<ItemCard item={baseItem} canEdit={false} />);
    const link = screen.getByRole("link", { name: /Laporan Q3/i });
    expect(link).toHaveAttribute("href", baseItem.url);
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("hides edit/delete controls when canEdit is false", () => {
    renderWithDnd(<ItemCard item={baseItem} canEdit={false} />);
    expect(screen.queryByTitle("Edit link")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Hapus link")).not.toBeInTheDocument();
  });

  it("shows edit/delete controls when canEdit is true", () => {
    renderWithDnd(<ItemCard item={baseItem} canEdit={true} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByTitle("Edit link")).toBeInTheDocument();
    expect(screen.getByTitle("Hapus link")).toBeInTheDocument();
  });

  it("calls onEdit with the item when the edit button is clicked", async () => {
    const onEdit = vi.fn();
    renderWithDnd(<ItemCard item={baseItem} canEdit={true} onEdit={onEdit} onDelete={() => {}} />);
    await userEvent.click(screen.getByTitle("Edit link"));
    expect(onEdit).toHaveBeenCalledWith(baseItem);
  });

  it("calls onOpen when the link itself is clicked", async () => {
    const onOpen = vi.fn((e) => e.preventDefault());
    renderWithDnd(<ItemCard item={baseItem} canEdit={false} onOpen={onOpen} />);
    await userEvent.click(screen.getByRole("link", { name: /Laporan Q3/i }));
    expect(onOpen).toHaveBeenCalled();
  });
});