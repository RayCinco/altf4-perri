'use client';

import { useEffect, useRef, useState } from 'react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Hi! I am ChismiScan.', sender: 'bot' },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Persist open state so the chat remains open in the corner after reloads/navigation
  useEffect(() => {
    try {
      const saved = localStorage.getItem('chatsOpen');
      if (saved === 'true') setIsOpen(true);
    } catch (e) {
      // ignore (ssr or privacy settings)
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('chatsOpen', isOpen ? 'true' : 'false');
    } catch (e) {
      // ignore
    }
  }, [isOpen]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!input.trim()) return;

    const text = input.trim();
    setMessages((prev) => [...prev, { id: Date.now().toString(), text, sender: 'user' }]);
    setInput('');

    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: 'I can help with that.',
          sender: 'bot',
        },
      ]);
    }, 300);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 h-14 w-14">
      <div className={`fixed bottom-4 right-4 flex h-[30rem] w-[26rem] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl transform transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          <div className="flex items-center justify-between bg-[#054E98] p-4 text-white">
            <div className="flex items-center gap-2">
              <img src="/ChatbotIcon.png" alt="Parri" className="h-7 w-7 rounded-full object-cover" />
              <h3 className="font-semibold">Parri</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-white/15"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <img
                    src="/ChatbotIcon.png"
                    alt="Parri"
                    className="h-6 w-6 rounded-full object-cover mr-2"
                  />
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    msg.sender === 'user'
                      ? 'bg-[#054E98] text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-gray-200 bg-white p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#054E98]"
              />
              <button
                onClick={handleSendMessage}
                className="rounded-xl bg-[#054E98] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#043a7a]"
              >
                Send
              </button>
            </div>
          </div>
        </div>

      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="absolute bottom-0 right-0 flex h-17 w-17 items-center justify-center rounded-full  text-2xl text-white shadow-lg transition hover:scale-105 hover:bg-[#054E98]"
          title="Open chat"
        >
          <img src="/ChatbotIcon.png" alt="Chat" className="h-15 w-15 object-contain" />
        </button>
      )}
    </div>
  );
}
