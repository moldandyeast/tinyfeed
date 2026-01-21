// 404 Not Found page

import { baseHtml } from '../utils/html';

export function notFoundPage(): string {
  const content = `
    <div class="landing">
      <h1 class="landing-title">404</h1>
      <p class="landing-tagline">feed not found</p>

      <div style="margin-top: 2rem;">
        <a href="/" class="btn">← back home</a>
      </div>
    </div>
  `;

  return baseHtml(content, { title: 'not found — tinyfeed' });
}
