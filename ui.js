let activeTab = 'settings';
let gearTarget = -1;
let gearSubview = '';

// ── Modal open/close ───────────────────────────────────────────
function openModal(){
  document.getElementById('modalOverlay').classList.add('open');
  renderModal();
}
function closeModal(){
  document.getElementById('modalOverlay').classList.remove('open');
  closeGearPopup();
}
function handleOverlayClick(e){
  if(e.target === document.getElementById('modalOverlay')) closeModal();
}
function switchTab(tab){
  activeTab=tab;
  document.querySelectorAll('.modal-tab').forEach(b=>b.classList.remove('active'));
  document.getElementById('tabBtn-'+tab).classList.add('active');
  renderModal();
}
function renderModal(){
  if(activeTab==='settings') renderSettingsTab();
  else renderPortfolioTab();
}

// ── Settings tab ───────────────────────────────────────────────
function renderSettingsTab(){
  const s=state.settings;
  const yearOpts = (sel,min,max) => {
    let h='';
    for(let y=max;y>=min;y--) h+=`<option value="${y}" ${y==sel?'selected':''}>${y}년</option>`;
    return h;
  };
  document.getElementById('modalBody').innerHTML=`
  <div class="settings-section">
    <div class="settings-section-title">백테스트 기간</div>
    <div class="settings-grid-2">
      <div class="field"><div class="field-label">시작 연도</div>
        <select class="field-select" id="s-startYear" onchange="state.settings.startYear=+this.value">${yearOpts(s.startYear,1994,CY-1)}</select>
      </div>
      <div class="field"><div class="field-label">종료 연도</div>
        <select class="field-select" id="s-endYear" onchange="state.settings.endYear=+this.value">${yearOpts(s.endYear,1995,CY)}</select>
      </div>
    </div>
  </div>
  <div class="settings-section">
    <div class="settings-section-title">투자 금액</div>
    <div class="settings-grid">
      <div class="field"><div class="field-label">초기 투자금 (만원)</div>
        <input class="field-input" type="number" id="s-init" value="${s.initialAmount}" min="100" step="100" oninput="state.settings.initialAmount=+this.value||1000">
      </div>
      <div class="field"><div class="field-label">납입 시점</div>
        <select class="field-select" id="s-timing" onchange="state.settings.additionTiming=this.value">
          <option value="start"   ${s.additionTiming==='start'  ?'selected':''}>연초</option>
          <option value="end"     ${s.additionTiming==='end'    ?'selected':''}>연말</option>
          <option value="monthly" ${s.additionTiming==='monthly'?'selected':''}>매월</option>
        </select>
      </div>
      <div class="field"><div class="field-label">납입금액 (만원)</div>
        <input class="field-input" type="number" id="s-add" value="${s.annualAddition}" min="0" step="100" oninput="state.settings.annualAddition=+this.value||0">
      </div>
    </div>
  </div>
  <div class="settings-section">
    <div class="settings-section-title">운용 설정</div>
    <div class="settings-grid-2">
      <div class="field"><div class="field-label">리밸런싱 주기</div>
        <select class="field-select" id="s-rebal" onchange="state.settings.rebalancing=this.value">
          <option value="none" ${s.rebalancing==='none'?'selected':''}>없음</option>
          <option value="annual" ${s.rebalancing==='annual'?'selected':''}>연 1회 (1월)</option>
          <option value="semi" ${s.rebalancing==='semi'?'selected':''}>반기 (1·7월)</option>
          <option value="quarterly" ${s.rebalancing==='quarterly'?'selected':''}>분기 (1·4·7·10월)</option>
        </select>
      </div>
      <div class="field"><div class="field-label">벤치마크</div>
        <select class="field-select" id="s-bench" onchange="state.settings.benchmark=this.value">
          <option value="none" ${s.benchmark==='none'?'selected':''}>없음</option>
          <option value="0" ${s.benchmark==='0'?'selected':''}>포트폴리오 1</option>
          <option value="1" ${s.benchmark==='1'?'selected':''}>포트폴리오 2</option>
          <option value="2" ${s.benchmark==='2'?'selected':''}>포트폴리오 3</option>
        </select>
      </div>
    </div>
  </div>
  <div class="note-banner">ℹ 납입금액은 선택한 시점당 금액입니다 (연초·연말: 연 1회 / 매월: 매월). 환율 변동은 USD 자산에 자동 반영됩니다 (Yahoo Finance KRW=X).</div>`;
}

// ── Asset select options HTML ──────────────────────────────────
function assetOptions(selectedId){
  let h = `<option value="">— 자산 선택 —</option>`;
  ASSET_GROUPS.forEach(grp => {
    const ids = Object.keys(ASSET_DEF).filter(k => ASSET_DEF[k].grp === grp);
    if(!ids.length) return;
    h += `<optgroup label="${ASSET_GROUP_LABEL[grp]||grp}">`;
    ids.forEach(id => {
      const def = ASSET_DEF[id];
      h += `<option value="${id}" ${id===selectedId?'selected':''}>${def.name}</option>`;
    });
    h += `</optgroup>`;
  });
  return h;
}

