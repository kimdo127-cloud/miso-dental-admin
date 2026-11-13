"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Title } from "@/components/shell";
import { Badge, Button, ErrorText, Panel, Spinner, input } from "@/components/ui";

type D = { id: number; kind: string; title: string; edition_year: number; is_current: boolean; uploaded_at: string; uploaded_by: string | null; chunks: number };
const SAMPLE = `## [스케일링] 스케일링 보험 (5쪽)
만 19세 이상은 1년에 1회 스케일링에 건강보험이 적용됩니다. 1년은 1월 1일부터 12월 31일까지입니다.`;

// A8 자료 관리: 주의사항 · 보험 기준 문서 올리기. 올리면 바로 AI 상담에 반영, 같은 종류의 예전 판은 현재 판에서 내려감
export default function Documents() {
  const [list, setList] = useState<D[] | null>(null);
  const [f, setF] = useState({ kind: "보험 기준", title: "", year: new Date().getFullYear() + 1, text: "" });
  const [err, setErr] = useState(""); const [ok, setOk] = useState("");
  const load = () => api<D[]>("/documents").then(setList);
  useEffect(() => { load(); }, []);

  async function upload() {
    setErr(""); setOk("");
    try {
      const r = await api<{ chunks: number; dify: boolean }>("/documents", { body: f });
      setOk(`단락 ${r.chunks}개를 올렸어요. 지금부터 AI 상담 답변에 반영돼요.${r.dify ? " (Dify 지식에도 추가)" : ""}`);
      setF({ ...f, title: "", text: "" }); load();
    } catch (e) { setErr((e as Error).message); }
  }
  async function pickFile(file?: File) { if (file) setF({ ...f, text: await file.text(), title: f.title || file.name.replace(/\.(md|txt)$/i, "") }); }

  return (
    <div>
      <Title title="자료 관리" sub="AI 상담은 '현재 판' 자료로만 답해요. 보험 기준은 새 판을 올리면 예전 판은 답변에 쓰지 않아요." />
      <div className="grid grid-cols-[1fr_420px] gap-4">
        <Panel title="올린 자료">
          {!list ? <Spinner /> : (
            <table className="w-full text-[14px]">
              <thead className="text-left text-grey-500"><tr>{["종류", "제목", "판", "단락", "상태", "올린 사람"].map((h) => <th key={h} className="py-2 font-medium">{h}</th>)}</tr></thead>
              <tbody>{list.map((d) => (
                <tr key={d.id} className="border-t border-grey-100">
                  <td className="py-2.5">{d.kind}</td><td className="py-2.5 font-semibold">{d.title}</td><td className="py-2.5 tabular">{d.edition_year}</td><td className="py-2.5 tabular">{d.chunks}</td>
                  <td className="py-2.5">{d.is_current ? <Badge tone="success">현재 판 · 답변에 사용</Badge> : <Badge>지난 판 · 사용 안 함</Badge>}</td>
                  <td className="py-2.5 text-grey-500">{d.uploaded_by ?? "-"}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </Panel>
        <Panel title="새 자료 올리기">
          <div className="space-y-2">
            <div className="flex gap-2">
              <select className={input} value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}><option>보험 기준</option><option>주의사항</option></select>
              <input className={`${input} w-24`} type="number" value={f.year} onChange={(e) => setF({ ...f, year: Number(e.target.value) })} />
              <span className="self-center text-[13px] text-grey-500">년 판</span>
            </div>
            <input className={`${input} w-full`} placeholder="제목 (예: 치과 건강보험 적용 기준 안내 2027년 판)" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
            <input type="file" accept=".md,.txt" onChange={(e) => pickFile(e.target.files?.[0])} className="text-[13px]" />
            <textarea value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} rows={10} placeholder={SAMPLE} className="w-full rounded-s border border-grey-200 p-3 font-mono text-[13px] outline-none focus:border-brand" />
            <p className="text-[12px] text-grey-500">단락마다 &quot;## [시술 이름] 제목 (쪽)&quot; 한 줄 뒤에 내용을 써요. 시술 이름으로 주의사항이 섞이지 않게 나눠요.</p>
            <ErrorText>{err}</ErrorText>{ok && <p className="text-[14px] text-success">{ok}</p>}
            <Button className="w-full" onClick={upload} disabled={!f.title.trim() || !f.text.trim()}>올리고 바로 반영</Button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
