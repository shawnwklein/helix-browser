import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { hostOf } from "../lib/intent";

function Cite({ href, children }: { href?: string; children?: ReactNode }) {
  const label = Array.isArray(children) ? children.join("") : String(children ?? "");
  const numbered = /^\[\d+\]$/.test(label);
  const x = href ? hostOf(href).includes("x.com") || hostOf(href).includes("twitter.com") : false;
  if (numbered && href) {
    return (
      <a className={`cite${x ? " x" : ""}`} href={href} target="_blank" rel="noreferrer" title={href}>
        {label.replace(/[[\]]/g, "")}
      </a>
    );
  }
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

export function Markdown({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => <Cite href={href}>{children}</Cite>,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
