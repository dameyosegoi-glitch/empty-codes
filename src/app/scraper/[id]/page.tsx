"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { categoryLabels, languageLabels } from "@/lib/labels";
import { Copy, Check, ArrowLeft, Code } from "lucide-react";
import Link from "next/link";

export default function ScraperDetail() {
  const { id } = useParams();
  const [scraper, setScraper] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/scrapers/${id}`).then(r => r.json()).then(setScraper);
  }, [id]);

  const copyCode = () => {
    if (scraper) {
      navigator.clipboard.writeText(scraper.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!scraper) {
    return <div className="py-32 text-center text-gray-400">Loading...</div>;
  }

  if (scraper.error) {
    return (
      <div className="py-32 text-center">
        <h2 className="text-2xl font-light mb-4">Not Found</h2>
        <Link href="/browse" className="text-blue-600 hover:underline">← Back to browse</Link>
      </div>
    );
  }

  return (
    <div className="py-16 bg-white dark:bg-black min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <Link href="/browse" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-black dark:hover:text-white mb-6"><ArrowLeft className="w-4 h-4" /> Back</Link>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{categoryLabels[scraper.category] || scraper.category}</span>
          <span className="text-xs text-gray-400">{languageLabels[scraper.language] || scraper.language}</span>
        </div>

        <h1 className="text-4xl font-light mb-3">{scraper.title}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-2">{scraper.description}</p>
        <p className="text-sm text-gray-400 mb-8">by {scraper.author} · {scraper.created_at}</p>

        <div className="relative">
          <button onClick={copyCode} className="absolute top-3 right-3 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm flex items-center gap-1">
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy"}
          </button>
          <pre className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-6 overflow-x-auto text-sm leading-relaxed">
            <code>{scraper.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
