import Link from "next/link";
import { Code } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white dark:bg-black border-t border-gray-100 dark:border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <Code className="w-5 h-5 text-blue-600" />
              <span className="font-bold">Empty Codes</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Open source scraper hub — share code, learn, build.</p>
          </div>
          {[
            { title: "NAVIGATE", links: [{ label: "Browse", href: "/browse" }, { label: "Submit", href: "/submit" }] },
            { title: "CATEGORIES", links: [{ label: "Social Media", href: "/browse?category=social-media" }, { label: "AI / LLM", href: "/browse?category=ai" }, { label: "E-Commerce", href: "/browse?category=e-commerce" }] },
            { title: "INFO", links: [{ label: "GitHub", href: "https://github.com/wibuon223/empty-codes" }, { label: "Vercel", href: "https://vercel.com" }] },
          ].map(col => (
            <div key={col.title}>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map(l => (
                  <li key={l.label}><Link href={l.href} className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">{l.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} Empty Codes. MIT License.
        </div>
      </div>
    </footer>
  );
}
