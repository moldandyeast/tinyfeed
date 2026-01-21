// Feed page (read and write modes)

import { baseHtml, escapeHtml, formatDate, OgMeta } from '../utils/html';

interface Post {
  id: string;
  content: string;
  url: string | null;
  timestamp: number;
}

interface FeedData {
  id: string;
  name: string;
  about: string;
  createdAt: number;
  posts: Post[];
}

export function feedPage(feed: FeedData, baseUrl: string): string {
  const feedName = feed.name || feed.id;
  const feedUrl = `${baseUrl}/f/${feed.id}`;
  
  // Open Graph meta
  const og: OgMeta = {
    title: `${feedName} — tinyfeed`,
    description: feed.about || (feed.posts[0]?.content.slice(0, 150) || 'a feed is a url'),
    url: feedUrl,
  };

  const postsHtml = feed.posts.length > 0
    ? feed.posts.map((post) => `
        <article class="post" id="post-${post.id}">
          <p class="post-content">${escapeHtml(post.content)}</p>
          ${post.url ? `<a class="post-link" href="${escapeHtml(post.url)}" target="_blank" rel="noopener">${escapeHtml(new URL(post.url).hostname)}</a>` : ''}
          <div class="post-meta">
            <time class="post-time">${formatDate(post.timestamp)}</time>
            <span class="post-delete write-only" onclick="deletePost('${post.id}')" title="delete">✕</span>
          </div>
        </article>
      `).join('')
    : '<p class="empty">no posts yet</p>';

  const scripts = `
<script>
  const feedId = '${feed.id}';
  let writeKey = null;
  let isWriteMode = false;

  // Check for write key in hash
  function checkWriteMode() {
    const hash = window.location.hash;
    const match = hash.match(/s=([a-z0-9]+)/i);
    if (match) {
      writeKey = match[1];
      isWriteMode = true;
      document.body.classList.add('write-mode');
      document.querySelector('.header-actions').innerHTML = \`
        <button class="btn" onclick="sharePublic()">share</button>
        <div class="export-dropdown">
          <button class="btn" onclick="toggleExportMenu()">export ▾</button>
          <div class="export-menu" id="export-menu">
            <button onclick="exportFeed('json')">json</button>
            <button onclick="exportFeed('md')">markdown</button>
          </div>
        </div>
      \`;
      document.querySelector('.edit-profile-btn').style.display = 'inline';
    }
  }

  checkWriteMode();

  // Export dropdown
  function toggleExportMenu() {
    document.getElementById('export-menu').classList.toggle('show');
  }
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.export-dropdown')) {
      document.getElementById('export-menu')?.classList.remove('show');
    }
  });

  // Composer
  const textarea = document.getElementById('composer-input');
  const urlInput = document.getElementById('composer-url');
  const charCount = document.getElementById('char-count');
  const MAX_CHARS = 500;

  if (textarea) {
    textarea.addEventListener('input', () => {
      const len = textarea.value.length;
      charCount.textContent = len + '/' + MAX_CHARS;
      charCount.classList.toggle('warn', len > MAX_CHARS - 50);

      // Auto-resize
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    });

    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.metaKey) {
        e.preventDefault();
        submitPost();
      }
    });
  }

  async function submitPost() {
    const content = textarea.value.trim();
    if (!content || !writeKey) return;

    const btn = document.getElementById('submit-btn');
    btn.disabled = true;

    const postUrl = urlInput?.value.trim() || null;

    try {
      const res = await fetch('/api/feed/' + feedId + '/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Write-Key': writeKey
        },
        body: JSON.stringify({ content, url: postUrl })
      });

      if (res.status === 429) {
        const data = await res.json();
        showToast(data.error || 'rate limited');
        btn.disabled = false;
        return;
      }

      if (!res.ok) throw new Error('Failed to post');

      // Refresh page to show new post
      window.location.reload();
    } catch (e) {
      showToast('failed to post');
      btn.disabled = false;
    }
  }

  async function deletePost(postId) {
    if (!confirm('delete this post?')) return;

    try {
      const res = await fetch('/api/feed/' + feedId + '/post/' + postId, {
        method: 'DELETE',
        headers: { 'X-Write-Key': writeKey }
      });

      if (!res.ok) throw new Error('Failed to delete');

      document.getElementById('post-' + postId)?.remove();
      showToast('deleted');
    } catch (e) {
      showToast('failed to delete');
    }
  }

  function sharePublic() {
    const publicUrl = window.location.origin + '/f/' + feedId;
    copyToClipboard(publicUrl);
  }

  async function exportFeed(format) {
    document.getElementById('export-menu')?.classList.remove('show');
    try {
      const res = await fetch('/api/feed/' + feedId + '/export?format=' + format, {
        headers: { 'X-Write-Key': writeKey }
      });

      if (!res.ok) throw new Error('Failed to export');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = feedId + '.' + (format === 'md' ? 'md' : 'json');
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      showToast('failed to export');
    }
  }

  async function addContact() {
    const contacts = JSON.parse(localStorage.getItem('contacts') || '[]');
    const exists = contacts.some(c => c.id === feedId);

    if (exists) {
      showToast('already in contacts');
      return;
    }

    contacts.push({
      id: feedId,
      name: '${escapeHtml(feedName)}',
      url: window.location.origin + '/f/' + feedId
    });

    localStorage.setItem('contacts', JSON.stringify(contacts));
    showToast('added to contacts');
  }

  // Edit profile
  let editMode = false;

  function toggleEdit() {
    editMode = !editMode;
    const header = document.querySelector('.header');

    if (editMode) {
      header.innerHTML = \`
        <form class="edit-form" onsubmit="saveProfile(event)">
          <div class="edit-field">
            <label for="edit-name">name</label>
            <input type="text" id="edit-name" value="${escapeHtml(feed.name)}" maxlength="30" placeholder="your name">
          </div>
          <div class="edit-field">
            <label for="edit-about">about</label>
            <input type="text" id="edit-about" value="${escapeHtml(feed.about)}" maxlength="160" placeholder="a short bio">
          </div>
          <div class="edit-actions">
            <button type="submit" class="btn btn-primary">save</button>
            <button type="button" class="btn" onclick="window.location.reload()">cancel</button>
          </div>
        </form>
      \`;
    }
  }

  async function saveProfile(e) {
    e.preventDefault();
    const name = document.getElementById('edit-name').value;
    const about = document.getElementById('edit-about').value;

    try {
      const res = await fetch('/api/feed/' + feedId, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Write-Key': writeKey
        },
        body: JSON.stringify({ name, about })
      });

      if (!res.ok) throw new Error('Failed to save');
      window.location.reload();
    } catch (e) {
      showToast('failed to save');
    }
  }
</script>
<style>
  .write-only { display: none; }
  .write-mode .write-only { display: inline; display: block; }
  .edit-profile-btn { display: none; }
  
  .export-dropdown { position: relative; display: inline-block; }
  .export-menu {
    display: none;
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 0.25rem;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
    box-shadow: 0 4px 12px var(--shadow);
    z-index: 10;
  }
  .export-menu.show { display: block; }
  .export-menu button {
    display: block;
    width: 100%;
    padding: 0.5rem 1rem;
    font-family: var(--font-mono);
    font-size: 0.85rem;
    background: none;
    border: none;
    color: var(--text);
    cursor: pointer;
    text-align: left;
  }
  .export-menu button:hover { background: var(--bg-subtle); }
</style>
`;

  const content = `
    <header class="header">
      <div class="header-top">
        <h1 class="feed-name">${escapeHtml(feedName)}</h1>
        <div class="header-actions">
          <button class="btn" onclick="addContact()">+ contact</button>
        </div>
      </div>
      ${feed.about ? `<p class="feed-about">${escapeHtml(feed.about)}</p>` : ''}
      <button class="edit-profile-btn btn" onclick="toggleEdit()" style="margin-top: 0.75rem">edit profile</button>
    </header>

    <section class="posts">
      ${postsHtml}
    </section>

    <div class="composer write-only">
      <textarea
        id="composer-input"
        class="composer-input"
        placeholder="write something..."
        maxlength="500"
        rows="1"
      ></textarea>
      <div class="composer-extras">
        <input
          type="url"
          id="composer-url"
          class="composer-url"
          placeholder="link (optional)"
        >
        <div class="composer-meta">
          <span class="char-count" id="char-count">0/500</span>
          <span class="composer-hint">⌘↵ to post</span>
        </div>
        <button id="submit-btn" class="composer-submit" onclick="submitPost()">post</button>
      </div>
    </div>

    <footer class="footer">
      <div class="subscribe-links">
        <span>subscribe:</span>
        <a href="${feedUrl}.rss">rss</a>
        <span>·</span>
        <a href="${feedUrl}.json">json</a>
      </div>
    </footer>
  `;

  return baseHtml(content, { title: `${feedName} — tinyfeed`, scripts, og });
}
