import { G, getPlayerNation, hasAnySave, initGame, loadFromSlot, saveToSlot, autoSave, loadAchievements } from './state.js';
import { pick, rand, clamp, RACE_DATA, RACE_KEYS, isMale, genderText, genderClass, formatWealth, wealthToCopper, addWealth, getDateString, timeStr } from './data.js';
import { renderAll, switchPage, renderSettings } from './render.js';
import { advanceTime, goToPlace, quickGoTo, interactChar, recruitCharToHarem, buildChamberForPending, cancelPendingHarem, visitChamber, doIntimacy, talkToConcubine, renameSubject, renameNation, showNationDiplomacy, startDiplomacy, sendMessenger, executeDiplomacy, completeDiplomacy, showAuctionHouse, handlePlaceEvent } from './actions.js';

// ========== 弹窗系统 ==========
export function showModal(title, body, actions) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = body;
    const act = document.getElementById('modalActions');
    act.innerHTML = '';
    if(actions) actions.forEach(a => {
        const b = document.createElement('button');
        b.className = 'btn btn-sm';
        b.textContent = a.text;
        b.addEventListener('click', a.action);
        act.appendChild(b);
    });
    document.getElementById('modal-overlay').classList.add('show');
}

export function closeModal() {
    document.getElementById('modal-overlay').classList.remove('show');
}

// ========== 头像相关 ==========
export function loadAvatarFromStorage() {
    try{ const s=localStorage.getItem('queen_avatar_data'); if(s){ const d=JSON.parse(s); if(d?.type==='custom'&&d.url){ G.player.avatarData=d.url; G.player.avatar='custom'; return true; } else if(d?.type==='emoji'&&d.emoji){ G.player.avatar=d.emoji; G.player.avatarData=null; return true; } } }catch(e){}
    return false;
}
export function saveAvatarToStorage(type,value){ try{ const d={type}; if(type==='custom') d.url=value; else d.emoji=value; localStorage.setItem('queen_avatar_data',JSON.stringify(d)); }catch(e){ G.player.avatar='👑'; G.player.avatarData=null; } }
export function setAvatarEmoji(emoji){ G.player.avatar=emoji; G.player.avatarData=null; saveAvatarToStorage('emoji',emoji); renderTopbar(); }
export function setAvatarImage(base64){ if(!base64||base64.length<100){ setAvatarEmoji('👑'); return; } G.player.avatar='custom'; G.player.avatarData=base64; saveAvatarToStorage('custom',base64); renderTopbar(); }
export function showAvatarChangeModal() {
    const preview = G.player.avatar==='custom'&&G.player.avatarData ? `<img src="${G.player.avatarData}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:2px solid var(--gold);">` : `<span style="font-size:2.4em;">${G.player.avatar||'👑'}</span>`;
    const body = `<div style="display:flex;flex-direction:column;align-items:center;gap:8px;"><div style="text-align:center;"><div style="font-size:0.65em;color:var(--text-dim);">当前头像</div><div style="width:64px;height:64px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.05);border:2px solid var(--gold);margin-top:2px;">${preview}</div></div><div style="display:flex;flex-direction:column;gap:4px;width:100%;"><div class="file-input-wrap" style="position:relative;overflow:hidden;display:block;width:100%;"><button class="btn btn-primary btn-block" style="pointer-events:none;font-size:0.75em;">📤 上传新图片</button><input type="file" id="avatarChangeInput" accept="image/*" style="position:absolute;left:0;top:0;opacity:0;width:100%;height:100%;cursor:pointer;"></div><button class="btn btn-sm btn-block" onclick="setAvatarEmoji('👑');closeModal();renderTopbar();">↩️ 恢复默认表情</button></div><div style="font-size:0.5em;color:var(--text-dim);">支持 JPG / PNG / GIF</div></div>`;
    showModal('📷 更换头像', body, []);
    const input = document.getElementById('avatarChangeInput');
    if(input) input.addEventListener('change', function(e){
        const file = e.target.files[0]; if(!file) return;
        const reader = new FileReader();
        reader.onload = ev => { setAvatarImage(ev.target.result); closeModal(); addLog('📷 已更换头像','highlight'); renderTopbar(); };
        reader.readAsDataURL(file);
        input.value = '';
    });
}

