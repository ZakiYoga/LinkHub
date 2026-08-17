import { z } from "zod";

export const ItemTypeEnum = z.enum([
  "spreadsheet",
  "slides",
  "drive",
  "document",
  "form",
  "other",
]);

// Field names mirror the Go struct's json tags (snake_case) exactly,
// so no mapping layer is needed between the API response and the form.
export const menuItemFormSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(255),
  url: z.string().url("URL tidak valid"),
  type: ItemTypeEnum,
  folder_id: z.string().uuid().nullable(),
  description: z.string().max(500).optional(),
  tag_ids: z.array(z.string().uuid()).optional(),
});
