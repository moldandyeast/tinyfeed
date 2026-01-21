// Landing page

import { baseHtml } from '../utils/html';

export function landingPage(baseUrl: string): string {
  const scripts = `
<script>
  // Check if user already has a feed
  (function() {
    const myFeed = JSON.parse(localStorage.getItem('myFeed') || 'null');
    if (myFeed && myFeed.id) {
      const myFeedEl = document.getElementById('my-feed-banner');
      const myFeedLink = document.getElementById('my-feed-link');
      myFeedLink.href = '/f/' + myFeed.id + '#s=' + myFeed.writeKey;
      myFeedEl.style.display = 'block';
    }
  })();

  async function createFeed() {
    const btn = document.getElementById('create-btn');
    btn.disabled = true;
    btn.textContent = 'creating...';

    try {
      const res = await fetch('/api/feed', { method: 'POST' });
      const data = await res.json();

      if (data.id && data.writeKey) {
        showCreatedModal(data.id, data.writeKey);
      } else {
        throw new Error('Invalid response');
      }
    } catch (e) {
      alert('Failed to create feed. Please try again.');
      btn.disabled = false;
      btn.textContent = 'create';
    }
  }

  function showCreatedModal(id, writeKey) {
    const baseUrl = window.location.origin;
    const publicUrl = baseUrl + '/f/' + id;
    const privateUrl = publicUrl + '#s=' + writeKey;

    // Save to localStorage
    localStorage.setItem('myFeed', JSON.stringify({ id, writeKey }));

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = \`
      <div class="modal-content">
        <h2 class="modal-title">your feed is ready</h2>

        <div class="url-block">
          <div class="url-label">public</div>
          <div class="url-value" onclick="copyToClipboard('\${publicUrl}')">\${publicUrl}</div>
        </div>

        <div class="url-block">
          <div class="url-label">private (keep this!)</div>
          <div class="url-value" onclick="copyToClipboard('\${privateUrl}')">\${privateUrl}</div>
        </div>

        <div class="url-warning">
          ⚠ save your private URL somewhere safe. it's the only way to post to your feed.
        </div>

        <div class="modal-actions">
          <button class="btn btn-primary" onclick="window.location.href='\${privateUrl}'">go to my feed</button>
          <button class="btn" onclick="copyToClipboard('\${privateUrl}')">copy private url</button>
        </div>
      </div>
    \`;
    document.body.appendChild(modal);
  }
</script>
<style>
  .my-feed-banner {
    display: none;
    margin-bottom: 2rem;
    padding: 1rem 1.25rem;
    background: var(--bg-subtle);
    border-radius: 8px;
    text-align: center;
  }
  .my-feed-banner a {
    font-weight: 500;
  }
</style>
`;

  const content = `
    <div class="landing">
      <h1 class="landing-title">tinyfeed</h1>
      <p class="landing-tagline">a feed is a url</p>

      <div id="my-feed-banner" class="my-feed-banner">
        <a id="my-feed-link" href="#">go to my feed →</a>
      </div>

      <div class="landing-create">
        <button id="create-btn" class="btn btn-primary" onclick="createFeed()">create</button>
      </div>

      <p class="landing-import">
        already have one? <a href="/import">restore access →</a>
      </p>
    </div>
  `;

  return baseHtml(content, { scripts });
}
