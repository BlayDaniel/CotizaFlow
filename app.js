const STORAGE_KEY = 'cotizaflow_fase1_state_v1';

const defaultState = {
  session: null,
  company: {
    name: 'Mi Empresa SRL',
    taxId: '',
    email: '',
    phone: '',
    address: '',
    currency: 'USD',
    taxRate: 0,
    logoDataUrl: ''
  },
  clients: [],
  quotes: []
};

let state = loadState();

const app = document.getElementById('app');

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...structuredClone(defaultState), ...JSON.parse(raw) } : structuredClone(defaultState);
  } catch (error) {
    console.error(error);
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function money(value) {
  const currency = state.company.currency || 'USD';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(value || 0));
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(days) {
  const date = new Date();
  date.setDate(date.getDate() + Number(days || 0));
  return date.toISOString().slice(0, 10);
}

function uid(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function setRoute(route) {
  window.location.hash = route;
}

function getRoute() {
  return window.location.hash.replace('#', '') || (state.session ? 'dashboard' : 'home');
}

function toast(message) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2800);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function statusBadge(status) {
  const map = {
    draft: 'Borrador',
    sent: 'Enviada',
    accepted: 'Aceptada',
    rejected: 'Rechazada',
    expired: 'Vencida'
  };
  return `<span class="badge ${status}">${map[status] || status}</span>`;
}

function render() {
  const route = getRoute();
  if (!state.session) {
    renderPublic(route);
    return;
  }
  renderApp(route);
}

function renderPublic(route) {
  app.innerHTML = `
    <main class="landing app-page">
      <div class="landing-inner">
        <header class="topbar">
          <div class="brand"><span class="brand-mark">C</span> CotizaFlow</div>
          <div class="nav-actions">
            <button class="btn ghost" data-action="show-login">Entrar</button>
            <button class="btn primary" data-action="start-demo">Probar demo</button>
          </div>
        </header>

        <section class="hero">
          <div>
            <span class="eyebrow">MVP fase 1 · GitHub Pages</span>
            <h1>Cotizaciones profesionales en 2 minutos.</h1>
            <p>Controla clientes, genera PDF y evita que las cotizaciones se queden olvidadas en WhatsApp o Excel.</p>
            <div class="hero-actions">
              <button class="btn primary" data-action="start-demo">Entrar al demo</button>
              <button class="btn secondary" data-action="show-login">Usar correo</button>
            </div>
            <div class="bullets">
              <span>Sin backend todavía: funciona con LocalStorage.</span>
              <span>Preparado para conectar Supabase, pagos y referidos en las próximas fases.</span>
              <span>PDF descargable desde el navegador.</span>
            </div>
          </div>

          <div class="preview-card">
            <div class="quote-preview">
              <div class="quote-preview-header">
                <div>
                  <h3>Cotización</h3>
                  <div class="num">CF-2026-0001</div>
                </div>
                ${statusBadge('sent')}
              </div>
              <div class="quote-line"><span>Instalación de cámaras</span><strong>US$350.00</strong></div>
              <div class="quote-line"><span>Materiales</span><strong>US$180.00</strong></div>
              <div class="quote-line"><span>Configuración remota</span><strong>US$75.00</strong></div>
              <div class="quote-total"><span>Total</span><span>US$605.00</span></div>
            </div>
          </div>
        </section>

        <section id="login" class="login-box ${route === 'login' ? '' : 'hidden'}">
          <h2>Acceso demo</h2>
          <p>Esta fase usa acceso local. La autenticación real entra cuando conectemos Supabase.</p>
          <form data-form="login" class="form-grid">
            <div class="field">
              <label>Correo</label>
              <input name="email" type="email" required placeholder="tuempresa@email.com" />
            </div>
            <div class="field">
              <label>Nombre</label>
              <input name="name" required placeholder="Tu nombre" />
            </div>
            <button class="btn primary full" type="submit">Entrar</button>
          </form>
        </section>
      </div>
    </main>
  `;
}

function navLink(route, label) {
  return `<button class="nav-link ${getRoute() === route ? 'active' : ''}" data-route="${route}">${label}</button>`;
}

function renderApp(route) {
  app.innerHTML = `
    <div class="layout app-page">
      <aside class="sidebar">
        <div class="brand"><span class="brand-mark">C</span> CotizaFlow</div>
        <nav>
          ${navLink('dashboard', 'Dashboard')}
          ${navLink('quotes', 'Cotizaciones')}
          ${navLink('quote-new', 'Nueva cotización')}
          ${navLink('clients', 'Clientes')}
          ${navLink('settings', 'Empresa')}
        </nav>
        <div class="sidebar-footer">
          <strong>${escapeHtml(state.company.name || 'Mi empresa')}</strong><br />
          Plan MVP local<br />
          <button class="btn secondary small" data-action="logout" style="margin-top:12px;">Salir</button>
        </div>
      </aside>
      <main class="main">${renderRoute(route)}</main>
    </div>
  `;
}

function renderRoute(route) {
  if (route.startsWith('quote-edit/')) return renderQuoteForm(route.split('/')[1]);
  if (route.startsWith('quote-view/')) return renderQuoteView(route.split('/')[1]);

  switch (route) {
    case 'quotes': return renderQuotes();
    case 'quote-new': return renderQuoteForm();
    case 'clients': return renderClients();
    case 'settings': return renderSettings();
    case 'dashboard':
    default: return renderDashboard();
  }
}

function quoteTotals(quote) {
  const subtotal = (quote.items || []).reduce((sum, item) => sum + Number(item.total || 0), 0);
  const tax = subtotal * (Number(quote.taxRate || 0) / 100);
  return { subtotal, tax, total: subtotal + tax };
}

function dashboardMetrics() {
  const quotes = state.quotes;
  const pending = quotes.filter(q => ['draft', 'sent'].includes(q.status));
  const accepted = quotes.filter(q => q.status === 'accepted');
  const totalPending = pending.reduce((sum, q) => sum + quoteTotals(q).total, 0);
  const totalAccepted = accepted.reduce((sum, q) => sum + quoteTotals(q).total, 0);
  return { quotes, pending, accepted, totalPending, totalAccepted };
}

function renderDashboard() {
  const m = dashboardMetrics();
  const latest = [...state.quotes].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  return `
    <div class="page-header">
      <div>
        <h1>Dashboard</h1>
        <p>Resumen local de clientes y cotizaciones.</p>
      </div>
      <div class="header-actions">
        <button class="btn primary" data-route="quote-new">Nueva cotización</button>
        <button class="btn secondary" data-route="clients">Crear cliente</button>
      </div>
    </div>

    <section class="grid cols-4">
      <div class="card metric"><span>Total cotizaciones</span><strong>${m.quotes.length}</strong></div>
      <div class="card metric"><span>Pendientes</span><strong>${m.pending.length}</strong></div>
      <div class="card metric"><span>Aceptadas</span><strong>${m.accepted.length}</strong></div>
      <div class="card metric"><span>Monto pendiente</span><strong>${money(m.totalPending)}</strong></div>
    </section>

    <section class="grid cols-2" style="margin-top:18px;">
      <div class="card">
        <h2>Últimas cotizaciones</h2>
        ${latest.length ? renderQuotesTable(latest, true) : `<div class="empty">Todavía no hay cotizaciones.</div>`}
      </div>
      <div class="card">
        <h2>Próximo de fase 2</h2>
        <p class="help">Conectar Supabase Auth, base de datos PostgreSQL, envío real por email y enlaces públicos.</p>
        <div class="bullets">
          <span>Registro real por usuario.</span>
          <span>Datos en la nube.</span>
          <span>Recordatorios automáticos.</span>
          <span>Planes de pago y referidos.</span>
        </div>
      </div>
    </section>
  `;
}

function renderQuotes() {
  return `
    <div class="page-header">
      <div>
        <h1>Cotizaciones</h1>
        <p>Listado de propuestas creadas en esta versión local.</p>
      </div>
      <div class="header-actions">
        <button class="btn primary" data-route="quote-new">Nueva cotización</button>
      </div>
    </div>
    <div class="card">
      ${state.quotes.length ? renderQuotesTable(state.quotes) : `<div class="empty">No hay cotizaciones. Crea la primera para probar el flujo.</div>`}
    </div>
  `;
}

function renderQuotesTable(quotes, compact = false) {
  const rows = quotes.map(q => {
    const client = state.clients.find(c => c.id === q.clientId);
    const totals = quoteTotals(q);
    return `
      <tr>
        <td><strong>${escapeHtml(q.number)}</strong><br><span class="help">${escapeHtml(q.createdAt)}</span></td>
        <td>${escapeHtml(client?.name || 'Sin cliente')}</td>
        <td>${statusBadge(q.status)}</td>
        <td><strong>${money(totals.total)}</strong></td>
        <td class="actions">
          <button class="btn small ghost" data-route="quote-view/${q.id}">Ver</button>
          ${compact ? '' : `<button class="btn small secondary" data-route="quote-edit/${q.id}">Editar</button>`}
          <button class="btn small primary" data-action="download-pdf" data-id="${q.id}">PDF</button>
        </td>
      </tr>`;
  }).join('');
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>No.</th><th>Cliente</th><th>Estado</th><th>Total</th><th>Acciones</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function renderClients() {
  const rows = state.clients.map(c => `
    <tr>
      <td><strong>${escapeHtml(c.name)}</strong><br><span class="help">${escapeHtml(c.company || '')}</span></td>
      <td>${escapeHtml(c.email || '')}</td>
      <td>${escapeHtml(c.phone || '')}</td>
      <td class="actions">
        <button class="btn small secondary" data-action="edit-client" data-id="${c.id}">Editar</button>
        <button class="btn small danger" data-action="delete-client" data-id="${c.id}">Eliminar</button>
      </td>
    </tr>`).join('');

  return `
    <div class="page-header">
      <div>
        <h1>Clientes</h1>
        <p>Base mínima de clientes para cotizar rápido.</p>
      </div>
    </div>
    <section class="grid cols-2">
      <div class="card">
        <h2 id="client-form-title">Nuevo cliente</h2>
        <form data-form="client" class="form-grid">
          <input type="hidden" name="id" />
          <div class="field"><label>Nombre</label><input name="name" required placeholder="Juan Pérez" /></div>
          <div class="field"><label>Empresa</label><input name="company" placeholder="Empresa del cliente" /></div>
          <div class="field"><label>Correo</label><input name="email" type="email" placeholder="cliente@email.com" /></div>
          <div class="field"><label>Teléfono</label><input name="phone" placeholder="809-000-0000" /></div>
          <div class="field"><label>Dirección</label><textarea name="address" placeholder="Dirección del cliente"></textarea></div>
          <button class="btn primary" type="submit">Guardar cliente</button>
        </form>
      </div>
      <div class="card">
        <h2>Listado</h2>
        ${state.clients.length ? `<div class="table-wrap"><table><thead><tr><th>Cliente</th><th>Correo</th><th>Teléfono</th><th>Acciones</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<div class="empty">No hay clientes guardados.</div>`}
      </div>
    </section>
  `;
}

function renderSettings() {
  return `
    <div class="page-header">
      <div>
        <h1>Empresa</h1>
        <p>Estos datos se usarán en las cotizaciones y PDFs.</p>
      </div>
    </div>
    <div class="card">
      <form data-form="settings" class="form-grid two">
        <div class="field"><label>Nombre de empresa</label><input name="name" required value="${escapeHtml(state.company.name)}" /></div>
        <div class="field"><label>RNC / Documento</label><input name="taxId" value="${escapeHtml(state.company.taxId)}" /></div>
        <div class="field"><label>Correo</label><input name="email" type="email" value="${escapeHtml(state.company.email)}" /></div>
        <div class="field"><label>Teléfono</label><input name="phone" value="${escapeHtml(state.company.phone)}" /></div>
        <div class="field"><label>Moneda</label><select name="currency">
          ${['USD','DOP','EUR'].map(c => `<option ${state.company.currency === c ? 'selected' : ''}>${c}</option>`).join('')}
        </select></div>
        <div class="field"><label>Impuesto por defecto %</label><input name="taxRate" type="number" step="0.01" value="${escapeHtml(state.company.taxRate)}" /></div>
        <div class="field" style="grid-column:1/-1;"><label>Dirección</label><textarea name="address">${escapeHtml(state.company.address)}</textarea></div>
        <div class="field" style="grid-column:1/-1;"><label>Logo</label><input name="logo" type="file" accept="image/*" /><span class="help">Opcional. Se guarda localmente en este navegador.</span></div>
        <button class="btn primary" type="submit">Guardar empresa</button>
      </form>
    </div>
  `;
}

function renderQuoteForm(id = null) {
  const quote = id ? state.quotes.find(q => q.id === id) : null;
  const selectedClientId = quote?.clientId || '';
  const items = quote?.items?.length ? quote.items : [{ description: '', quantity: 1, unitPrice: 0, total: 0 }];
  const clientsOptions = state.clients.map(c => `<option value="${c.id}" ${selectedClientId === c.id ? 'selected' : ''}>${escapeHtml(c.name)}${c.company ? ' - ' + escapeHtml(c.company) : ''}</option>`).join('');

  return `
    <div class="page-header">
      <div>
        <h1>${quote ? 'Editar cotización' : 'Nueva cotización'}</h1>
        <p>${quote ? escapeHtml(quote.number) : 'Crea una propuesta comercial en formato PDF.'}</p>
      </div>
    </div>

    <form data-form="quote" class="grid">
      <input type="hidden" name="id" value="${escapeHtml(quote?.id || '')}" />
      <div class="card form-grid three">
        <div class="field">
          <label>Cliente</label>
          <select name="clientId" required>
            <option value="">Selecciona un cliente</option>
            ${clientsOptions}
          </select>
          <span class="help">Crea el cliente primero si no aparece.</span>
        </div>
        <div class="field">
          <label>Válida hasta</label>
          <input name="validUntil" type="date" required value="${escapeHtml(quote?.validUntil || addDaysISO(15))}" />
        </div>
        <div class="field">
          <label>Impuesto %</label>
          <input name="taxRate" type="number" step="0.01" value="${escapeHtml(quote?.taxRate ?? state.company.taxRate ?? 0)}" />
        </div>
        <div class="field" style="grid-column:1/-1;">
          <label>Notas</label>
          <textarea name="notes" placeholder="Condiciones, tiempo de entrega, garantía, etc.">${escapeHtml(quote?.notes || '')}</textarea>
        </div>
      </div>

      <div class="card">
        <div class="page-header" style="margin-bottom:12px;">
          <h2>Conceptos</h2>
          <button type="button" class="btn secondary small" data-action="add-item">Agregar línea</button>
        </div>
        <div id="items-list">
          ${items.map((item, index) => itemRow(item, index)).join('')}
        </div>
        <div class="summary-box">
          <div class="summary-line"><span>Subtotal</span><strong id="subtotal-label">${money(0)}</strong></div>
          <div class="summary-line"><span>Impuesto</span><strong id="tax-label">${money(0)}</strong></div>
          <div class="summary-line total"><span>Total</span><span id="total-label">${money(0)}</span></div>
        </div>
      </div>

      <div class="header-actions">
        <button class="btn primary" type="submit">Guardar cotización</button>
        <button class="btn secondary" type="button" data-route="quotes">Cancelar</button>
      </div>
    </form>
  `;
}

function itemRow(item, index) {
  return `
    <div class="item-row" data-item-row>
      <div class="field"><label>Descripción</label><input name="description" required value="${escapeHtml(item.description)}" placeholder="Servicio o producto" /></div>
      <div class="field"><label>Cantidad</label><input name="quantity" type="number" min="0" step="0.01" value="${escapeHtml(item.quantity)}" /></div>
      <div class="field"><label>Precio</label><input name="unitPrice" type="number" min="0" step="0.01" value="${escapeHtml(item.unitPrice)}" /></div>
      <div class="field"><label>Total</label><input name="lineTotal" type="text" readonly value="${money(Number(item.quantity || 0) * Number(item.unitPrice || 0))}" /></div>
      <button class="btn danger small" type="button" data-action="remove-item" title="Eliminar línea">×</button>
    </div>
  `;
}

function renderQuoteView(id) {
  const quote = state.quotes.find(q => q.id === id);
  if (!quote) return `<div class="empty">Cotización no encontrada.</div>`;
  const client = state.clients.find(c => c.id === quote.clientId);
  const totals = quoteTotals(quote);
  const rows = quote.items.map(item => `
    <tr>
      <td>${escapeHtml(item.description)}</td>
      <td>${escapeHtml(item.quantity)}</td>
      <td>${money(item.unitPrice)}</td>
      <td><strong>${money(item.total)}</strong></td>
    </tr>`).join('');

  return `
    <div class="page-header">
      <div>
        <h1>${escapeHtml(quote.number)}</h1>
        <p>${statusBadge(quote.status)} · Cliente: ${escapeHtml(client?.name || 'Sin cliente')}</p>
      </div>
      <div class="header-actions">
        <button class="btn primary" data-action="download-pdf" data-id="${quote.id}">Descargar PDF</button>
        <button class="btn secondary" data-action="copy-whatsapp" data-id="${quote.id}">Mensaje WhatsApp</button>
        <button class="btn ghost" data-route="quote-edit/${quote.id}">Editar</button>
      </div>
    </div>

    <section class="grid cols-2">
      <div class="card">
        <h2>Cliente</h2>
        <p><strong>${escapeHtml(client?.name || '')}</strong></p>
        <p class="help">${escapeHtml(client?.company || '')}<br>${escapeHtml(client?.email || '')}<br>${escapeHtml(client?.phone || '')}</p>
      </div>
      <div class="card">
        <h2>Estado</h2>
        <div class="actions">
          <button class="btn small secondary" data-action="set-status" data-id="${quote.id}" data-status="sent">Enviada</button>
          <button class="btn small primary" data-action="set-status" data-id="${quote.id}" data-status="accepted">Aceptada</button>
          <button class="btn small danger" data-action="set-status" data-id="${quote.id}" data-status="rejected">Rechazada</button>
        </div>
        <p class="help">Válida hasta: ${escapeHtml(quote.validUntil)}</p>
      </div>
    </section>

    <div class="card" style="margin-top:18px;">
      <h2>Detalle</h2>
      <div class="table-wrap">
        <table><thead><tr><th>Descripción</th><th>Cantidad</th><th>Precio</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table>
      </div>
      <div class="summary-box" style="margin-top:18px;">
        <div class="summary-line"><span>Subtotal</span><strong>${money(totals.subtotal)}</strong></div>
        <div class="summary-line"><span>Impuesto</span><strong>${money(totals.tax)}</strong></div>
        <div class="summary-line total"><span>Total</span><span>${money(totals.total)}</span></div>
      </div>
    </div>
  `;
}

function calculateQuoteFormTotals() {
  const form = document.querySelector('[data-form="quote"]');
  if (!form) return;
  let subtotal = 0;
  form.querySelectorAll('[data-item-row]').forEach(row => {
    const quantity = Number(row.querySelector('[name="quantity"]').value || 0);
    const unitPrice = Number(row.querySelector('[name="unitPrice"]').value || 0);
    const total = quantity * unitPrice;
    subtotal += total;
    row.querySelector('[name="lineTotal"]').value = money(total);
  });
  const taxRate = Number(form.querySelector('[name="taxRate"]').value || 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;
  const subtotalLabel = document.getElementById('subtotal-label');
  if (subtotalLabel) subtotalLabel.textContent = money(subtotal);
  const taxLabel = document.getElementById('tax-label');
  if (taxLabel) taxLabel.textContent = money(tax);
  const totalLabel = document.getElementById('total-label');
  if (totalLabel) totalLabel.textContent = money(total);
}

function nextQuoteNumber() {
  const year = new Date().getFullYear();
  const next = state.quotes.length + 1;
  return `CF-${year}-${String(next).padStart(4, '0')}`;
}

function handleLogin(form) {
  const fd = new FormData(form);
  state.session = { email: fd.get('email'), name: fd.get('name'), startedAt: new Date().toISOString() };
  saveState();
  setRoute('dashboard');
  render();
}

function startDemo() {
  state.session = { email: 'demo@cotizaflow.app', name: 'Demo', startedAt: new Date().toISOString() };
  if (!state.clients.length) {
    state.clients.push({ id: uid('client'), name: 'Cliente Demo', company: 'Empresa Demo', email: 'cliente@demo.com', phone: '809-000-0000', address: 'Santo Domingo', createdAt: todayISO() });
  }
  saveState();
  setRoute('dashboard');
  render();
}

function handleClient(form) {
  const fd = new FormData(form);
  const id = fd.get('id') || uid('client');
  const client = {
    id,
    name: fd.get('name'),
    company: fd.get('company'),
    email: fd.get('email'),
    phone: fd.get('phone'),
    address: fd.get('address'),
    createdAt: todayISO()
  };
  const index = state.clients.findIndex(c => c.id === id);
  if (index >= 0) state.clients[index] = { ...state.clients[index], ...client };
  else state.clients.push(client);
  saveState();
  toast('Cliente guardado.');
  render();
}

function editClient(id) {
  const client = state.clients.find(c => c.id === id);
  if (!client) return;
  const form = document.querySelector('[data-form="client"]');
  if (!form) return;
  form.id.value = client.id;
  form.name.value = client.name || '';
  form.company.value = client.company || '';
  form.email.value = client.email || '';
  form.phone.value = client.phone || '';
  form.address.value = client.address || '';
  document.getElementById('client-form-title').textContent = 'Editar cliente';
}

function deleteClient(id) {
  const used = state.quotes.some(q => q.clientId === id);
  if (used) {
    toast('No puedes eliminar un cliente con cotizaciones creadas.');
    return;
  }
  state.clients = state.clients.filter(c => c.id !== id);
  saveState();
  render();
}

async function handleSettings(form) {
  const fd = new FormData(form);
  state.company = {
    ...state.company,
    name: fd.get('name'),
    taxId: fd.get('taxId'),
    email: fd.get('email'),
    phone: fd.get('phone'),
    address: fd.get('address'),
    currency: fd.get('currency'),
    taxRate: Number(fd.get('taxRate') || 0)
  };

  const file = form.logo.files[0];
  if (file) {
    state.company.logoDataUrl = await fileToDataUrl(file);
  }
  saveState();
  toast('Empresa guardada.');
  render();
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function handleQuote(form) {
  const fd = new FormData(form);
  const id = fd.get('id') || uid('quote');
  const items = [...form.querySelectorAll('[data-item-row]')]
    .map(row => {
      const quantity = Number(row.querySelector('[name="quantity"]').value || 0);
      const unitPrice = Number(row.querySelector('[name="unitPrice"]').value || 0);
      return {
        description: row.querySelector('[name="description"]').value,
        quantity,
        unitPrice,
        total: quantity * unitPrice
      };
    })
    .filter(item => item.description.trim());

  if (!items.length) {
    toast('Agrega al menos un concepto.');
    return;
  }

  const existing = state.quotes.find(q => q.id === id);
  const quote = {
    id,
    number: existing?.number || nextQuoteNumber(),
    clientId: fd.get('clientId'),
    validUntil: fd.get('validUntil'),
    taxRate: Number(fd.get('taxRate') || 0),
    notes: fd.get('notes'),
    items,
    status: existing?.status || 'draft',
    createdAt: existing?.createdAt || todayISO(),
    updatedAt: new Date().toISOString()
  };

  const index = state.quotes.findIndex(q => q.id === id);
  if (index >= 0) state.quotes[index] = quote;
  else state.quotes.push(quote);

  saveState();
  toast('Cotización guardada.');
  setRoute(`quote-view/${id}`);
  render();
}

function addItemRow() {
  const list = document.getElementById('items-list');
  if (!list) return;
  list.insertAdjacentHTML('beforeend', itemRow({ description: '', quantity: 1, unitPrice: 0 }, Date.now()));
  calculateQuoteFormTotals();
}

function removeItemRow(button) {
  const rows = document.querySelectorAll('[data-item-row]');
  if (rows.length <= 1) {
    toast('Debe quedar al menos una línea.');
    return;
  }
  button.closest('[data-item-row]').remove();
  calculateQuoteFormTotals();
}

function setQuoteStatus(id, status) {
  const quote = state.quotes.find(q => q.id === id);
  if (!quote) return;
  quote.status = status;
  quote.updatedAt = new Date().toISOString();
  if (status === 'sent') quote.sentAt = new Date().toISOString();
  if (status === 'accepted') quote.acceptedAt = new Date().toISOString();
  saveState();
  render();
}

function copyWhatsApp(id) {
  const quote = state.quotes.find(q => q.id === id);
  const client = state.clients.find(c => c.id === quote?.clientId);
  if (!quote) return;
  const total = money(quoteTotals(quote).total);
  const msg = `Hola ${client?.name || ''}, te comparto la cotización ${quote.number} por un total de ${total}. Quedo atento a tu confirmación.`;
  navigator.clipboard.writeText(msg).then(() => toast('Mensaje copiado para WhatsApp.'));
}

function generatePDF(id) {
  const quote = state.quotes.find(q => q.id === id);
  if (!quote) return;
  const client = state.clients.find(c => c.id === quote.clientId);
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 46;
  let y = 52;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(state.company.name || 'Mi Empresa', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  y += 16;
  const companyLines = [state.company.taxId && `RNC/Doc: ${state.company.taxId}`, state.company.email, state.company.phone, state.company.address].filter(Boolean);
  companyLines.forEach(line => { doc.text(String(line), margin, y); y += 12; });

  if (state.company.logoDataUrl) {
    try { doc.addImage(state.company.logoDataUrl, 'PNG', pageWidth - 146, 45, 100, 50, undefined, 'FAST'); } catch (e) { console.warn(e); }
  }

  y = 140;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.text('Cotización', margin, y);
  doc.setFontSize(11);
  doc.text(quote.number, pageWidth - margin, y, { align: 'right' });
  y += 24;

  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 28;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Cliente', margin, y);
  doc.text('Detalles', pageWidth - 230, y);
  y += 15;

  doc.setFont('helvetica', 'normal');
  const leftInfo = [client?.name, client?.company, client?.email, client?.phone].filter(Boolean);
  leftInfo.forEach(line => { doc.text(String(line), margin, y); y += 13; });

  let detailsY = y - (leftInfo.length * 13);
  doc.text(`Fecha: ${quote.createdAt}`, pageWidth - 230, detailsY); detailsY += 13;
  doc.text(`Válida hasta: ${quote.validUntil}`, pageWidth - 230, detailsY); detailsY += 13;
  doc.text(`Estado: ${quote.status}`, pageWidth - 230, detailsY);

  y = Math.max(y + 24, 245);
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, pageWidth - margin * 2, 28, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Descripción', margin + 10, y + 18);
  doc.text('Cant.', pageWidth - 260, y + 18);
  doc.text('Precio', pageWidth - 190, y + 18);
  doc.text('Total', pageWidth - margin - 10, y + 18, { align: 'right' });
  y += 32;

  doc.setFont('helvetica', 'normal');
  quote.items.forEach(item => {
    const descriptionLines = doc.splitTextToSize(item.description, pageWidth - margin * 2 - 250);
    const rowHeight = Math.max(24, descriptionLines.length * 12 + 10);
    if (y + rowHeight > 700) { doc.addPage(); y = 55; }
    doc.text(descriptionLines, margin + 10, y + 14);
    doc.text(String(item.quantity), pageWidth - 260, y + 14);
    doc.text(money(item.unitPrice), pageWidth - 190, y + 14);
    doc.text(money(item.total), pageWidth - margin - 10, y + 14, { align: 'right' });
    y += rowHeight;
    doc.setDrawColor(235, 235, 235);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;
  });

  const totals = quoteTotals(quote);
  y += 8;
  const rightX = pageWidth - margin;
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', rightX - 150, y); doc.text(money(totals.subtotal), rightX, y, { align: 'right' }); y += 18;
  doc.text('Impuesto:', rightX - 150, y); doc.text(money(totals.tax), rightX, y, { align: 'right' }); y += 22;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Total:', rightX - 150, y); doc.text(money(totals.total), rightX, y, { align: 'right' }); y += 36;

  if (quote.notes) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.text('Notas', margin, y); y += 14;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.text(doc.splitTextToSize(quote.notes, pageWidth - margin * 2), margin, y);
  }

  doc.save(`${quote.number}.pdf`);
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cotizaflow-backup.json';
  a.click();
  URL.revokeObjectURL(url);
}

document.addEventListener('click', event => {
  const routeButton = event.target.closest('[data-route]');
  if (routeButton) {
    setRoute(routeButton.dataset.route);
    return;
  }

  const actionButton = event.target.closest('[data-action]');
  if (!actionButton) return;
  const action = actionButton.dataset.action;
  const id = actionButton.dataset.id;

  if (action === 'show-login') setRoute('login');
  if (action === 'start-demo') startDemo();
  if (action === 'logout') { state.session = null; saveState(); setRoute('home'); render(); }
  if (action === 'add-item') addItemRow();
  if (action === 'remove-item') removeItemRow(actionButton);
  if (action === 'edit-client') editClient(id);
  if (action === 'delete-client') deleteClient(id);
  if (action === 'download-pdf') generatePDF(id);
  if (action === 'copy-whatsapp') copyWhatsApp(id);
  if (action === 'set-status') setQuoteStatus(id, actionButton.dataset.status);
  if (action === 'export-data') exportData();
});

document.addEventListener('submit', event => {
  event.preventDefault();
  const form = event.target;
  const type = form.dataset.form;
  if (type === 'login') handleLogin(form);
  if (type === 'client') handleClient(form);
  if (type === 'settings') handleSettings(form);
  if (type === 'quote') handleQuote(form);
});

document.addEventListener('input', event => {
  if (event.target.closest('[data-form="quote"]')) calculateQuoteFormTotals();
});

window.addEventListener('hashchange', render);

render();
setTimeout(calculateQuoteFormTotals, 0);
