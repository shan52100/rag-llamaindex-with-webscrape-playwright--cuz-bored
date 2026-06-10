"use client";

import { useState, useRef } from "react";
import { uploadFile, scrapeUrl } from "@/lib/api";

interface Chunk {
  index: number;
  text: string;
  char_count: number;
  metadata: Record<string, unknown>;
}

interface IngestionResult {
  collection: string;
  source: string;
  total_chunks: number;
  chunks: Chunk[];
}

export default function UploadPage() {
  const [tab, setTab] = useState<"file" | "url">("file");
  const [dragging, setDragging] = useState(false);
  const [url, setUrl] = useState("");
  const [collection, setCollection] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IngestionResult | null>(null);
  const [error, setError] = useState("");
  const [expandedChunk, setExpandedChunk] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setResult(null);
    setError("");
    setExpandedChunk(null);
  };

  const handleFile = async (file: File) => {
    reset();
    setLoading(true);
    try {
      const col =
        collection.trim() ||
        file.name.replace(/\.[^/.]+$/, "").replace(/[\s\W]+/g, "_").toLowerCase();
      const data = await uploadFile(file, col);
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleScrape = async () => {
    if (!url.trim()) return;
    reset();
    setLoading(true);
    try {
      const data = await scrapeUrl(url.trim(), collection.trim() || undefined);
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Scrape failed");
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="shrink-0 px-5 py-3 border-b border-gray-800 bg-gray-900">
        <h1 className="font-semibold text-white">Upload &amp; Scrape</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Add documents or web pages to your knowledge base
        </p>
      </div>

      <div className="flex-1 p-5 max-w-3xl w-full mx-auto space-y-5">
        {/* Collection name */}
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">
            Collection name{" "}
            <span className="text-gray-600">(auto-generated if empty)</span>
          </label>
          <input
            type="text"
            value={collection}
            onChange={(e) => setCollection(e.target.value)}
            placeholder="e.g. my_research_docs"
            className="w-full bg-gray-800 text-white rounded-xl px-4 py-2.5 text-sm border border-gray-700 focus:outline-none focus:border-indigo-500 placeholder-gray-600"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-900 border border-gray-800 p-1 rounded-xl w-fit">
          {(["file", "url"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); reset(); }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {t === "file" ? "📄 Upload File" : "🌐 Scrape URL"}
            </button>
          ))}
        </div>

        {/* File upload */}
        {tab === "file" && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer transition-all select-none ${
              dragging
                ? "border-indigo-500 bg-indigo-500/10 scale-[1.01]"
                : "border-gray-700 hover:border-gray-500 bg-gray-900"
            }`}
          >
            <div className="text-4xl mb-3">📁</div>
            <p className="text-gray-300 font-medium">Drop your file here</p>
            <p className="text-gray-600 text-sm mt-1">or click to browse</p>
            <p className="text-gray-700 text-xs mt-3">PDF · TXT · DOCX · MD</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.docx,.md"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
          </div>
        )}

        {/* URL scrape */}
        {tab === "url" && (
          <div className="space-y-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScrape()}
              placeholder="https://example.com/article"
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:border-indigo-500 placeholder-gray-600"
            />
            <button
              onClick={handleScrape}
              disabled={loading || !url.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-800 disabled:text-gray-600 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              {loading ? "Scraping with Playwright…" : "Scrape & Index"}
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 text-center">
            <div className="flex items-center justify-center gap-3 text-indigo-400">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm">Processing, chunking &amp; indexing into Qdrant…</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-950/40 border border-red-800/60 text-red-300 rounded-xl p-4 text-sm">
            <span className="font-medium">Error: </span>{error}
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-green-950/30 border border-green-800/50 rounded-2xl p-4">
              <p className="text-green-400 font-semibold text-sm mb-3">
                ✓ Successfully indexed into Qdrant
              </p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-gray-900 rounded-xl p-3">
                  <p className="text-2xl font-bold text-indigo-400">{result.total_chunks}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Chunks</p>
                </div>
                <div className="bg-gray-900 rounded-xl p-3 col-span-2 text-left">
                  <p className="text-xs font-medium text-gray-300 truncate">{result.collection}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5">Collection</p>
                  <p className="text-xs text-gray-500 truncate mt-1" title={result.source}>
                    {result.source}
                  </p>
                </div>
              </div>
            </div>

            {/* Chunks viewer */}
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                Document Chunks — {result.chunks.length} total
              </p>
              <div className="space-y-2">
                {result.chunks.map((chunk) => (
                  <div
                    key={chunk.index}
                    onClick={() =>
                      setExpandedChunk(expandedChunk === chunk.index ? null : chunk.index)
                    }
                    className="bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl p-3.5 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-indigo-400">
                        Chunk {chunk.index + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-600">
                          {chunk.char_count} chars
                        </span>
                        <span className="text-[10px] text-gray-700">
                          {expandedChunk === chunk.index ? "▲" : "▼"}
                        </span>
                      </div>
                    </div>
                    <p
                      className={`text-xs text-gray-400 leading-relaxed font-mono ${
                        expandedChunk === chunk.index ? "" : "line-clamp-3"
                      }`}
                    >
                      {chunk.text}
                    </p>
                    {!!chunk.metadata?.source && (
                      <p className="text-[10px] text-gray-700 mt-1.5 truncate">
                        src: {String(chunk.metadata.source)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
