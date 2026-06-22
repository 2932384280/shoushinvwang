import { G, getPlayerNation, hasAnySave, initGame, loadFromSlot, saveToSlot, autoSave, loadAchievements, addLog } from './state.js';
import { renderAll, switchPage, renderSettings, renderTopbar } from './render.js';
import { RACE_DATA, RACE_KEYS } from './data.js';

// ========== 弹窗系统 ==========
export function showModal(title, body, actions) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = body;
    const act = document.getElementById('modalActions');
    act.innerHTML = '';
    if (actions) actions.forEach(a => {
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
export function loadAvatarFromStorage() { /* 同前 */ }
export function saveAvatarToStorage(type, value) { /* 同前 */ }
export function setAvatarEmoji(emoji) { /* 同前，调用 renderTopbar */ }
export function setAvatarImage(base64) { /* 同前 */ }
export function showAvatarChangeModal() { /* 同前 */ }

// ========== 存档管理界面 ==========
export function openSaveLoad() { /* 同前，调用 loadSlot/saveSlot/deleteSlot */ }
export function saveSlot(idx) { saveToSlot(idx); addLog(`💾 存档 ${idx+1}`, 'highlight'); closeModal(); openSaveLoad(); }
export function loadSlot(idx) { if (loadFromSlot(idx)) { addLog(`📤 读取存档 ${idx+1}`, 'highlight'); closeModal(); renderAll(); switchPage('queen'); } else showModal(...); }
export function deleteSlot(idx) { /* 同前 */ }

// ========== 主题 ==========
const THEMES = { royal: { primary: '#d4a74a', secondary: '#f0d080', bg: '#1a1410' }, /* ... */ };
export function applyTheme(name) { /* 同前 */ }
export function loadTheme() { /* 同前 */ }

// ========== 设置相关 ==========
export function setAutoMode(mode) { G.autoSaveMode = mode; addLog(`🤖 自动存档：${mode}`); renderSettings(); }
export function setLogSyncMode(mode) { G.logSyncMode = mode; addLog(`📜 日志同步：${mode === 'all' ? '全部' : mode === 'none' ? '关闭' : '仅相关'}`, 'highlight'); renderSettings(); }

// ========== 开始界面 ==========
let startAvatarType = '👑', startAvatarData = null, selectedRace = '狼族';
const AVATARS = ['👑', '💎', '🌙', '⭐', '🌺', '✨'];
export function renderStartScreen() { /* 同前 */ }
export function updateStartAvatarPreview() { /* 同前 */ }
export function resetStartAvatar() { /* 同前 */ }

export function startGame() {
    const name = document.getElementById('nameInput').value.trim() || '漓洛';
    const nn = document.getElementById('nationNameInput').value.trim() || '苍月国';
    let at = startAvatarType, ad = startAvatarData;
    if (at === 'custom' && (!ad || ad.length < 100)) { at = '👑'; ad = null; }
    // 初始化数据
    initGame(name, at, ad, nn, selectedRace);
    // ---- 显示 UI ----
    document.getElementById('topbar').style.display = 'flex';
    document.getElementById('navbar').style.display = 'flex';
    renderAll();
    switchPage('queen');
    autoSave();
    // 显示欢迎弹窗
    const pn = getPlayerNation();
    const loc = pn?.environment || '北境之地';
    const neigh = G.nations.filter(n => n.id !== pn?.id).slice(0, 3).map(n => n.name).join('、');
    showModal('👑 兽历360年 · 新王登基', `兽历360年，${G.player.name}带领${G.player.race}部族在${loc}自封为王，\n同时与邻国${neigh || '诸国'}进行了初步外交。\n\n🌱 新手引导：\n1. 点击「地点」探索王宫与王都\n2. 在「角色」页面结识臣子与兽人\n3. 在「国家」页面与其他国度建立外交\n4. 后宫、子嗣、征战……尽在掌握\n\n📌 距离近的国家可直接外交，远国需派遣使者（忠诚≥70的臣子）。\n📌 使者出访需要时间，且可能被拒绝。`, [{ text: '👑 开始统治', action: closeModal }]);
}

export function loadLastSave() { /* 同前 */ }
export function confirmRestart() { /* 同前 */ }
export function restartGame() { location.reload(); }