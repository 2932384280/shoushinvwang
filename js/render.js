import { G, getChar, getPlace, getNation, getPlayerNation, getNationPower, getNationDistance, addLog, addCharacterLog } from './state.js';
import { pick, rand, clamp, RACE_DATA, RACE_KEYS, isMale, genderText, genderClass, formatWealth, wealthToCopper, getDateString, timeStr, ALL_ACHIEVEMENTS } from './data.js';
import { applyTheme, setAutoMode, setLogSyncMode, openSaveLoad, confirmRestart } from './ui.js';
import { showModal, closeModal } from './ui.js'; // 已包含

// 定义主题常量
const THEMES = {
    royal: { primary: '#d4a74a', secondary: '#f0d080', bg: '#1a1410' },
    purple: { primary: '#a855f7', secondary: '#c084fc', bg: '#1a1025' },
    ruby: { primary: '#e84393', secondary: '#fd79a8', bg: '#1a0a0a' },
    emerald: { primary: '#2ecc71', secondary: '#55efc4', bg: '#0a1a0a' },
    sapphire: { primary: '#3498db', secondary: '#74b9ff', bg: '#0a0a1a' }
};

export function renderTopbar() {
    const p = G.player;
    const a = document.getElementById('headerAvatar');
    a.innerHTML = p.avatar === 'custom' && p.avatarData ? `<img src="${p.avatarData}" alt="头像">` : `<span class="emoji">${p.avatar || '👑'}</span>`;
    document.getElementById('headerName').textContent = p.name;
    const pn = getPlayerNation();
    document.getElementById('headerTitle').textContent = pn ? `👑 ${pn.name}女王` : '👑 兽世女王';
    document.getElementById('hHealth').textContent = p.health;
    document.getElementById('hpFill').style.width = (p.health / p.maxHealth * 100) + '%';
    document.getElementById('hStamina').textContent = p.stamina;
    document.getElementById('staminaFill').style.width = (p.stamina / 100 * 100) + '%';
    document.getElementById('hPrestige').textContent = p.prestige;
    document.getElementById('hMilitary').textContent = p.military;
    document.getElementById('hNation').textContent = pn ? pn.name : '无国';
    document.getElementById('hWealth').textContent = formatWealth(p.wealth);
    document.getElementById('hTreasury').textContent = p.treasury;
    document.getElementById('hDay').textContent = getDateString();
}

export function renderAll() {
    renderTopbar();
}

export function switchPage(page) {
    G.currentPage = page;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const t = document.getElementById('page-' + page);
    if (t) t.classList.add('active');
    const nb = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (nb) nb.classList.add('active');
    switch (page) {
        case 'queen': renderQueen(); break;
        case 'harem': renderHarem(); break;
        case 'places': renderPlaces(); break;
        case 'nations': renderNations(); break;
        case 'characters': renderCharacters(); break;
        case 'settings': renderSettings(); break;
        default: renderQueen();
    }
    renderTopbar();
}

