let _dirtyLocal = false;
let _syncRetryTimer = null;

function loadLocal() {
  try {
    const s = localStorage.getItem(STORE_KEY);
    if (s) state = normalizeState(JSON.parse(s));
  } catch(e) { state = normalizeState(null); }
}

function saveLocal() { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }

function fetchWithTimeout(url, opts = {}, ms = 10000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(t));
}

async function loadCloud() {
  try {
    const res = await fetchWithTimeout(`${CLOUD_DB}/${STORE_KEY}.json`);
    if (!res.ok) return 'error';
    const data = await res.json();
    if (data && typeof data === 'object') {
      const cloudState = normalizeState(data);
      if (!_dirtyLocal || (cloudState.updatedAt && (!state.updatedAt || cloudState.updatedAt > state.updatedAt))) {
        state = cloudState;
      }
      return 'loaded';
    }
    return 'empty';
  } catch { return 'error'; }
}

async function saveCloud() {
  try {
    const res = await fetchWithTimeout(`${CLOUD_DB}/${STORE_KEY}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    });
    if (res.ok) { _dirtyLocal = false; }
    return res.ok;
  } catch { return false; }
}

function setSyncStatus(ok, text) {
  document.getElementById('sync-dot').className = 'sync-dot' + (ok ? ' ok' : '');
  document.getElementById('sync-text').textContent = text;
}

function scheduleRetry() {
  if (_syncRetryTimer) return;
  _syncRetryTimer = setTimeout(async () => {
    _syncRetryTimer = null;
    if (!_dirtyLocal) return;
    const ok = await saveCloud();
    setSyncStatus(ok,
      ok ? 'Синхронизировано ' + new Date().toLocaleTimeString('ru', { hour:'2-digit', minute:'2-digit' })
         : 'Нет связи — повтор...');
    if (!ok) scheduleRetry();
  }, 15000);
}

function save() {
  state.updatedAt = Date.now();
  _dirtyLocal = true;
  saveLocal();
  saveCloud().then(ok => {
    setSyncStatus(ok,
      ok ? 'Синхронизировано ' + new Date().toLocaleTimeString('ru', { hour:'2-digit', minute:'2-digit' })
         : 'Нет связи — повтор...');
    if (!ok) scheduleRetry();
  });
  renderAll();
}
