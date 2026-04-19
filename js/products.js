let expandedSeries = new Set();

function renderProdMatSelect() {
  const wrap = document.getElementById('prod-mat-select-wrap');
  if (!wrap) return;
  const opts = state.materials.map(m => ({ v: m.id, l: matLabel(m) }));
  if (!document.getElementById('csel-prod-mat')) {
    wrap.innerHTML = cselHtml('prod-mat', opts, opts[0]?.v || '', 'Выберите материал');
  } else {
    cselSetOptions('prod-mat', opts);
  }
}

function addMatToProduct() {
  const matId = cselValue('prod-mat');
  const qty = parseFloat(document.getElementById('prod-mat-qty').value);
  if (!matId || !qty || qty <= 0) return;
  const i = newProdMats.findIndex(x => x.matId === matId);
  if (i >= 0) newProdMats[i].qty = qty; else newProdMats.push({ matId, qty });
  document.getElementById('prod-mat-qty').value = '';
  renderNewProdMats();
}

function removeNewProdMat(matId) {
  newProdMats = newProdMats.filter(x => x.matId !== matId);
  renderNewProdMats();
}

function renderNewProdMats() {
  document.getElementById('prod-mats-list').innerHTML = newProdMats.map(x => {
    const m = state.materials.find(m => m.id === x.matId);
    return `<div class="added-mat">
      <span>${esc(matLabel(m))} — Расход: <b>${x.qty} м</b></span>
      <button class="btn btn-danger btn-sm" onclick="removeNewProdMat('${x.matId}')">✕</button>
    </div>`;
  }).join('');
}

