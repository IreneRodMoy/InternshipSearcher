export function fold(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function words(list: string[]): RegExp {
  const terms = list.filter((w) => w.trim());
  if (!terms.length) return /(?!)/;
  const body = terms.map((w) => escapeRegex(fold(w.trim())).replace(/[\s-]+/g, '[\\s-]*')).join('|');
  return new RegExp(`(?<![a-z0-9])(?:${body})(?![a-z0-9])`);
}

export function compact(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export function htmlToText(html: string): string {
  return compact(
    decodeEntities(
      html
        .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
        .replace(/<\/(p|div|li|h\d|br|tr)>|<br\s*\/?>/gi, '\n')
        .replace(/<li[^>]*>/gi, '• ')
        .replace(/<[^>]+>/g, ' '),
    ).replace(/[ \t]+/g, ' '),
  );
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

export function decodeEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, code: string) => {
    if (code.startsWith('#x') || code.startsWith('#X')) return String.fromCodePoint(parseInt(code.slice(2), 16));
    if (code.startsWith('#')) return String.fromCodePoint(Number(code.slice(1)));
    return ENTITIES[code.toLowerCase()] ?? match;
  });
}
