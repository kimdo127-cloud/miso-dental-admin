"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, auth, Staff } from "@/lib/api";
import { Button, ErrorText, input } from "@/components/ui";

// A1 직원 로그인
export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (auth.token()) router.replace("/dashboard"); }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      const r = await api<{ token: string; staff: Staff }>("/login", { body: { email, password: pw } });
      auth.set(r.token); router.replace("/dashboard");
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
        <p className="mt-6 rounded-s bg-grey-50 p-3 text-[12px] leading-relaxed text-grey-500">시연용 계정 (비밀번호 miso1234)<br />데스크 desk1@miso.test · 원장 ceo@miso.test · 위생사 hyg1@miso.test</p>
      </form>
    </div>
  );
}
