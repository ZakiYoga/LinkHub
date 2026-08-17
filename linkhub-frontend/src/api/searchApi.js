import axiosClient from "./axiosClient";

export async function search(params) {
  const res = await axiosClient.get("/search", { params });
  return res.data.data; // { items, total, page, limit }
}
