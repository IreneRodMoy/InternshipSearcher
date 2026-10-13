import { execFileSync, execSync, spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const NAME = 'internship-searcher';
const LABEL = 'com.internshipsearcher.app';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envFile = path.join(root, '.env');
const entry = path.join(root, 'server', 'dist', 'index.js');
const node = process.execPath;
const platform = process.platform;

const run = (command) => execSync(command, { cwd: root, stdio: 'inherit' });
const quiet = (file, args) => spawnSync(file, args, { stdio: 'ignore' });

function readEnv() {
  if (!fs.existsSync(envFile)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(envFile, 'utf8')
      .split('\n')
      .map((line) => line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/))
      .filter(Boolean)
      .map(([, key, value]) => [key, value]),
  );
}

const dataDir = () => path.resolve(root, readEnv().DATA_DIR || 'data');
const logDir = () => path.join(dataDir(), 'logs');

const wantsLocalData = (env) => !env.DATA_DIR && platform === 'win32' && /onedrive/i.test(root) && Boolean(process.env.LOCALAPPDATA);

async function ensureEnv() {
  const env = readEnv();
  if (env.APP_PASSWORD && env.SESSION_SECRET && env.PORT && !wantsLocalData(env)) return env;

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  let password = env.APP_PASSWORD ?? '';
  while (password.length < 4) password = (await rl.question('Choose a password for the site (4+ characters): ')).trim();
  rl.close();

  const lines = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8').trimEnd().split('\n') : [];
  const set = (key, value) => {
    const index = lines.findIndex((line) => line.startsWith(`${key}=`));
    if (index >= 0) lines[index] = `${key}=${value}`;
    else lines.push(`${key}=${value}`);
  };
  if (!env.APP_PASSWORD) set('APP_PASSWORD', password);
  if (!env.SESSION_SECRET) set('SESSION_SECRET', randomBytes(32).toString('hex'));
  if (!env.PORT) set('PORT', '3000');
  if (wantsLocalData(env)) set('DATA_DIR', path.join(process.env.LOCALAPPDATA, 'InternshipSearcher'));
  fs.writeFileSync(envFile, `${lines.join('\n')}\n`);
  return readEnv();
}

function stopRunningServer() {
  const pidFile = path.join(dataDir(), 'server.pid');
  if (!fs.existsSync(pidFile)) return;
  try {
    process.kill(Number(fs.readFileSync(pidFile, 'utf8')));
  } catch {
    return;
  }
}

const mac = {
  plist: path.join(os.homedir(), 'Library', 'LaunchAgents', `${LABEL}.plist`),
  domain: `gui/${process.getuid?.()}`,
  install() {
    fs.mkdirSync(path.dirname(this.plist), { recursive: true });
    fs.writeFileSync(
      this.plist,
      `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array><string>${node}</string><string>${entry}</string></array>
  <key>WorkingDirectory</key><string>${root}</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>${path.join(logDir(), 'server.log')}</string>
  <key>StandardErrorPath</key><string>${path.join(logDir(), 'server.log')}</string>
</dict>
</plist>
`,
    );
    this.uninstall(false);
    execFileSync('launchctl', ['bootstrap', this.domain, this.plist]);
  },
  restart() {
    execFileSync('launchctl', ['kickstart', '-k', `${this.domain}/${LABEL}`]);
  },
  uninstall(removeFile = true) {
    quiet('launchctl', ['bootout', `${this.domain}/${LABEL}`]);
    if (removeFile) fs.rmSync(this.plist, { force: true });
  },
};

const linux = {
  unit: path.join(os.homedir(), '.config', 'systemd', 'user', `${NAME}.service`),
  install() {
    fs.mkdirSync(path.dirname(this.unit), { recursive: true });
    fs.writeFileSync(
      this.unit,
      `[Unit]
Description=InternshipSearcher
After=network-online.target

[Service]
WorkingDirectory=${root}
ExecStart=${node} ${entry}
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
`,
    );
    execFileSync('systemctl', ['--user', 'daemon-reload']);
    execFileSync('systemctl', ['--user', 'enable', '--now', NAME]);
    this.restart();
  },
  restart() {
    execFileSync('systemctl', ['--user', 'restart', NAME]);
  },
  uninstall() {
    quiet('systemctl', ['--user', 'disable', '--now', NAME]);
    fs.rmSync(this.unit, { force: true });
    quiet('systemctl', ['--user', 'daemon-reload']);
  },
};

const windows = {
  launcher: path.join(process.env.APPDATA ?? '', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup', 'InternshipSearcher.vbs'),
  install() {
    fs.writeFileSync(
      this.launcher,
      ['Set shell = CreateObject("WScript.Shell")', `shell.CurrentDirectory = "${root}"`, `shell.Run """${node}"" ""${entry}""", 0, False`].join('\r\n'),
    );
    this.restart();
  },
  restart() {
    stopRunningServer();
    spawn('wscript.exe', [this.launcher], { detached: true, stdio: 'ignore' }).unref();
  },
  uninstall() {
    fs.rmSync(this.launcher, { force: true });
    stopRunningServer();
  },
};

const service = { darwin: mac, linux, win32: windows }[platform];
if (!service) {
  console.error(`Automatic start isn't supported on ${platform}. Run "npm start" instead.`);
  process.exit(1);
}

const action = process.argv[2];

async function waitUntilUp(port) {
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      if ((await fetch(`http://127.0.0.1:${port}/api/health`)).ok) return true;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return false;
}

function checkSqlite() {
  const result = spawnSync(node, ['-e', "require('better-sqlite3')(':memory:')"], { cwd: path.join(root, 'server'), stdio: 'ignore' });
  if (result.status !== 0) run('npm rebuild better-sqlite3');
}

if (action === 'install') {
  const env = await ensureEnv();
  fs.mkdirSync(logDir(), { recursive: true });
  console.log('\nInstalling dependencies and building…\n');
  run('npm install');
  checkSqlite();
  run('npm run build');
  service.install();
  const port = env.PORT ?? 3000;
  if (!(await waitUntilUp(port))) {
    console.error(`\nThe app was installed but didn't answer on http://localhost:${port} yet.`);
    console.error(platform === 'win32' ? 'Try "npm start" to see the error.' : `Check the log: ${path.join(logDir(), 'server.log')}`);
    process.exit(1);
  }
  console.log(`\n✿ InternshipSearcher is running at http://localhost:${port}`);
  console.log('  It starts by itself whenever you log in, so you can just bookmark that link.');
  if (platform !== 'win32') console.log(`  Logs: ${path.join(logDir(), 'server.log')}`);
  console.log('');
} else if (action === 'restart') {
  service.restart();
  console.log((await waitUntilUp(readEnv().PORT ?? 3000)) ? 'Restarted.' : 'Restarted, but the app is not answering yet.');
} else if (action === 'uninstall') {
  service.uninstall();
  console.log(`InternshipSearcher no longer starts automatically. Your data is still in ${dataDir()}`);
} else {
  console.log('Usage: node scripts/service.mjs <install|restart|uninstall>');
}
