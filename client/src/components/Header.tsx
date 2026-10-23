import { timeAgo } from '../lib/format';
import { Flower, Icon, Sparkle } from './Doodles';

interface HeaderProps {
  now: number;
  lastScan: number | null;
  scanning: boolean;
  sourceCount: number;
  hasCv: boolean;
  notificationsOn: boolean;
  onScan: () => void;
  onAdd: () => void;
  onCv: () => void;
  onSettings: () => void;
  onNotifications: () => void;
  onLogout: () => void;
}

export function Header(props: HeaderProps) {
  return (
    <header className="app-header">
      <div className="brand">
        <Flower size={40} className="brand__flower" />
        <div>
          <h1>
            Internship<em>Searcher</em>
          </h1>
          <button className={`live-pill${props.scanning ? ' is-scanning' : ''}`} onClick={props.onSettings} title="See sources">
            <span className="live-dot" />
            {props.scanning
              ? 'Scanning…'
              : `Watching ${props.sourceCount} sources · ${props.lastScan ? `checked ${timeAgo(props.lastScan, props.now)}` : 'starting up'}`}
          </button>
        </div>
        <Sparkle size={14} className="brand__sparkle" />
      </div>

      <nav className="header-actions">
        <button className="button button--ghost" onClick={props.onScan} disabled={props.scanning}>
          <Icon name="refresh" size={16} /> <span>Scan now</span>
        </button>
        <button className="button button--ghost" onClick={props.onAdd}>
          <Icon name="plus" size={16} /> <span>Add a job</span>
        </button>
        <button className={`button ${props.hasCv ? 'button--ghost' : 'button--pink'}`} onClick={props.onCv}>
          <Icon name="file" size={16} /> <span>{props.hasCv ? 'My CV' : 'Upload CV'}</span>
        </button>
        <button
          className={`icon-button${props.notificationsOn ? ' is-on' : ''}`}
          onClick={props.onNotifications}
          title={props.notificationsOn ? 'Desktop notifications are on (click to send a test)' : 'Turn on desktop notifications'}
          aria-label="Desktop alerts"
        >
          <Icon name="bell" />
        </button>
        <button className="icon-button" onClick={props.onSettings} title="Preferences & sources" aria-label="Settings">
          <Icon name="settings" />
        </button>
        <button className="icon-button" onClick={props.onLogout} title="Sign out" aria-label="Sign out">
          <Icon name="logout" />
        </button>
      </nav>
    </header>
  );
}
