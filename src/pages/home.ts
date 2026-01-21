// Home page - aggregated feed from contacts

import { baseHtml, escapeHtml, formatDate } from '../utils/html';

export function homePage(baseUrl: string): string {
  const scripts = `
<script>
  let posts = [];
  let loading = true;

  async function loadFeeds() {
    const contacts = JSON.parse(localStorage.getItem('contacts') || '[]');
    const myFeed = JSON.parse(localStorage.getItem('myFeed') || 'null');
    const postsContainer = document.getElementById('posts');
    const feedCount = document.getElementById('feed-count');

    // Build list of feeds to fetch (contacts + own feed)
    const feedsToFetch = contacts.map(c => ({ id: c.id, name: c.name, url: c.url, isMe: false }));
    
    if (myFeed && myFeed.id) {
      feedsToFetch.push({
        id: myFeed.id,
        name: null, // will get from API
        url: window.location.origin + '/f/' + myFeed.id,
        isMe: true
      });
    }

    if (feedsToFetch.length === 0) {
      loading = false;
      postsContainer.innerHTML = \`
        <div class="empty">
          <p>nothing here yet</p>
          <p style="margin-top: 1rem;">create a feed or add contacts to get started</p>
        </div>
      \`;
      feedCount.textContent = '0 feeds';
      return;
    }

    const totalFeeds = feedsToFetch.length;
    feedCount.textContent = totalFeeds + ' feed' + (totalFeeds === 1 ? '' : 's');

    // Fetch all feeds in parallel
    const results = await Promise.allSettled(
      feedsToFetch.map(async (feed) => {
        const res = await fetch('/api/feed/' + feed.id);
        if (!res.ok) return null;
        const data = await res.json();
        return { feed, data };
      })
    );

    // Collect all posts with author info
    posts = [];
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        const { feed, data } = result.value;
        for (const post of data.posts) {
          posts.push({
            ...post,
            authorId: feed.id,
            authorName: data.name || feed.name || feed.id,
            feedUrl: feed.url,
            isMe: feed.isMe
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
          <span class="post-time"><a href="\${post.feedUrl}">\${post.isMe ? 'you' : escapeHtml(post.authorName)}</a> · \${formatDate(post.timestamp)}</span>
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