export function renderQueen() {
    const p = G.player,
        pn = getPlayerNation(),
        rd = RACE_DATA[p.race];
    const stats = [
        { icon: '❤️', val: p.health + '/' + p.maxHealth, label: '生命' },
        { icon: '⚡', val: p.stamina + '/100', label: '体力' },
        { icon: '⭐', val: p.prestige, label: '威望' },
        { icon: '⚔️', val: p.military, label: '兵力' },
        { icon: '💖', val: p.charm, label: '魅力' },
        { icon: '🧠', val: p.intelligence, label: '智慧' },
        { icon: '👑', val: p.rule, label: '统治力' },
        { icon: '💰', val: formatWealth(p.wealth), label: '财富' },
        { icon: '🏦', val: p.treasury, label: '国库' }
    ];
    const statsHtml = stats.map(s => `<div class="stat-item"><div class="icon">${s.icon}</div><div class="value">${s.val}</div><div class="label">${s.label}</div></div>`).join('');
    const logs = G.logs.slice(0, 20).map(l => `<div class="log-entry ${l.cls}"><span class="time">${l.time}</span>${l.msg}</div>`).join('') || '<div class="empty">暂无记录</div>';
    const cp = getPlace(p.location);
    document.getElementById('content').innerHTML = `<div class="page active" id="page-queen">
        <div class="page-title">👑 女王 <small>— ${pn ? pn.name : '无国'} · ${rd ? rd.emoji : ''} ${p.race}</small></div>
        <div class="card"><div class="card-title">📊 我的属性</div><div class="grid-3">${statsHtml}</div></div>
        <div class="card"><div class="card-title">📍 当前位置</div><div style="display:flex;align-items:center;gap:4px;"><span style="font-size:1em;">${cp ? cp.icon : '📍'}</span><span style="font-weight:600;color:var(--gold-light);font-size:0.75em;">${cp ? cp.name : '未知'}</span><span style="font-size:0.55em;color:var(--text-dim);">${cp ? cp.desc : ''}</span></div></div>
        <div class="card"><div class="card-title">📜 女王日志</div><div style="max-height:150px;overflow-y:auto;">${logs}</div><div style="font-size:0.55em;color:var(--text-dim);margin-top:2px;">📌 日志同步模式：${G.logSyncMode === 'all' ? '全部' : G.logSyncMode === 'related' ? '仅相关' : '关闭'}</div></div></div>`;
}

export function renderHarem() {
    const haremChars = G.characters.filter(c => c.inHarem && c.chamberBuilt);
    const pending = G.characters.filter(c => c.inHarem && !c.chamberBuilt);
    let html = '';
    if (haremChars.length === 0 && pending.length === 0) html = '<div class="empty">💔 后宫空寂</div>';
    else {
        haremChars.forEach(c => {
            const status = c.pregnant ? '🤰 怀孕' : (c.healthStatus || '健康');
            html += `<div class="harem-card" style="border-left:3px solid ${isMale(c.gender) ? 'var(--male-color)' : 'var(--female-color)'};">
                <div class="avatar">${c.raceEmoji}</div><div class="info"><div class="name ${isMale(c.gender) ? 'male' : 'female'}">${c.name} ${genderText(c.gender)}</div>
                <div class="sub">❤️ ${c.affection} ｜ 🤝 ${c.loyalty} ｜ 🛏️ ${c.intimacyCount}次</div>
                <div class="tags"><span class="tag">状态：${status}</span><span class="tag">寝殿：${c.chamberName || '未命名'}</span></div></div></div>`;
        });
        if (pending.length) {
            html += `<div style="margin-top:10px;padding:6px;background:rgba(212,167,74,0.06);border-radius:8px;border:1px dashed var(--gold);"><div style="font-size:0.7em;color:var(--gold-light);">⏳ 待建造寝殿的妃子</div>`;
            pending.forEach(c => html += `<div style="display:flex;align-items:center;gap:6px;padding:4px 0;"><span>${c.raceEmoji}</span><span>${c.name}</span><button class="btn btn-sm btn-primary" onclick="buildChamberForPending(${c.id})">🏛️ 建造（50国库）</button><button class="btn btn-sm btn-danger" onclick="cancelPendingHarem(${c.id})">✖</button></div>`);
            html += `</div>`;
        }
    }
    const childrenHtml = G.children.length === 0 ? '<div class="empty">👶 尚无子嗣</div>' :
        '<div style="display:flex;flex-direction:column;gap:3px;">' + G.children.map(c => `<div class="harem-card" style="border-color:rgba(212,167,74,0.06);"><div class="avatar">${c.gender === '皇子' ? '👦' : '👧'}</div><div class="info"><div class="name" style="color:var(--gold-light);font-size:0.7em;">${c.name}</div><div class="sub">👨‍👦 父：${c.father} ｜ 母：${c.mother} ｜ ${c.gender} ｜ ${c.age}岁</div><div class="tags"><span class="tag">⭐ ${c.charm}</span><span class="tag">🌱 ${c.potential}</span></div></div></div>`).join('') + '</div>';
    document.getElementById('content').innerHTML = `<div class="page active" id="page-harem"><div class="page-title">💕 后宫 <small>— 妃子 · 子嗣</small></div><div style="font-size:0.7em;color:var(--text-dim);margin-bottom:4px;">妃子仅能在寝殿、后花园、宫医所活动。</div><div style="font-weight:600;color:var(--gold-light);font-size:0.7em;margin:4px 0 3px;">👑 妃子 (${haremChars.length})</div>${html}<div style="font-weight:600;color:var(--gold-light);font-size:0.7em;margin:8px 0 3px;">👶 子嗣 (${G.children.length})</div>${childrenHtml}</div>`;
}

