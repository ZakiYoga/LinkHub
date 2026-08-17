import axiosClient from "./axiosClient";

export async function listTags() {
  const res = await axiosClient.get("/tags");
  return res.data.data; // Tag[]
}

export async function createTag(name) {
  const res = await axiosClient.post("/tags", { name });
  return res.data.data;
}

export async function updateTag(id, name) {
  const res = await axiosClient.patch(`/tags/${id}`, { name });
  return res.data.data;
}

export async function deleteTag(id) {
  const res = await axiosClient.delete(`/tags/${id}`);
  return res.data.data;
}
