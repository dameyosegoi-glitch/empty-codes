"use client";
import { useState } from "react";
import Link from "next/link";
import { Menu, X, Code } from "lucide-react";

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full bg-white/90 dark:bg-black/90 backdrop-blur-sm z-50 border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Code className="w-6 h-6 text-blue-600" />
          <span className="text-lg font-bold">Empty Codes</span>
        </Link>
        <div className="hidden md:flex items-center gap-1">
          <Link href="/browse" className="px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">Browse</Link>
          <Link href="/submit" className="px-4 py-2 rounded-lg text-sm bg-black dark:bg-white text-white dark:text-black font-medium">Submit Code</Link>
        </div>
        <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-black px-4 py-3 space-y-1">
          <Link href="/browse" onClick={() => setOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400">Browse</Link>
          <Link href="/submit" onClick={() => setOpen(false)} className="block px-4 py-2 rounded-lg text-sm text-center bg-black dark:bg-white text-white dark:text-black font-medium">Submit Code</Link>
        </div>
      )}
    </nav>
  );
}
