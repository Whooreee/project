function prevSummaryDay() { summaryDay = new Date(summaryDay - 86400000); renderSummary(); }

function nextSummaryDay() {
  const next = new Date(summaryDay.getTime() + 86400000);
  const today = new Date(); today.setHours(0,0,0,0);
  if (next <= today) { summaryDay = next; renderSummary(); }
}

function renderDayHistory() {
  const today = new Date(); today.setHours(0,0,0,0);
  const isToday = summaryDay.getTime() === today.getTime();
  const isYest  = summaryDay.getTime() === today.getTime() - 86400000;
  const label   = isToday ? 'Сегодня' : isYest ? 'Вчера' : summaryDay.toLocaleDateString('ru', {day:'2-digit',month:'long',year:'numeric'});
  document.getElementById('day-nav-label').textContent = label;
  const nextBtn = document.getElementById('day-nav-next');
  if (nextBtn) nextBtn.disabled = isToday;

  const dayWOs = state.writeoffs.filter(w => {
    if (!state.products.find(p => p.id === w.productId)) return false;
    const d = new Date(w.timestamp); d.setHours(0,0,0,0);
    return d.getTime() === summaryDay.getTime();
  });

  const wrap = document.getElementById('day-table-wrap');
  if (!dayWOs.length) { wrap.innerHTML = '<div class="empty">Списаний за этот день нет</div>'; return; }

  const rows = dayWOs.map(w => {
    const time = new Date(w.timestamp).toLocaleTimeString('ru', {hour:'2-digit',minute:'2-digit'});
    const mats = (w.items || []).map(i => `<span class="wo-mat-chip">${esc(i.materialName)}: ${i.meters.toFixed(2)} м</span>`).join(' ');
    return `<tr><td>${time}</td><td style="font-weight:500">${esc(w.productName)}</td><td>${w.quantity} шт.</td><td>${mats}</td></tr>`;
  }).join('');

  wrap.innerHTML = `<table class="day-table">
    <thead><tr><th>Время</th><th>Изделие</th><th>Кол-во</th><th>Состав</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function renderSummary() {
  const today = new Date(); today.setHours(0,0,0,0);
  const isToday = summaryDay.getTime() === today.getTime();
  const isYest  = summaryDay.getTime() === today.getTime() - 86400000;
  const dayLabel = isToday ? 'сегодня' : isYest ? 'вчера' : summaryDay.toLocaleDateString('ru', {day:'2-digit',month:'short'});

  const dayWOs  = state.writeoffs.filter(w => {
    const d = new Date(w.timestamp); d.setHours(0,0,0,0);
    return d.getTime() === summaryDay.getTime();
  });
  const total  = dayWOs.reduce((s, w) => s + w.quantity, 0);
  const totalM = dayWOs.reduce((s, w) => s + (w.items || []).reduce((ss, i) => ss + i.meters, 0), 0);

  document.getElementById('stat-row').innerHTML = `
    <div class="stat-card"><div class="stat-label">Списано (${dayLabel})</div><div class="stat-val">${total}</div></div>
    <div class="stat-card"><div class="stat-label">Материалов (м)</div><div class="stat-val">${totalM.toFixed(1)}</div></div>
    <div class="stat-card"><div class="stat-label">Операций</div><div class="stat-val">${dayWOs.length}</div></div>
    <div class="stat-card"><div class="stat-label">На складе (м)</div><div class="stat-val">${state.materials.reduce((s,m)=>s+m.stock,0).toFixed(1)}</div></div>
  `;

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
    days.push({ date: d, count: 0, label: i === 0 ? 'Сег' : i === 1 ? 'Вч' : d.toLocaleDateString('ru',{weekday:'short'}) });
  }
  state.writeoffs.forEach(w => {
    const d = new Date(w.timestamp); d.setHours(0,0,0,0);
    const day = days.find(dd => dd.date.getTime() === d.getTime());
    if (day) day.count += w.quantity;
  });
  const maxCount = Math.max(...days.map(d => d.count), 1);
  document.getElementById('chart-bars').innerHTML = days.map(d => `
    <div class="chart-col">
      <div class="chart-day-val">${d.count > 0 ? d.count : ''}</div>
      <div class="chart-bar-fill ${d.count>0?'has-data':''}" style="height:${Math.max(d.count/maxCount*60,d.count>0?4:2)}px"></div>
      <div class="chart-day-label">${d.label}</div>
    </div>
  `).join('');

  renderDayHistory();
}
