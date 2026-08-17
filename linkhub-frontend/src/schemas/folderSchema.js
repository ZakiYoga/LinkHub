import { z } from "zod";

export const folderFormSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(255),
  parent_id: z.string().uuid().nullable(),
});
