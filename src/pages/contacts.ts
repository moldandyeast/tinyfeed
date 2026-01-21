// Contacts management page

import { baseHtml, escapeHtml } from '../utils/html';

export function contactsPage(baseUrl: string): string {
  const scripts = `
<script>
  let contacts = [];

  function loadContacts() {
    contacts = JSON.parse(localStorage.getItem('contacts') || '[]');
    renderContacts();
    updateExportButton();
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

  function updateExportButton() {
    const exportBtn = document.getElementById('export-btn');
    exportBtn.style.display = contacts.length > 0 ? 'inline-flex' : 'none';
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
    updateExportButton();
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
      updateExportButton();
      input.value = '';
      showToast('added');
    } catch (e) {
      showToast('feed not found');
    }
  }

  function exportContacts() {
    const data = {
      exported: new Date().toISOString(),
      contacts: contacts
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tinyfeed-contacts.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('exported');
  }

  function importContacts() {
    document.getElementById('import-file').click();
  }

  function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        const imported = data.contacts || data; // support both formats
        
        if (!Array.isArray(imported)) {
          throw new Error('Invalid format');
        }

        let added = 0;
        for (const contact of imported) {
          if (contact.id && !contacts.some(c => c.id === contact.id)) {
            contacts.push({
              id: contact.id,
              name: contact.name || contact.id,
              url: contact.url || (window.location.origin + '/f/' + contact.id)
            });
            added++;
          }
        }

        localStorage.setItem('contacts', JSON.stringify(contacts));
        renderContacts();
        updateExportButton();
        showToast(added + ' contact' + (added === 1 ? '' : 's') + ' imported');
      } catch (err) {
        showToast('invalid file');
      }
      e.target.value = ''; // reset file input
    };
    reader.readAsText(file);
  }

  loadContacts();
</script>
`;

  const content = `
    <header class="header">
      <div class="header-top">
        <h1 class="feed-name">contacts</h1>
        <div class="header-actions">
          <button id="export-btn" class="btn" onclick="exportContacts()" style="display: none;">export</button>
          <button class="btn" onclick="importContacts()">import</button>
          <input type="file" id="import-file" accept=".json" onchange="handleImportFile(event)" style="display: none;">
        </div>
      </div>
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
