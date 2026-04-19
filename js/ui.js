const _csel = {};
const ARROW_SVG = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>`;

function cselHtml(id, opts, value, placeholder, iconSvg) {
  _csel[id] = { opts, value: value || '', onChange: null };
  const found = opts.find(o => o.v === value);
  const label = found ? found.l : placeholder;
  const isEmpty = !found;
  const optsHtml = opts.map(o =>
    `<div class="csel-opt${o.v === value ? ' csel-selected' : ''}" data-csel-id="${id}" data-csel-val="${esc(o.v)}">${esc(o.l)}</div>`
  ).join('');
  return `<div class="csel" id="csel-${id}" tabindex="0" data-csel="${id}">
    ${iconSvg ? `<span class="csel-ico">${iconSvg}</span>` : ''}
    <span class="csel-val${isEmpty ? ' csel-empty' : ''}">${esc(label)}</span>
    <span class="csel-arr">${ARROW_SVG}</span>
    <div class="csel-drop hidden">${optsHtml}</div>
  </div>`;
}

function cselSetOptions(id, opts) {
  if (!_csel[id]) return;
  _csel[id].opts = opts;
  const val = _csel[id].value;
  const drop = document.querySelector(`#csel-${id} .csel-drop`);
  if (!drop) return;
  drop.innerHTML = opts.map(o =>
    `<div class="csel-opt${o.v === val ? ' csel-selected' : ''}" data-csel-id="${id}" data-csel-val="${esc(o.v)}">${esc(o.l)}</div>`
  ).join('');
  const found = opts.find(o => o.v === val);
  const valEl = document.querySelector(`#csel-${id} .csel-val`);
  if (valEl) {
    if (!found && val) { _csel[id].value = ''; valEl.textContent = _csel[id].placeholder || ''; valEl.classList.add('csel-empty'); }
    else if (found) { valEl.textContent = found.l; valEl.classList.remove('csel-empty'); }
  }
}

function cselOnChange(id, fn) { if (_csel[id]) _csel[id].onChange = fn; }
function cselValue(id) { return _csel[id] ? _csel[id].value : ''; }
function cselReset(id, placeholder) {
  if (!_csel[id]) return;
  _csel[id].value = '';
  const valEl = document.querySelector(`#csel-${id} .csel-val`);
  if (valEl) { valEl.textContent = placeholder || ''; valEl.classList.add('csel-empty'); }
  document.querySelectorAll(`#csel-${id} .csel-opt`).forEach(o => o.classList.remove('csel-selected'));
}

document.addEventListener('click', e => {
  const opt = e.target.closest('.csel-opt');
  const sel = e.target.closest('.csel');

  if (opt) {
    e.stopPropagation();
    const id = opt.dataset.cselId;
    const val = opt.dataset.cselVal;
    const data = _csel[id];
    if (!data) return;
    data.value = val;
    const wrap = document.getElementById('csel-' + id);
    if (wrap) {
      const found = data.opts.find(o => o.v === val);
      const valEl = wrap.querySelector('.csel-val');
      if (valEl) { valEl.textContent = found ? found.l : val; valEl.classList.remove('csel-empty'); }
      wrap.classList.remove('open');
      wrap.querySelector('.csel-drop').classList.add('hidden');
      wrap.querySelectorAll('.csel-opt').forEach(o => o.classList.toggle('csel-selected', o.dataset.cselVal === val));
    }
    if (data.onChange) data.onChange(val);
    return;
  }

  if (sel) {
    e.stopPropagation();
    document.querySelectorAll('.csel.open').forEach(s => {
      if (s !== sel) { s.classList.remove('open'); s.querySelector('.csel-drop').classList.add('hidden'); }
    });
    const drop = sel.querySelector('.csel-drop');
    const isOpen = !drop.classList.contains('hidden');
    if (isOpen) { sel.classList.remove('open'); drop.classList.add('hidden'); }
    else { sel.classList.add('open'); drop.classList.remove('hidden'); }
    return;
  }

  document.querySelectorAll('.csel.open').forEach(s => {
    s.classList.remove('open'); s.querySelector('.csel-drop').classList.add('hidden');
  });
});

// ── Modal ─────────────────────────────────────────────────────────────────
function showModal(title, body, onConfirm, confirmLabel = 'Подтвердить', danger = false) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = body;
  const btn = document.getElementById('modal-confirm-btn');
  btn.textContent = confirmLabel;
  btn.className = 'btn ' + (danger ? 'btn-danger' : 'btn-primary');
  modalCallback = onConfirm;
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function hideModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  modalCallback = null;
}

function confirmModal() {
  const cb = modalCallback;
  hideModal();
  if (cb) cb();
}
