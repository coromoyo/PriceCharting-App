const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export type Game = {
  id: number;
  console_name: string;
  product_name: string;
  upc?: string | null;
  genre?: string | null;
  release_date?: string | null;
};

export type GamesPage = {
  page: number;
  page_size: number;
  total: number;
  items: Game[];
};

export async function fetchGames(params: {
  page?: number;
  page_size?: number;
  console?: string;
  q?: string;
}) {
  const url = new URL(`${API_BASE_URL}/games`);
  const sp = new URLSearchParams();

  if (params.page) sp.set("page", String(params.page));
  if (params.page_size) sp.set("page_size", String(params.page_size));
  if (params.console) sp.set("console", params.console);
  if (params.q) sp.set("q", params.q);

  url.search = sp.toString();

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Failed to fetch games (${res.status})`);
  return (await res.json()) as GamesPage;
}

export async function fetchConsoles() {
  const res = await fetch(`${API_BASE_URL}/consoles`);
  if (!res.ok) throw new Error(`Failed to fetch consoles (${res.status})`);
  return (await res.json()) as { console_name: string }[];
}

export async function fetchGamesByName(params: { product_name: string; console?: string; limit?: number }) {
  const url = new URL(`${API_BASE_URL}/games/by-name`);
  url.searchParams.set("product_name", params.product_name);
  if (params.console) url.searchParams.set("console", params.console);
  if (params.limit) url.searchParams.set("limit", String(params.limit));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Failed to search games (${res.status})`);
  return (await res.json()) as Game[];
}
export type Snapshot = {
  snapshot_date: string; // FastAPI returns ISO date -> treat as string in TS
  loose_price: number | null;
  cib_price: number | null;
  new_price: number | null;
  graded_price: number | null;
  box_only_price: number | null;
  manual_only_price: number | null;
  sales_volume: number | null;
};

export async function fetchLatestSnapshot(game_id: number) {
  const res = await fetch(`${API_BASE_URL}/games/${game_id}/latest-snapshot`);
  if (!res.ok) throw new Error(`Failed to fetch latest snapshot (${res.status})`);
  return (await res.json()) as Snapshot;
}

