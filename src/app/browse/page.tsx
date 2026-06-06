"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { categoryLabels, languageLabels } from "@/lib/labels";
import { Search } from "lucide-react";

export default function BrowsePage() {
  const [scrapers, setScrapers] = useState<any[]>([]);
  const [category, setCategory] = useState("");
  const [language, setLanguage] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCategory(params.get("category") || "");
    setLanguage(params.get("language") || "");
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (language) params.set("language", language);
    if (query) params.set("search", query);
    fetch(`/api/scrapers?${params}`)
      .then(r => r.json())
      .then(d => setScrapers(d.scrapers || []));
  }, [category, language, query]);

  return (
    <div className="py-16 bg-white dark:bg-black min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <h1 className="text-4xl font-light mb-8">Browse Scrapers</h1>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search scrapers..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-black text-sm"
            />
          </div>
          <select value={category} onChange={e => setCategory(e.target.value)} className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-black text-sm">
            <option value="">All Categories</option>
            {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={language} onChange={e => setLanguage(e.target.value)} className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-black text-sm">
            <option value="">All Languages</option>
            {Object.entries(languageLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {/* Results */}
        {scrapers.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No scrapers found.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {scrapers.map(s => (
              <Link key={s.id} href={`/scraper/${s.id}`} className="block p-6 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{categoryLabels[s.category] || s.category}</span>
                  <span className="text-xs text-gray-400">{s.language}</span>
                </div>
                <h3 className="font-bold mb-1">{s.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{s.description}</p>
                <p className="text-xs text-gray-400 mt-2">by {s.author}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
