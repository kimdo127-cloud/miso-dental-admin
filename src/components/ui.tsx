"use client";
import { Loader2 } from "lucide-react";

export function Button({ children, variant = "primary", className = "", ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" }) {
  const v = variant === "primary" ? "bg-brand text-white hover:bg-[#1b64da]" : variant === "danger" ? "bg-danger-weak text-danger" : "bg-grey-100 text-grey-700 hover:bg-grey-200";
  return <button {...p} className={`h-10 rounded-s px-4 text-[14px] font-semibold transition disabled:opacity-40 ${v} ${className}`}>{children}</button>;
}
export function Badge({ children, tone = "grey" }: { children: React.ReactNode; tone?: "grey" | "brand" | "danger" | "success" | "warning" }) {
  const t = { grey: "bg-grey-100 text-grey-700", brand: "bg-brand-weak text-brand", danger: "bg-danger-weak text-danger", success: "bg-success-weak text-success", warning: "bg-warning-weak text-warning" }[tone];
  return <span className={`inline-flex h-6 items-center whitespace-nowrap rounded-xs px-2 text-[12px] font-semibold ${t}`}>{children}</span>;
}
export function Spinner() { return <div className="flex justify-center py-10 text-grey-400"><Loader2 className="animate-spin" /></div>; }
export function ErrorText({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="rounded-s bg-danger-weak px-4 py-3 text-[14px] text-danger">{children}</p>;
}
export function Panel({ title, right, children, className = "" }: { title?: string; right?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl bg-white p-6 ${className}`}>
      {(title || right) && <div className="mb-4 flex items-center justify-between"><h2 className="text-[17px] font-bold">{title}</h2>{right}</div>}
      {children}
    </section>
  );
}
export const input = "h-10 rounded-s border border-grey-200 px-3 text-[14px] outline-none focus:border-brand";
