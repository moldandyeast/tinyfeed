// Home page - aggregated feed from contacts

import { baseHtml, escapeHtml, formatDate } from '../utils/html';

export function homePage(baseUrl: string): string {
  const scripts = `
<script>
  let posts = [];
  let loading = true;

  async function loadFeeds() {
    const contacts = JSON.parse(localStorage.getItem('contacts') || '[]');
    const postsContainer = document.getElementById('posts');
    const feedCount = document.getElementById('feed-count');

    if (contacts.length === 0) {
      loading = false;
      postsContainer.innerHTML = \`
        <div class="empty">
          <p>no contacts yet</p>
          <p style="margin-top: 1rem;">visit a feed and click "+ contact" to follow them</p>
        </div>
      \`;
      feedCount.textContent = '0 feeds';
      return;
    }

    feedCount.textContent = contacts.length + ' feed' + (contacts.length === 1 ? '' : 's');

    // Fetch all feeds in parallel
    const results = await Promise.allSettled(
      contacts.map(async (contact) => {
        const res = await fetch('/api/feed/' + contact.id);
        if (!res.ok) return null;
        const data = await res.json();
        return { contact, data };
      })
    );

    // Collect all posts with author info
    posts = [];
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        const { contact, data } = result.value;
        for (const post of data.posts) {
          posts.push({
            ...post,
            authorId: contact.id,
            authorName: data.name || contact.name || contact.id,
            feedUrl: contact.url
          });
        }
      }
    }

    // Sort by timestamp (newest first)
    posts.sort((a, b) => b.timestamp - a.timestamp);

    // Render
    loading = false;
    renderPosts();
  }

  function renderPosts() {
    const postsContainer = document.getElementById('posts');

    if (posts.length === 0) {
      postsContainer.innerHTML = '<p class="empty">no posts from your contacts yet</p>';
      return;
    }

    postsContainer.innerHTML = posts.slice(0, 100).map(post => \`
      <article class="post">
        <p class="post-content">\${escapeHtml(post.content)}</p>
        \${post.url ? \`<a class="post-link" href="\${escapeHtml(post.url)}" target="_blank" rel="noopener">\${escapeHtml(new URL(post.url).hostname)}</a>\` : ''}
        <div class="post-meta">
          <span class="post-time"><a href="\${post.feedUrl}">\${escapeHtml(post.authorName)}</a> · \${formatDate(post.timestamp)}</span>
        </div>
      </article>
    \`).join('');
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const isThisYear = date.getFullYear() === now.getFullYear();

    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    const hour12 = hours % 12 || 12;

    if (isThisYear) {
      return month + ' ' + day + ', ' + hour12 + ':' + minutes + ampm;
    }
    return month + ' ' + day + ', ' + date.getFullYear();
  }

  loadFeeds();
</script>
`;

  const content = `
    <header class="header">
      <h1 class="feed-name">home</h1>
    </header>

    <section class="posts" id="posts">
      <p class="loading">loading</p>
    </section>

    <footer class="footer">
      <span id="feed-count">loading...</span>
    </footer>
  `;

  return baseHtml(content, { title: 'home — tinyfeed', scripts });
}