// ── Portfolio tab ──────────────────────────────────────────────
function renderPortfolioTab(){
  const rows = state.rows;
  const portHeaders = state.portfolios.map((p,i) => `
    <th class="port-col" style="color:${P_COLORS[i]}">
      <input class="port-name-input" value="${escHtml(p.name)}" style="color:${P_COLORS[i]}"
        oninput="state.portfolios[${i}].name=this.value">
      <button class="gear-btn" onclick="openGearPopup(${i},event)" title="포트폴리오 옵션">⚙</button>
    </th>`).join('');

  const rowsHtml = rows.map((row,ri) => {
    const wCells = row.weights.map((w,pi) =>
      `<td><input class="weight-input" type="number" min="0" max="100" step="0.5" value="${w}" placeholder=""
        oninput="updateWeight(${ri},${pi},this.value)" style="border-color:${P_COLORS[pi]}22"></td>`
    ).join('');
    return `<tr>
      <td><select class="asset-select" onchange="updateAsset(${ri},this.value)">${assetOptions(row.assetId)}</select></td>
      ${wCells}
      <td><button class="remove-row-btn" onclick="removeRow(${ri})">×</button></td>
    </tr>`;
  }).join('');

  const sums = [0,1,2].map(pi => rows.reduce((s,r)=>s+(parseFloat(r.weights[pi])||0),0));
  const sumCells = sums.map((s,pi) => {
    const ok = Math.abs(s-100) < 0.1;
    const cls = s===0 ? '' : ok ? 'sum-ok' : 'sum-bad';
    return `<td class="${cls}" style="color:${P_COLORS[pi]}">${s>0?s.toFixed(1)+'%':'—'}</td>`;
  }).join('');

  document.getElementById('modalBody').innerHTML = `
  <div class="port-header">
    <div style="font-size:.8rem;color:var(--text3)">각 포트폴리오의 자산 비중을 입력하세요. 합계가 100%여야 합니다.</div>
  </div>
  <div class="port-scroll">
    <table class="port-table">
      <thead><tr><th>자산군</th>${portHeaders}<th style="width:32px"></th></tr></thead>
      <tbody id="portTableBody">${rowsHtml}</tbody>
      <tfoot><tr><td style="color:var(--text2);font-size:.78rem">합계</td>${sumCells}<td></td></tr></tfoot>
    </table>
  </div>
  <button class="add-row-btn" onclick="addRow()">+ 자산 추가</button>`;
}

function updateAsset(ri, val){
  state.rows[ri].assetId = val;
}
function updateWeight(ri, pi, val){
  state.rows[ri].weights[pi] = val;
  // Update sum display
  const sums = [0,1,2].map(p => state.rows.reduce((s,r)=>s+(parseFloat(r.weights[p])||0),0));
  const tfoot = document.querySelector('.port-table tfoot tr');
  if(tfoot) {
    const tds = tfoot.querySelectorAll('td');
    sums.forEach((s,p) => {
      const ok = Math.abs(s-100) < 0.1;
      if(tds[p+1]){
        tds[p+1].className = s===0 ? '' : ok ? 'sum-ok' : 'sum-bad';
        tds[p+1].style.color = P_COLORS[p];
        tds[p+1].textContent = s>0 ? s.toFixed(1)+'%' : '—';
      }
    });
  }
}
function addRow(){
  if(state.rows.length >= 10){ alert('자산은 최대 10개까지 추가할 수 있습니다.'); return; }
  state.rows.push({assetId:'', weights:['','','']});
  renderPortfolioTab();
}
function removeRow(ri){
  if(state.rows.length <= 1) return;
  state.rows.splice(ri,1);
  renderPortfolioTab();
}

// ── Gear popup ─────────────────────────────────────────────────
function openGearPopup(pi, event){
  event.stopPropagation();
  gearTarget = pi;
  gearSubview = '';
  renderGearMain(pi);
  positionPopup(event.currentTarget);
}
function positionPopup(btn){
  const popup = document.getElementById('gearPopup');
  const rect = btn.getBoundingClientRect();
  popup.style.top = (rect.bottom + 4) + 'px';
  popup.style.left = Math.min(rect.left, window.innerWidth - 200) + 'px';
  popup.classList.add('open');
}
function closeGearPopup(){
  document.getElementById('gearPopup').classList.remove('open');
  gearTarget = -1;
}
document.addEventListener('click', e => {
  if(!document.getElementById('gearPopup').contains(e.target) && !e.target.classList.contains('gear-btn')){
    closeGearPopup();
  }
});

function renderGearMain(pi){
  const other = [0,1,2].filter(x=>x!==pi).map(x=>`
    <div class="gear-item" onclick="copyFromPortfolio(${x})">
      <span style="color:${P_COLORS[x]}">${escHtml(state.portfolios[x].name)}</span>
    </div>`).join('');

  const presetCats = [...new Set(Object.values(PRESETS).map(p=>p.cat))];
  const presetHtml = presetCats.map(cat => {
    const names = Object.keys(PRESETS).filter(k=>PRESETS[k].cat===cat);
    return `<div class="gear-category">${cat}</div>` + names.map(n =>
      `<div class="gear-item" onclick="applyPreset('${escHtml(n)}')">${n}</div>`
    ).join('');
  }).join('<hr class="gear-divider">');

  document.getElementById('gearPopup').innerHTML = `
    <div class="gear-item" onclick="applyEqual()">균등 배분</div>
    <div class="gear-item" onclick="applyNormalize()">합계 100%로 정규화</div>
    <div class="gear-item danger" onclick="applyClear()">비중 초기화</div>
    <hr class="gear-divider">
    <div class="gear-category">다른 포트폴리오에서 복사</div>
    ${other}
    <hr class="gear-divider">
    <div class="gear-category">프리셋 불러오기</div>
    ${presetHtml}`;
}

