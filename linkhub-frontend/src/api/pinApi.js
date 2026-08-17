import axiosClient from "./axiosClient";

export async function verifyFolderPin(folderId, pin) {
  const res = await axiosClient.post(`/folders/${folderId}/verify-pin`, { pin });
  return res.data.data; // { unlock_token }
}

export async function setFolderPin(folderId, pin) {
  const res = await axiosClient.post(`/folders/${folderId}/pin`, { pin });
  return res.data.data;
}

export async function removeFolderPin(folderId) {
  const res = await axiosClient.delete(`/folders/${folderId}/pin`);
  return res.data.data;
}

// Reads the structured { pin_required, folder_name } body from a 403
// response, or null if this error isn't a PIN challenge.
export function extractPinRequired(err) {
  const body = err.response?.data;
  if (err.response?.status === 403 && body?.data?.pin_required) {
    return { folderName: body.data.folder_name };
  }
  return null;
}
