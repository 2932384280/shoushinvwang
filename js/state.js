import { pick, rand, clamp, SURNAMES, GIVEN_NAMES, RACE_DATA, RACE_KEYS, NATION_DATA, PLACE_DATA, ALL_ACHIEVEMENTS } from './data.js';

export let G = {
    player: {
        name: '女王', avatar: '👑', avatarData: null,
        health: 100, maxHealth: 100, stamina: 100,
        charm: 20, prestige: 20, wealth: { gold: 20, silver: 0, copper: 0 },
        treasury: 60, military: 20, intelligence: 20, rule: 20,
        day: 1, month: 1, year: 360, weekDay: 1, period: 0,
        nationId: null, race: '狼族', location: 'qin_dian', realm: 'palace'
    },
    nations: [], characters: [], hiddenCharacters: [], harem: [], children: [],
    places: [], exploredCount: {}, logs: [],
    gameStarted: false, gameActive: true,
    currentTheme: 'royal', autoSaveMode: 'day', logSyncMode: 'all',
    _nextId: 1, _turn: 0, _usedNames: new Set(),
    diplomacy: { pending: null },
    haremChambers: [],
    currentPage: 'queen',
    achievements: []
};

let uid = () => G._nextId++;

// ----- 时间函数（依赖 G.player） -----
export const getDateString = () => {
    const w = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    return `兽历${G.player.year}年${G.player.month}月${G.player.day}日 ${w[(G.player.weekDay - 1) % 7]}`;
};
export const timeStr = () => ['🌅 晨', '☀️ 午', '🌇 昏', '🌙 夜'][G.player.period] || '晨';

// ----- 辅助函数 -----
export const getChar = id => G.characters.find(c => c.id === id) || G.hiddenCharacters.find(c => c.id === id);
export const getPlace = id => G.places.find(p => p.id === id);
export const getNation = id => G.nations.find(n => n.id === id);
export const getPlayerNation = () => G.nations.find(n => n.id === G.player.nationId);
export const getNationPower = n => (n.power || 50) + (n.military || 20) * 0.3 + (n.wealth || 40) * 0.2;
export const getNationDistance = (a, b) => Math.sqrt(((a.x || 0) - (b.x || 0)) ** 2 + ((a.y || 0) - (b.y || 0)) ** 2);

export const addLog = (msg, cls) => {
    G.logs.unshift({ msg, cls: cls || '', time: getDateString() + ' ' + timeStr() });
    if (G.logs.length > 80) G.logs.length = 60;
};

export const addCharacterLog = (charId, eventType, desc, isRelated) => {
    const c = getChar(charId);
    if (!c) return;
    if (!c.logs) c.logs = [];
    c.logs.push({ time: getDateString() + ' ' + timeStr(), type: eventType, desc, isRelated: isRelated || false });
    if (c.logs.length > 50) c.logs.shift();
    if (c.met) {
        const mode = G.logSyncMode || 'all';
        if (mode === 'none') return;
        if (mode === 'related' && !isRelated) return;
        addLog(`👤 ${c.name}：${desc}`, isRelated ? 'related' : '');
    }
};
export const getCharacterLogs = charId => getChar(charId)?.logs || [];

export function getAdultChildren() {
    return G.children.filter(c => c.age >= 16);
}

// ----- 生成角色等（保持不变） -----
export function generateCharacter(...) { /* 同你之前的代码，无需改动 */ }
export function revealCharacter(...) { /* 同前 */ }
function buildInitialRelationships() { /* 同前 */ }
export function initNations(playerRace) { /* 同前 */ }
export function unlockAchievement(id) { /* 同前，使用 ALL_ACHIEVEMENTS */ }
export function loadAchievements() { /* 同前 */ }

// ----- 存档系统 -----
const MAX_SLOTS = 6;
export function saveToSlot(idx) { /* 同前，包含 hiddenCharacters */ }
export function loadFromSlot(idx) { /* 同前，包含 hiddenCharacters，但不调用 applyTheme */ }
export function hasAnySave() { /* 同前 */ }
export function autoSave() { if (G.autoSaveMode !== 'never') saveToSlot(5); }

// ----- 初始化游戏（只设置数据，不操作 UI） -----
export function initGame(playerName, avatarType, avatarData, nationName, playerRace) {
    // 重置 G.player 等
    G.player.name = playerName || '女王';
    G.player.avatar = avatarType || '👑';
    G.player.avatarData = avatarData || null;
    G.player.race = playerRace || '狼族';
    // ... 其他属性重置（同之前）
    G.characters = [];
    G.hiddenCharacters = [];
    // ... 重置其他数组
    G.gameStarted = true;
    G.gameActive = true;
    G._nextId = 1;
    G._usedNames = new Set();
    G.diplomacy = { pending: null };
    G.haremChambers = [];
    G.achievements = [];
    initNations(playerRace);
    const pn = getPlayerNation();
    if (pn && nationName?.trim()) pn.name = nationName.trim();
    G.places = [];
    for (const k in PLACE_DATA) PLACE_DATA[k].forEach(p => G.places.push({ ...p, devProgress: 0, garrison: null, explored: false }));
    // 头像存储由外部（ui.js）调用，这里不处理
    addLog(`👑 你登基为 ${pn ? pn.name : '王国'} 的女王！`, 'highlight');
    addLog(`🌍 你的国家以 ${playerRace} 为主体。`, '');
    addLog('💰 货币：1金=1000银=1,000,000铜', '');
    // 不操作 DOM
}