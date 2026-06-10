const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

async function handleResponse(res: Response) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export async function sendChatMessage(message: string, collection_name: string) {
  return handleResponse(
    await fetch(`${BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, collection_name }),
    })
  );
}

export async function uploadFile(file: File, collection_name: string) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("collection_name", collection_name);
  return handleResponse(await fetch(`${BASE}/upload`, { method: "POST", body: fd }));
}

export async function scrapeUrl(url: string, collection_name?: string) {
  return handleResponse(
    await fetch(`${BASE}/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, collection_name }),
    })
  );
}

export async function getChunks(collection_name: string) {
  return handleResponse(await fetch(`${BASE}/chunks/${collection_name}`));
}

export async function fetchSources() {
  return handleResponse(await fetch(`${BASE}/sources`));
}

export async function deleteSource(collection_name: string) {
  return handleResponse(
    await fetch(`${BASE}/sources/${collection_name}`, { method: "DELETE" })
  );
}