function applyEqual(){
  const pi = gearTarget;
  const activeRows = state.rows.filter(r=>r.assetId);
  if(!activeRows.length){ closeGearPopup(); return; }
  const w = (100/activeRows.length).toFixed(1);
  state.rows.forEach(r => { if(r.assetId) r.weights[pi] = w; });
  closeGearPopup(); renderPortfolioTab();
}
function applyNormalize(){
  const pi = gearTarget;
  const total = state.rows.reduce((s,r)=>s+(parseFloat(r.weights[pi])||0),0);
  if(!total){ closeGearPopup(); return; }
  state.rows.forEach(r => {
    const w = parseFloat(r.weights[pi])||0;
    r.weights[pi] = w ? parseFloat((w/total*100).toFixed(2)).toString() : '';
  });
  closeGearPopup(); renderPortfolioTab();
}
function applyClear(){
  const pi = gearTarget;
  state.rows.forEach(r => { r.weights[pi] = ''; });
  closeGearPopup(); renderPortfolioTab();
}
function copyFromPortfolio(from){
  const pi = gearTarget;
  state.rows.forEach(r => { r.weights[pi] = r.weights[from]; });
  closeGearPopup(); renderPortfolioTab();
}
function applyPreset(name){
  const pi = gearTarget;
  const preset = PRESETS[name];
  if(!preset){ closeGearPopup(); return; }
  // Reset weights for this portfolio
  state.rows.forEach(r => { r.weights[pi] = ''; });
  // Apply preset rows
  preset.rows.forEach(([assetId, w]) => {
    let row = state.rows.find(r => r.assetId === assetId);
    if(!row){
      // Find empty row or add new one
      row = state.rows.find(r => !r.assetId);
      if(!row){
        if(state.rows.length >= 10){ return; }
        row = {assetId:'', weights:['','','']};
        state.rows.push(row);
      }
      row.assetId = assetId;
    }
    row.weights[pi] = w.toString();
  });
  closeGearPopup(); renderPortfolioTab();
}

// ── Run backtest ───────────────────────────────────────────────
async function doRunBacktest(){
  closeModal();
  debugClear();

  // Validate
  const s = state.settings;
  if(s.startYear >= s.endYear){ alert('종료 연도는 시작 연도보다 커야 합니다.'); openModal(); return; }

  // Collect active portfolios
  const activePorts = state.portfolios.map((p,pi)=>{
    const rows = state.rows
      .filter(r => r.assetId && parseFloat(r.weights[pi])>0)
      .map(r => ({assetId:r.assetId, weight:parseFloat(r.weights[pi])}));
    const totalW = rows.reduce((s,r)=>s+r.weight,0);
    return {name:p.name, rows, totalW, active: rows.length>0};
  });

  const anyActive = activePorts.some(p=>p.active);
  if(!anyActive){ alert('최소 1개 포트폴리오에 자산을 입력하세요.'); openModal(); switchTab('assets'); return; }

  // Warn about weight sums
  const badPort = activePorts.find(p=>p.active && Math.abs(p.totalW-100)>0.5);
  if(badPort){
    if(!confirm(`${badPort.name}의 비중 합계가 ${badPort.totalW.toFixed(1)}%입니다. 자동으로 정규화하고 계속할까요?`))
      { openModal(); switchTab('assets'); return; }
  }

  showLoading();

  // Collect unique assets
  const uniqueAssets = new Set();
  activePorts.forEach(p => p.rows.forEach(r => uniqueAssets.add(r.assetId)));

  const steps = ['환율 데이터 로딩', ...Array.from(uniqueAssets).map(id=>ASSET_DEF[id]?.name||id), '백테스트 계산'];
  renderLoadingSteps(steps);

  try{
    let stepIdx = 0;
    updateStep(stepIdx++, 'active');
    const fxMap = await fetchFX(s.startYear, s.endYear);
    updateStep(stepIdx-1, 'done');

    const assetDataMap = {};
    const warnings = [];
    for(const assetId of uniqueAssets){
      updateStep(stepIdx++, 'active');
      try{
        assetDataMap[assetId] = await fetchAssetData(assetId, s.startYear, s.endYear);
        if(assetDataMap[assetId].proxyNote) warnings.push(`${ASSET_DEF[assetId].name}: ${assetDataMap[assetId].proxyNote}`);
      }catch(e){
        warnings.push(`${ASSET_DEF[assetId]?.name||assetId}: 데이터 로드 실패 — 제외됨`);
      }
      updateStep(stepIdx-1, 'done');
    }

    updateStep(stepIdx++, 'active');
    const results = activePorts.map((p,pi) => {
      if(!p.active) return null;
      try{
        return runEngine(p.rows, assetDataMap, fxMap, s);
      }catch(e){
        warnings.push(`${p.name}: 계산 오류 — ${e.message}`);
        return null;
      }
    });
    updateStep(stepIdx-1, 'done');

    await new Promise(r=>setTimeout(r,200));
    renderResults(results, activePorts, warnings, s);
  }catch(e){
    hideLoading();
    document.getElementById('emptyState').style.display='none';
    document.getElementById('resultsArea').innerHTML=`<div class="error-banner">오류: ${e.message}</div>`;
    document.getElementById('resultsArea').style.display='block';
  }
}

