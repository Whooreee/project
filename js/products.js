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

function addProduct() {
  const name = document.getElementById('prod-name').value.trim();
  const errEl = document.getElementById('prod-err');
  if (!name) { errEl.textContent = 'Укажите название'; return; }
  if (!newProdMats.length) { errEl.textContent = 'Добавьте хотя бы один материал'; return; }
  errEl.textContent = '';
  state.products.push({ id: genId(), name, materials: [...newProdMats] });
  newProdMats = [];
  document.getElementById('prod-name').value = '';
  renderNewProdMats();
  save();
}

let prodPage = 0;
let prodPerPage = 10;
let prodSearch = '';

function renderProducts() {
  const el = document.getElementById('products-list');
  if (!state.products.length) { el.innerHTML = '<div class="empty">Нет изделий — создайте первое</div>'; return; }

  const q = prodSearch.toLowerCase();
  const filtered = q ? state.products.filter(p => p.name.toLowerCase().includes(q)) : state.products;
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / prodPerPage));
  if (prodPage >= totalPages) prodPage = Math.max(0, totalPages - 1);
  const start = prodPage * prodPerPage;
  const page = filtered.slice(start, start + prodPerPage);

  const perPageOptions = [5, 10, 25, 50].map(n =>
    `<option value="${n}"${n === prodPerPage ? ' selected' : ''}>${n}</option>`
  ).join('');

  const rows = page.map(p => {
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

  const from = total ? start + 1 : 0;
  const to = Math.min(start + prodPerPage, total);
  const paginationBtns = totalPages > 1 ? `
    <button class="btn-page" onclick="setProdPage(0)" ${prodPage===0?'disabled':''}>«</button>
    <button class="btn-page" onclick="setProdPage(${prodPage-1})" ${prodPage===0?'disabled':''}>‹</button>
    <span class="mat-page-info">${prodPage+1} / ${totalPages}</span>
    <button class="btn-page" onclick="setProdPage(${prodPage+1})" ${prodPage>=totalPages-1?'disabled':''}>›</button>
    <button class="btn-page" onclick="setProdPage(${totalPages-1})" ${prodPage>=totalPages-1?'disabled':''}>»</button>
  ` : '';

  el.innerHTML = `
    <div class="mat-tbl-wrap">
      <div class="tbl-search-bar">
        <input class="tbl-search-input" type="text" placeholder="Поиск..." value="${esc(prodSearch)}" oninput="setProdSearch(this.value)">
      </div>
      <table class="mat-table">
        <thead><tr><th>Название</th><th>Состав</th><th></th></tr></thead>
        <tbody>${rows || '<tr><td colspan="3" class="tbl-empty">Ничего не найдено</td></tr>'}</tbody>
      </table>
      <div class="mat-tbl-footer">
        <div class="mat-tbl-perpage">Показывать: <select onchange="setProdPerPage(+this.value)">${perPageOptions}</select></div>
        <div class="mat-tbl-info">${from}–${to} из ${total}</div>
        <div class="mat-tbl-pages">${paginationBtns}</div>
      </div>
      <div class="tbl-total">Всего изделий: ${state.products.length}</div>
    </div>
  `;
}

function setProdPage(p) { prodPage = p; renderProducts(); }
function setProdPerPage(n) { prodPerPage = n; prodPage = 0; renderProducts(); }
function setProdSearch(q) { prodSearch = q; prodPage = 0; renderProducts(); }

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

  const bodyHtml = `
    <label style="display:block;font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">Название</label>
    <input id="edit-prod-name" value="${esc(p.name)}" placeholder="Название изделия">
    <div style="margin-top:14px;margin-bottom:6px;font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.06em">Состав</div>
    <div id="edit-prod-mats">${editProdMats.map(x => {
      const m = state.materials.find(m => m.id === x.matId);
      return `<div class="added-mat">
        <span>${esc(matLabel(m))} — Расход: <b>${x.qty} м</b></span>
        <button class="btn btn-danger btn-sm" onclick="removeEditProdMat('${x.matId}')">✕</button>
      </div>`;
    }).join('')}</div>
    <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
      <div style="flex:1;min-width:0">${cselHtml('edit-mat-sel', matOpts, matOpts[0]?.v || '', 'Выберите материал')}</div>
      <input type="number" id="edit-mat-qty" class="edit-ctrl" placeholder="м" min="0" step="0.01" style="width:80px">
      <button class="btn btn-secondary" onclick="addEditProdMat()">+</button>
    </div>
  `;

  showModal('Редактировать изделие', bodyHtml, () => {
    const newName = document.getElementById('edit-prod-name')?.value.trim();
    if (!newName) return;
    const idx = state.products.findIndex(p => p.id === id);
    if (idx >= 0) { state.products[idx].name = newName; state.products[idx].materials = [...editProdMats]; }
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
