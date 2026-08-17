import axiosClient from "./axiosClient";

export async function listUsers() {
  const res = await axiosClient.get("/users");
  return res.data.data; // { id, username, role }[]
}

export async function createUser(payload) {
  const res = await axiosClient.post("/users", payload);
  return res.data.data;
}