// ── Render results ─────────────────────────────────────────────
let _charts = [];
function destroyCharts(){ _charts.forEach(c=>{try{c.destroy();}catch(e){}}); _charts=[]; }

function renderResults(results, ports, warnings, settings){
  hideLoading();
  destroyCharts();

  const active = results.map((r,i)=>r?i:-1).filter(i=>i>=1||i===0);
  if(!active.length){
    document.getElementById('resultsArea').innerHTML=`<div class="error-banner">유효한 백테스트 결과가 없습니다. 데이터를 확인하세요.</div>`;
    document.getElementById('resultsArea').style.display='block';
    return;
  }

  const pct = v => (v>=0?'+':'')+v.toFixed(2)+'%';
  const manwon = v => Math.round(v/10000).toLocaleString('ko-KR')+'만원';
  const fmtDate = ({y,m}) => `${y}.${String(m).padStart(2,'0')}`;

  // Period string
  const validResults = results.filter(Boolean);
  const firstStart = validResults.reduce((a,b)=>
    (a.firstDate.y*12+a.firstDate.m < b.firstDate.y*12+b.firstDate.m) ? a : b
  ).firstDate;
  const lastEnd = validResults[0].monthlyValues.slice(-1)[0];
  const periodStr = `${fmtDate(firstStart)} — ${fmtDate({y:lastEnd.y,m:lastEnd.m})}`;

  const warnHTML = warnings.map(w=>`<div class="note-banner">⚠ ${w}</div>`).join('');

  // ── 1. Performance summary ──────────────────────────────────
  const rows1 = [
    ['초기 투자금', i=>manwon(results[i].iv)],
    ['최종 자산',   i=>manwon(results[i].fv)],
    ['총 수익률',   i=>`<span class="${results[i].totalReturn>=0?'positive':'negative'}">${pct(results[i].totalReturn)}</span>`],
    ['CAGR',        i=>`<span class="${results[i].cagr>=0?'positive':'negative'}">${pct(results[i].cagr)}</span>`],
    ['표준편차',       i=>results[i].annualVol.toFixed(2)+'%'],
    ['최대 낙폭(MDD)',i=>`<span class="negative">-${(results[i].mdd*100).toFixed(2)}%</span>${results[i].mddEnd?` <small style="color:var(--text3)">(${fmtDate(results[i].mddEnd)})</small>`:''}` ],
    ['샤프지수',    i=>results[i].sharpe.toFixed(2)],
    ['소르티노지수',i=>results[i].sortino.toFixed(2)],
    ['최고 연도',   i=>`${results[i].bestYear.year}년 (${pct(results[i].bestYear.ret)})`],
    ['최저 연도',   i=>`${results[i].worstYear.year}년 (${pct(results[i].worstYear.ret)})`],
  ];

  const thCols = results.map((r,i)=>r?`<th class="p${i+1}-col">${escHtml(ports[i].name)}</th>`:'').join('');
  const perfRows = rows1.map(([label, fn])=>{
    const cells = results.map((r,i)=>r?`<td>${fn(i)}</td>`:'').join('');
    return `<tr><td>${label}</td>${cells}</tr>`;
  }).join('');

  // ── 2. Growth chart data ────────────────────────────────────
  // Build aligned month labels from all results
  const allMonths = new Set();
  validResults.forEach(r=>r.monthlyValues.forEach(p=>allMonths.add(`${p.y}-${p.m}`)));
  const sortedMonths = [...allMonths].sort((a,b)=>{
    const [ay,am]=a.split('-').map(Number), [by,bm]=b.split('-').map(Number);
    return (ay*12+am)-(by*12+bm);
  });

  // ── 4. Risk/return detail ───────────────────────────────────
  const riskRows = [
    ['산술평균 수익률', i=>pct(results[i].arithMean)],
    ['기하평균(CAGR)',  i=>pct(results[i].cagr)],
    ['표준편차',        i=>results[i].annualVol.toFixed(2)+'%'],
    ['하방 편차',       i=>results[i].downDev.toFixed(2)+'%'],
    ['최대 낙폭',       i=>'-'+(results[i].mdd*100).toFixed(2)+'%'],
    ['샤프지수',        i=>results[i].sharpe.toFixed(2)],
    ['소르티노지수',    i=>results[i].sortino.toFixed(2)],
  ].map(([label,fn])=>`<tr><td>${label}</td>${results.map((r,i)=>r?`<td>${fn(i)}</td>`:'').join('')}</tr>`).join('');

  // ── 6. Crisis periods ──────────────────────────────────────
  const crisisRows = CRISES.map(c=>{
    const cells = results.map((r,i)=>{
      if(!r) return '';
      const ret = getCrisisReturn(r.monthlyValues, c);
      if(ret===null) return `<td style="color:var(--text3)">N/A</td>`;
      return `<td class="${ret>=0?'positive':'negative'}">${pct(ret)}</td>`;
    }).join('');
    return `<tr><td>${c.name}<br><small style="color:var(--text3)">${c.s.y}.${String(c.s.m).padStart(2,'0')} ~ ${c.e.y}.${String(c.e.m).padStart(2,'0')}</small></td>${cells}</tr>`;
  }).join('');

  // ── 7. Rolling returns ─────────────────────────────────────
  const rollingYears = [1,3,5,7,10];
  const rollingHTML = results.map((r,pi)=>{
    if(!r) return '';
    const tRows = rollingYears.map(yr=>{
      const ro = computeRolling(r.monthlyValues, yr);
      if(!ro) return `<tr><td>${yr}년</td><td colspan="3" style="color:var(--text3)">데이터 부족</td></tr>`;
      return `<tr>
        <td>${yr}년</td>
        <td>${pct(ro.avg)}</td>
        <td class="positive">${pct(ro.max)}</td>
        <td class="negative">${pct(ro.min)}</td>
      </tr>`;
    }).join('');
    return `<div style="margin-bottom:1rem"><div style="font-size:.8rem;font-weight:500;color:${P_COLORS[pi]};margin-bottom:.5rem">${escHtml(ports[pi].name)}</div>
      <table class="rolling-table">
        <thead><tr><th>구간</th><th>평균</th><th>최고</th><th>최저</th></tr></thead>
        <tbody>${tRows}</tbody>
      </table></div>`;
  }).join('');

  // ── 8. Asset performance ───────────────────────────────────
  const assetPerfHTML = results.map((r,pi)=>{
    if(!r) return '';
    const assetRows = r.assets.map(a=>{
      // Compute asset-level returns from assetVals
      const idx = r.assets.indexOf(a);
      const vals = r.monthlyValues.map(m=>m.assetVals[idx]);
      const iv0 = vals.find(v=>v>0)||0;
      const fv0 = [...vals].reverse().find(v=>v>0)||0;
      const yr0 = r.monthlyValues.length/12;
      const cagr0 = iv0&&fv0&&yr0>0 ? (Math.pow(fv0/iv0,1/yr0)-1)*100 : 0;
      const rets0 = [];
      for(let i=1;i<vals.length;i++) if(vals[i-1]>0) rets0.push((vals[i]-vals[i-1])/vals[i-1]);
      const avg0 = rets0.reduce((s,v)=>s+v,0)/(rets0.length||1);
      const vol0 = Math.sqrt(rets0.reduce((s,v)=>s+(v-avg0)**2,0)/(rets0.length||1))*Math.sqrt(12)*100;
      // Annual vals
      const byYr = {};
      r.monthlyValues.forEach((p,mi)=>{ if(vals[mi]>0){ if(!byYr[p.y])byYr[p.y]={s:vals[mi],e:vals[mi]}; else byYr[p.y].e=vals[mi]; } });
      const aRets = Object.entries(byYr).map(([y,{s,e}])=>({y,ret:(e-s)/s*100}));
      const best = aRets.reduce((a,b)=>a.ret>b.ret?a:b,{ret:-Infinity,y:'—'});
      const worst = aRets.reduce((a,b)=>a.ret<b.ret?a:b,{ret:Infinity,y:'—'});
      return `<tr>
        <td>${ASSET_DEF[a.id]?.name||a.id}</td>
        <td class="${cagr0>=0?'positive':'negative'}">${pct(cagr0)}</td>
        <td>${vol0.toFixed(2)}%</td>
        <td>${best.y!=='—'?best.y+'년 '+pct(best.ret):'—'}</td>
        <td>${worst.y!=='—'?worst.y+'년 '+pct(worst.ret):'—'}</td>
      </tr>`;
    }).join('');
    return `<div style="margin-bottom:1.25rem"><div style="font-size:.8rem;font-weight:500;color:${P_COLORS[pi]};margin-bottom:.5rem">${escHtml(ports[pi].name)}</div>
      <table class="asset-table">
        <thead><tr><th style="text-align:left">자산군</th><th>CAGR</th><th>표준편차</th><th>최고 연도</th><th>최저 연도</th></tr></thead>
        <tbody>${assetRows}</tbody>
      </table></div>`;
  }).join('');

  // ── 9. Correlation heatmap ─────────────────────────────────
  const heatmapHTML = results.map((r,pi)=>{
    if(!r || r.assets.length < 2) return '';
    const labels = r.assets.map(a=>ASSET_DEF[a.id]?.name?.slice(0,8)||a.id);
    // Build monthly return series per asset
    const retSeries = r.assets.map((a,ai)=>{
      const vals = r.monthlyValues.map(m=>m.assetVals[ai]);
      const rets = [];
      for(let i=1;i<vals.length;i++){
        rets.push(vals[i-1]>0 && vals[i]>0
          ? (vals[i]-vals[i-1])/vals[i-1]
          : null);  // 누락·미상장 구간은 null로 마킹
      }
      return rets;
    });
    // 첫 번째 포트폴리오의 첫 번째 자산 쌍만 디버그 로깅
    if(pi===0 && retSeries.length>=2){
      debugLog('상관계수 배열A', labels[0]+' (첫12개)', retSeries[0].slice(0,12).map(v=>v==null?'null':v.toFixed(4)));
      debugLog('상관계수 배열B', labels[1]+' (첫12개)', retSeries[1].slice(0,12).map(v=>v==null?'null':v.toFixed(4)));
    }
    let hRows = `<tr><th></th>${labels.map(l=>`<th>${escHtml(l)}</th>`).join('')}</tr>`;
    labels.forEach((l,i)=>{
      hRows += `<tr><th>${escHtml(l)}</th>`;
      labels.forEach((_,j)=>{
        if(i===j){ hRows+=`<td style="background:var(--surface2);color:var(--text2)">1.00</td>`; return; }
        const c = pearsonCorr(retSeries[i], retSeries[j]);
        const bg = corrColor(c);
        hRows+=`<td style="background:${bg.bg};color:${bg.fg}">${c.toFixed(2)}</td>`;
      });
      hRows += `</tr>`;
    });
    return `<div style="margin-bottom:1.25rem"><div style="font-size:.8rem;font-weight:500;color:${P_COLORS[pi]};margin-bottom:.5rem">${escHtml(ports[pi].name)}</div>
      <div class="heatmap-scroll"><table class="heatmap-table">${hRows}</table></div></div>`;
  }).join('');

  // ── 10. Contribution breakdown ─────────────────────────────
  const contribHTML = results.map((r,pi)=>{
    if(!r) return '';
    const last = r.monthlyValues[r.monthlyValues.length-1];
    const contribRows = r.assets.map((a,ai)=>{
      const finalVal = last.assetVals[ai];
      const share = last.value>0 ? finalVal/last.value*100 : 0;
      return `<tr><td>${ASSET_DEF[a.id]?.name||a.id}</td>
        <td>${(a.w*100).toFixed(1)}%</td>
        <td>${manwon(finalVal)}</td>
        <td>${share.toFixed(1)}%</td></tr>`;
    }).join('');
    return `<div style="margin-bottom:1.25rem"><div style="font-size:.8rem;font-weight:500;color:${P_COLORS[pi]};margin-bottom:.5rem">${escHtml(ports[pi].name)}</div>
      <table class="contrib-table">
        <thead><tr><th style="text-align:left">자산군</th><th>목표비중</th><th>최종가치</th><th>실제비중</th></tr></thead>
        <tbody>${contribRows}</tbody>
      </table></div>`;
  }).join('');

  // ── Assemble HTML ──────────────────────────────────────────
  document.getElementById('resultsArea').innerHTML = `
    <div class="results-header">
      <div class="results-title">백테스트 결과</div>
      <div class="results-period">${periodStr} · ${settings.startYear}–${settings.endYear} 시뮬레이션</div>
      ${warnHTML}
    </div>

    <div class="section-card">
      <div class="section-title">① 자산 구성 비중</div>
      <div class="donut-row" id="donutRow"></div>
    </div>

    <div class="section-card">
      <div class="section-title">② 성과 요약</div>
      <div style="overflow-x:auto"><table class="perf-table">
        <thead><tr><th>지표</th>${thCols}</tr></thead>
        <tbody>${perfRows}</tbody>
      </table></div>
    </div>

    <div class="section-card">
      <div class="section-title" style="display:flex;justify-content:space-between;align-items:center">
        <span>③ 포트폴리오 성장 추이</span>
        <div style="display:flex;align-items:center;gap:.75rem">
          <button class="log-toggle" id="logToggle" onclick="toggleLog()">로그 스케일</button>
          <div class="legend-row" id="growthLegend"></div>
        </div>
      </div>
      <div class="chart-wrap" style="height:340px"><canvas id="growthChart"></canvas></div>
    </div>

    <div class="section-card">
      <div class="section-title">④ 연도별 수익률</div>
      <div class="chart-wrap" style="height:280px"><canvas id="annualChart"></canvas></div>
    </div>

    <div class="section-card">
      <div class="section-title">⑤ 리스크 / 수익률 상세 지표</div>
      <div style="overflow-x:auto"><table class="perf-table">
        <thead><tr><th>지표</th>${thCols}</tr></thead>
        <tbody>${riskRows}</tbody>
      </table></div>
    </div>

    <div class="section-card">
      <div class="section-title">⑥ 낙폭 차트</div>
      <div class="chart-wrap" style="height:220px"><canvas id="ddChart"></canvas></div>
    </div>

    <div class="section-card">
      <div class="section-title">⑦ 역사적 위기 구간 성과</div>
      <div style="overflow-x:auto"><table class="crisis-table">
        <thead><tr><th>위기 구간</th>${thCols}</tr></thead>
        <tbody>${crisisRows}</tbody>
      </table></div>
    </div>

    <div class="section-card">
      <div class="section-title">⑧ 롤링 수익률 테이블</div>
      ${rollingHTML}
    </div>

    <div class="section-card">
      <div class="section-title">⑨ 자산별 성과</div>
      ${assetPerfHTML}
    </div>

    <div class="section-card">
      <div class="section-title">⑩ 상관계수 히트맵</div>
      <div class="section-sub">포트폴리오 내 자산군 간 월별 수익률 기반 피어슨 상관계수</div>
      ${heatmapHTML||'<div style="color:var(--text3);font-size:.82rem">자산이 2개 이상인 포트폴리오에서 표시됩니다.</div>'}
    </div>

    <div class="section-card">
      <div class="section-title">⑪ 수익 기여도 분해</div>
      ${contribHTML}
    </div>

    <div class="disclaimer">
      <b>데이터 출처 및 한계</b><br>
      Yahoo Finance 무료 API와 한국은행 ECOS 통계를 사용합니다.
      KOSPI(^KS11), 코스닥(^KQ11), 미국 대형주(S&P 500 지수 ^GSPC, 1928년~), 미국 소형주(Russell 2000 ^RUT, 1987년~)는 실제 지수 데이터를 사용합니다.
      그 외 자산(선진국·이머징·글로벌 리츠·원자재·금 등)은 상장 ETF(VEA, VWO, GLD, VNQ 등)의 수정주가를 사용하며,
      운용보수와 추적오차로 인해 실제 지수 대비 수익률에 차이가 있을 수 있습니다.
      ETF 상장 이전 구간(예: GLD 2004년 이전, VWO·VGK 2005년 이전, VNQI 2010년 이전)은 유사 ETF 데이터로 연장·대체합니다.
      국내 채권과 현금(콜금리)은 한국은행 ECOS 금리 통계를 기반으로 월간 수익률을 추산합니다.<br>
      거래비용·세금·슬리피지 미반영. 배당은 수정주가(Adj Close)에 근사 반영. 무위험수익률 기준: 연 3.0%. 본 도구는 투자 자문이 아닙니다.
    </div>`;

  document.getElementById('resultsArea').style.display = 'block';
  document.getElementById('emptyState').style.display = 'none';

  // Build charts after DOM is ready
  setTimeout(()=>buildCharts(results, ports, sortedMonths, settings), 80);
}

