"use client";
import { useEffect, useState } from "react";
import { addDays, api, dow, hm, today } from "@/lib/api";
import { Title } from "@/components/shell";
import { Badge, Button, Spinner } from "@/components/ui";

type A = { id: number; start_at: string; status: string; confirm_status: string; chair: string; procedure: string; patient: string; phone: string; is_child: boolean };

// A5 전날 확인: 내일 예약에 확인 요청 보내고, 답이 없거나 변경 요청이면 전화
export default function Reminders() {
  const tomorrow = addDays(today(), 1);
  const [list, setList] = useState<A[] | null>(null);
  const [msg, setMsg] = useState("");
  const load = () => api<A[]>(`/appointments?date=${tomorrow}`).then((l) => setList(l.filter((a) => a.status === "예약")));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function send() { const r = await api<{ sent: number }>("/reminders/send", { method: "POST" }); setMsg(`${r.sent}명에게 확인 요청을 보냈어요. (환자 앱 알림함)`); }
  async function phoneOk(id: number) { await api(`/appointments/${id}/status`, { body: { confirm: "확인" } }); load(); }

  const todo = list?.filter((a) => a.confirm_status !== "확인") ?? [];
  return (
    <div>
      <Title title="전날 확인" sub={`내일 ${tomorrow} (${dow(tomorrow)}) 예약 ${list?.length ?? 0}건 · 미확인 ${todo.length}건`}
        right={<Button onClick={send}>미확인 환자에게 확인 요청 보내기</Button>} />
      {msg && <p className="mb-4 rounded-s bg-success-weak px-4 py-3 text-[14px] text-success">{msg}</p>}
      {!list ? <Spinner /> : (
        <table className="w-full overflow-hidden rounded-xl bg-white text-[14px]">
          <thead className="bg-grey-50 text-left text-grey-500"><tr>{["시간", "환자", "연락처", "시술", "의자", "확인 상태", ""].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>
            {list.map((a) => (
              <tr key={a.id} className="border-t border-grey-100">
                <td className="px-4 py-3 tabular">{hm(a.start_at)}</td>
                <td className="px-4 py-3 font-semibold">{a.patient}{a.is_child && <span className="ml-1 font-normal text-grey-500">(아이 · 보호자 번호)</span>}</td>
                <td className="px-4 py-3 tabular">{a.phone}</td>
                <td className="px-4 py-3">{a.procedure}</td>
                <td className="px-4 py-3">{a.chair}</td>
                <td className="px-4 py-3">{a.confirm_status === "확인" ? <Badge tone="success">확인</Badge> : a.confirm_status === "변경 요청" ? <Badge tone="warning">변경 요청 · 전화</Badge> : <Badge>미확인</Badge>}</td>
                <td className="px-4 py-3 text-right">{a.confirm_status !== "확인" && <Button variant="secondary" onClick={() => phoneOk(a.id)}>전화로 확인함</Button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