export function renderHaremInterior() {
    let html = `<div style="padding:4px 0;"><div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><button class="btn btn-sm" onclick="goToPlace('qin_dian');renderPlaces();">🏰 返回王宫</button><span style="font-size:0.85em;font-weight:700;color:var(--gold-light);">💕 后宫内部</span></div><div class="place-card fixed-first" onclick="goToPlace('qin_dian');renderPlaces();" style="border-color:var(--gold);background:rgba(212,167,74,0.04);"><div class="icon">🛏️</div><div class="info"><div class="name">女王寝殿</div><div class="desc">你的寝殿</div></div><div class="status">📍</div></div>`;
    if (G.haremChambers.length === 0) html += '<div class="empty">暂无妃子寝殿</div>';
    else G.haremChambers.forEach(ch => {
        const owner = getChar(ch.ownerId);
        if (!owner) return;
        const status = owner.pregnant ? '🤰 孕中' : (owner.healthStatus || '健康');
        html += `<div class="place-card" onclick="visitChamber(${ch.id})"><div class="icon">🏛️</div><div class="info"><div class="name">${ch.name}</div><div class="desc">${owner.name} ｜ ${status} ｜ 侍寝${owner.intimacyCount}次</div></div><div class="status">➡️</div></div>`;
    });
    html += `<div style="margin-top:8px;"><button class="btn btn-sm" onclick="goToPlace('hou_hua_yuan');renderPlaces();">🌺 后花园</button> <button class="btn btn-sm" onclick="goToPlace('gong_yi_suo');renderPlaces();">💉 宫医所</button></div></div>`;
    document.getElementById('content').innerHTML = html;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    G.currentPage = 'harem_interior';
}

export function renderPlaces() {
    if (G.currentPage == 'harem_interior') { renderHaremInterior(); return; }
    const realm = G.player.realm;
    const placeList = G.places.filter(p => p.realm === realm).sort((a, b) => {
        if (a.fixed == 'first') return -1;
        if (b.fixed == 'first') return 1;
        if (a.fixed == 'last') return 1;
        if (b.fixed == 'last') return -1;
        return a.name.localeCompare(b.name, 'zh');
    });
    const realmNames = { palace: '🏰 王宫', city: '🏙️ 王都', outcity: '🌄 城外' };
    let html = `<div class="page active" id="page-places"><div class="page-title">🗺️ 地点 <small>— ${realmNames[realm]}</small></div><div style="display:flex;gap:3px;flex-wrap:wrap;margin-bottom:3px;">${realm !== 'palace' ? '<button class="btn btn-sm" onclick="quickGoTo(\'palace\')">🏰 回王宫</button>' : ''}${realm !== 'city' ? '<button class="btn btn-sm" onclick="quickGoTo(\'city\')">🏙️ 回王都</button>' : ''}${realm !== 'outcity' ? '<button class="btn btn-sm" onclick="quickGoTo(\'outcity\')">🌄 去城外</button>' : ''}</div>`;
    placeList.forEach(p => {
        const isCurrent = p.id === G.player.location;
        html += `<div class="place-card ${p.fixed == 'first' ? 'fixed-first' : p.fixed == 'last' ? 'fixed-last' : ''}" onclick="goToPlace('${p.id}')" style="${isCurrent ? 'border-color:var(--gold);background:rgba(212,167,74,0.04);' : ''}"><div class="icon">${p.icon}</div><div class="info"><div class="name">${p.name}${isCurrent ? ' 👈' : ''}</div><div class="desc">${p.desc}</div></div><div class="status unlocked">${isCurrent ? '📍' : '➡️'}</div></div>`;
    });
    html += '</div>';
    document.getElementById('content').innerHTML = html;
}

