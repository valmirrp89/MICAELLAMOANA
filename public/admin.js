/**
 * PAINEL ADMINISTRATIVO — 4º ANIVERSÁRIO DA MICAELLA
 */

let adminToken = sessionStorage.getItem('micaella_admin_token') || '';
let allGuests = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (adminToken) {
    const isValid = await verifyAuthToken();
    if (isValid) {
      hideLoginModal();
      loadDashboardData();
    } else {
      showLoginModal();
    }
  } else {
    showLoginModal();
  }
});

function showLoginModal() {
  document.getElementById('login-modal').style.display = 'flex';
}

function hideLoginModal() {
  document.getElementById('login-modal').style.display = 'none';
}

async function verifyAuthToken() {
  try {
    const res = await fetch('/api/auth/check', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

async function handleAdminLogin(e) {
  e.preventDefault();
  const password = document.getElementById('admin-password-input').value;
  const errorMsg = document.getElementById('login-error-msg');
  errorMsg.style.display = 'none';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    const data = await res.json();
    if (res.ok && data.token) {
      adminToken = data.token;
      sessionStorage.setItem('micaella_admin_token', adminToken);
      hideLoginModal();
      loadDashboardData();
    } else {
      errorMsg.textContent = data.error || 'Senha incorreta. Tente novamente.';
      errorMsg.style.display = 'block';
    }
  } catch (err) {
    errorMsg.textContent = 'Erro de conexão com o servidor.';
    errorMsg.style.display = 'block';
  }
}

async function handleAdminLogout() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
  } catch (e) {}

  sessionStorage.removeItem('micaella_admin_token');
  adminToken = '';
  location.reload();
}

async function loadDashboardData() {
  await Promise.all([
    loadGuests(),
    loadEventSettings()
  ]);
}

