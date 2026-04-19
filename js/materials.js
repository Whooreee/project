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

let matPage = 0;
let matPerPage = 10;
let matSearch = '';

function svgEdit() {
  return `<svg width="15" height="15" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.333 2a1.886 1.886 0 0 1 2.667 2.667L5.5 13.167l-3.5.833.833-3.5L11.333 2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
function svgTrash() {
  return `<svg width="15" height="15" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 4h12M5.333 4V2.667a.667.667 0 0 1 .667-.667h4a.667.667 0 0 1 .667.667V4M12.667 4l-.667 9.333A1.333 1.333 0 0 1 10.667 14H5.333A1.333 1.333 0 0 1 4 13.333L3.333 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function renderMaterials() {
  const el = document.getElementById('materials-list');
  if (!state.materials.length) { el.innerHTML = '<div class="empty">Нет материалов — добавьте первый</div>'; return; }

  const q = matSearch.toLowerCase();
  const filtered = q ? state.materials.filter(m => matLabel(m).toLowerCase().includes(q)) : state.materials;
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / matPerPage));
  if (matPage >= totalPages) matPage = Math.max(0, totalPages - 1);
  const start = matPage * matPerPage;
  const page = filtered.slice(start, start + matPerPage);

  const perPageOptions = [5, 10, 25, 50].map(n =>
    `<option value="${n}"${n === matPerPage ? ' selected' : ''}>${n}</option>`
  ).join('');

  const rows = page.map(m => `
    <tr id="mr-${m.id}">
      <td><span class="badge ${m.type==='pipe'?'badge-pipe':'badge-profile'}">${m.type==='pipe'?'Труба':'Профиль'}</span></td>
      <td class="mat-tbl-name">${esc(matLabel(m))}</td>
      <td class="mat-tbl-stock"><span class="mat-tbl-stock-val">${m.stock.toFixed(2)}</span> <span class="mat-tbl-unit">м</span></td>
      <td class="mat-tbl-actions">
        <button class="btn-icon" data-edit-mat="${m.id}" title="Изменить">${svgEdit()}</button>
        <button class="btn-icon btn-icon-danger" data-del-mat="${m.id}" title="Удалить">${svgTrash()}</button>
      </td>
    </tr>
    <tr class="mat-edit-tr" id="me-${m.id}" style="display:none">
      <td colspan="4">
        <div class="mat-edit-inline">
          <input type="number" id="mei-${m.id}" value="${m.stock}" min="0" step="0.01" placeholder="Введите остаток" onkeydown="if(event.key==='Enter') askSaveMat('${m.id}')">
          <button class="btn btn-primary btn-sm" data-save-mat="${m.id}">Сохранить</button>
          <button class="btn btn-ghost btn-sm" data-cancel-mat="${m.id}">Отмена</button>
        </div>
      </td>
    </tr>
  `).join('');

  const from = total ? start + 1 : 0;
  const to = Math.min(start + matPerPage, total);
  const paginationBtns = totalPages > 1 ? `
    <button class="btn-page" onclick="setMatPage(0)" ${matPage===0?'disabled':''}>«</button>
    <button class="btn-page" onclick="setMatPage(${matPage-1})" ${matPage===0?'disabled':''}>‹</button>
    <span class="mat-page-info">${matPage+1} / ${totalPages}</span>
    <button class="btn-page" onclick="setMatPage(${matPage+1})" ${matPage>=totalPages-1?'disabled':''}>›</button>
    <button class="btn-page" onclick="setMatPage(${totalPages-1})" ${matPage>=totalPages-1?'disabled':''}>»</button>
  ` : '';

  el.innerHTML = `
    <div class="mat-tbl-wrap">
      <div class="tbl-search-bar">
        <input class="tbl-search-input" type="text" placeholder="Поиск..." value="${esc(matSearch)}" oninput="setMatSearch(this.value)">
      </div>
      <table class="mat-table">
        <thead><tr>
          <th>Тип</th><th>Название</th><th>Остаток</th><th></th>
        </tr></thead>
        <tbody>${rows || '<tr><td colspan="4" class="tbl-empty">Ничего не найдено</td></tr>'}</tbody>
      </table>
      <div class="mat-tbl-footer">
        <div class="mat-tbl-perpage">Показывать: <select onchange="setMatPerPage(+this.value)">${perPageOptions}</select></div>
        <div class="mat-tbl-info">${from}–${to} из ${total}</div>
        <div class="mat-tbl-pages">${paginationBtns}</div>
      </div>
      <div class="tbl-total">Всего материалов: ${state.materials.length}</div>
    </div>
  `;
}

function setMatPage(p) { matPage = p; renderMaterials(); }
function setMatPerPage(n) { matPerPage = n; matPage = 0; renderMaterials(); }
function setMatSearch(q) { matSearch = q; matPage = 0; renderMaterials(); }

function startEditMat(id) {
  document.getElementById('me-' + id).style.display = '';
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
      m.peakStock = val;
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
