import axiosClient from "./axiosClient";

export async function listFolders(parentId, ownerScope) {
  const params = {};
  if (parentId) params.parent_id = parentId;
  if (ownerScope && ownerScope !== "all") params.owner_scope = ownerScope;
  const res = await axiosClient.get("/folders", { params });
  return res.data.data; // Folder[]
}

export async function getFolder(id) {
  const res = await axiosClient.get(`/folders/${id}`);
  return res.data.data; // { folder, breadcrumb }
}

export async function getFolderSummary(id) {
  const res = await axiosClient.get(`/folders/${id}/summary`);
  return res.data.data; // { subfolder_count, item_count }
}

export async function createFolder(payload) {
  const res = await axiosClient.post("/folders", payload);
  return res.data.data;
}

export async function updateFolder(id, payload) {
  const res = await axiosClient.patch(`/folders/${id}`, payload);
  return res.data.data;
}

export async function deleteFolder(id) {
  const res = await axiosClient.delete(`/folders/${id}`);
  return res.data.data;
}