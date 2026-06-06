"use client";
import { useState } from "react";
import { categoryLabels, languageLabels } from "@/lib/labels";
import { Shield, Check, X, Trash2, RefreshCw } from "lucide-react";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [scrapers, setScrapers] = useState<any[]>([]);
  const [counts, setCounts] = useState<any[]>([]);
  const [tab, setTab] = useState("pending");
  const [notes, setNotes] = useState<Record<number, string>>({});

  const login = () => {
    setAuthed(true);
    fetchData(tab);
  };

  const fetchData = (status: string) => {
    fetch(`/api/admin?status=${status}`, { headers: { Authorization: `Bearer ${password}` } })
      .then(r => r.json())
      .then(d => { setScrapers(d.scrapers || []); setCounts(d.counts || []); });
  };

  const action = async (id: number, status: string) => {
    await fetch("/api/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${password}` },
      body: JSON.stringify({ id, status, admin_notes: notes[id] || "" }),
    });
    fetchData(tab);
  };

  const deleteItem = async (id: number) => {
    if (!confirm("Delete permanently?")) return;
    await fetch(`/api/admin?id=${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${password}` } });
    fetchData(tab);
  };

  if (!authed) {
    return (
      <div className="py-32 bg-white dark:bg-black min-h-screen">
        <div className="max-w-sm mx-auto px-4 text-center">
          <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-light mb-4">Admin Login</h1>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter admin password" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-black text-sm mb-4" onKeyDown={e => e.key === "Enter" && login()} />
          <button onClick={login} className="w-full px-6 py-3 rounded-lg bg-black dark:bg-white text-white dark:text-black font-medium text-sm">Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 bg-white dark:bg-black min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-light">Admin Dashboard</h1>
          <button onClick={() => fetchData(tab)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900"><RefreshCw className="w-5 h-5" /></button>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mb-8">
          {["pending", "approved", "rejected"].map(s => {
            const count = counts.find((c: any) => c.status === s)?.count || 0;
            return (
              <button key={s} onClick={() => { setTab(s); fetchData(s); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === s ? "bg-black dark:bg-white text-white dark:text-black" : "bg-gray-100 dark:bg-gray-900 text-gray-600"}`}>
                {s.charAt(0).toUpperCase() + s.slice(1)} ({count})
              </button>
            );
          })}
        </div>

        {/* List */}
        <div className="space-y-4">
          {scrapers.map((s: any) => (
            <div key={s.id} className="rounded-lg border border-gray-100 dark:border-gray-800 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800">{categoryLabels[s.category] || s.category}</span>
                    <span className="text-xs text-gray-400">{s.language}</span>
                  </div>
                  <h3 className="font-bold mb-1">{s.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{s.description}</p>
                  <p className="text-xs text-gray-400 mt-1">by {s.author} · {s.created_at}</p>
                  <details className="mt-3">
                    <summary className="text-xs text-blue-600 cursor-pointer">View code</summary>
                    <pre className="mt-2 rounded bg-gray-50 dark:bg-gray-950 p-4 text-xs overflow-x-auto"><code>{s.code.slice(0, 1000)}{s.code.length > 1000 && "..."}</code></pre>
                  </details>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  {tab === "pending" && (
                    <>
                      <input placeholder="Admin note" value={notes[s.id] || ""} onChange={e => setNotes({ ...notes, [s.id]: e.target.value })} className="px-3 py-1.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-black text-xs w-32" />
                      <button onClick={() => action(s.id, "approved")} className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 hover:bg-green-200"><Check className="w-4 h-4" /></button>
                      <button onClick={() => action(s.id, "rejected")} className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200"><X className="w-4 h-4" /></button>
                    </>
                  )}
                  <button onClick={() => deleteItem(s.id)} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
          {scrapers.length === 0 && <p className="text-center py-8 text-gray-400">No {tab} submissions.</p>}
        </div>
      </div>
    </div>
  );
}