// ── Charts ─────────────────────────────────────────────────────
let _logScale = false;
function toggleLog(){
  _logScale = !_logScale;
  document.getElementById('logToggle').classList.toggle('active', _logScale);
  // Rebuild growth chart
  const gc = _charts.find(c=>c.canvas?.id==='growthChart');
  if(gc){ gc.options.scales.y.type = _logScale?'logarithmic':'linear'; gc.update(); }
}

function buildCharts(results, ports, sortedMonths, settings){
  const isDark = matchMedia('(prefers-color-scheme:dark)').matches;
  const gc = isDark?'rgba(255,255,255,.06)':'rgba(0,0,0,.06)';
  const tc = isDark?'#5C5A54':'#A09E97';
  const chartDefaults = {
    responsive:true, maintainAspectRatio:false,
    plugins:{legend:{display:false}, tooltip:{mode:'index',intersect:false}},
  };

  // ── Donut charts (asset allocation) ───────────────────────
  const donutColors = ['#4E79A7','#F28E2B','#E15759','#76B7B2','#59A14F','#EDC948','#B07AA1','#FF9DA7','#9C755F','#BAB0AC'];
  const donutRow = document.getElementById('donutRow');
  if(donutRow){
    results.forEach((r,pi)=>{
      if(!r) return;
      const wrap = document.createElement('div');
      wrap.className = 'donut-wrap';
      wrap.innerHTML = `<div style="font-size:.8rem;font-weight:500;color:${P_COLORS[pi]};text-align:center;margin-bottom:.5rem">${escHtml(ports[pi].name)}</div><div style="position:relative;height:220px"><canvas id="donut${pi}"></canvas></div>`;
      donutRow.appendChild(wrap);
    });
    results.forEach((r,pi)=>{
      if(!r) return;
      const ctx = document.getElementById(`donut${pi}`);
      if(!ctx) return;
      const labels = r.assets.map(a=>ASSET_DEF[a.id]?.name||a.id);
      const data = r.assets.map(a=>Math.round(a.w*1000)/10);
      const c = new Chart(ctx,{
        type:'doughnut',
        data:{labels, datasets:[{data, backgroundColor:donutColors.slice(0,labels.length), borderWidth:0}]},
        options:{
          responsive:true, maintainAspectRatio:false,
          plugins:{
            legend:{display:true,position:'right',labels:{color:tc,font:{size:10},boxWidth:12,padding:6}},
            tooltip:{callbacks:{label:ctx=>`${ctx.label}: ${ctx.parsed}%`}},
          },
          cutout:'65%',
        }
      });
      _charts.push(c);
    });
  }

  // ── Growth chart (万원 on Y axis) ─────────────────────────
  const growthDatasets = results.map((r,pi)=>{
    if(!r) return null;
    const valMap = {};
    r.monthlyValues.forEach(p=>{ valMap[`${p.y}-${p.m}`]=p.value/10000; });
    return {
      label: ports[pi].name,
      data: sortedMonths.map(k=>valMap[k]??null),
      borderColor: P_COLORS[pi], borderWidth:2, pointRadius:0, tension:.3, fill:false, spanGaps:false,
    };
  }).filter(Boolean);

  const growthCtx = document.getElementById('growthChart');
  if(growthCtx){
    const labels = sortedMonths.map(k=>{ const[y,m]=k.split('-'); return m==='1'?y:''; });
    const c = new Chart(growthCtx, {
      type:'line', data:{labels, datasets:growthDatasets},
      options:{...chartDefaults,
        scales:{
          x:{ticks:{color:tc,font:{size:10,family:'IBM Plex Mono'},autoSkip:false,maxRotation:0,callback:val=>labels[val]||null},grid:{color:gc}},
          y:{type:'linear',ticks:{color:tc,font:{size:10,family:'IBM Plex Mono'},callback:v=>v.toLocaleString('ko-KR')+'만'},grid:{color:gc}},
        },
        plugins:{...chartDefaults.plugins, tooltip:{...chartDefaults.plugins.tooltip, callbacks:{
          label: ctx=>`${ctx.dataset.label}: ${Math.round(ctx.parsed.y).toLocaleString('ko-KR')}만원`
        }}},
      }
    });
    _charts.push(c);

    // Legend
    const leg = document.getElementById('growthLegend');
    if(leg) leg.innerHTML = growthDatasets.map(d=>`
      <span class="legend-item"><span class="legend-dot" style="background:${d.borderColor}"></span>${escHtml(d.label)}</span>`).join('');
  }

  // ── Annual bar chart ──────────────────────────────────────
  const annualCtx = document.getElementById('annualChart');
  if(annualCtx){
    const allYears = new Set();
    results.forEach(r=>r&&r.annualRets.forEach(a=>allYears.add(a.year)));
    const years = [...allYears].sort();
    const annDatasets = results.map((r,pi)=>{
      if(!r) return null;
      const retMap = {};
      r.annualRets.forEach(a=>{ retMap[a.year]=a.ret; });
      return {
        label:ports[pi].name,
        data: years.map(y=>retMap[y]??null),
        backgroundColor: years.map(y=>{
          const v = retMap[y];
          if(v==null) return 'transparent';
          return v>=0 ? P_COLORS[pi] : P_COLORS[pi]+'88';
        }),
        borderColor: P_COLORS[pi], borderWidth:1,
      };
    }).filter(Boolean);

    const c = new Chart(annualCtx, {
      type:'bar', data:{labels:years, datasets:annDatasets},
      options:{...chartDefaults,
        scales:{
          x:{ticks:{color:tc,font:{size:10}},grid:{color:gc}},
          y:{ticks:{color:tc,font:{size:10,family:'IBM Plex Mono'},callback:v=>(v>=0?'+':'')+v+'%'},grid:{color:gc}},
        },
        plugins:{...chartDefaults.plugins, tooltip:{...chartDefaults.plugins.tooltip,callbacks:{
          label:ctx=>`${ctx.dataset.label}: ${pctFmt(ctx.parsed.y)}`
        }}},
      }
    });
    _charts.push(c);
  }

  // ── Drawdown chart ────────────────────────────────────────
  const ddCtx = document.getElementById('ddChart');
  if(ddCtx){
    const ddDatasets = results.map((r,pi)=>{
      if(!r) return null;
      let peak = r.monthlyValues[0].value;
      const ddVals = r.monthlyValues.map(p=>{
        if(p.value>peak) peak=p.value;
        return -((peak-p.value)/peak*100);
      });
      const valMap = {};
      r.monthlyValues.forEach((p,i)=>{ valMap[`${p.y}-${p.m}`]=ddVals[i]; });
      return {
        label:ports[pi].name,
        data:sortedMonths.map(k=>valMap[k]??null),
        borderColor:P_COLORS[pi], borderWidth:1.5, pointRadius:0, tension:.2, fill:true,
        backgroundColor:P_BG[pi], spanGaps:false,
      };
    }).filter(Boolean);

    const labels2 = sortedMonths.map(k=>{ const[y,m]=k.split('-'); return m==='1'?y:''; });
    const c = new Chart(ddCtx, {
      type:'line', data:{labels:labels2, datasets:ddDatasets},
      options:{...chartDefaults,
        scales:{
          x:{ticks:{color:tc,font:{size:10},autoSkip:false,maxRotation:0,callback:val=>labels2[val]||null},grid:{color:gc}},
          y:{ticks:{color:tc,font:{size:10,family:'IBM Plex Mono'},callback:v=>v.toFixed(0)+'%'},grid:{color:gc}},
        },
      }
    });
    _charts.push(c);
  }
}

