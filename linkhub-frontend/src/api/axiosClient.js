import axios from "axios";
import { useAuthStore } from "../stores/authStore";
import { getStoredPinToken } from "../lib/pinStorage";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Figures out which folder ID (if any) a request is browsing into, so
// the matching PIN unlock token (if we have one stored) can be
// attached automatically — the caller never has to think about it.
function relevantFolderId(config) {
  const url = config.url || "";
  const detailMatch = url.match(/^\/folders\/([0-9a-fA-F-]{36})$/);
  if (detailMatch) return detailMatch[1];
  if (config.params?.parent_id) return config.params.parent_id;
  if (config.params?.folder_id) return config.params.folder_id;
  return null;
}

axiosClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const folderId = relevantFolderId(config);
  if (folderId) {
    const pinToken = getStoredPinToken(folderId);
    if (pinToken) config.headers["X-Folder-Pin-Token"] = pinToken;
  }

  return config;
});

axiosClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) useAuthStore.getState().logout();
    return Promise.reject(err);
  }
);

export default axiosClient;
