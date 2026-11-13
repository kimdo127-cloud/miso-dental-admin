"use client";
import { useState } from "react";
import { Lock } from "lucide-react";
import { api, hm, md } from "@/lib/api";
import { Title, useMe } from "@/components/shell";
import { Badge, Button, Panel, input } from "@/components/ui";

type P = { id: number; name: string; birth_date: string; phone: string; is_child: boolean };
type T = { id: number; treated_at: string; procedure: string; doctor: string; hygienist: string; record_note: string | null; record_locked: boolean };
type Detail = { id: number; name: string; birth_date: string; phone: string | null; guardian_phone: string | null; preferred_channel: string; last_checkup_at: string; treatments: T[]; appointments: { id: number; start_at: string; status: string; procedure: string }[] };

// A7 환자 · A7-1 환자 상세 · 진료 기록 (원장 · 담당 위생사만)
export default function Patients() {
  const me = useMe();
  const [kw, setKw] = useState("");
  const [list, setList] = useState<P[]>([]);
  const [d, setD] = useState<Detail | null>(null);
  async function search() { setList(await api<P[]>(`/patients?q=${encodeURIComponent(kw)}`)); }
  async function open(id: number) { setD(await api<Detail>(`/patients/${id}`)); }

  return (
    <div>
      <Title title="환자" sub={me?.role === "데스크" ? "데스크는 진료 기록 내용을 볼 수 없어요 (원장 · 담당 위생사만)" : undefined} />
      <div className="grid grid-cols-[360px_1fr] gap-4">
        <Panel>
          <div className="flex gap-2">
            <input className={`${input} flex-1`} placeholder="이름 또는 휴대폰 번호" value={kw} onChange={(e) => setKw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} />
            <Button onClick={search}>찾기</Button>
          </div>
          <ul className="mt-3 max-h-[60vh] overflow-auto">
            {list.map((p) => (
              <li key={p.id}><button onClick={() => open(p.id)} className={`w-full rounded-s px-3 py-2.5 text-left text-[14px] hover:bg-grey-50 ${d?.id === p.id ? "bg-brand-weak" : ""}`}>
                <span className="font-semibold">{p.name}</span>{p.is_child && <span className="text-grey-500"> (아이)</span>} <span className="text-grey-500">· {p.birth_date} · {p.phone}</span>
              </button></li>
            ))}
          </ul>
        </Panel>
        {d ? (
          <Panel title={`${d.name} · ${d.birth_date}`}>
            <p className="text-[14px] text-grey-700">{d.phone ? `휴대폰 ${d.phone}` : `보호자 번호 ${d.guardian_phone}`} · 선호 연락 {d.preferred_channel} · 마지막 검진 {d.last_checkup_at}</p>
            <h3 className="mt-5 text-[15px] font-bold">받은 시술 · 진료 기록</h3>
            <table className="mt-2 w-full text-[14px]">
              <thead className="text-left text-grey-500"><tr>{["날짜", "시술", "원장", "담당 위생사", "진료 기록"].map((h) => <th key={h} className="py-2 font-medium">{h}</th>)}</tr></thead>
              <tbody>{d.treatments.map((t) => (
                <tr key={t.id} className="border-t border-grey-100">
                  <td className="py-2 tabular">{t.treated_at}</td><td className="py-2">{t.procedure}</td><td className="py-2">{t.doctor}</td><td className="py-2">{t.hygienist}</td>
                  <td className="py-2">{t.record_locked ? <span className="flex items-center gap-1 text-grey-400"><Lock size={14} /> 원장 · 담당 위생사만</span> : t.record_note}</td>
                </tr>
              ))}</tbody>
            </table>
            <h3 className="mt-5 text-[15px] font-bold">예약</h3>
            <ul className="mt-2 space-y-1 text-[14px]">{d.appointments.map((a) => <li key={a.id} className="flex items-center gap-2"><span className="tabular">{md(a.start_at)} {hm(a.start_at)}</span> {a.procedure} <Badge tone={a.status === "노쇼" ? "danger" : a.status === "완료" ? "success" : "grey"}>{a.status}</Badge></li>)}</ul>
          </Panel>
        ) : <Panel><p className="py-10 text-center text-grey-500">환자를 찾아 고르세요. 시연: 김민지, 박지연</p></Panel>}
      </div>
    </div>
  );
}