function pctFmt(v){ return (v>=0?'+':'')+v.toFixed(2)+'%'; }

function corrColor(v){
  if(v>=0.7)  return {bg:'#F5C4B3',fg:'#4A1B0C'};
  if(v>=0.3)  return {bg:'#FAC775',fg:'#412402'};
  if(v>=-0.3) return {bg:'#E1F5EE',fg:'#085041'};
  return {bg:'#B5D4F4',fg:'#042C53'};
}

// ── Loading helpers ────────────────────────────────────────────
function showLoading(){
  document.getElementById('emptyState').style.display='none';
  document.getElementById('resultsArea').style.display='none';
  document.getElementById('loadingState').style.display='flex';
}
function hideLoading(){
  document.getElementById('loadingState').style.display='none';
}
function renderLoadingSteps(steps){
  document.getElementById('loadingSteps').innerHTML = steps.map((s,i)=>
    `<div class="loading-step" id="lstep-${i}"><span class="step-dot"></span>${escHtml(s)}</div>`
  ).join('');
}
function updateStep(i,st){
  const el=document.getElementById(`lstep-${i}`); if(!el) return;
  el.className='loading-step '+st;
  if(st==='done') el.querySelector('.step-dot').style.background='var(--green)';
}

// ── Debug panel ────────────────────────────────────────────────
function debugClear(){
  const body = document.getElementById('debugBody');
  if(body) body.innerHTML = '';
  const panel = document.getElementById('debugPanel');
  if(panel) panel.style.display = 'none';
}
function debugLog(category, label, data){
  const panel = document.getElementById('debugPanel');
  const body  = document.getElementById('debugBody');
  if(!panel || !body) return;
  panel.style.display = 'block';
  const el = document.createElement('div');
  el.className = 'debug-entry';
  const dataStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  el.innerHTML = `<div class="debug-entry-head"><span class="debug-cat">[${escHtml(category)}]</span><span class="debug-label">${escHtml(String(label))}</span></div><pre class="debug-pre">${escHtml(dataStr)}</pre>`;
  body.appendChild(el);
  body.scrollTop = body.scrollHeight;
}

// ── Utilities ──────────────────────────────────────────────────
function escHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
