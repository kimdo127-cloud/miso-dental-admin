"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { BellRing, CalendarDays, FileText, LayoutDashboard, LogOut, MessageSquareReply, Stethoscope, Users } from "lucide-react";
import { api, auth, Role, Staff } from "@/lib/api";

const MeCtx = createContext<Staff | null>(null);
export const useMe = () => useContext(MeCtx);

// 역할별 메뉴 (위생사는 예약 · 환자만)
const MENU: { href: string; label: string; icon: typeof Users; roles: Role[] }[] = [
  { href: "/dashboard", label: "지금 처리할 일", icon: LayoutDashboard, roles: ["데스크", "원장", "위생사"] },
  { href: "/appointments", label: "예약 관리", icon: CalendarDays, roles: ["데스크", "원장", "위생사"] },
  { href: "/questions", label: "문의 답변", icon: MessageSquareReply, roles: ["데스크", "원장"] },
  { href: "/reminders", label: "전날 확인", icon: BellRing, roles: ["데스크", "원장"] },
  { href: "/checkups", label: "정기 검진 대상", icon: Stethoscope, roles: ["데스크", "원장"] },
  { href: "/patients", label: "환자", icon: Users, roles: ["데스크", "원장", "위생사"] },
  { href: "/documents", label: "자료 관리", icon: FileText, roles: ["데스크", "원장"] },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [me, setMe] = useState<Staff | null>(null);
  useEffect(() => {
    if (!auth.token()) { router.replace("/"); return; }
    api<Staff>("/me").then(setMe).catch(() => {});
  }, [router]);
  if (!me) return <div className="min-h-dvh bg-grey-100" />;
  const menu = MENU.filter((m) => m.roles.includes(me.role));
  const allowed = menu.some((m) => path.startsWith(m.href));

  return (
    <MeCtx.Provider value={me}>
      <div className="flex min-h-dvh bg-grey-100">
        <aside className="sticky top-0 flex h-dvh w-60 shrink-0 flex-col bg-white px-3 py-6">
          <p className="px-3 text-[18px] font-bold text-brand">미소치과 <span className="text-grey-500">어드민</span></p>
          <nav className="mt-8 space-y-1">
            {menu.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className={`flex h-11 items-center gap-3 rounded-s px-3 text-[15px] font-medium ${path.startsWith(href) ? "bg-brand-weak text-brand" : "text-grey-700 hover:bg-grey-50"}`}>
                <Icon size={18} /> {label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto border-t border-grey-100 px-3 pt-4">
            <p className="text-[15px] font-semibold">{me.name}</p>
            <p className="text-[13px] text-grey-500">{me.role}</p>
            <button onClick={() => { auth.clear(); router.replace("/"); }} className="mt-3 flex items-center gap-2 text-[13px] text-grey-500 hover:text-grey-900"><LogOut size={14} /> 로그아웃</button>
          </div>
        </aside>
        <main className="min-w-0 flex-1 p-8">
          {allowed ? children : <p className="rounded-xl bg-white p-10 text-center text-grey-500">{me.role}은(는) 이 메뉴를 쓸 수 없어요.</p>}
        </main>
      </div>
    </MeCtx.Provider>
  );
}

export function Title({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between">
      <div><h1 className="text-[26px] font-bold">{title}</h1>{sub && <p className="mt-1 text-[15px] text-grey-500">{sub}</p>}</div>
      {right}
    </div>
  );
}
