// 병원 어드민 API. 직원 토큰은 이 PC에만 저장
export const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4100/api";
export type Role = "데스크" | "원장" | "위생사";
export type Staff = { id: number; name: string; role: Role };

export const auth = {
  token: () => (typeof window === "undefined" ? null : localStorage.getItem("miso.admin.token")),
  set: (t: string) => localStorage.setItem("miso.admin.token", t),
  clear: () => localStorage.removeItem("miso.admin.token"),
};

export async function api<T = unknown>(path: string, opt: { method?: string; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const t = auth.token(); if (t) headers.Authorization = `Bearer ${t}`;
  let res: Response;
  try {
    res = await fetch(`${API}/admin${path}`, { method: opt.method || (opt.body ? "POST" : "GET"), headers, body: opt.body ? JSON.stringify(opt.body) : undefined });
  } catch { throw new Error("서버에 연결하지 못했어요."); }
  const j = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined" && !path.startsWith("/login")) { auth.clear(); window.location.href = "/"; }
    throw new Error((Array.isArray(j.message) ? j.message[0] : j.message) || "문제가 생겼어요.");
  }
  return j as T;
}

const DOW = ["일", "월", "화", "수", "목", "금", "토"];
const k = (iso: string) => new Date(new Date(iso).getTime() + 9 * 3600e3);
export const hm = (iso: string) => { const d = k(iso); return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`; };
export const md = (iso: string) => { const d = k(iso); return `${d.getUTCMonth() + 1}/${d.getUTCDate()} (${DOW[d.getUTCDay()]})`; };
export const today = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
export const addDays = (ymd: string, n: number) => { const t = new Date(ymd + "T00:00:00Z"); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
export const dow = (ymd: string) => DOW[new Date(ymd + "T00:00:00Z").getUTCDay()];
