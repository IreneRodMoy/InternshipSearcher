const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function timeAgo(timestamp: number | null, now = Date.now()): string {
  if (!timestamp) return 'date unknown';
  const diff = Math.max(0, now - timestamp);
  if (diff < MINUTE) return 'just now';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < 30 * DAY) return `${Math.floor(diff / DAY)}d ago`;
  return new Date(timestamp).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}

export function daysSince(timestamp: number | null, now = Date.now()) {
  return timestamp ? Math.max(0, Math.floor((now - timestamp) / DAY)) : 0;
}

export function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function isFreshToday(job: { postedAt: number | null; discoveredAt: number }, now = Date.now()) {
  return now - (job.postedAt ?? job.discoveredAt) < DAY;
}

export function primaryLocation(locations: string[]) {
  const first = locations[0] ?? 'Location TBD';
  return locations.length > 1 ? `${first} +${locations.length - 1}` : first;
}

const AVATAR_COLORS = ['#ffd1e1', '#d9d4ff', '#cdeefe', '#ffe8a3', '#c8f0dc', '#ffd8c2'];

export function avatarColor(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]!;
}
