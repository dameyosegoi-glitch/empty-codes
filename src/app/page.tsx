import Link from "next/link";
import { queryAll, categoryLabels } from "@/lib/db";
import { Code, Shield, Sparkles, ArrowRight, Search } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const recent = await queryAll(
    "SELECT id, title, description, language, category, author, created_at FROM scrapers WHERE status='approved' ORDER BY created_at DESC LIMIT 6"
  );
  const categories = await queryAll(
    "SELECT category, COUNT(*) as count FROM scrapers WHERE status='approved' GROUP BY category ORDER BY count DESC"
  );

  return (
    <>
      <section className="py-24 bg-white dark:bg-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-light mb-6">
            Empty <span className="text-blue-600">Codes</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
            Open source scraper hub. Share your web scraping code, discover tools, and build together — all for free.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/browse" className="px-8 py-3 rounded-lg bg-black dark:bg-white text-white dark:text-black font-medium text-sm">Browse Scrapers</Link>
            <Link href="/submit" className="px-8 py-3 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-900">Submit Code</Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Code, title: "Open Source", desc: "Every scraper is public. Learn from real code." },
            { icon: Shield, title: "AI Reviewed", desc: "Submissions reviewed by AI agent to filter spam." },
            { icon: Sparkles, title: "Copy & Use", desc: "Syntax highlighting + one-click copy." },
          ].map(f => (
            <div key={f.title} className="text-center">
              <f.icon className="w-10 h-10 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">{f.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {recent.length > 0 && (
        <section className="py-24 bg-white dark:bg-black">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-3xl font-light">Recent Scrapers</h2>
              <Link href="/browse" className="text-sm text-blue-600 hover:underline flex items-center gap-1">View all <ArrowRight className="w-4 h-4" /></Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recent.map((s: any) => (
                <Link key={s.id} href={`/scraper/${s.id}`} className="block p-6 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{categoryLabels[s.category] || s.category}</span>
                    <span className="text-xs text-gray-400">{s.language}</span>
                  </div>
                  <h3 className="font-bold mb-1 truncate">{s.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{s.description}</p>
                  <p className="text-xs text-gray-400 mt-2">by {s.author}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-24 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-light text-center mb-10">Browse by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {categories.map((c: any) => (
              <Link key={c.category} href={`/browse?category=${c.category}`} className="text-center p-4 rounded-lg bg-white dark:bg-black border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                <div className="text-2xl font-bold text-blue-600">{c.count}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{categoryLabels[c.category] || c.category}</div>
              </Link>
            ))}
            {categories.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-400">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No scrapers yet. Be the first!</p>
                <Link href="/submit" className="text-blue-600 hover:underline mt-2 inline-block">Submit Code →</Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