async function loadGuests() {
  try {
    const res = await fetch('/api/admin/guests', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (res.status === 401) {
      showLoginModal();
      return;
    }

    const data = await res.json();
    allGuests = data.guests || [];
    updateKpis(data.stats);
    renderGuestsTable(allGuests);
  } catch (e) {
    console.error('Erro ao carregar convidados:', e);
  }
}

function updateKpis(stats) {
  if (!stats) return;
  document.getElementById('kpi-total-responses').textContent = stats.totalResponses || 0;
  document.getElementById('kpi-attending').textContent = stats.attendingCount || 0;
  document.getElementById('kpi-adults').textContent = stats.totalAdults || 0;
  document.getElementById('kpi-children').textContent = stats.totalChildren || 0;
  document.getElementById('kpi-total-people').textContent = stats.totalPeople || 0;
}

function renderGuestsTable(guests) {
  const tbody = document.getElementById('guests-tbody');
  tbody.innerHTML = '';

  if (!guests.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; color: rgba(255,253,247,0.5); padding: 30px;">
          Nenhum convidado confirmado ainda.
        </td>
      </tr>
    `;
    return;
  }

  guests.forEach(g => {
    const tr = document.createElement('tr');
    const isAttending = g.attending !== false;
    const total = (Number(g.adults) || 0) + (Number(g.children) || 0);
    const dateFormatted = g.confirmedAt ? new Date(g.confirmedAt).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    }) : '-';

    tr.innerHTML = `
      <td><strong>${escapeHtml(g.name)}</strong></td>
      <td>
        <span class="status-tag ${isAttending ? 'status-confirmed' : 'status-declined'}">
          ${isAttending ? 'Confirmado' : 'Não Vai'}
        </span>
      </td>
      <td>${isAttending ? g.adults : '-'}</td>
      <td>${isAttending ? g.children : '-'}</td>
      <td><strong>${isAttending ? total : '-'}</strong></td>
      <td>${escapeHtml(g.companionNames || '-')}</td>
      <td style="max-width: 250px; font-style: italic; color: #ffd166;">${escapeHtml(g.message || '-')}</td>
      <td style="font-size: 0.8rem; color: rgba(255,253,247,0.6);">${dateFormatted}</td>
      <td>
        <button type="button" class="btn-del-guest" onclick="deleteGuest('${g.id}', '${escapeHtml(g.name)}')">
          🗑️ Excluir
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function filterGuestsTable() {
  const query = document.getElementById('guest-search-input').value.toLowerCase().trim();
  const statusFilter = document.getElementById('guest-status-filter').value;

  const filtered = allGuests.filter(g => {
    const matchesName = (g.name || '').toLowerCase().includes(query) || (g.companionNames || '').toLowerCase().includes(query);
    const isAttending = g.attending !== false;

    let matchesStatus = true;
    if (statusFilter === 'confirmed') matchesStatus = isAttending;
    if (statusFilter === 'declined') matchesStatus = !isAttending;

    return matchesName && matchesStatus;
  });

  renderGuestsTable(filtered);
}

async function deleteGuest(id, name) {
  if (!confirm(`Remover "${name}" da lista de presença?`)) return;

  try {
    const res = await fetch(`/api/admin/guests/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (res.ok) {
      await loadGuests();
    } else {
      alert('Erro ao excluir convidado.');
    }
  } catch (err) {
    alert('Erro de conexão ao excluir.');
  }
}

function exportToCsv() {
  window.location.href = `/api/admin/export-csv?token=${adminToken}`;
}

async function loadEventSettings() {
  try {
    const res = await fetch('/api/event');
    if (res.ok) {
      const ev = await res.json();
      document.getElementById('edit-child-name').value = ev.childName || '';
      document.getElementById('edit-age').value = ev.age || '';
      document.getElementById('edit-title').value = ev.title || '';
      document.getElementById('edit-opening-quote').value = ev.openingQuote || '';
      document.getElementById('edit-date').value = ev.date || '';
      document.getElementById('edit-rsvp-deadline').value = ev.rsvpDeadline || '';
      document.getElementById('edit-time').value = ev.time || '';
      document.getElementById('edit-end-time').value = ev.endTime || '';
      document.getElementById('edit-cake-time').value = ev.cakeTime || '';
      document.getElementById('edit-location-name').value = ev.locationName || '';
      document.getElementById('edit-address').value = ev.address || '';
      document.getElementById('edit-maps-url').value = ev.mapsUrl || '';
      document.getElementById('edit-waze-url').value = ev.wazeUrl || '';
      document.getElementById('edit-whatsapp-group').value = ev.whatsappGroupUrl || '';
      document.getElementById('edit-description').value = ev.description || '';
    }
  } catch (err) {
    console.error('Erro ao ler evento:', err);
  }
}

async function handleSaveEventSettings(e) {
  e.preventDefault();

  const payload = {
    childName: document.getElementById('edit-child-name').value.trim(),
    age: document.getElementById('edit-age').value.trim(),
    title: document.getElementById('edit-title').value.trim(),
    openingTitle: document.getElementById('edit-child-name').value.trim(),
    openingSubtitle: `FAZ ${document.getElementById('edit-age').value.trim().toUpperCase()}`,
    openingQuote: document.getElementById('edit-opening-quote').value.trim(),
    date: document.getElementById('edit-date').value,
    rsvpDeadline: document.getElementById('edit-rsvp-deadline').value.trim(),
    time: document.getElementById('edit-time').value,
    endTime: document.getElementById('edit-end-time').value,
    cakeTime: document.getElementById('edit-cake-time').value.trim(),
    locationName: document.getElementById('edit-location-name').value.trim(),
    address: document.getElementById('edit-address').value.trim(),
    mapsUrl: document.getElementById('edit-maps-url').value.trim(),
    wazeUrl: document.getElementById('edit-waze-url').value.trim(),
    whatsappGroupUrl: document.getElementById('edit-whatsapp-group').value.trim(),
    description: document.getElementById('edit-description').value.trim()
  };

  const newPwd = document.getElementById('edit-admin-password').value.trim();
  if (newPwd) payload.adminPassword = newPwd;

  try {
    const res = await fetch('/api/admin/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert('Configurações atualizadas com sucesso! ✨');
      document.getElementById('edit-admin-password').value = '';
    } else {
      alert('Erro ao salvar alterações.');
    }
  } catch (err) {
    alert('Erro de conexão ao salvar.');
  }
}

function switchAdminTab(tabId, btn) {
  document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

  document.getElementById(tabId).classList.add('active');
  btn.classList.add('active');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
