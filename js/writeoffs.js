function getWoSeriesOpts() {
  const keys = [...new Set(state.products.map(p => (p.series || '').trim()))]
    .sort((a, b) => { if (!a) return 1; if (!b) return -1; return a.localeCompare(b, 'ru'); });
  return keys.map(k => ({ v: k, l: k || 'Без серии' }));
}

function renderWoItems() {
  const el = document.getElementById('wo-items-list');
  if (!state.products.length) {
    el.innerHTML = '<div class="empty">Сначала создайте изделия</div>';
    updateWoPreview();
    return;
  }

  const seriesOpts = getWoSeriesOpts();

  el.innerHTML = woItems.map((item, i) => {
    const seriesVal = item.seriesKey !== null ? item.seriesKey : '__unset__';
    const prodOpts = item.seriesKey !== null
      ? state.products.filter(p => (p.series || '').trim() === item.seriesKey).map(p => ({ v: p.id, l: p.name }))
      : [];

    return `<div class="wo-item-row">
      <div class="field">
        <label>Линейка</label>
        ${cselHtml('wo-series-' + i, seriesOpts, seriesVal, 'Выберите линейку')}
      </div>
      <div class="field">
        <label>Изделие</label>
        ${cselHtml('wo-prod-' + i, prodOpts, item.prodId, 'Выберите изделие')}
      </div>
      <div class="field narrow">
        <label>Кол-во (шт)</label>
        <input type="number" min="1" step="1" value="${item.qty||''}" placeholder="Введите кол-во"
          oninput="woItems[${i}].qty=parseFloat(this.value)||0;updateWoPreview()">
      </div>
      ${woItems.length > 1 ? `<div style="padding-bottom:2px"><button class="btn btn-danger btn-sm" onclick="removeWoItem(${i})">✕</button></div>` : ''}
    </div>`;
  }).join('');

  woItems.forEach((item, i) => {
    cselOnChange('wo-series-' + i, val => {
      woItems[i].seriesKey = val;
      woItems[i].prodId = '';
      const newProdOpts = state.products
        .filter(p => (p.series || '').trim() === val)
        .map(p => ({ v: p.id, l: p.name }));
      cselSetOptions('wo-prod-' + i, newProdOpts);
      cselReset('wo-prod-' + i, 'Выберите изделие');
      updateWoPreview();
    });
    cselOnChange('wo-prod-' + i, val => { woItems[i].prodId = val; updateWoPreview(); });
  });
  updateWoPreview();
}

function addWoItem() { woItems.push({ seriesKey: null, prodId: '', qty: 1 }); renderWoItems(); }
function removeWoItem(i) { woItems.splice(i, 1); renderWoItems(); }

function updateWoPreview() {
  const el = document.getElementById('wo-preview');
  woItems.forEach((item, i) => {
    const v = cselValue('wo-prod-' + i);
    if (v) item.prodId = v;
  });
  const validItems = woItems.filter(x => x.prodId && x.qty > 0);
  if (!validItems.length) { el.innerHTML = ''; return; }

  const needs = {};
  for (const item of validItems) {
    const p = state.products.find(p => p.id === item.prodId);
    if (!p) continue;
    for (const x of p.materials) {
      if (!needs[x.matId]) needs[x.matId] = 0;
      needs[x.matId] += x.qty * item.qty;
    }
  }

  let allOk = true;
  const rows = validItems.map(item => {
    const p = state.products.find(p => p.id === item.prodId);
    if (!p) return '';
    const matRows = p.materials.map(x => {
      const m = state.materials.find(m => m.id === x.matId);
      const total = x.qty * item.qty;
      const ok = m && m.stock >= needs[x.matId];
      if (!ok) allOk = false;
      return `<div class="wo-preview-mat ${ok?'':'not-enough'}">${esc(matLabel(m))}: ${total.toFixed(2)} м${ok?'':' — недостаточно'}</div>`;
    }).join('');
    return `<div class="wo-preview-item"><b>${esc(p.name)} × ${item.qty} шт.</b></div>${matRows}`;
  }).join('');

  el.innerHTML = `<div class="wo-preview"><div class="wo-preview-title">Предварительный расчёт</div>${rows}</div>`;
}

function doWriteoff() {
  const errEl = document.getElementById('wo-err');
  const okEl  = document.getElementById('wo-ok');
  errEl.textContent = ''; okEl.textContent = '';

  woItems.forEach((item, i) => { const v = cselValue('wo-prod-' + i); if (v) item.prodId = v; });
  const validItems = woItems.filter(x => x.prodId && x.qty > 0);
  if (!validItems.length) { errEl.textContent = 'Добавьте хотя бы одно изделие'; return; }

  const needs = {};
  for (const item of validItems) {
    const p = state.products.find(p => p.id === item.prodId);
    if (!p) continue;
    for (const x of p.materials) {
      if (!needs[x.matId]) needs[x.matId] = 0;
      needs[x.matId] += x.qty * item.qty;
    }
  }
  for (const [matId, total] of Object.entries(needs)) {
    const m = state.materials.find(m => m.id === matId);
    if (!m || m.stock < total) { errEl.textContent = `Недостаточно материала: ${matLabel(m)}`; return; }
  }

  for (const [matId, total] of Object.entries(needs)) {
    const m = state.materials.find(m => m.id === matId);
    m.stock = Math.round((m.stock - total) * 1000) / 1000;
  }

  for (const item of validItems) {
    const p = state.products.find(p => p.id === item.prodId);
    const items = p.materials.map(x => {
      const m = state.materials.find(m => m.id === x.matId);
      return { materialId: x.matId, materialName: matLabel(m), meters: Math.round(x.qty * item.qty * 1000) / 1000 };
    });
    state.writeoffs.push({ id: genId(), productId: p.id, productName: p.name, quantity: item.qty, timestamp: Date.now(), items });
  }

  const names = validItems.map(x => {
    const p = state.products.find(p => p.id === x.prodId);
    return `${p?.name} × ${x.qty}`;
  }).join(', ');
  woItems = [{ seriesKey: null, prodId: '', qty: 1 }];
  save();
  okEl.textContent = `Списано: ${names}`;
  setTimeout(() => okEl.textContent = '', 4000);
}
