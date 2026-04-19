function addMaterial() {
  const type = cselValue('mat-type');
  const wall = parseFloat(document.getElementById('mat-wall').value);
  const stock = parseFloat(document.getElementById('mat-stock').value) || 0;
  const errEl = document.getElementById('mat-err');
  if (!wall || wall <= 0) { errEl.textContent = 'Укажите толщину стенки'; return; }
  const mat = { id: genId(), type, wall, stock, peakStock: stock };
  if (type === 'pipe') {
    const d = parseFloat(document.getElementById('mat-diameter').value);
    if (!d || d <= 0) { errEl.textContent = 'Укажите диаметр'; return; }
    mat.diameter = d;
  } else {
    const h = parseFloat(document.getElementById('mat-height').value);
    const w = parseFloat(document.getElementById('mat-width').value);
    if (!h || !w) { errEl.textContent = 'Укажите высоту и ширину'; return; }
    mat.height = h; mat.width = w;
  }
  errEl.textContent = '';
  state.materials.push(mat);
  save();
  ['mat-diameter','mat-wall','mat-stock','mat-height','mat-width'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
}

function renderMaterials() {
  const el = document.getElementById('materials-list');
  if (!state.materials.length) { el.innerHTML = '<div class="empty">Нет материалов — добавьте первый</div>'; return; }
  el.innerHTML = state.materials.map(m => `
    <div class="mat-card" id="mc-${m.id}">
      <div class="mat-card-top">
        <div class="mat-card-info">
          <div style="margin-bottom:4px"><span class="badge ${m.type==='pipe'?'badge-pipe':'badge-profile'}">${m.type==='pipe'?'Труба':'Профиль'}</span></div>
          <div class="mat-card-name">${esc(matLabel(m))}</div>
          <div style="margin-top:6px">
            <span class="mat-card-stock">${m.stock.toFixed(2)}</span>
            <span class="mat-card-unit">м</span>
          </div>
        </div>
        <div class="mat-card-actions">
          <button class="btn btn-ghost btn-sm" data-edit-mat="${m.id}">Изменить</button>
          <button class="btn btn-danger btn-sm" data-del-mat="${m.id}">Удалить</button>
        </div>
      </div>
      <div class="mat-edit-row" id="me-${m.id}" style="display:none">
        <input type="number" id="mei-${m.id}" value="${m.stock}" min="0" step="0.01" placeholder="Введите остаток" onkeydown="if(event.key==='Enter') askSaveMat('${m.id}')">
        <button class="btn btn-primary btn-sm" data-save-mat="${m.id}">Сохранить</button>
        <button class="btn btn-ghost btn-sm" data-cancel-mat="${m.id}">Отмена</button>
      </div>
    </div>
  `).join('');
}

function startEditMat(id) {
  document.getElementById('me-' + id).style.display = 'flex';
  const inp = document.getElementById('mei-' + id);
  inp.focus(); inp.select();
}

function cancelEditMat(id) { document.getElementById('me-' + id).style.display = 'none'; }

function askSaveMat(id) {
  const val = parseFloat(document.getElementById('mei-' + id).value);
  if (isNaN(val) || val < 0) return;
  showModal('Изменить остаток', `Установить остаток: <b>${val.toFixed(2)} м</b>?`, () => {
    const m = state.materials.find(m => m.id === id);
    if (m) {
      if (val > (m.peakStock || 0)) m.peakStock = val;
      m.stock = val;
      save();
    }
  }, 'Сохранить');
}

function askDeleteMat(id) {
  const m = state.materials.find(m => m.id === id);
  showModal('Удалить материал', `Удалить <b>${esc(matLabel(m))}</b>? Это действие нельзя отменить.`, () => {
    state.materials = state.materials.filter(m => m.id !== id);
    state.products.forEach(p => { p.materials = p.materials.filter(x => x.matId !== id); });
    save();
  }, 'Удалить', true);
}

function renderIsland(elId) {
  const el = document.getElementById(elId);
  if (!el) return;
  if (!state.materials.length) { el.innerHTML = '<div class="island-empty">Нет материалов</div>'; return; }
  el.innerHTML = state.materials.map(m => {
    const peak = (m.peakStock && m.peakStock > 0) ? m.peakStock : (m.stock > 0 ? m.stock : 1);
    const pct = Math.min(Math.round(m.stock / peak * 100), 100);
    return `
      <div class="island-row">
        <div class="island-mat-name">
          <span class="badge ${m.type==='pipe'?'badge-pipe':'badge-profile'}" style="font-size:9px">${m.type==='pipe'?'Т':'П'}</span>
          ${esc(matLabel(m))}
        </div>
        <div class="island-bar-wrap">
          <div class="island-bar" style="width:${pct}%"></div>
        </div>
        <div class="island-meta">
          <span>${pct}%</span>
          <span class="island-stock-val">${m.stock.toFixed(2)} м</span>
        </div>
      </div>`;
  }).join('');
}
