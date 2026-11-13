"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { Title, useMe } from "@/components/shell";
import { Spinner } from "@/components/ui";

type D = { waiting: number; unconfirmed: number; change_req: number; today_cnt: number; checkup: number };

// A2 대시보드: 아침에 출근하면 보는 화면
export default function Dashboard() {
  const me = useMe();
  const [d, setD] = useState<D | null>(null);
  useEffect(() => { api<D>("/dashboard").then(setD).catch(() => {}); }, []);
  if (!d || !me) return <Spinner />;
  const desk = me.role !== "위생사";
  const cards = [
    desk && { href: "/questions", label: "답변 기다리는 문의", value: d.waiting, sub: "AI가 병원 자료로 답하지 못한 질문", tone: d.waiting ? "text-danger" : "" },
    desk && { href: "/reminders", label: "내일 예약 미확인", value: d.unconfirmed, sub: d.change_req ? `변경 요청 ${d.change_req}건 포함 · 전화 확인 필요` : "확인 요청을 보내고 답이 없으면 전화", tone: d.unconfirmed ? "text-warning" : "" },
    desk && { href: "/checkups", label: "정기 검진 대상", value: d.checkup, sub: "검진 시기가 지났고 예약이 없는 환자", tone: "" },
    { href: "/appointments", label: "오늘 예약", value: d.today_cnt, sub: "의자별 일정과 준비물", tone: "" },
  ].filter(Boolean) as { href: string; label: string; value: number; sub: string; tone: string }[];
  return (
    <div>
      <Title title={`${me.name}님, 오늘 처리할 일이에요`} sub={desk ? "밤사이 쌓인 문의부터 보세요. 답변은 환자 알림함으로 바로 가요." : "오늘 예약과 시술 준비물을 확인하세요."} />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="group rounded-xl bg-white p-6 hover:ring-2 hover:ring-brand-weak">
            <p className="flex items-center justify-between text-[15px] font-semibold text-grey-700">{c.label}<ChevronRight size={18} className="text-grey-400 group-hover:text-brand" /></p>
            <p className={`mt-3 text-[36px] font-bold tabular ${c.tone}`}>{c.value}<span className="ml-1 text-[16px] font-medium text-grey-500">건</span></p>
            <p className="mt-1 text-[13px] text-grey-500">{c.sub}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
