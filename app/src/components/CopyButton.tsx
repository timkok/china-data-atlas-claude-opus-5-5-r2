"use client";
import { useState } from "react";
export default function CopyButton({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return <button className="btn mt-2 text-xs" onClick={() => navigator.clipboard?.writeText(text).then(() => { setOk(true); setTimeout(() => setOk(false), 1500); })}>{ok ? "已复制" : "复制引用"}</button>;
}
