// Import/restore page

import { baseHtml } from '../utils/html';

export function importPage(baseUrl: string): string {
  const scripts = `
<script>
  function importFeed(e) {
    e.preventDefault();
    const input = document.getElementById('import-input');
    const url = input.value.trim();

    if (!url) return;

    // Parse private URL
    const feedMatch = url.match(/\\/f\\/([a-z0-9]+)/i);
    const keyMatch = url.match(/#s=([a-z0-9]+)/i);

    if (!feedMatch || !keyMatch) {
      showToast('invalid private url');
      return;
    }

    const feedId = feedMatch[1];
    const writeKey = keyMatch[1];

    // Save to localStorage
    localStorage.setItem('myFeed', JSON.stringify({ id: feedId, writeKey }));

    // Redirect to feed
    window.location.href = '/f/' + feedId + '#s=' + writeKey;
  }

  // Check if already have a feed
  const myFeed = JSON.parse(localStorage.getItem('myFeed') || 'null');
  if (myFeed) {
    document.getElementById('existing-feed').style.display = 'block';
    document.getElementById('existing-feed-link').href = '/f/' + myFeed.id + '#s=' + myFeed.writeKey;
  }
</script>
`;

  const content = `
    <header class="header">
      <div class="header-top">
        <h1 class="feed-name">restore access</h1>
        <div class="header-actions">
          <a href="/" class="btn">← back</a>
        </div>
      </div>
      <p class="feed-about">paste your private URL to restore access to your feed</p>
    </header>

    <div id="existing-feed" style="display: none; margin-bottom: 2rem; padding: 1rem; background: var(--bg-subtle); border-radius: 6px;">
      <p style="margin-bottom: 0.5rem;">you already have a feed saved in this browser:</p>
      <a id="existing-feed-link" href="#">go to my feed →</a>
    </div>

    <form onsubmit="importFeed(event)">
      <div class="edit-field">
        <label for="import-input">private url</label>
        <input
          type="text"
          id="import-input"
          placeholder="${baseUrl}/f/xxxxxxxx#s=xxxxxxxxxxxx"
          style="font-family: var(--font-mono); font-size: 0.85rem;"
        >
      </div>
      <button type="submit" class="btn btn-primary" style="margin-top: 1rem;">restore</button>
    </form>

    <div style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid var(--border);">
      <h2 style="font-size: 1rem; margin-bottom: 1rem;">how it works</h2>
      <p style="color: var(--text-muted); line-height: 1.8;">
        your private URL looks like:<br>
        <code style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--text);">${baseUrl}/f/abc123#s=secretkey</code>
      </p>
      <p style="color: var(--text-muted); margin-top: 1rem; line-height: 1.8;">
        the part after <code style="font-family: var(--font-mono); font-size: 0.85rem;">#s=</code> is your write key.
        it never leaves your browser — the server only sees a hash of it.
      </p>
    </div>
  `;

  return baseHtml(content, { title: 'restore — tinyfeed', scripts });
}
