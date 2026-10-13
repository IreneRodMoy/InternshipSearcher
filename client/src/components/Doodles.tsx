import type { CSSProperties } from 'react';

interface DoodleProps {
  size?: number;
  color?: string;
  className?: string;
  style?: CSSProperties;
}

export function Flower({ size = 32, color = 'var(--pink-400)', className, style }: DoodleProps) {
  return (
    <svg width={size} height={size} viewBox="-32 -32 64 64" className={className} style={style} aria-hidden>
      <g fill={color}>
        {[0, 72, 144, 216, 288].map((angle) => (
          <ellipse key={angle} rx="9.5" ry="15" cy="-13" transform={`rotate(${angle})`} />
        ))}
      </g>
      <circle r="8" fill="var(--navy-800)" />
      <circle r="3" cx="-2" cy="-2" fill="var(--pink-200)" />
    </svg>
  );
}

export function Sparkle({ size = 18, color = 'var(--pink-400)', className, style }: DoodleProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} aria-hidden>
      <path d="M12 1c.6 5.3 4.6 9.6 10 11-5.4 1.4-9.4 5.7-10 11-.6-5.3-4.6-9.6-10-11 5.4-1.4 9.4-5.7 10-11Z" fill={color} />
    </svg>
  );
}

export function Squiggle({ width = 120, color = 'var(--pink-400)', className }: { width?: number; color?: string; className?: string }) {
  return (
    <svg width={width} height="10" viewBox="0 0 120 10" preserveAspectRatio="none" className={className} aria-hidden>
      <path
        d="M2 6c8-6 14 4 22 0s14-6 22 0 14 4 22 0 14-6 22 0 14 4 22 0 6-2 6-2"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BackgroundBlobs() {
  return (
    <div className="background" aria-hidden>
      <svg className="blob blob-one" viewBox="0 0 200 200">
        <path d="M45.4-62.3C58.2-52.6 67.2-38.1 72.4-21.8 77.6-5.5 79 12.6 71.7 26.2 64.5 39.8 48.6 48.8 32.4 57.3 16.2 65.8-.3 73.8-17.9 72.6-35.5 71.4-54.3 61-64.9 45.4-75.6 29.8-78.1 8.9-73.4-9.6-68.7-28.1-56.8-44.3-42-53.7-27.2-63.1-9.6-65.7 7.2-69.7 24-73.6 32.6-72 45.4-62.3Z" transform="translate(100 100)" />
      </svg>
      <svg className="blob blob-two" viewBox="0 0 200 200">
        <path d="M39.9-52.1C51.3-46.8 60.1-34.8 66.5-20.6 72.8-6.4 76.6 10.1 70.6 22.2 64.7 34.3 49 42 34.5 50.9 20 59.8 6.6 69.9-9.4 72.8-25.5 75.7-44.2 71.4-55.2 59.6-66.1 47.8-69.2 28.5-70.8 10.3-72.3-7.9-72.2-25-63.6-36.7-55-48.4-37.8-54.7-22.4-59.1-7-63.5 6.7-66 18.8-63.6 30.9-61.3 28.5-57.5 39.9-52.1Z" transform="translate(100 100)" />
      </svg>
      <svg className="blob blob-three" viewBox="0 0 200 200">
        <path d="M35.2-47.8C46.8-40.4 57.8-31.2 63.5-18.6 69.1-6 69.3 10 62.8 22.2 56.3 34.4 43 42.8 29.4 50.6 15.8 58.4 1.8 65.6-13.5 66.9-28.7 68.1-45.2 63.3-55.7 52.2-66.2 41.1-70.7 23.6-69.2 7.5-67.8-8.6-60.3-23.4-50.1-31.2-39.8-39.1-26.7-40.1-15.2-47.6-3.6-55.2 6.4-69.4 16.7-69.6 27-69.9 23.6-55.2 35.2-47.8Z" transform="translate(100 100)" />
      </svg>
      <Sparkle className="floating-sparkle s1" size={22} color="var(--pink-300)" />
      <Sparkle className="floating-sparkle s2" size={14} color="var(--lavender-400)" />
      <Sparkle className="floating-sparkle s3" size={18} color="var(--pink-300)" />
    </div>
  );
}

export function ColumnIcon({ icon, color }: { icon: 'heart' | 'letter' | 'cloud' | 'star' | 'ghost'; color: string }) {
  const shape = { fill: color, stroke: 'var(--navy-800)', strokeWidth: 1.8, strokeLinejoin: 'round' as const };
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden>
      {icon === 'heart' && <path d="M13 21.5S4 16 4 9.8C4 7 6.2 5 8.7 5c1.9 0 3.4 1.1 4.3 2.6C13.9 6.1 15.4 5 17.3 5 19.8 5 22 7 22 9.8c0 6.2-9 11.7-9 11.7Z" {...shape} />}
      {icon === 'letter' && (
        <>
          <rect x="3.5" y="6.5" width="19" height="13.5" rx="3" {...shape} />
          <path d="m5 9 8 5.5L21 9" fill="none" stroke="var(--cream)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {icon === 'cloud' && <path d="M7.5 19.5a4.5 4.5 0 0 1-.6-9 6 6 0 0 1 11.4 1.3 3.9 3.9 0 0 1 .2 7.7Z" {...shape} />}
      {icon === 'star' && <path d="m13 3.8 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L13 17.6l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8Z" {...shape} />}
      {icon === 'ghost' && (
        <>
          <path d="M6 21.5V11a7 7 0 0 1 14 0v10.5l-2.4-1.7-2.3 1.7-2.3-1.7-2.3 1.7-2.4-1.7Z" {...shape} />
          <circle cx="10.5" cy="11.5" r="1.2" fill="var(--navy-800)" />
          <circle cx="15.5" cy="11.5" r="1.2" fill="var(--navy-800)" />
        </>
      )}
    </svg>
  );
}

export function MatchRing({ score, size = 44 }: { score: number | null; size?: number }) {
  const radius = size / 2 - 4;
  const circumference = 2 * Math.PI * radius;
  const value = score ?? 0;
  const tone = value >= 80 ? 'var(--pink-500)' : value >= 65 ? 'var(--pink-400)' : value >= 45 ? 'var(--lavender-500)' : 'var(--navy-300)';
  return (
    <div className="match-ring" style={{ width: size, height: size }} title={score === null ? 'Upload your CV to see a match score' : `${score}% match`}>
      <svg width={size} height={size} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="var(--cream)" stroke="var(--pink-100)" strokeWidth="4" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tone}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span>{score === null ? '?' : score}</span>
    </div>
  );
}

export function Icon({ name, size = 18 }: { name: 'search' | 'refresh' | 'plus' | 'file' | 'settings' | 'bell' | 'logout' | 'close' | 'external' | 'eye-off' | 'pin'; size?: number }) {
  const paths: Record<typeof name, string> = {
    search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm9 16-4-4',
    refresh: 'M20 11a8 8 0 0 0-14.6-4.4M4 4v4h4m-4 5a8 8 0 0 0 14.6 4.4M20 20v-4h-4',
    plus: 'M12 5v14M5 12h14',
    file: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Zm0 0v5h5M9 13h6M9 17h4',
    settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14.5 3h-4L10 5.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2l.5 2.6h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z',
    bell: 'M6 16V11a6 6 0 1 1 12 0v5l2 2H4Zm4 4a2 2 0 0 0 4 0',
    logout: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4m-4 4h10',
    close: 'M6 6l12 12M18 6 6 18',
    external: 'M14 4h6v6m0-6-9 9M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4',
    'eye-off': 'M3 3l18 18M10.6 6.1A9.8 9.8 0 0 1 12 6c5 0 9 6 9 6a16 16 0 0 1-2.6 3.2M6.6 6.6C4.3 8.1 3 12 3 12s4 6 9 6a8.6 8.6 0 0 0 4.4-1.2M9.9 9.9a3 3 0 0 0 4.2 4.2',
    pin: 'M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={paths[name]} />
    </svg>
  );
}
