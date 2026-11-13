"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { Title, useMe } from "@/components/shell";
import { Spinner } from "@/components/ui";

type Q = { id: number; question: string; category: string; asked_at: string; patient: string; is_child: boolean };
type A = { id: number; start_at: string; status: string; confirm_status: string; chair: string; procedure: string; supplies: string | null; patient: string; is_child: boolean };
type D = { waiting: number; unconfirmed: number; change_req: number; today_cnt: number; checkup: number };

// A2 대시보드: 아침에 출근하면 보는 화면
export default function Dashboard() {
  const me = useMe();
  const [d, setD] = useState<D | null>(null);
  const [qs, setQs] = useState<Q[] | null>(null);
  const [appts, setAppts] = useState<A[] | null>(null);
  useEffect(() => {
    api<D>("/dashboard").then(setD).catch(() => {});
    api<A[]>("/appointments").then(setAppts).catch(() => setAppts([]));
  }, []);
  useEffect(() => { if (me && me.role !== "위생사") api<Q[]>("/questions?status=" + encodeURIComponent("데스크 대기")).then(setQs).catch(() => setQs([])); }, [me]);
  if (!d || !me) return <Spinner />;
  const desk = me.role !== "위생사";
  const cards = [
    desk && { href: "/questions", label: "답변 기다리는 문의", value: d.waiting, sub: "AI가 병원 자료로 답하지 못한 질문", tone: d.waiting ? "text-danger" : "" },
    desk && { href: "/reminders", label: "내일 예약 미확인", value: d.unconfirmed, sub: d.change_req ? `변경 요청 ${d.change_req}건 포함 · 전화 확인 필요` : "확인 요청을 보내고 답이 없으면 전화", tone: d.unconfirmed ? "text-warning" : "" },
    desk && { href: "/checkups", label: "정기 검진 대상", value: d.checkup, sub: "검진 시기가 지났고 예약이 없는 환자", tone: "" },
    { href: "/appointments", label: "오늘 예약", value: d.today_cnt, sub: "의자별 일정과 준비물", tone: "" },
  ].filter(Boolean) as { href: string; label: string; value: number; sub: string; tone: string }[];
  const hm = (iso: string) => new Date(iso).toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", hour12: false });
  const ago = (iso: string) => { const h = Math.round((Date.now() - new Date(iso).getTime()) / 3600e3); return h < 1 ? "방금" : h < 24 ? `${h}시간 전` : `${Math.round(h / 24)}일 전`; };
  const nowMs = Date.now();
  return (
    <div className="flex h-[calc(100dvh-64px)] flex-col">
      <Title title={`${me.name}님, 오늘 처리할 일이에요`} sub={desk ? "밤사이 쌓인 문의부터 보세요. 답변은 환자 알림함으로 바로 가요." : "오늘 예약과 시술 준비물을 확인하세요."} />
      <div className={`grid gap-4 ${cards.length === 4 ? "grid-cols-2 xl:grid-cols-4" : "grid-cols-1"}`}>
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="group rounded-xl bg-white px-6 py-5 hover:ring-2 hover:ring-brand-weak">
            <p className="flex items-center justify-between text-[15px] font-semibold text-grey-700">{c.label}<ChevronRight size={18} className="text-grey-400 group-hover:text-brand" /></p>
            <p className={`mt-2 text-[34px] font-bold tabular ${c.tone}`}>{c.value}<span className="ml-1 text-[16px] font-medium text-grey-500">건</span></p>
            <p className="mt-1 text-[13px] text-grey-500">{c.sub}</p>
          </Link>
        ))}
      </div>

      <div className={`mt-4 grid min-h-0 flex-1 gap-4 ${desk ? "xl:grid-cols-[1.4fr_1fr]" : ""}`}>
        {/* 오늘 예약 */}
        <section className="flex min-h-0 flex-col rounded-xl bg-white">
          <div className="flex items-center justify-between border-b border-grey-100 px-6 py-4">
            <h2 className="text-[16px] font-bold">오늘 예약 <span className="ml-1 text-[14px] font-medium text-grey-500">{appts?.length ?? 0}건</span></h2>
            <Link href="/appointments" className="text-[13px] font-semibold text-brand">의자별 일정 보기</Link>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            {!appts ? <Spinner /> : appts.length === 0 ? <p className="p-6 text-[14px] text-grey-500">오늘 예약이 없어요</p> : (
              <table className="w-full text-[14px]">
                <thead className="sticky top-0 bg-grey-50 text-left text-[12px] text-grey-500">
                  <tr><th className="px-6 py-2 font-medium">시간</th><th className="py-2 font-medium">의자</th><th className="py-2 font-medium">환자</th><th className="py-2 font-medium">시술 · 준비물</th><th className="px-6 py-2 text-right font-medium">상태</th></tr>
                </thead>
                <tbody className="divide-y divide-grey-100">
                  {appts.map((a) => {
                    const past = new Date(a.start_at).getTime() < nowMs;
                    return (
                      <tr key={a.id} className={past && a.status === "예약" ? "text-grey-400" : ""}>
                        <td className="px-6 py-2.5 font-semibold tabular">{hm(a.start_at)}</td>
                        <td className="py-2.5">{a.chair}</td>
                        <td className="py-2.5">{a.patient}{a.is_child && <span className="ml-1 text-[12px] text-grey-500">아이</span>}</td>
                        <td className="py-2.5">{a.procedure}{a.supplies && <span className="ml-1 text-[12px] text-grey-500">· {a.supplies}</span>}</td>
                        <td className="px-6 py-2.5 text-right">
                          <span className={`rounded-md px-2 py-0.5 text-[12px] font-semibold ${a.status === "완료" ? "bg-success-weak text-success" : a.status === "노쇼" ? "bg-danger-weak text-danger" : a.confirm_status === "확인" ? "bg-brand-weak text-brand" : "bg-grey-100 text-grey-700"}`}>{a.status === "예약" ? (a.confirm_status === "확인" ? "방문 확인" : "예약") : a.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* 답변 기다리는 문의 (데스크 · 원장) */}
        {desk && (
          <section className="flex min-h-0 flex-col rounded-xl bg-white">
            <div className="flex items-center justify-between border-b border-grey-100 px-6 py-4">
              <h2 className="text-[16px] font-bold">답변 기다리는 문의 <span className="ml-1 text-[14px] font-medium text-danger">{qs?.length ?? 0}건</span></h2>
              <Link href="/questions" className="text-[13px] font-semibold text-brand">답변하러 가기</Link>
            </div>
            <div className="min-h-0 flex-1 overflow-auto">
              {!qs ? <Spinner /> : qs.length === 0 ? <p className="p-6 text-[14px] text-grey-500">모든 문의에 답했어요</p> : (
                <ul className="divide-y divide-grey-100">
                  {qs.map((q) => (
                    <li key={q.id}>
                      <Link href="/questions" className="block px-6 py-3 hover:bg-grey-50">
                        <div className="flex items-center gap-2 text-[12px] text-grey-500">
                          <span className="rounded bg-grey-100 px-1.5 py-0.5 font-semibold text-grey-700">{q.category}</span>
                          {q.patient}{q.is_child ? " (아이)" : ""} · {ago(q.asked_at)}
                        </div>
                        <p className="mt-1 text-[14px] font-medium">{q.question}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