// ========== 存档管理界面 ==========
export function openSaveLoad() {
    let html = '<div style="font-size:0.7em;color:var(--text-dim);margin-bottom:4px;">槽位5为自动存档</div>';
    const MAX_SLOTS = 6;
    for(let i=0;i<MAX_SLOTS;i++) {
        const exists = localStorage.getItem('queen_slot_'+i);
        const isAuto = i===5;
        html += `<div class="save-slot ${isAuto?'auto':''}"><div><b>槽位 ${i+1}${isAuto?' (自动)':''}</b> ${exists?'💾 有存档':'🕳️ 空'}</div><div class="slot-actions">`;
        if(exists) {
            html += `<button class="btn btn-sm" onclick="loadSlot(${i})">📤 读取</button>`;
            html += `<button class="btn btn-sm btn-danger" onclick="deleteSlot(${i})">🗑️ 删除</button>`;
        } else {
            html += `<button class="btn btn-sm btn-primary" onclick="saveSlot(${i})">💾 保存</button>`;
        }
        html += `</div></div>`;
    }
    html += '<button class="btn btn-sm" onclick="closeModal()">关闭</button>';
    showModal('📂 存档管理', html, []);
}

export function saveSlot(idx) {
    saveToSlot(idx);
    addLog(`💾 存档 ${idx+1}`,'highlight');
    closeModal();
    openSaveLoad(); // 刷新列表
}

export function loadSlot(idx) {
    if(loadFromSlot(idx)){
        addLog(`📤 读取存档 ${idx+1}`,'highlight');
        closeModal();
        renderAll();
        switchPage('queen');
    } else {
        showModal('❌ 读取失败','存档为空或损坏。',[{text:'知道了',action:closeModal}]);
    }
}

export function deleteSlot(idx) {
    if(confirm(`确定删除槽位 ${idx+1} 的存档吗？`)) {
        localStorage.removeItem('queen_slot_'+idx);
        addLog(`🗑️ 删除存档 ${idx+1}`,'danger');
        closeModal();
        openSaveLoad();
    }
}

// ========== 主题 ==========
const THEMES = {royal:{primary:'#d4a74a',secondary:'#f0d080',bg:'#1a1410'},purple:{primary:'#a855f7',secondary:'#c084fc',bg:'#1a1025'},ruby:{primary:'#e84393',secondary:'#fd79a8',bg:'#1a0a0a'},emerald:{primary:'#2ecc71',secondary:'#55efc4',bg:'#0a1a0a'},sapphire:{primary:'#3498db',secondary:'#74b9ff',bg:'#0a0a1a'}};
export function applyTheme(name){ const t=THEMES[name]; if(!t) return; G.currentTheme=name; const r=document.documentElement; r.style.setProperty('--gold',t.primary); r.style.setProperty('--gold-light',t.secondary); r.style.setProperty('--dark',t.bg); r.style.setProperty('--dark-card',t.bg+'f0'); localStorage.setItem('queen_theme',name); }
export function loadTheme(){ const s=localStorage.getItem('queen_theme'); if(s&&THEMES[s]) applyTheme(s); }

// ========== 设置相关 ==========
export function setAutoMode(mode){ G.autoSaveMode=mode; addLog(`🤖 自动存档：${mode}`); renderSettings(); }
export function setLogSyncMode(mode){ G.logSyncMode=mode; addLog(`📜 日志同步：${mode==='all'?'全部':mode==='none'?'关闭':'仅相关'}`,'highlight'); renderSettings(); }

// ========== 开始界面 ==========
let startAvatarType='👑', startAvatarData=null, selectedRace='狼族';
const AVATARS=['👑','💎','🌙','⭐','🌺','✨'];

