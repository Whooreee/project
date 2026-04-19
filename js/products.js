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

function renderProducts() {
  const el = document.getElementById('products-list');
  if (!state.products.length) { el.innerHTML = '<div class="empty">Нет изделий — создайте первое</div>'; return; }
  el.innerHTML = state.products.map(p => {
    const visibleMats = p.materials.filter(x => state.materials.find(m => m.id === x.matId));
    return `
    <div class="prod-card">
      <div class="prod-card-top">
        <div class="prod-card-name">${esc(p.name)}</div>
        <div style="display:flex;gap:4px;flex-shrink:0;margin-top:-2px">
          <button class="btn btn-ghost btn-sm" data-edit-prod="${p.id}">Редактировать</button>
          <button class="btn btn-danger btn-sm" data-del-prod="${p.id}">Удалить</button>
        </div>
      </div>
      ${visibleMats.length ? `<div class="prod-card-body">
        ${visibleMats.map(x => {
          const m = state.materials.find(m => m.id === x.matId);
          return `<div class="comp-row"><span>${esc(matLabel(m))}</span><span class="comp-val">Расход: ${x.qty} м</span></div>`;
        }).join('')}
      </div>` : ''}
    </div>`;
  }).join('');
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