export function renderNations() {
    const pn = getPlayerNation();
    let html = `<div class="page active" id="page-nations"><div class="page-title">🌍 国家 <small>— ${G.nations.length}国并立</small></div>${pn ? '<div style="display:flex;gap:3px;flex-wrap:wrap;margin-bottom:3px;"><button class="btn btn-sm btn-primary" onclick="renameNation()">✏️ 改国名</button></div>' : ''}`;
    if (G.diplomacy.pending) html += `<span style="font-size:0.65em;color:var(--gold-light);">📨 外交进行中：${G.diplomacy.pending.targetName}（剩余${G.diplomacy.pending.remainingDays}天）</span>`;
    G.nations.forEach(n => {
        const isPlayer = n.isPlayer;
        const power = Math.round(getNationPower(n));
        const rel = !isPlayer && pn ? (n.relations[pn.id] || 0) : '—';
        const relText = isPlayer ? '本国' : rel > 30 ? '🤝 友好' : rel > 10 ? '😊 中立' : rel > -10 ? '😐 冷淡' : rel > -30 ? '😤 敌视' : '⚔️ 敌对';
        const canDip = !isPlayer && (!pn || getNationDistance(pn, n) <= 50);
        html += `<div class="nation-card ${canDip ? '' : 'diplomacy-disabled'}" style="border-color:${isPlayer ? 'var(--gold)' : 'rgba(255,255,255,0.04)'};" ${!isPlayer ? `onclick="showNationDiplomacy(${n.id})"` : ''}><div style="font-size:1.3em;width:28px;text-align:center;">${n.raceEmoji}</div><div class="info"><div class="name">${n.name}${isPlayer ? ' 👑' : ''}</div><div class="desc">${n.desc}</div><div style="font-size:0.5em;color:var(--text-dim);">🏞️ ${n.environment || ''} ｜ 国力 ${power} ｜ ${n.race}</div></div><div class="status">${isPlayer ? '👑' : n.vassal === pn?.id ? '📜 附属' : n.ally === pn?.id ? '🤝 盟友' : relText}</div></div>`;
    });
    html += '</div>';
    document.getElementById('content').innerHTML = html;
}

