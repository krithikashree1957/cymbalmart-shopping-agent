import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  Bot,
  User,
  X,
  Loader2,
  PlusCircle,
  TrendingDown,
  Check,
  AlertCircle,
} from "lucide-react";
import { ChatMessage, PartyPlan, ShoppingItem } from "../types";

interface AgentChatDrawerProps {
  plan: PartyPlan;
  onUpdatePlan: (updated: PartyPlan) => void;
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

const QUICK_PROMPTS = [
  "How can I cut $40 from this shopping list?",
  "Add 4 vegan & gluten-free guest options",
  "Suggest the best bulk cocktail to batch",
  "What tableware & decorations am I missing?",
  "How much ice do I need if it's 85°F outside?",
];

export const AgentChatDrawer: React.FC<AgentChatDrawerProps> = ({
  plan,
  onUpdatePlan,
  isOpen,
  onClose,
  initialPrompt,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "agent",
      text: `Hello! I'm your AI Party Shopping Agent. I can help adjust your quantities, recommend store substitutions, add items to your shopping list, or trim your budget. How can I assist with "${plan.title}"?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [inputMessage, setInputMessage] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialPrompt && isOpen) {
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsSending(true);

    try {
      const res = await fetch("/api/ai/chat-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          currentPlan: plan,
          chatHistory: messages.slice(-6),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const agentMsg: ChatMessage = {
          id: `agent-${Date.now()}`,
          sender: "agent",
          text: data.reply || "I have analyzed your request.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          actionSuggested: data.actionSuggested,
        };
        setMessages((prev) => [...prev, agentMsg]);
      } else {
        throw new Error("Failed to get agent response");
      }
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `agent-err-${Date.now()}`,
          sender: "agent",
          text: "I'm having trouble connecting to the AI service right now. You can still modify items directly from the Master Shopping List tab!",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleExecuteAction = (action: any) => {
    if (!action) return;

    if (action.itemsToAdd && Array.isArray(action.itemsToAdd)) {
      const formatted: ShoppingItem[] = action.itemsToAdd.map((item: any, idx: number) => ({
        id: `ai-item-${Date.now()}-${idx}`,
        name: item.name,
        category: item.category || "Snacks & Pantry",
        quantity: item.quantity || "1 unit",
        estimatedCost: Number(item.estimatedCost) || 10,
        storeType: item.storeType || "Supermarket / Grocery",
        priority: item.priority || "Recommended",
        dietaryTag: item.dietaryTag,
        notes: item.notes || "Added by AI Shopping Agent",
        isChecked: false,
        isCustom: true,
        status: "to_buy",
      }));

      onUpdatePlan({
        ...plan,
        shoppingItems: [...formatted, ...(plan.shoppingItems || [])],
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          sender: "system",
          text: `✅ Successfully added ${formatted.length} items to your Master Shopping List!`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">AI Shopping Concierge</h3>
            <p className="text-[11px] text-slate-400">Plan adjustments, budget trims & substitutions</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[88%] rounded-2xl p-3 text-xs leading-relaxed ${
                msg.sender === "user"
                  ? "bg-amber-500 text-slate-950 font-medium rounded-tr-none"
                  : msg.sender === "system"
                  ? "bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-semibold"
                  : "bg-slate-800 border border-slate-700/80 text-slate-200 rounded-tl-none space-y-2"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>

              {/* Action Button if provided by Gemini */}
              {msg.actionSuggested && (
                <div className="pt-2 border-t border-slate-700/60 mt-1">
                  <button
                    onClick={() => handleExecuteAction(msg.actionSuggested)}
                    className="w-full py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{msg.actionSuggested.label || "Apply to Shopping List"}</span>
                  </button>
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
          </div>
        ))}

        {isSending && (
          <div className="flex items-center gap-2 text-slate-400 text-xs bg-slate-800/40 p-2.5 rounded-xl w-fit">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
            <span>AI is analyzing party math & groceries...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/60">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
          Quick Ask:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.slice(0, 3).map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2 py-1 rounded-md border border-slate-700 transition-colors truncate max-w-full text-left"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="p-3 border-t border-slate-800 bg-slate-900">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask agent: 'Add 6 gluten-free buns', 'Trim budget'..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isSending}
            className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
