import axiosClient from "./axiosClient";

export async function listItems(params) {
  const res = await axiosClient.get("/items", { params });
  return res.data.data; // { items, total, page, limit }
}

export async function createItem(payload) {
  const res = await axiosClient.post("/items", payload);
  return res.data.data;
}

export async function updateItem(id, payload) {
  const res = await axiosClient.patch(`/items/${id}`, payload);
  return res.data.data;
}

export async function deleteItem(id) {
  const res = await axiosClient.delete(`/items/${id}`);
  return res.data.data;
}