let currentCharCategory = 'all';
export function renderCharacters() {
    const pn = getPlayerNation();
    const allChars = G.characters;
    const categories = {
        all: { label: '全部', filter: c => c.met },
        minister: { label: '臣子', filter: c => c.met && c.nation === pn?.id && c.isMinister },
        harem: { label: '后宫', filter: c => c.inHarem },
        subject: { label: '臣民', filter: c => c.met && c.nation === pn?.id && !c.isMinister && !c.inHarem && !c.isRuler },
        foreign: { label: '外国', filter: c => c.met && c.nation && c.nation !== pn?.id }
    };
    const tabsHtml = Object.entries(categories).map(([key, cat]) => `<button class="cat-tab ${currentCharCategory === key ? 'active' : ''}" onclick="setCharCategory('${key}')">${cat.label} (${allChars.filter(cat.filter).length})</button>`).join('');
    const display = categories[currentCharCategory]?.filter(allChars) || allChars.filter(c => c.met);
    display.sort((a, b) => {
        if (a.isMinister !== b.isMinister) return a.isMinister ? -1 : 1;
        if ((a.nation === pn?.id) !== (b.nation === pn?.id)) return a.nation === pn?.id ? -1 : 1;
        return a.name.localeCompare(b.name);
    });
    const charsHtml = display.length ? display.map(c => {
        const isPN = c.nation === pn?.id;
        const statusText = c.isRuler ? '👑 国王' : c.inHarem ? '💕 妃子' : c.isMinister ? '📜 臣子' : isPN ? '📋 臣民' : '🌍 外国';
        const roleText = c.role ? ` 📌 ${c.role}` : '';
        const ageColor = (c.race !== '人鱼族' && c.age > 80) || (c.race === '人鱼族' && c.age > 400) ? 'color:#e8a080;' : '';
        const nation = c.nation ? getNation(c.nation) : null;
        return `<div class="char-card ${genderClass(c.gender)}" onclick="showCharDetail(${c.id})"><div class="avatar">${c.raceEmoji}</div><div class="info"><div class="name">${c.name} ${genderText(c.gender)}${roleText}</div><div class="sub" style="${ageColor}">${c.race} ｜ ${c.age}岁 ｜ ${nation ? nation.name : '无国籍'}</div><div class="tags"><span class="tag">❤️ ${c.affection}</span><span class="tag">⚔️ ${c.combat}</span><span class="tag">📖 ${c.talent}</span><span class="tag">${c.level}级</span></div></div><div class="status">${statusText}</div></div>`;
    }).join('') : '<div class="empty">该分类暂无角色</div>';
    document.getElementById('content').innerHTML = `<div class="page active" id="page-characters"><div class="page-title">👥 角色 <small>— ${G.characters.length}人</small></div><div class="category-tabs" style="display:flex;gap:3px;flex-wrap:wrap;margin-bottom:4px;">${tabsHtml}</div>${charsHtml}<div style="margin-top:4px;"><button class="btn btn-sm" onclick="showCharsHelp()">📖 说明</button></div></div>`;
}
export function setCharCategory(cat) { currentCharCategory = cat;
    renderCharacters(); }

