// Contacts management page

import { baseHtml, escapeHtml } from '../utils/html';

export function contactsPage(baseUrl: string): string {
  const scripts = `
<script>
  let contacts = [];

  function loadContacts() {
    contacts = JSON.parse(localStorage.getItem('contacts') || '[]');
    renderContacts();
  }

  function renderContacts() {
    const container = document.getElementById('contacts-list');

    if (contacts.length === 0) {
      container.innerHTML = \`
        <div class="empty">
          <p>no contacts yet</p>
          <p style="margin-top: 1rem;">visit a feed and click "+ contact" to follow them</p>
        </div>
      \`;
      return;
    }

    container.innerHTML = contacts.map(contact => \`
      <div class="contact">
        <div class="contact-info">
          <h3><a href="\${contact.url}">\${escapeHtml(contact.name || contact.id)}</a></h3>
          <p class="contact-url">\${escapeHtml(contact.url)}</p>
        </div>
        <span class="contact-remove" onclick="removeContact('\${contact.id}')" title="remove">✕</span>
      </div>
    \`).join('');
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function removeContact(id) {
    contacts = contacts.filter(c => c.id !== id);
    localStorage.setItem('contacts', JSON.stringify(contacts));
    renderContacts();
    showToast('removed');
  }

  async function addContact(e) {
    e.preventDefault();
    const input = document.getElementById('add-input');
    const url = input.value.trim();

    if (!url) return;

    // Parse feed URL
    const match = url.match(/\\/f\\/([a-z0-9]+)/i);
    if (!match) {
      showToast('invalid feed url');
      return;
    }

    const feedId = match[1];

    // Check if already exists
    if (contacts.some(c => c.id === feedId)) {
      showToast('already in contacts');
      input.value = '';
      return;
    }

    // Fetch feed to get name
    try {
      const res = await fetch('/api/feed/' + feedId);
      if (!res.ok) throw new Error('Feed not found');

      const data = await res.json();
      const baseUrl = window.location.origin;

      contacts.push({
        id: feedId,
        name: data.name || feedId,
        url: baseUrl + '/f/' + feedId
      });

      localStorage.setItem('contacts', JSON.stringify(contacts));
      renderContacts();
      input.value = '';
      showToast('added');
    } catch (e) {
      showToast('feed not found');
    }
  }

  loadContacts();
</script>
`;

  const content = `
    <header class="header">
      <h1 class="feed-name">contacts</h1>
    </header>

    <section id="contacts-list">
      <p class="loading">loading</p>
    </section>

    <form class="add-form" onsubmit="addContact(event)">
      <input
        type="text"
        id="add-input"
        class="add-input"
        placeholder="paste feed url..."
      >
      <button type="submit" class="btn btn-primary">add</button>
    </form>
  `;

  return baseHtml(content, { title: 'contacts — tinyfeed', scripts });
}
