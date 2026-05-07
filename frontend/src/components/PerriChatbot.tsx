"use client";
import { useEffect, useRef, useState } from "react";

interface LiteracyPoint {
  issue: string;
  correction: string;
}

interface LiteracyLesson {
  summary: string;
  points: LiteracyPoint[];
  tip: string;
}

interface Source {
  title: string;
  url: string;
  credibility: "verified" | "questionable" | "unknown";
}

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  sources?: Source[];
  factCorrection?: string | null;
  literacyLesson?: LiteracyLesson | null;
}

export default function PerriChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", text: "Hi! Bhie ako si Perri.", sender: "bot" },
  ]);
  const [input, setInput] = useState("");
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("chatsOpen");
      if (saved === "true") setIsOpen(true);
    } catch (e) {
      // ignore (ssr or privacy settings)
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("chatsOpen", isOpen ? "true" : "false");
    } catch (e) {
      // ignore
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      // Cleanup if needed
    };
  }, []);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const text = input.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: "user",
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      const botText: string = data?.reply || "Sorry, something went wrong.";

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: botText,
          sender: "bot",
          sources: data?.sources ?? [],
          factCorrection: data?.factCorrection ?? null,
          literacyLesson: data?.literacyLesson ?? null,
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: "I can help with that.",
          sender: "bot",
        },
      ]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!mounted) return null;

  return (
    <div
      className="fixed bottom-2 right-2 z-50 h-12 w-12 sm:bottom-4 sm:right-4 sm:h-14 sm:w-14"
      suppressHydrationWarning
    >
      <div
        className={`fixed bottom-2 right-2 sm:bottom-4 sm:right-4 flex h-[35vh] w-[85vw] max-w-[26rem] sm:h-[30rem] sm:w-[26rem] flex-col overflow-hidden rounded-2xl border border-[#04356A] bg-[#000919] shadow-2xl transform transition-all duration-300 ${isOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"}`}
      >
        <div className="flex items-center justify-between bg-[#04356A] p-2 sm:p-4 text-white">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <img
              src="/logo/ChatbotIcon.png"
              alt="Perri"
              className="h-6 w-6 sm:h-7 sm:w-7 rounded-full object-cover"
            />
            <h3 className="text-sm sm:text-base font-semibold">Perri</h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full text-sm sm:text-base transition hover:bg-[#0a1a3a]"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-1.5 sm:space-y-3 overflow-y-auto bg-[#001d3f49] p-2 sm:p-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "bot" && (
                <img
                  src="/logo/ChatbotIcon.png"
                  alt="Perri"
                  className="h-5 w-5 sm:h-6 sm:w-6 rounded-full object-cover mr-1.5 sm:mr-2 self-start mt-1"
                />
              )}
              <div className="max-w-[80%] flex flex-col gap-1.5">
                <div
                  className={`rounded-2xl px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm ${
                    msg.sender === "user"
                      ? "bg-[#04356A] text-white"
                      : "bg-[#001D3F] text-white"
                  }`}
                >
                  {msg.text}
                </div>

                {/* Fact Correction */}
                {msg.sender === "bot" && msg.factCorrection && (
                  <div className="rounded-xl bg-[#1a0a0a] border border-red-800/50 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs text-red-300">
                    <span className="font-semibold text-red-400">
                      ✗ Fact Check:{" "}
                    </span>
                    {msg.factCorrection}
                  </div>
                )}

                {/* Sources */}
                {msg.sender === "bot" &&
                  msg.sources &&
                  msg.sources.length > 0 && (
                    <div className="rounded-xl bg-[#001d3f] border border-[#04356A]/60 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs">
                      <p className="text-[#7FB3FF] font-semibold mb-1">
                        📎 Sources:
                      </p>
                      <ul className="flex flex-col gap-0.5">
                        {msg.sources.map((src, i) => (
                          <li key={i} className="flex items-center gap-1">
                            <span
                              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                src.credibility === "verified"
                                  ? "bg-green-400"
                                  : src.credibility === "questionable"
                                    ? "bg-yellow-400"
                                    : "bg-gray-400"
                              }`}
                            />
                            <a
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#7FB3FF] hover:underline truncate"
                              title={src.title}
                            >
                              {src.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Media Literacy Lesson */}
                {msg.sender === "bot" && msg.literacyLesson && (
                  <div className="rounded-xl bg-[#001d3f] border border-[#054E98]/60 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs">
                    <p className="text-[#7FB3FF] font-semibold mb-1">
                      📚 Media Literacy:
                    </p>
                    <p className="text-white/80 mb-1">
                      {msg.literacyLesson.summary}
                    </p>
                    {msg.literacyLesson.points.slice(0, 2).map((pt, i) => (
                      <div key={i} className="mb-1">
                        <span className="text-yellow-400">⚠ </span>
                        <span className="text-white/70">{pt.issue}</span>
                      </div>
                    ))}
                    <p className="text-green-400/80 italic">
                      💡 {msg.literacyLesson.tip}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-[#04356A] bg-[#000919] p-1.5 sm:p-4">
          <div className="flex gap-1 sm:gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 rounded-xl border border-[#04356A] bg-[#001D3F] px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm text-white placeholder-[#7FB3FF]/50 focus:border-[#054E98] focus:outline-none"
              suppressHydrationWarning
            />

            <button
              onClick={handleSendMessage}
              className="rounded-xl bg-[#054E98] px-2.5 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white transition hover:bg-[#043a7a]"
              suppressHydrationWarning
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="absolute bottom-0 right-0 flex h-12 w-12 sm:h-17 sm:w-17 items-center justify-center rounded-full border-2 border-[#04356A] text-2xl text-white shadow-lg transition hover:scale-110"
          title="Open chat"
          suppressHydrationWarning
        >
          <img
            src="/logo/ChatbotIcon.png"
            alt="Chat"
            className="h-10 w-10 sm:h-15 sm:w-15 object-contain"
          />
        </button>
      )}
    </div>
  );
}