export function showCharDetail(id) {
    const c = getChar(id);
    if (!c) return;
    const pn = getPlayerNation();
    const nation = c.nation ? getNation(c.nation) : null;
    const isPN = c.nation === pn?.id;
    const appearanceText = c.appearance ? `${c.appearance.hair}，${c.appearance.eyes}，${c.appearance.aura || ''}` : '未知';
    let relationsHtml = '';
    if (c.relations?.length) {
        relationsHtml = '<div style="font-weight:600;color:var(--gold-light);font-size:0.7em;margin:3px 0;">🔗 关系网</div><div class="relation-tree">';
        c.relations.forEach(rel => {
            const target = getChar(rel.targetId);
            if (target) {
                if (target.met) relationsHtml += `<div class="rel-item"><span style="color:var(--text-dim);">${rel.type}：</span><span style="color:var(--text-main);cursor:pointer;text-decoration:underline;" onclick="closeModal();showCharDetail(${target.id})">${target.name}（${target.race}）</span></div>`;
                else relationsHtml += `<div class="rel-item"><span style="color:var(--text-dim);">${rel.type}：</span><span style="color:var(--text-dim);">${target.name}（${target.race}）</span></div>`;
            } else relationsHtml += `<div class="rel-item"><span style="color:var(--text-dim);">${rel.type}：</span><span style="color:var(--text-dim);">（未知）</span></div>`;
        });
        relationsHtml += '</div>';
    } else relationsHtml = '<div style="font-size:0.6em;color:var(--text-dim);">暂无关系</div>';
    const ageWarning = (c.race !== '人鱼族' && c.age > 80) || (c.race === '人鱼族' && c.age > 400) ? ' ⚠️ 年事已高' : '';
    const hasSpouse = c.relations?.some(r => r.type === '配偶');
    const canMarry = c.isMale && !c.inHarem && c.affection >= 50 && !(c.isRuler && c.nation !== pn?.id) && !hasSpouse;

    const detailHtml = `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;"><span style="font-size:1.8em;">${c.raceEmoji}</span><div><div style="font-weight:700;font-size:1em;color:${isMale(c.gender) ? 'var(--male-color)' : 'var(--female-color)'};">${c.name} ${genderText(c.gender)}</div><div style="font-size:0.6em;color:var(--text-dim);">${c.race} · ${c.gender} · ${c.age}岁${ageWarning}${nation ? ' · ' + nation.name : ''}</div>${c.role ? `<div style="font-size:0.6em;color:var(--gold-light);">📌 ${c.role}</div>` : ''}</div></div><hr><div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 6px;font-size:0.7em;color:#d0c0b0;margin:3px 0;"><span style="color:var(--text-dim);">种族特性</span><span>${c.raceTrait}</span><span style="color:var(--text-dim);">食性</span><span>${c.raceType}</span><span style="color:var(--text-dim);">性格</span><span>${c.personality?.join('、') || '—'}</span><span style="color:var(--text-dim);">外貌</span><span>${appearanceText}</span>${c.appearance?.feature && c.appearance.feature !== '无特殊标记' ? `<span style="color:var(--text-dim);">特征</span><span>${c.appearance.feature}</span>` : ''}<span style="color:var(--text-dim);">能力</span><span>${c.ability}</span><span style="color:var(--text-dim);">兽形</span><span>${c.petForm}</span><span style="color:var(--text-dim);">战斗力</span><span>⚔️ ${c.combat}</span><span style="color:var(--text-dim);">才能</span><span>📖 ${c.talent}</span><span style="color:var(--text-dim);">等级</span><span>⭐ ${c.level}级</span><span style="color:var(--text-dim);">好感</span><span>❤️ ${c.affection}</span><span style="color:var(--text-dim);">忠诚</span><span>🤝 ${c.loyalty}</span><span style="color:var(--text-dim);">地位</span><span>${c.isRuler ? '👑 国王' : c.inHarem ? '💕 妃子' : c.isMinister ? '📜 臣子' : isPN ? '📋 臣民' : '🌍 外国兽人'}</span></div><hr>${relationsHtml}<hr><div style="font-weight:600;color:var(--gold-light);font-size:0.7em;margin:3px 0;">📜 角色日志</div><button class="btn btn-sm" onclick="closeModal();showCharLogs(${c.id})">📜 查看日志</button><hr><div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:3px;">${isPN && !c.isMinister && !c.inHarem && !c.isRuler ? `<button class="btn btn-sm btn-primary" onclick="closeModal();interactChar(${c.id})">📜 邀请入职</button>` : ''}${canMarry ? `<button class="btn btn-sm btn-primary" onclick="closeModal();recruitCharToHarem(${c.id})">🐺 纳妃（20银）</button>` : ''}${c.inHarem ? `<button class="btn btn-sm" onclick="closeModal();tryBirth(${c.id})">🤱 生育</button>` : ''}${isPN && !c.isRuler && !c.inHarem && !c.isMinister ? `<button class="btn btn-sm" onclick="closeModal();renameSubject(${c.id})">✏️ 改名</button>` : ''}<button class="btn btn-sm" onclick="closeModal()">关闭</button></div>`;
    showModal(`📋 ${c.name} · 角色详情`, detailHtml, []);
}

export function showCharLogs(charId) {
    const c = getChar(charId);
    if (!c) return;
    const logs = getCharacterLogs(charId);
    const logHtml = logs.length ? logs.slice().reverse().map(l => `<div class="log-entry"><span class="time">${l.time}</span>${l.desc}</div>`).join('') : '<div class="empty">暂无日志</div>';
    showModal(`📜 ${c.name} 的日志`, logHtml, [{ text: '关闭', action: closeModal }]);
}

