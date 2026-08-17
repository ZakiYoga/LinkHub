import axiosClient from "./axiosClient";

export async function login(username, password) {
  const res = await axiosClient.post("/auth/login", { username, password });
  return res.data.data; // { token }
}
