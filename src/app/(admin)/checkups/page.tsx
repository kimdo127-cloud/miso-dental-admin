"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Title } from "@/components/shell";
import { Badge, Button, Spinner } from "@/components/ui";

type C = { id: number; name: string; phone: string; is_child: boolean; preferred_channel: string; last_checkup_at: string; due: string; last_notice: string | null };

// A6 정기 검진 대상: 검진 시기가 지났고 예약이 없는 환자 → 안내 (어르신은 전화 선호)
export default function Checkups() {
  const [list, setList] = useState<C[] | null>(null);
  const [sel, setSel] = useState<number[]>([]);
  const [msg, setMsg] = useState("");
  const load = () => api<C[]>("/checkups").then(setList);
  useEffect(() => { load(); }, []);
  const toggle = (id: number) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const app = list?.filter((c) => c.preferred_channel !== "전화" && !c.last_notice) ?? [];

  async function notify(ids: number[]) {
    const r = await api<{ sent: number }>("/checkups/notify", { body: { patientIds: ids } });
    setMsg(`${r.sent}명에게 앱으로 검진 안내를 보냈어요.`); setSel([]); load();
  }

  return (
    <div>
      <Title title="정기 검진 대상" sub={`검진 시기가 지났고 다가오는 검진 예약이 없는 환자 ${list?.length ?? 0}명 (오래된 순)`}
        right={<div className="flex gap-2">
          <Button variant="secondary" disabled={!sel.length} onClick={() => notify(sel)}>고른 {sel.length}명 안내</Button>
          <Button disabled={!app.length} onClick={() => notify(app.map((c) => c.id))}>앱 안내 대상 {app.length}명 모두 보내기</Button>
        </div>} />
      {msg && <p className="mb-4 rounded-s bg-success-weak px-4 py-3 text-[14px] text-success">{msg}</p>}
      {!list ? <Spinner /> : (
        <table className="w-full overflow-hidden rounded-xl bg-white text-[14px]">
          <thead className="bg-grey-50 text-left text-grey-500"><tr>{["", "환자", "연락처", "마지막 검진", "검진 예정일", "안내 방법", "최근 안내"].map((h, i) => <th key={i} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id} className="border-t border-grey-100">
                <td className="px-4 py-3"><input type="checkbox" checked={sel.includes(c.id)} onChange={() => toggle(c.id)} /></td>
                <td className="px-4 py-3 font-semibold">{c.name}{c.is_child && <span className="ml-1 font-normal text-grey-500">(아이)</span>}</td>
                <td className="px-4 py-3 tabular">{c.phone}</td>
                <td className="px-4 py-3 tabular">{c.last_checkup_at}</td>
                <td className="px-4 py-3 tabular">{c.due}</td>
                <td className="px-4 py-3">{c.preferred_channel === "전화" ? <Badge tone="warning">전화 (어르신)</Badge> : c.is_child ? <Badge tone="brand">보호자에게 앱</Badge> : <Badge>앱 알림</Badge>}</td>
                <td className="px-4 py-3 text-grey-500">{c.last_notice ? c.last_notice.slice(0, 10) : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
