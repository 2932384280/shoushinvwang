// data.js - 只含常量定义和纯工具函数（不依赖 G）
export const SURNAMES = [...]; // 同你之前的
export const GIVEN_NAMES = [...];
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];
export const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export const RACE_DATA = {...};
export const RACE_KEYS = Object.keys(RACE_DATA);
export const NATION_DATA = [...];
export const PLACE_DATA = {...};
export const ALL_ACHIEVEMENTS = [...];
// 以下工具函数不依赖 G
export const getRaceData = r => RACE_DATA[r] || null;
export const getRaceEmoji = r => (getRaceData(r) || {}).emoji || '👤';
export const isMale = g => g === '雄性';
export const genderText = g => isMale(g) ? '♂' : '♀';
export const genderClass = g => isMale(g) ? 'gender-male' : 'gender-female';
export const wealthToCopper = w => (w.gold || 0) * 1000000 + (w.silver || 0) * 1000 + (w.copper || 0);
export const formatWealth = w => { if (!w) return '0金'; let p = []; if (w.gold > 0) p.push(w.gold + '金'); if (w.silver > 0) p.push(w.silver + '银'); if (w.copper > 0) p.push(w.copper + '铜'); return p.length ? p.join(' ') : '0铜'; };
export const addWealth = (w, amt) => { let t = wealthToCopper(w) + amt; w.gold = Math.floor(t / 1000000); t -= w.gold * 1000000; w.silver = Math.floor(t / 1000); w.copper = t - w.silver * 1000; return w; };
// 注意：getDateString 和 timeStr 已被移走，现在在 state.js 中