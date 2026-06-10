"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { sendChatMessage, fetchSources } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Source {
  name: string;
  points_count: number;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSource, setSelectedSource] = useState("default");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchSources()
      .then((d) => {
        const srcs: Source[] = d.sources ?? [];
        setSources(srcs);
        // Auto-select first real collection so user never queries nonexistent "default"
        if (srcs.length > 0) setSelectedSource(srcs[0].name);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    try {
      const data = await sendChatMessage(text, selectedSource);
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ Error: ${msg}` },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800 bg-gray-900 shrink-0">
        <h1 className="font-semibold text-white">Chat</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Source:</span>
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="bg-gray-800 text-white text-xs rounded-lg px-2.5 py-1.5 border border-gray-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="default">default</option>
            {sources.map((s) => (
              <option key={s.name} value={s.name}>
                {s.name} ({s.points_count})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center select-none">
            <div className="text-5xl mb-4 opacity-60">🧠</div>
            <p className="text-gray-300 font-semibold text-lg">Ask anything</p>
            <p className="text-gray-600 text-sm mt-1 max-w-xs">
              Upload documents or scrape a URL first, then ask questions about your data.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs shrink-0 mr-2 mt-0.5">
                AI
              </div>
            )}
            <div
              className={`max-w-2xl rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-br-sm"
                  : "bg-gray-800 text-gray-200 rounded-bl-sm"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs shrink-0 mr-2 mt-0.5">
              AI
            </div>
            <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-gray-800 bg-gray-900 px-4 py-3">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask a question… (Enter to send, Shift+Enter for newline)"
            className="flex-1 resize-none bg-gray-800 text-white rounded-xl px-4 py-2.5 text-sm border border-gray-700 focus:outline-none focus:border-indigo-500 placeholder-gray-600 max-h-32 overflow-y-auto"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-800 disabled:text-gray-600 text-white px-5 rounded-xl text-sm font-medium transition-colors shrink-0"
          >
            Send
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-700 mt-1.5">
          Querying collection: <span className="text-indigo-500">{selectedSource}</span>
        </p>
      </div>
    </div>
  );
}
