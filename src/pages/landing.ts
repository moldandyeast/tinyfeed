// Landing page

import { baseHtml } from '../utils/html';

export function landingPage(baseUrl: string): string {
  const scripts = `
<script>
  // Check if user already has a feed or contacts
  (function() {
    const myFeed = JSON.parse(localStorage.getItem('myFeed') || 'null');
    const contacts = JSON.parse(localStorage.getItem('contacts') || '[]');

    if (myFeed && myFeed.id) {
      const myFeedLink = document.getElementById('nav-my-feed');
      myFeedLink.href = '/f/' + myFeed.id + '#s=' + myFeed.writeKey;
      myFeedLink.style.display = 'inline';
    }

    if (contacts.length > 0) {
      document.getElementById('nav-home').style.display = 'inline';
    }

    // Show nav if either exists
    if ((myFeed && myFeed.id) || contacts.length > 0) {
      document.getElementById('user-nav').style.display = 'flex';
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
  .user-nav {
    display: none;
    justify-content: center;
    gap: 1.5rem;
    margin-bottom: 3rem;
    padding: 1rem;
    background: var(--bg-subtle);
    border-radius: 8px;
  }
  .user-nav a {
    font-family: var(--font-mono);
    font-size: 0.9rem;
    display: none;
  }

  .hero {
    text-align: center;
    margin-bottom: 4rem;
  }

  .hero-title {
    font-size: 3rem;
    font-weight: 500;
    letter-spacing: -0.03em;
    margin-bottom: 0.75rem;
  }

  .hero-tagline {
    font-size: 1.35rem;
    color: var(--text-muted);
    font-style: italic;
    margin-bottom: 2.5rem;
  }

  .hero-actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .hero-actions .btn {
    font-size: 1rem;
    padding: 0.75rem 2rem;
  }

  .hero-secondary {
    font-size: 0.9rem;
    color: var(--text-muted);
  }

  /* How it works */
  .how-it-works {
    margin-bottom: 4rem;
  }

  .section-title {
    font-size: 1.1rem;
    font-weight: 500;
    text-transform: lowercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .steps {
    display: grid;
    gap: 1.5rem;
  }

  .step {
    display: grid;
    grid-template-columns: 2.5rem 1fr;
    gap: 1rem;
    align-items: start;
  }

  .step-num {
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--text);
    color: var(--bg);
    border-radius: 50%;
    font-family: var(--font-mono);
    font-size: 0.9rem;
    font-weight: 500;
  }

  .step-content h3 {
    font-size: 1.1rem;
    font-weight: 500;
    margin-bottom: 0.35rem;
  }

  .step-content p {
    color: var(--text-muted);
    font-size: 0.95rem;
    line-height: 1.5;
  }

  /* What you get */
  .features {
    margin-bottom: 4rem;
    padding: 2rem;
    background: var(--bg-subtle);
    border-radius: 12px;
  }

  .feature-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }

  @media (max-width: 480px) {
    .feature-grid {
      grid-template-columns: 1fr;
    }
  }

  .feature h4 {
    font-size: 0.95rem;
    font-weight: 500;
    margin-bottom: 0.25rem;
  }

  .feature p {
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  /* Philosophy */
  .philosophy {
    text-align: center;
    padding: 2rem 0;
    border-top: 1px solid var(--border);
  }

  .philosophy p {
    color: var(--text-muted);
    font-style: italic;
    max-width: 400px;
    margin: 0 auto;
    line-height: 1.7;
  }
</style>
`;

  const content = `
    <nav class="user-nav" id="user-nav">
      <a href="/home" id="nav-home">home feed</a>
      <a href="#" id="nav-my-feed">my feed</a>
    </nav>

    <div class="hero">
      <h1 class="hero-title">tinyfeed</h1>
      <p class="hero-tagline">a feed is a url</p>

      <div class="hero-actions">
        <button id="create-btn" class="btn btn-primary" onclick="createFeed()">create your feed</button>
      </div>

      <p class="hero-secondary">
        already have one? <a href="/import">restore access →</a>
      </p>
    </div>

    <section class="how-it-works">
      <h2 class="section-title">how it works</h2>

      <div class="steps">
        <div class="step">
          <span class="step-num">1</span>
          <div class="step-content">
            <h3>create</h3>
            <p>click the button. you get two URLs: a public one to share, and a private one to post. no signup required.</p>
          </div>
        </div>

        <div class="step">
          <span class="step-num">2</span>
          <div class="step-content">
            <h3>post</h3>
            <p>open your feed with the private URL. write something. hit enter. posts are short — 500 characters max.</p>
          </div>
        </div>

        <div class="step">
          <span class="step-num">3</span>
          <div class="step-content">
            <h3>share</h3>
            <p>give out your public URL. anyone can read it. anyone can subscribe with their favorite RSS reader.</p>
          </div>
        </div>

        <div class="step">
          <span class="step-num">4</span>
          <div class="step-content">
            <h3>follow</h3>
            <p>visit someone's feed and click "+ contact". their posts appear on your home feed. contacts live in your browser — the server never knows.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="features">
      <h2 class="section-title">what you get</h2>

      <div class="feature-grid">
        <div class="feature">
          <h4>RSS & JSON Feed</h4>
          <p>standard formats. works with any reader.</p>
        </div>

        <div class="feature">
          <h4>no account</h4>
          <p>your URL is your identity. bookmark it.</p>
        </div>

        <div class="feature">
          <h4>no tracking</h4>
          <p>no cookies. no analytics. no algorithms.</p>
        </div>

        <div class="feature">
          <h4>export anytime</h4>
          <p>download your posts as JSON or markdown.</p>
        </div>
      </div>
    </section>

    <section class="philosophy">
      <p>no likes. no followers count. no engagement metrics. just you, your thoughts, and a URL.</p>
    </section>
  `;

  return baseHtml(content, { 
    title: 'tinyfeed — a feed is a url',
    scripts,
    og: {
      title: 'tinyfeed',
      description: 'a feed is a url. no accounts, no algorithms. just post and share.',
    }
  });
}
