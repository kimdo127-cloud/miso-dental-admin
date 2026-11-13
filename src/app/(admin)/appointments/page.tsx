"use client";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, api, dow, hm, today } from "@/lib/api";
import { Title, useMe } from "@/components/shell";
import { Badge, Button, ErrorText, Panel, Spinner, input } from "@/components/ui";

type A = { id: number; start_at: string; end_at: string; status: string; confirm_status: string; source: string; chair_id: number; chair: string; procedure: string; supplies: string; patient: string; phone: string; is_child: boolean };
type Opt = { id: number; name: string; duration_min?: number };
type P = { id: number; name: string; birth_date: string; phone: string; is_child: boolean };

// A3 예약 관리 (의자별) · A3-1 전화 · 네이버 예약 입력
export default function Appointments() {
  const me = useMe();
  const desk = me?.role !== "위생사";
  const [date, setDate] = useState(today());
  const [list, setList] = useState<A[] | null>(null);
  const [chairs, setChairs] = useState<Opt[]>([]);
  const [procs, setProcs] = useState<Opt[]>([]);
  const [err, setErr] = useState("");
  const load = () => api<A[]>(`/appointments?date=${date}`).then(setList).catch((e) => setErr(e.message));
  useEffect(() => { setList(null); load(); }, [date]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { api<Opt[]>("/chairs").then(setChairs); api<Opt[]>("/procedures").then(setProcs); }, []);

  async function setStatus(id: number, status: string) {
    setErr("");
    try { await api(`/appointments/${id}/status`, { body: { status } }); load(); } catch (e) { setErr((e as Error).message); }
  }

  return (
    <div>
      <Title title="예약 관리" sub="의자 5대 · 같은 의자에 시간이 겹치는 예약은 저장되지 않아요 (DB가 막음)"
        right={<div className="flex items-center gap-2">
          <button onClick={() => setDate(addDays(date, -1))} className="h-10 w-10 rounded-s bg-white"><ChevronLeft className="mx-auto" size={18} /></button>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${input} bg-white`} />
          <span className="w-6 text-[14px] text-grey-500">{dow(date)}</span>
          <button onClick={() => setDate(addDays(date, 1))} className="h-10 w-10 rounded-s bg-white"><ChevronRight className="mx-auto" size={18} /></button>
          <Button variant="secondary" onClick={() => setDate(today())}>오늘</Button>
        </div>} />
      <ErrorText>{err}</ErrorText>
      {desk && <NewAppointment date={date} chairs={chairs} procs={procs} onDone={load} />}
      {!list ? <Spinner /> : (
        <div className="mt-4 grid grid-cols-5 gap-3">
          {chairs.map((c) => (
            <div key={c.id} className="rounded-xl bg-white p-3">
              <p className="px-1 pb-2 text-[14px] font-bold">{c.name}</p>
              <div className="space-y-2">
                {list.filter((a) => a.chair_id === c.id).length === 0 && <p className="px-1 text-[13px] text-grey-400">예약 없음</p>}
                {list.filter((a) => a.chair_id === c.id).map((a) => (
                  <div key={a.id} className={`rounded-s border p-2.5 ${a.status === "예약" ? "border-grey-200" : "border-grey-100 bg-grey-50 opacity-70"}`}>
                    <p className="text-[13px] font-semibold tabular">{hm(a.start_at)}~{hm(a.end_at)}</p>
                    <p className="text-[14px] font-bold">{a.patient}{a.is_child && <span className="ml-1 text-[12px] font-normal text-grey-500">아이</span>}</p>
                    <p className="text-[13px] text-grey-700">{a.procedure}</p>
                    <p className="mt-1 text-[12px] text-grey-500">준비물: {a.supplies}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Badge>{a.source}</Badge>
                      {a.status !== "예약" ? <Badge tone={a.status === "노쇼" ? "danger" : "success"}>{a.status}</Badge>
                        : a.confirm_status === "확인" ? <Badge tone="success">방문 확인</Badge> : a.confirm_status === "변경 요청" ? <Badge tone="warning">변경 요청</Badge> : <Badge tone="grey">미확인</Badge>}
                    </div>
                    {desk && a.status === "예약" && (
                      <div className="mt-2 flex gap-1 text-[12px]">
                        <button onClick={() => setStatus(a.id, "완료")} className="rounded-xs bg-grey-100 px-2 py-1">완료</button>
                        <button onClick={() => setStatus(a.id, "노쇼")} className="rounded-xs bg-grey-100 px-2 py-1">노쇼</button>
                        <button onClick={() => setStatus(a.id, "취소")} className="rounded-xs bg-grey-100 px-2 py-1 text-danger">취소</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NewAppointment({ date, chairs, procs, onDone }: { date: string; chairs: Opt[]; procs: Opt[]; onDone: () => void }) {
  const [kw, setKw] = useState("");
  const [found, setFound] = useState<P[]>([]);
  const [patient, setPatient] = useState<P | null>(null);
  const [f, setF] = useState({ procedureId: "", chairId: "", time: "10:00", source: "전화" });
  const [err, setErr] = useState(""); const [ok, setOk] = useState("");
  const times = Array.from({ length: 19 }, (_, i) => 570 + i * 30).map((t) => `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`);

  async function search() { setFound(kw.trim() ? await api<P[]>(`/patients?q=${encodeURIComponent(kw)}`) : []); }
  async function save() {
    setErr(""); setOk("");
    try {
      await api("/appointments", { body: { patientId: patient?.id, procedureId: Number(f.procedureId), chairId: Number(f.chairId), date, time: f.time, source: f.source } });
      setOk(`${patient?.name} ${f.time} 예약을 저장했어요.`); setPatient(null); setKw(""); setFound([]); onDone();
    } catch (e) { setErr((e as Error).message); }
  }

  return (
    <Panel title={`전화 · 네이버 예약 입력 (${date} ${dow(date)})`}>
      <div className="flex flex-wrap items-center gap-2">
        {patient ? (
          <span className="flex h-10 items-center gap-2 rounded-s bg-brand-weak px-3 text-[14px] font-semibold text-brand">{patient.name} {patient.is_child ? "(아이)" : ""} · {patient.phone}<button onClick={() => setPatient(null)} className="text-grey-500">✕</button></span>
        ) : (
          <div className="relative">
            <input className={`${input} w-56`} placeholder="환자 이름 또는 번호" value={kw} onChange={(e) => setKw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} />
            <Button variant="secondary" className="ml-1" onClick={search}>찾기</Button>
            {found.length > 0 && (
              <ul className="absolute z-10 mt-1 max-h-64 w-80 overflow-auto rounded-s border border-grey-200 bg-white shadow-lg">
                {found.map((p) => <li key={p.id}><button onClick={() => { setPatient(p); setFound([]); }} className="w-full px-3 py-2 text-left text-[14px] hover:bg-grey-50">{p.name} {p.is_child && "(아이)"} · {p.birth_date} · {p.phone}</button></li>)}
              </ul>
            )}
          </div>
        )}
        <select className={input} value={f.procedureId} onChange={(e) => setF({ ...f, procedureId: e.target.value })}><option value="">시술</option>{procs.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.duration_min}분)</option>)}</select>
        <select className={input} value={f.chairId} onChange={(e) => setF({ ...f, chairId: e.target.value })}><option value="">의자</option>{chairs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select className={input} value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })}>{times.map((t) => <option key={t}>{t}</option>)}</select>
        <select className={input} value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })}><option>전화</option><option>네이버</option></select>
        <Button onClick={save} disabled={!patient || !f.procedureId || !f.chairId}>예약 저장</Button>
      </div>
      <div className="mt-3"><ErrorText>{err}</ErrorText>{ok && <p className="text-[14px] text-success">{ok}</p>}</div>
    </Panel>
  );
}
