function renderAll() {
  renderMaterials();
  renderProdMatSelect();
  renderProducts();
  renderWoItems();
  renderIsland('island-mats-1');
  renderIsland('island-mats-2');
  renderSummary();
}

function initEventDelegation() {
  document.getElementById('materials-list').addEventListener('click', e => {
    const editBtn   = e.target.closest('[data-edit-mat]');
    const delBtn    = e.target.closest('[data-del-mat]');
    const saveBtn   = e.target.closest('[data-save-mat]');
    const cancelBtn = e.target.closest('[data-cancel-mat]');
    if (editBtn)   startEditMat(editBtn.dataset.editMat);
    if (delBtn)    askDeleteMat(delBtn.dataset.delMat);
    if (saveBtn)   askSaveMat(saveBtn.dataset.saveMat);
    if (cancelBtn) cancelEditMat(cancelBtn.dataset.cancelMat);
  });
  document.getElementById('products-list').addEventListener('click', e => {
    const editBtn = e.target.closest('[data-edit-prod]');
    const delBtn  = e.target.closest('[data-del-prod]');
    if (editBtn) startEditProduct(editBtn.dataset.editProd);
    if (delBtn)  askDeleteProduct(delBtn.dataset.delProd);
  });
}

function switchTab(name) {
  const names = ['sklad','products','writeoffs','summary'];
  document.querySelectorAll('.tab-btn').forEach((b, i) => b.classList.toggle('active', names[i] === name));
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
}

function doLogin() {
  const val = document.getElementById('auth-input').value;
  if (val === PASSWORD) {
    sessionStorage.setItem('sklad-auth', '1');
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('auth-input').value = '';
    initApp();
  } else {
    const el = document.getElementById('auth-err');
    el.textContent = 'Неверный пароль';
    document.getElementById('auth-input').value = '';
    setTimeout(() => el.textContent = '', 2000);
  }
}

async function initApp() {
  setSyncStatus(false, 'Синхронизация...');
  loadLocal();

  document.getElementById('mat-type-wrap').innerHTML = cselHtml(
    'mat-type',
    [{v:'pipe',l:'Труба'},{v:'profile',l:'Профиль'}],
    'pipe', 'Тип'
  );
  cselOnChange('mat-type', updateMatFields);
  updateMatFields('pipe');

  initEventDelegation();
  renderAll();

  const result = await loadCloud();
  if (result === 'loaded') {
    saveLocal(); renderAll(); setSyncStatus(true, 'Синхронизировано');
  } else if (result === 'empty') {
    const ok = await saveCloud();
    setSyncStatus(ok, ok ? 'Синхронизировано' : 'Нет связи — проверьте правила БД');
  } else {
    setSyncStatus(false, 'Нет связи — проверьте правила БД');
  }
}

// Boot
if (sessionStorage.getItem('sklad-auth') === '1') {
  document.getElementById('auth-screen').classList.add('hidden');
  initApp();
} else {
  setTimeout(() => document.getElementById('auth-input').focus(), 100);
}
