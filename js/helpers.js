function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function matBaseLabel(m) {
  if (!m) return '—';
  if (m.type === 'pipe') return `Труба Ø${m.diameter}×${m.wall}`;
  if (m.type === 'masha') return `Маша ${m.height}×${m.width}×${m.wall}`;
  return `Профиль ${m.height}×${m.width}×${m.wall}`;
}

function matLabel(m) {
  if (!m) return '—';
  const parts = [matBaseLabel(m), m.surface, m.grade].filter(Boolean);
  return parts.join(' · ');
}

function normalizeState(s) {
  if (!s || typeof s !== 'object') return { materials: [], products: [], writeoffs: [] };
  return {
    materials: Array.isArray(s.materials) ? s.materials
      .filter(m => m && m.id)
      .map(m => ({ ...m, stock: m.stock ?? 0, peakStock: m.peakStock ?? m.stock ?? 0 })) : [],
    products: Array.isArray(s.products) ? s.products
      .filter(p => p && p.id)
      .map(p => ({ ...p, materials: Array.isArray(p.materials) ? p.materials.map(x => ({ ...x, qty: x.qty ?? x.amount ?? 0 })) : [] })) : [],
    writeoffs: Array.isArray(s.writeoffs) ? s.writeoffs
      .filter(w => w && w.id)
      .map(w => ({ ...w, items: Array.isArray(w.items) ? w.items : [] })) : [],
    updatedAt: s.updatedAt || null,
  };
}

function updateMatFields(val) {
  const t = val || cselValue('mat-type');
  document.getElementById('f-diam').style.display = t === 'pipe' ? '' : 'none';
  document.getElementById('f-h').style.display = (t === 'profile' || t === 'masha') ? '' : 'none';
  document.getElementById('f-w').style.display = (t === 'profile' || t === 'masha') ? '' : 'none';
}