export function renderStartScreen() {
    const avatarsHtml = AVATARS.map(a=>`<div class="avatar-opt ${a===startAvatarType?'selected':''}" data-avatar="${a}">${a}</div>`).join('');
    const previewHtml = startAvatarType==='custom'&&startAvatarData? `<img src="${startAvatarData}" alt="头像">` : `<span class="emoji">${startAvatarType||'👑'}</span>`;
    const raceGridHtml = RACE_KEYS.map(r=>`<div class="race-opt ${selectedRace===r?'selected':''}" data-race="${r}"><span class="race-emoji">${RACE_DATA[r].emoji}</span>${r}</div>`).join('');
    document.getElementById('content').innerHTML = `<div class="start-screen"><div class="title">👑 兽世女王</div><div class="sub">～ 选国族 · 立王朝 ～</div><div class="start-avatar-upload"><div class="preview" id="startAvatarPreview">${previewHtml}</div><div style="display:flex;gap:3px;flex-wrap:wrap;justify-content:center;"><div class="file-input-wrap"><button class="btn btn-primary" style="pointer-events:none;font-size:0.6em;">📤 上传</button><input type="file" id="startAvatarInput" accept="image/*"></div><button class="btn btn-sm" onclick="resetStartAvatar()">↩️</button></div></div><div class="avatar-grid" id="startEmojiGrid">${avatarsHtml}</div><div class="input-group"><label>✏️ 你的名字</label><input type="text" id="nameInput" value="漓洛" maxlength="10"></div><div class="input-group"><label>🏛️ 王国名称</label><input type="text" id="nationNameInput" value="苍月国" maxlength="12"></div><div style="font-weight:600;color:var(--gold-light);font-size:0.6em;margin-top:2px;">🏛️ 选择国民族群</div><div class="race-grid">${raceGridHtml}</div><button class="start-btn" onclick="startGame()" style="margin-top:6px;">👑 登基</button>${hasAnySave()?'<button class="btn btn-sm" onclick="loadLastSave()" style="margin-top:4px;">📤 读取最近存档</button>':''}<div style="font-size:0.4em;color:var(--text-dim);margin-top:4px;">💰 1金=1000银=1,000,000铜</div></div>`;
    document.querySelectorAll('#startEmojiGrid .avatar-opt').forEach(el=> el.addEventListener('click',function(){ document.querySelectorAll('#startEmojiGrid .avatar-opt').forEach(o=>o.classList.remove('selected')); this.classList.add('selected'); startAvatarType=this.dataset.avatar; startAvatarData=null; updateStartAvatarPreview(); }));
    document.querySelectorAll('.race-opt').forEach(el=> el.addEventListener('click',function(){ document.querySelectorAll('.race-opt').forEach(o=>o.classList.remove('selected')); this.classList.add('selected'); selectedRace=this.dataset.race; }));
    const fi=document.getElementById('startAvatarInput'); if(fi) fi.addEventListener('change',function(e){ const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=ev=>{ startAvatarType='custom'; startAvatarData=ev.target.result; updateStartAvatarPreview(); document.querySelectorAll('#startEmojiGrid .avatar-opt').forEach(o=>o.classList.remove('selected')); }; r.readAsDataURL(f); fi.value=''; });
    document.getElementById('topbar').style.display='none'; document.getElementById('navbar').style.display='none';
}

export function updateStartAvatarPreview(){ const p=document.getElementById('startAvatarPreview'); if(p) p.innerHTML = startAvatarType==='custom'&&startAvatarData? `<img src="${startAvatarData}" alt="头像">` : `<span class="emoji">${startAvatarType||'👑'}</span>`; }
export function resetStartAvatar(){ startAvatarType='👑'; startAvatarData=null; updateStartAvatarPreview(); document.querySelectorAll('#startEmojiGrid .avatar-opt').forEach(o=>{ o.classList.remove('selected'); if(o.dataset.avatar=='👑') o.classList.add('selected'); }); }

export function startGame(){ const name=document.getElementById('nameInput').value.trim()||'漓洛'; const nn=document.getElementById('nationNameInput').value.trim()||'苍月国'; let at=startAvatarType, ad=startAvatarData; if(at==='custom'&&(!ad||ad.length<100)){ at='👑'; ad=null; } initGame(name,at,ad,nn,selectedRace); }

export function loadLastSave(){ for(let i=5;i>=0;i--) if(loadFromSlot(i)){ document.getElementById('topbar').style.display='flex'; document.getElementById('navbar').style.display='flex'; renderAll(); switchPage('queen'); addLog(`📤 读取存档 ${i+1}`,'highlight'); return; } showModal('❌ 无存档','没有找到可读取的存档。',[{text:'知道了',action:closeModal}]); }

export function confirmRestart(){ showModal('🔄 重新开始','确定重新开始吗？',[{text:'✅ 确认',action:()=>{closeModal();restartGame();}},{text:'❌ 取消',action:closeModal}]); }
export function restartGame(){
    // 重置 G 但保留部分设置（主题、自动存档模式等）
    const theme = G.currentTheme;
    const autoMode = G.autoSaveMode;
    G = { /* 重新初始化，但保留设置 */ };
    // 实际上需要重新构建整个状态，我们直接调用 initGame 会覆盖，但我们希望保留设置，所以简单重置
    location.reload(); // 最简单方式
}