export function tryBirth(charId) {
    const c = getChar(charId);
    if (!c) return;
    if (!c.inHarem) {
        showModal('❌ 不可生育', '该角色不在后宫。', [{ text: '知道了', action: closeModal }]);
        return;
    }
    if (!c.isMale) {
        showModal('❌ 不可生育', '只有雄性兽人可以生育。', [{ text: '知道了', action: closeModal }]);
        return;
    }
    if (c.fertility < 30) {
        showModal('🌱 生育力低', `${c.name} 的生育力太低。`, [{ text: '知道了', action: closeModal }]);
        return;
    }
    if (c.pregnant) {
        showModal('🤰 已怀孕', `${c.name} 已经怀孕了。`, [{ text: '知道了', action: closeModal }]);
        return;
    }
    const rate = 0.25 + (c.fertility - 30) / 150;
    if (Math.random() > clamp(rate, 0.1, 0.8)) {
        addLog(`😢 与 ${c.name} 未能成功孕育`, 'danger');
        c.fertility = clamp(c.fertility - rand(1, 5), 5, 100);
        renderAll();
        return;
    }
    c.pregnant = true;
    c.pregnancyDays = c.race === '人鱼族' ? 300 : 90;
    c.healthStatus = '怀孕';
    addLog(`🤰 ${c.name} 已怀孕！预计 ${c.race === '人鱼族' ? '10个月' : '3个月'} 后生产。`, 'success');
    addCharacterLog(c.id, 'pregnant', `手动怀孕，预计${c.race === '人鱼族' ? '10个月' : '3个月'}后生产`, true);
    renderAll();
    showModal('✅ 生育成功', `${c.name} 已怀孕。`, [{ text: '好的', action: closeModal }]);
}

export function renderSettings() {
    const themeBtns = Object.keys(THEMES).map(k => `<div class="color-dot ${G.currentTheme === k ? 'active' : ''}" data-theme="${k}" style="background:${THEMES[k].primary};" title="${k}"></div>`).join('');
    const autoModes = { never: '从不', day: '每1天', week: '每7天' };
    const modeBtns = Object.entries(autoModes).map(([m, label]) => `<button class="btn btn-sm ${G.autoSaveMode === m ? 'btn-primary' : ''}" onclick="setAutoMode('${m}')">${label}</button>`).join('');
    const syncLabels = { all: '全部', none: '关闭', related: '仅相关' };
    const syncBtns = Object.entries(syncLabels).map(([m, label]) => `<button class="btn btn-sm ${G.logSyncMode === m ? 'btn-primary' : ''}" onclick="setLogSyncMode('${m}')">${label}</button>`).join('');
    const achievementsHtml = G.achievements.length ? G.achievements.map(id => {
        const a = ALL_ACHIEVEMENTS.find(x => x.id === id);
        return a ? `<span class="tag">${a.icon} ${a.name}</span>` : '';
    }).join(' ') : '<div class="empty">暂无成就</div>';
    document.getElementById('content').innerHTML = `<div class="page active" id="page-settings"><div class="page-title">⚙️ 设置</div>
        <div class="card"><div class="card-title">💾 存档管理</div><button class="btn btn-sm btn-block" onclick="openSaveLoad()">📂 存档 / 读档 (6个槽位)</button></div>
        <div class="card"><div class="card-title">⏳ 时间推进</div><button class="btn btn-sm btn-block" onclick="advanceTimeWithCost()">消耗25体力推进一节时间</button><div style="font-size:0.6em;color:var(--text-dim);margin-top:2px;">当前体力：${G.player.stamina}，时段：${timeStr()}</div></div>
        <div class="card"><div class="card-title">🏆 成就</div><div style="display:flex;flex-wrap:wrap;gap:2px;font-size:0.7em;">${achievementsHtml}</div></div>
        <div class="card"><div class="card-title">🤖 自动存档</div><div style="display:flex;gap:3px;flex-wrap:wrap;">${modeBtns}</div></div>
        <div class="card"><div class="card-title">📜 日志同步</div><div style="display:flex;gap:3px;flex-wrap:wrap;">${syncBtns}</div></div>
        <div class="card"><div class="card-title">🎨 UI主题</div><div style="display:flex;flex-wrap:wrap;gap:2px;">${themeBtns}</div></div>
        <div class="card"><button class="btn btn-sm btn-danger btn-block" onclick="confirmRestart()">🔄 重新开始</button></div></div>`;
    document.querySelectorAll('.color-dot').forEach(dot => dot.addEventListener('click', function() {
        applyTheme(this.dataset.theme);
        document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
        this.classList.add('active');
        renderSettings();
    }));
}

export function showCharsHelp() { showModal('📖 角色说明', '👥 所有兽人按分类展示。', [{ text: '知道了', action: closeModal }]); }