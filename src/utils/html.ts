// HTML utilities and base template

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isThisYear = date.getFullYear() === now.getFullYear();

  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  const hour12 = hours % 12 || 12;

  if (isThisYear) {
    return `${month} ${day}, ${hour12}:${minutes}${ampm}`;
  }
  return `${month} ${day}, ${date.getFullYear()}`;
}

export function formatRelative(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(timestamp);
}

// Open Graph meta tags
export interface OgMeta {
  title?: string;
  description?: string;
  url?: string;
}

// Base HTML with styles
export function baseHtml(content: string, options: { title?: string; scripts?: string; og?: OgMeta } = {}): string {
  const { title = 'tinyfeed', scripts = '', og } = options;

  const ogTags = og ? `
  <meta property="og:title" content="${escapeHtml(og.title || title)}">
  <meta property="og:description" content="${escapeHtml(og.description || 'a feed is a url')}">
  <meta property="og:type" content="website">
  ${og.url ? `<meta property="og:url" content="${escapeHtml(og.url)}">` : ''}
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeHtml(og.title || title)}">
  <meta name="twitter:description" content="${escapeHtml(og.description || 'a feed is a url')}">` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>${ogTags}
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='%23c45d3a' rx='12' width='100' height='100'/><circle cx='25' cy='75' r='10' fill='%23faf9f7'/><path d='M25 45 v-10 a40 40 0 0 1 40 40 h-10 a30 30 0 0 0 -30 -30z' fill='%23faf9f7'/><path d='M25 20 v-10 a65 65 0 0 1 65 65 h-10 a55 55 0 0 0 -55 -55z' fill='%23faf9f7'/></svg>">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #faf9f7;
      --bg-subtle: #f3f1ed;
      --text: #1a1a18;
      --text-muted: #6b6b66;
      --accent: #c45d3a;
      --accent-hover: #a84d2f;
      --border: #e5e3de;
      --shadow: rgba(26, 26, 24, 0.06);
      --font-serif: 'Newsreader', Georgia, serif;
      --font-mono: 'JetBrains Mono', monospace;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #161614;
        --bg-subtle: #1e1e1b;
        --text: #e8e6e1;
        --text-muted: #8a8a84;
        --accent: #e07c5a;
        --accent-hover: #f09070;
        --border: #2a2a26;
        --shadow: rgba(0, 0, 0, 0.2);
      }
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html {
      font-size: 18px;
    }

    body {
      font-family: var(--font-serif);
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
    }

    .container {
      max-width: 540px;
      margin: 0 auto;
      padding: 3rem 1.5rem;
    }

    a {
      color: var(--accent);
      text-decoration: none;
      transition: color 0.15s;
    }

    a:hover {
      color: var(--accent-hover);
    }

    /* Header */
    .header {
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border);
    }

    .header-top {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 0.25rem;
    }

    .feed-name {
      font-size: 1.5rem;
      font-weight: 500;
      letter-spacing: -0.02em;
    }

    .feed-about {
      color: var(--text-muted);
      font-style: italic;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
      font-size: 0.85rem;
    }

    /* Posts */
    .posts {
      margin-bottom: 2rem;
    }

    .post {
      margin-bottom: 1.75rem;
      padding-bottom: 1.75rem;
      border-bottom: 1px solid var(--border);
    }

    .post:last-child {
      border-bottom: none;
    }

    .post-content {
      margin-bottom: 0.5rem;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .post-link {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
      color: var(--accent);
    }

    .post-link::before {
      content: '→';
      opacity: 0.7;
    }

    .post-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .post-time {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--text-muted);
      letter-spacing: -0.02em;
    }

    .post-delete {
      font-size: 0.9rem;
      color: var(--text-muted);
      cursor: pointer;
      opacity: 0.6;
      transition: opacity 0.15s;
    }

    .post-delete:hover {
      opacity: 1;
    }

    /* Home feed post variant */
    .post-author {
      font-weight: 500;
      margin-bottom: 0.25rem;
    }

    .post-author a {
      color: var(--text);
    }

    .post-author a:hover {
      color: var(--accent);
    }

    /* Footer */
    .footer {
      padding-top: 1rem;
      border-top: 1px solid var(--border);
      font-size: 0.85rem;
      color: var(--text-muted);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .subscribe-links {
      display: flex;
      gap: 0.75rem;
    }

    .subscribe-links span {
      color: var(--text-muted);
    }

    /* Composer */
    .composer {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border);
    }

    .composer-input {
      width: 100%;
      padding: 0.75rem 1rem;
      font-family: var(--font-serif);
      font-size: 1rem;
      background: var(--bg-subtle);
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--text);
      resize: none;
      min-height: 2.75rem;
      max-height: 8rem;
    }

    .composer-input:focus {
      outline: none;
      border-color: var(--accent);
    }

    .composer-input::placeholder {
      color: var(--text-muted);
    }

    .composer-extras {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 0.75rem;
    }

    .composer-url {
      flex: 1;
      padding: 0.5rem 0.75rem;
      font-family: var(--font-mono);
      font-size: 0.85rem;
      background: var(--bg-subtle);
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--text);
    }

    .composer-url:focus {
      outline: none;
      border-color: var(--accent);
    }

    .composer-url::placeholder {
      color: var(--text-muted);
    }

    .composer-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.15rem;
    }

    .composer-hint {
      font-family: var(--font-mono);
      font-size: 0.7rem;
      color: var(--text-muted);
      opacity: 0.7;
    }

    .composer-submit {
      padding: 0.5rem 1rem;
      font-family: var(--font-mono);
      font-size: 0.85rem;
      background: var(--text);
      color: var(--bg);
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: transform 0.1s, opacity 0.15s;
    }

    .composer-submit:hover {
      opacity: 0.9;
    }

    .composer-submit:active {
      transform: scale(0.98);
    }

    .composer-submit:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .char-count {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .char-count.warn {
      color: var(--accent);
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.5rem 1rem;
      font-family: var(--font-mono);
      font-size: 0.85rem;
      background: var(--bg-subtle);
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--text);
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }

    .btn:hover {
      background: var(--border);
    }

    .btn-primary {
      background: var(--text);
      color: var(--bg);
      border-color: var(--text);
    }

    .btn-primary:hover {
      opacity: 0.9;
      background: var(--text);
    }

    /* Landing */
    .landing {
      text-align: center;
      padding-top: 20vh;
    }

    .landing-title {
      font-size: 2.5rem;
      font-weight: 500;
      letter-spacing: -0.03em;
      margin-bottom: 1rem;
    }

    .landing-tagline {
      font-size: 1.25rem;
      color: var(--text-muted);
      font-style: italic;
      margin-bottom: 3rem;
    }

    .landing-create {
      margin-bottom: 2rem;
    }

    .landing-create .btn {
      font-size: 1rem;
      padding: 0.75rem 2rem;
    }

    .landing-import {
      font-size: 0.9rem;
      color: var(--text-muted);
    }

    /* Created modal */
    .modal {
      position: fixed;
      inset: 0;
      background: rgba(26, 26, 24, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      z-index: 100;
    }

    @media (prefers-color-scheme: dark) {
      .modal {
        background: rgba(0, 0, 0, 0.7);
      }
    }

    .modal-content {
      background: var(--bg);
      border-radius: 12px;
      padding: 2rem;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 20px 60px var(--shadow);
    }

    .modal-title {
      font-size: 1.25rem;
      font-weight: 500;
      margin-bottom: 1.5rem;
    }

    .url-block {
      margin-bottom: 1rem;
    }

    .url-label {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-bottom: 0.35rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .url-value {
      font-family: var(--font-mono);
      font-size: 0.9rem;
      padding: 0.75rem 1rem;
      background: var(--bg-subtle);
      border-radius: 6px;
      word-break: break-all;
      cursor: pointer;
      transition: background 0.15s;
    }

    .url-value:hover {
      background: var(--border);
    }

    .url-warning {
      margin-top: 1.5rem;
      padding: 1rem;
      background: rgba(196, 93, 58, 0.1);
      border-radius: 6px;
      font-size: 0.9rem;
      color: var(--accent);
    }

    .modal-actions {
      margin-top: 1.5rem;
      display: flex;
      gap: 0.75rem;
    }

    /* Contacts */
    .contact {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem 0;
      border-bottom: 1px solid var(--border);
    }

    .contact:first-child {
      padding-top: 0;
    }

    .contact-info h3 {
      font-size: 1rem;
      font-weight: 500;
      margin-bottom: 0.25rem;
    }

    .contact-url {
      font-family: var(--font-mono);
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .contact-remove {
      color: var(--text-muted);
      cursor: pointer;
      opacity: 0.6;
      transition: opacity 0.15s;
    }

    .contact-remove:hover {
      opacity: 1;
    }

    /* Add contact form */
    .add-form {
      display: flex;
      gap: 0.75rem;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border);
    }

    .add-input {
      flex: 1;
      padding: 0.75rem 1rem;
      font-family: var(--font-mono);
      font-size: 0.9rem;
      background: var(--bg-subtle);
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--text);
    }

    .add-input:focus {
      outline: none;
      border-color: var(--accent);
    }

    /* Empty state */
    .empty {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--text-muted);
      font-style: italic;
    }

    /* Edit profile */
    .edit-form {
      margin-bottom: 1.5rem;
    }

    .edit-field {
      margin-bottom: 1rem;
    }

    .edit-field label {
      display: block;
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-bottom: 0.35rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .edit-field input {
      width: 100%;
      padding: 0.75rem 1rem;
      font-family: var(--font-serif);
      font-size: 1rem;
      background: var(--bg-subtle);
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--text);
    }

    .edit-field input:focus {
      outline: none;
      border-color: var(--accent);
    }

    .edit-actions {
      display: flex;
      gap: 0.75rem;
    }

    /* Toast */
    .toast {
      position: fixed;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%);
      padding: 0.75rem 1.5rem;
      background: var(--text);
      color: var(--bg);
      border-radius: 6px;
      font-family: var(--font-mono);
      font-size: 0.85rem;
      opacity: 0;
      transition: opacity 0.3s;
      pointer-events: none;
      z-index: 200;
    }

    .toast.show {
      opacity: 1;
    }

    /* Loading */
    .loading {
      text-align: center;
      padding: 3rem;
      color: var(--text-muted);
    }

    @keyframes pulse {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 1; }
    }

    .loading::after {
      content: '...';
      animation: pulse 1.5s infinite;
    }

    /* Responsive */
    @media (max-width: 480px) {
      html {
        font-size: 16px;
      }

      .container {
        padding: 2rem 1rem;
      }

      .landing {
        padding-top: 15vh;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    ${content}
  </div>
  <div class="toast" id="toast"></div>
  <script>
    function showToast(msg) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 2000);
    }

    async function copyToClipboard(text) {
      await navigator.clipboard.writeText(text);
      showToast('copied!');
    }
  </script>
  ${scripts}
</body>
</html>`;
}
