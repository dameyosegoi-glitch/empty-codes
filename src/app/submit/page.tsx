"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { categoryLabels, languageLabels } from "@/lib/labels";

export default function SubmitPage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", author: "", description: "", code: "", language: "javascript", category: "other" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/scrapers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage(data.message);
        setTimeout(() => router.push("/"), 2000);
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Try again.");
    }
  };

  return (
    <div className="py-16 bg-white dark:bg-black min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <h1 className="text-4xl font-light mb-2">Submit Code</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Share your scraper with the community. All submissions are reviewed.</p>

        {status === "success" ? (
          <div className="p-8 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 text-center">
            <h3 className="text-xl font-bold text-green-700 dark:text-green-400 mb-2">Submitted!</h3>
            <p className="text-green-600 dark:text-green-300">{message}</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            {status === "error" && <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600 text-sm">{message}</div>}
            <div>
              <label className="block text-sm font-medium mb-1.5">Title *</label>
              <input required maxLength={200} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-black text-sm" placeholder="Instagram Profile Scraper" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Your Name</label>
              <input maxLength={50} value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-black text-sm" placeholder="Anonymous" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Description *</label>
              <textarea required maxLength={1000} rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-black text-sm" placeholder="Describe what this scraper does and how to use it" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Language</label>
                <select value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-black text-sm">
                  {Object.entries(languageLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-black text-sm">
                  {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Code *</label>
              <textarea required maxLength={50000} rows={12} value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-sm font-mono" placeholder="// Paste your scraper code here" />
            </div>
            <button type="submit" disabled={status === "loading"} className="w-full px-6 py-3 rounded-lg bg-black dark:bg-white text-white dark:text-black font-medium text-sm disabled:opacity-50">
              {status === "loading" ? "Submitting..." : "Submit for Review"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
