import axiosClient from "./axiosClient";

export async function listCollaborators(folderId) {
  const res = await axiosClient.get(`/folders/${folderId}/collaborators`);
  return res.data.data;
}

export async function addCollaborator(folderId, userId) {
  const res = await axiosClient.post(`/folders/${folderId}/collaborators`, { user_id: userId });
  return res.data.data;
}

export async function removeCollaborator(folderId, userId) {
  const res = await axiosClient.delete(`/folders/${folderId}/collaborators/${userId}`);
  return res.data.data;
}