function getSeriesList() {
  return [...new Set(state.products.map(p => (p.series || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru'));
}

function updateSeriesDatalist() {
  const dl = document.getElementById('series-datalist');
  if (!dl) return;
  dl.innerHTML = getSeriesList().map(s => `<option value="${esc(s)}">`).join('');
}

function addProduct() {
  const name = document.getElementById('prod-name').value.trim();
  const series = document.getElementById('prod-series').value.trim();
  const errEl = document.getElementById('prod-err');
  if (!name) { errEl.textContent = 'Укажите название'; return; }
  if (!newProdMats.length) { errEl.textContent = 'Добавьте хотя бы один материал'; return; }
  errEl.textContent = '';
  state.products.push({ id: genId(), name, series, materials: [...newProdMats] });
  newProdMats = [];
  document.getElementById('prod-name').value = '';
  document.getElementById('prod-series').value = '';
  renderNewProdMats();
  save();
}

let prodSearch = '';

function pluralIzd(n) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return 'изделие';
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return 'изделия';
  return 'изделий';
}

function toggleSeries(key) {
  if (expandedSeries.has(key)) expandedSeries.delete(key);
  else expandedSeries.add(key);
  renderProducts();
}

function renderProducts() {
  const el = document.getElementById('products-list');
  if (!state.products.length) {
    el.innerHTML = '<div class="empty">Нет изделий — создайте первое</div>';
    return;
  }

  updateSeriesDatalist();
  const q = prodSearch.toLowerCase();

  const groups = {};
  state.products.forEach(p => {
    const key = (p.series || '').trim();
    if (!groups[key]) groups[key] = [];
    const match = !q || p.name.toLowerCase().includes(q) || key.toLowerCase().includes(q);
    if (match) groups[key].push(p);
  });

  const keys = Object.keys(groups)
    .filter(k => groups[k].length > 0)
    .sort((a, b) => {
      if (!a) return 1;
      if (!b) return -1;
      return a.localeCompare(b, 'ru');
    });

  if (q) keys.forEach(k => expandedSeries.add(k));

  let innerHtml;
  if (!keys.length) {
    innerHtml = '<div class="tbl-empty">Ничего не найдено</div>';
  } else {
    innerHtml = keys.map(key => {
      const products = groups[key];
      const displayName = key || 'Без серии';
      const isExpanded = expandedSeries.has(key);

      const rowsHtml = products.map(p => {
        const visibleMats = p.materials.filter(x => state.materials.find(m => m.id === x.matId));
        const matsHtml = visibleMats.length
          ? visibleMats.map(x => {
              const m = state.materials.find(m => m.id === x.matId);
              return `<div class="prod-tbl-mat">${esc(matLabel(m))} <span class="prod-tbl-qty">${x.qty} м</span></div>`;
            }).join('')
          : '<span class="prod-tbl-no-mats">—</span>';
        return `<tr>
          <td class="mat-tbl-name">${esc(p.name)}</td>
          <td class="prod-tbl-mats">${matsHtml}</td>
          <td class="mat-tbl-actions">
            <button class="btn-icon" data-edit-prod="${p.id}" title="Редактировать">${svgEdit()}</button>
            <button class="btn-icon btn-icon-danger" data-del-prod="${p.id}" title="Удалить">${svgTrash()}</button>
          </td>
        </tr>`;
      }).join('');

      const bodyHtml = isExpanded ? `<div class="series-body">
        <table class="mat-table">
          <thead><tr><th>Название</th><th>Состав</th><th></th></tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>` : '';

      return `<div class="series-group">
        <div class="series-header" data-toggle-series="${esc(key)}">
          <span class="series-arrow">${isExpanded ? '▼' : '▶'}</span>
          <span class="series-name">${esc(displayName)}</span>
          <span class="series-count">${products.length} ${pluralIzd(products.length)}</span>
        </div>
        ${bodyHtml}
      </div>`;
    }).join('');
  }

  el.innerHTML = `
    <div class="series-list-wrap">
      <div class="tbl-search-bar">
        <div class="tbl-total-inline">Всего изделий: ${state.products.length}</div>
        <input class="tbl-search-input" type="text" placeholder="Поиск..." value="${esc(prodSearch)}" oninput="setProdSearch(this.value)">
      </div>
      ${innerHtml}
    </div>
  `;
}

function setProdSearch(q) {
  prodSearch = q;
  renderProducts();
  const inp = document.querySelector('#products-list .tbl-search-input');
  if (inp) { inp.focus(); inp.setSelectionRange(q.length, q.length); }
}

function askDeleteProduct(id) {
  const p = state.products.find(p => p.id === id);
  showModal('Удалить изделие', `Удалить <b>${esc(p.name)}</b>? Это действие нельзя отменить.`, () => {
    state.products = state.products.filter(p => p.id !== id);
    save();
  }, 'Удалить', true);
}

function startEditProduct(id) {
  const p = state.products.find(p => p.id === id);
  if (!p) return;
  editProdMats = p.materials.map(x => ({ ...x }));
  const matOpts = state.materials.map(m => ({ v: m.id, l: matLabel(m) }));
  const seriesOpts = getSeriesList().map(s => `<option value="${esc(s)}">`).join('');

  const labelStyle = 'display:block;font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px';
  const bodyHtml = `
    <label style="${labelStyle}">Название</label>
    <input id="edit-prod-name" value="${esc(p.name)}" placeholder="Название изделия">
    <label style="${labelStyle};margin-top:12px">Серия / линейка</label>
    <input id="edit-prod-series" value="${esc(p.series || '')}" placeholder="Введите серию" list="edit-series-datalist" autocomplete="off">
    <datalist id="edit-series-datalist">${seriesOpts}</datalist>
    <div style="margin-top:14px;margin-bottom:6px;font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.06em">Состав</div>
    <div id="edit-prod-mats">${editProdMats.map(x => {
      const m = state.materials.find(m => m.id === x.matId);
      return `<div class="added-mat">
        <span>${esc(matLabel(m))} — Расход: <b>${x.qty} м</b></span>
        <button class="btn btn-danger btn-sm" onclick="removeEditProdMat('${x.matId}')">✕</button>
      </div>`;
    }).join('')}</div>
    <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
      <div style="flex:1;min-width:0">${cselHtml('edit-mat-sel', matOpts, matOpts[0]?.v || '', 'Выберите материал')}</div>
      <input type="number" id="edit-mat-qty" class="edit-ctrl" placeholder="м" min="0" step="0.01" style="width:80px;margin-top:0">
      <button class="btn btn-secondary" onclick="addEditProdMat()" style="flex-shrink:0">+</button>
    </div>
  `;

  showModal('Редактировать изделие', bodyHtml, () => {
    const newName = document.getElementById('edit-prod-name')?.value.trim();
    if (!newName) return;
    const idx = state.products.findIndex(p => p.id === id);
    if (idx >= 0) {
      state.products[idx].name = newName;
      state.products[idx].series = document.getElementById('edit-prod-series')?.value.trim() || '';
      state.products[idx].materials = [...editProdMats];
    }
    save();
  }, 'Сохранить');
}

function refreshEditProdMats() {
  const el = document.getElementById('edit-prod-mats');
  if (!el) return;
  el.innerHTML = editProdMats.map(x => {
    const m = state.materials.find(m => m.id === x.matId);
    return `<div class="added-mat">
      <span>${esc(matLabel(m))} — Расход: <b>${x.qty} м</b></span>
      <button class="btn btn-danger btn-sm" onclick="removeEditProdMat('${x.matId}')">✕</button>
    </div>`;
  }).join('');
}

function addEditProdMat() {
  const matId = cselValue('edit-mat-sel');
  const qty = parseFloat(document.getElementById('edit-mat-qty')?.value);
  if (!matId || !qty || qty <= 0) return;
  const i = editProdMats.findIndex(x => x.matId === matId);
  if (i >= 0) editProdMats[i].qty = qty; else editProdMats.push({ matId, qty });
  document.getElementById('edit-mat-qty').value = '';
  refreshEditProdMats();
}

function removeEditProdMat(matId) {
  editProdMats = editProdMats.filter(x => x.matId !== matId);
  refreshEditProdMats();
}
