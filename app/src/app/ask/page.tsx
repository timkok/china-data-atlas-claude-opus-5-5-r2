import type { Metadata } from "next";
import QueryEngine from "@/components/QueryEngine";
export const metadata: Metadata = { title: "研究查询引擎", description: "用自然语言模板提问：所有数字来自数据库查询，显示查询条件、公式与来源；不调用 AI 模型。", alternates: { canonical: "/ask/" } };
export default function Ask() { return <div className="wrap pt-8 max-w-4xl"><h1 className="text-2xl font-bold">研究查询引擎 <span className="text-sm font-normal text-[var(--muted)]">Research Query Engine</span></h1><p className="text-sm text-[var(--muted)] mt-1 mb-4">规则化模板 + 数据库查询。不是通用 AI 助手。</p><QueryEngine /></div>; }
