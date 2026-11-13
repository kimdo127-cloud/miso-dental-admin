"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, auth, Staff } from "@/lib/api";
import { Button, ErrorText, input } from "@/components/ui";

// 시드 데이터의 시연 계정 (backend/src/db/seed.ts, 비밀번호 miso1234)
const TEST_ACCOUNTS = [
  { label: "데스크", sub: "한실장 · 문의 답변", email: "desk1@miso.test" },
  { label: "원장", sub: "박대표 · 진료 기록", email: "ceo@miso.test" },
  { label: "위생사", sub: "정위생 · 예약 · 담당 환자", email: "hyg1@miso.test" },
];

const nextPath = () => { const n = new URLSearchParams(window.location.search).get("next"); return n && n.startsWith("/") && !n.startsWith("//") ? n : null; };

// A1 직원 로그인
export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (auth.token()) router.replace(nextPath() || "/dashboard"); }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); await doLogin(email, pw);
  }
  async function doLogin(email: string, pw: string) {
    setBusy(true); setErr("");
    try {
      const r = await api<{ token: string; staff: Staff }>("/login", { body: { email, password: pw } });
      auth.set(r.token); router.replace(nextPath() || "/dashboard");
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-grey-100">
      <form onSubmit={submit} className="w-[400px] rounded-2xl bg-white p-10">
        <p className="text-[15px] font-semibold text-brand">미소치과 어드민</p>
        <h1 className="mt-2 text-[24px] font-bold">직원 로그인</h1>
        <div className="mt-8 space-y-3">
          <input className={`${input} w-full`} placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
          <input className={`${input} w-full`} placeholder="비밀번호" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" />
          <ErrorText>{err}</ErrorText>
          <Button className="h-12 w-full" disabled={busy || !email || !pw}>{busy ? "확인 중..." : "로그인"}</Button>
        </div>
        {/* 테스트용: 시연 계정으로 바로 로그인 (역할별) */}
        <div className="mt-8 border-t border-grey-200 pt-6">
          <p className="mb-3 text-[12px] font-semibold text-grey-500">테스트 계정으로 로그인</p>
          <div className="grid grid-cols-3 gap-2">
            {TEST_ACCOUNTS.map((t) => (
              <button key={t.email} type="button" disabled={busy} onClick={() => doLogin(t.email, "miso1234")}
                className="rounded-xl border border-grey-200 bg-white px-2 py-3 text-center hover:bg-grey-50 disabled:opacity-40">
                <span className="block text-[14px] font-semibold">{t.label}</span>
                <span className="mt-0.5 block text-[11px] text-grey-500">{t.sub}</span>
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}
