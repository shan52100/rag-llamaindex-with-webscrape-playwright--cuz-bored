"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchSources, deleteSource } from "@/lib/api";

interface Source {
  name: string;
  points_count: number;
  sources: string[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const [sources, setSources] = useState<Source[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadSources = async () => {
    try {
      const data = await fetchSources();
      setSources(data.sources ?? []);
    } catch {
      /* backend not ready yet */
    }
  };

  useEffect(() => {
    loadSources();
    const id = setInterval(loadSources, 5000);
    return () => clearInterval(id);
  }, []);

  const handleDelete = async (name: string) => {
    setDeleting(name);
    try {
      await deleteSource(name);
      await loadSources();
    } finally {
      setDeleting(null);
    }
  };

  const navLink = (href: string, icon: string, label: string) => (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        pathname === href
          ? "bg-indigo-600 text-white"
          : "text-gray-400 hover:bg-gray-800 hover:text-white"
      }`}
    >
      <span>{icon}</span>
      {label}
    </Link>
  );

  return (
    <aside className="w-56 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          <div>
            <p className="font-bold text-white text-sm leading-tight">RAG Chat</p>
            <p className="text-xs text-gray-500">Groq · LlamaIndex · Qdrant</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="p-3 space-y-1 border-b border-gray-800">
        {navLink("/", "💬", "Chat")}
        {navLink("/upload", "📁", "Upload / Scrape")}
      </nav>

      {/* Sources list */}
      <div className="flex-1 overflow-y-auto p-3">
        <p className="text-[10px] uppercase tracking-widest text-gray-600 px-1 mb-2">
          Indexed Sources
        </p>

        {sources.length === 0 ? (
          <p className="text-xs text-gray-600 px-1 leading-relaxed">
            No sources yet.
            <br />
            Upload a doc or scrape a URL.
          </p>
        ) : (
          <div className="space-y-1">
            {sources.map((s) => (
              <div
                key={s.name}
                className="group flex items-start justify-between px-2 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-xs text-gray-300 font-medium truncate">{s.name}</p>
                  <p className="text-[10px] text-gray-600">{s.points_count} chunks</p>
                </div>
                <button
                  onClick={() => handleDelete(s.name)}
                  disabled={deleting === s.name}
                  className="ml-1 mt-0.5 text-gray-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs shrink-0"
                  title="Delete collection"
                >
                  {deleting === s.name ? "…" : "✕"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
