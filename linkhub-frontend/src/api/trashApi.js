import axiosClient from "./axiosClient";

export async function listDeletedFolders() {
  const res = await axiosClient.get("/folders/deleted");
  return res.data.data;
}

export async function listDeletedItems() {
  const res = await axiosClient.get("/items/deleted");
  return res.data.data;
}

export async function restoreFolder(id) {
  const res = await axiosClient.post(`/folders/${id}/restore`);
  return res.data.data;
}

export async function restoreItem(id) {
  const res = await axiosClient.post(`/items/${id}/restore`);
  return res.data.data;
}
