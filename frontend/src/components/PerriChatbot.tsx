"use client";
import { useEffect, useRef, useState } from "react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
}



export default function PerriChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", text: "Hi! I am Perri.", sender: "bot" },
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
        { id: (Date.now() + 1).toString(), text: botText, sender: "bot" },
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
                  className="h-5 w-5 sm:h-6 sm:w-6 rounded-full object-cover mr-1.5 sm:mr-2"
                />
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm ${msg.sender === "user"
                  ? "bg-[#04356A] text-white"
                  : "bg-[#001D3F]  text-white"
                  }`}
              >
                {msg.text}
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
