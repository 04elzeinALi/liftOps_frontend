import api from "@/api/client";

// Fetches every page of a paginated endpoint and returns the concatenated
// rows. The API paginates at 15, so any hook that reads only page 1
// silently truncates (hidden history, un-selectable records past the 15th).
export async function fetchAllPages(url) {
  const sep = url.includes("?") ? "&" : "?";
  const first = await api.get(`${url}${sep}page=1`);
  const { data, last_page } = first.data;

  if (last_page <= 1) {
    return data;
  }

  const rest = await Promise.all(
    Array.from({ length: last_page - 1 }, (_, i) => api.get(`${url}${sep}page=${i + 2}`))
  );

  return [data, ...rest.map((res) => res.data.data)].flat();
}
