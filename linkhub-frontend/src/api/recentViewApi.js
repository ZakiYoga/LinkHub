import axiosClient from "./axiosClient";

export async function trackRecentView(entityType, entityId, entityName) {
  const res = await axiosClient.post("/recent-views", {
    entity_type: entityType,
    entity_id: entityId,
    entity_name: entityName,
  });
  return res.data.data;
}

export async function listRecentViews() {
  const res = await axiosClient.get("/recent-views");
  return res.data.data;
}
