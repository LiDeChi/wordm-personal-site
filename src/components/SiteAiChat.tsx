import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildSiteAiContext } from "../lib/site-ai-context";
import type { Lang } from "../i18n/lang";
import type { PortfolioProject } from "../types";

type SiteAiChatProps = {
  lang: Lang;
  projects: PortfolioProject[];
  lastUpdated: string;
};

type ChatRole = "assistant" | "user";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

type ChatResponse = {
  answer?: string;
  error?: string;
  model?: string;
};

const CHAT_COPY = {
  zh: {
    open: "AI",
    launcher: "咨询",
    close: "关闭",
    title: "问 wordm.us",
    subtitle: "Kimi · 基于站点内容",
    intro:
      "你可以问我这个网站的结构、主页、项目、落地页、博客和文档。我会优先依据当前站点内容回答。",
    placeholder: "问问这个网站、项目或博客...",
    send: "发送",
    sending: "思考中",
    context: "上下文",
    contextItems: "结构 / 主页 / 项目 / 落地页 / 博客 / 文档",
    modelFallback: "Kimi",
    missingConfig:
      "聊天接口还没配置 Kimi API key。请在 Cloudflare Pages 环境变量里设置 KIMI_API_KEY。",
    failed: "请求失败，请稍后再试。",
    examples: ["这个网站有哪些产品？", "Agent Core 是什么？", "最近的博客在讲什么？"],
  },
  en: {
    open: "AI",
    launcher: "Ask",
    close: "Close",
    title: "Ask wordm.us",
    subtitle: "Kimi · grounded in the site",
    intro:
      "Ask about the site structure, home page, projects, landing pages, blog posts, and docs. Answers are grounded in the current site context.",
    placeholder: "Ask about this site, a project, or a blog post...",
    send: "Send",
    sending: "Thinking",
    context: "Context",
    contextItems: "structure / home / projects / landing pages / blog posts / docs",
    modelFallback: "Kimi",
    missingConfig:
      "The chat endpoint is missing a Kimi API key. Set KIMI_API_KEY in Cloudflare Pages environment variables.",
    failed: "Request failed. Please try again later.",
    examples: ["What products are on this site?", "What is Agent Core?", "What are the recent blog posts about?"],
  },
} as const;

function createMessageId(role: ChatRole) {
  return `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toApiMessages(messages: ChatMessage[]) {
  return messages
    .filter((message) => message.content.trim())
    .slice(-8)
    .map(({ role, content }) => ({ role, content }));
}

export function SiteAiChat({ lang, projects, lastUpdated }: SiteAiChatProps) {
  const copy = CHAT_COPY[lang];
  const siteContext = useMemo(
    () => buildSiteAiContext({ lang, projects, lastUpdated }),
    [lang, lastUpdated, projects],
  );
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [model, setModel] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: createMessageId("assistant"),
      role: "assistant",
      content: copy.intro,
    },
  ]);
  const closeTimerRef = useRef<number | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const openChat = useCallback(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    setClosing(false);
    setOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    if (!open || closing) {
      return;
    }

    setClosing(true);
    closeTimerRef.current = window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
      closeTimerRef.current = null;
    }, 260);
  }, [closing, open]);

  useEffect(() => {
    setMessages((current) => {
      if (current.length !== 1 || current[0]?.role !== "assistant") {
        return current;
      }

      return [{ ...current[0], content: copy.intro }];
    });
  }, [copy.intro]);

  useEffect(() => {
    if (!open || closing) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      messagesRef.current?.scrollTo({
        top: messagesRef.current.scrollHeight,
        behavior: "smooth",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [closing, messages, open]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (panelRef.current?.contains(target)) {
        return;
      }

      closeChat();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeChat();
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeChat, open]);

  async function submitChat(nextInput = input) {
    const question = nextInput.trim();
    if (!question || busy) {
      return;
    }

    const userMessage: ChatMessage = {
      id: createMessageId("user"),
      role: "user",
      content: question,
    };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setBusy(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lang,
          context: siteContext.text,
          messages: toApiMessages(nextMessages),
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as ChatResponse;

      if (!response.ok) {
        throw new Error(payload.error || `HTTP ${response.status}`);
      }

      setModel(payload.model || "");
      setMessages((current) => [
        ...current,
        {
          id: createMessageId("assistant"),
          role: "assistant",
          content: payload.answer?.trim() || copy.failed,
        },
      ]);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "";
      const content =
        detail === "KIMI_API_KEY_MISSING" ? copy.missingConfig : copy.failed;

      setMessages((current) => [
        ...current,
        {
          id: createMessageId("assistant"),
          role: "assistant",
          content,
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`site-ai-chat${open ? " is-open" : ""}${closing ? " is-closing" : ""}`}>
      {open ? (
        <section
          ref={panelRef}
          className="site-ai-panel"
          aria-label={copy.title}
          aria-live="polite"
        >
          <header className="site-ai-header">
            <div>
              <strong>{copy.title}</strong>
              <span>{model || copy.subtitle}</span>
            </div>
            <button
              type="button"
              className="site-ai-close"
              aria-label={copy.close}
              onClick={closeChat}
            >
              ×
            </button>
          </header>

          <div className="site-ai-context-line">
            <span>{copy.context}</span>
            <p>{copy.contextItems}</p>
          </div>

          <div ref={messagesRef} className="site-ai-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`site-ai-message site-ai-message-${message.role}`}
              >
                {message.content}
              </div>
            ))}
          </div>

          {messages.length === 1 ? (
            <div className="site-ai-examples">
              {copy.examples.map((example) => (
                <button
                  type="button"
                  key={example}
                  onClick={() => void submitChat(example)}
                >
                  {example}
                </button>
              ))}
            </div>
          ) : null}

          <form
            className="site-ai-form"
            onSubmit={(event) => {
              event.preventDefault();
              void submitChat();
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              placeholder={copy.placeholder}
              rows={2}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void submitChat();
                }
              }}
            />
            <button type="submit" disabled={busy || !input.trim()}>
              {busy ? copy.sending : copy.send}
            </button>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        className="site-ai-fab"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={copy.title}
        onClick={openChat}
      >
        <span className="site-ai-fab-mark">{copy.open}</span>
        <span className="site-ai-fab-text">{copy.launcher}</span>
      </button>
    </div>
  );
}
