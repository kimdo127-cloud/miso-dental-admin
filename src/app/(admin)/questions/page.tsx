"use client";
import { useEffect, useState } from "react";
import { api, md, hm } from "@/lib/api";
import { Title } from "@/components/shell";
import { Badge, Button, ErrorText, Spinner } from "@/components/ui";

type Q = { id: number; question: string; category: string; status: string; ai_answer: string | null; desk_answer: string | null; asked_at: string; answered_at: string | null; patient: string; is_child: boolean; answered_by: string | null };
const TABS = ["데스크 대기", "데스크 답변", "AI 답변", "증상 안내"];

// A4 문의 답변: AI가 병원 자료로 답하지 못한 질문 → 답변 → 환자 알림함
export default function Questions() {
  const [tab, setTab] = useState("데스크 대기");
  const [list, setList] = useState<Q[] | null>(null);
  const load = () => api<Q[]>(`/questions?status=${encodeURIComponent(tab)}`).then(setList);
  useEffect(() => { setList(null); load(); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div>
      <Title title="문의 답변" sub="AI가 병원 자료에 없어 답하지 못한 질문이에요. 답변하면 환자 앱 알림함으로 바로 가요." />
      <div className="mb-4 flex gap-2">
        {TABS.map((t) => <button key={t} onClick={() => setTab(t)} className={`h-9 rounded-full px-4 text-[14px] font-semibold ${tab === t ? "bg-grey-900 text-white" : "bg-white text-grey-700"}`}>{t}</button>)}
      </div>
      {!list ? <Spinner /> : list.length === 0 ? <p className="rounded-xl bg-white p-10 text-center text-grey-500">{tab === "데스크 대기" ? "답변을 기다리는 문의가 없어요" : "기록이 없어요"}</p> : (
        <div className="space-y-3">{list.map((q) => <Item key={q.id} q={q} onDone={load} />)}</div>
      )}
    </div>
  );
}

function Item({ q, onDone }: { q: Q; onDone: () => void }) {
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  async function send() {
    setErr("");
    try { await api(`/questions/${q.id}/answer`, { body: { answer: text } }); onDone(); } catch (e) { setErr((e as Error).message); }
  }
  return (
    <div className="rounded-xl bg-white p-5">
      <div className="flex items-center gap-2 text-[13px] text-grey-500">
        <Badge tone={q.category === "증상" ? "danger" : q.category === "보험" ? "brand" : "grey"}>{q.category}</Badge>
        <span className="font-semibold text-grey-700">{q.patient}{q.is_child ? " (아이)" : ""}</span>
        <span>{md(q.asked_at)} {hm(q.asked_at)}</span>
      </div>
      <p className="mt-2 text-[16px] font-semibold">{q.question}</p>
      {q.ai_answer && <p className="mt-2 rounded-s bg-grey-50 p-3 text-[14px] text-grey-700">AI 답변: {q.ai_answer}</p>}
      {q.desk_answer && <p className="mt-2 rounded-s bg-brand-weak p-3 text-[14px]">데스크 답변 ({q.answered_by}): {q.desk_answer}</p>}
      {q.status === "데스크 대기" && (
        <div className="mt-3">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder="환자에게 보낼 답변 (증상 판단은 하지 말고 내원 · 전화 안내)" className="w-full rounded-s border border-grey-200 p-3 text-[14px] outline-none focus:border-brand" />
          <ErrorText>{err}</ErrorText>
          <div className="mt-2 flex justify-end"><Button onClick={send} disabled={!text.trim()}>답변 보내기</Button></div>
        </div>
      )}
    </div>
  );
}
