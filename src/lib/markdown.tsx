import React from "react";

function inline(text: string, key: number): React.ReactNode {
  // **negrito** e links [texto](url)
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    const bold = part.match(/^\*\*(.+)\*\*$/);
    if (bold) return <strong key={`${key}-${i}`}>{bold[1]}</strong>;
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const href = link[2].startsWith("http") ? link[2] : `/${link[2].replace(/^\//, "")}`;
      return (
        <a key={`${key}-${i}`} href={href} target={link[2].startsWith("http") ? "_blank" : undefined} rel={link[2].startsWith("http") ? "noopener nofollow" : undefined}>
          {link[1]}
        </a>
      );
    }
    return <React.Fragment key={`${key}-${i}`}>{part}</React.Fragment>;
  });
}

/** Converte markdown simples (#, ##, ###, listas, **, links) em elementos React */
export function renderMarkdown(content: string): React.ReactNode[] {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let key = 0;

  const flushList = () => {
    if (!list) return;
    const items = list.items.map((item, i) => (
      <li key={i}>{inline(item, key++)}</li>
    ));
    blocks.push(list.ordered ? <ol key={key++}>{items}</ol> : <ul key={key++}>{items}</ul>);
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushList();
      continue;
    }
    const orderedMatch = line.match(/^\d+\.\s+(.+)/);
    const bulletMatch = line.match(/^[-*]\s+(.+)/);
    if (orderedMatch || bulletMatch) {
      if (!list || list.ordered !== !!orderedMatch) {
        flushList();
        list = { ordered: !!orderedMatch, items: [] };
      }
      list.items.push((orderedMatch ?? bulletMatch)![1]);
      continue;
    }
    flushList();

    const h1 = line.match(/^#\s+(.+)/);
    const h2 = line.match(/^##\s+(.+)/);
    const h3 = line.match(/^###\s+(.+)/);
    if (h1) blocks.push(<h2 key={key++}>{inline(h1[1], key)}</h2>);
    else if (h2) blocks.push(<h3 key={key++}>{inline(h2[1], key)}</h3>);
    else if (h3) blocks.push(<h3 key={key++}>{inline(h3[1], key)}</h3>);
    else blocks.push(<p key={key++}>{inline(line, key)}</p>);
  }
  flushList();
  return blocks;
}
