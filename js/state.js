import { pick, rand, clamp, SURNAMES, GIVEN_NAMES, RACE_DATA, RACE_KEYS, NATION_DATA, PLACE_DATA, ALL_ACHIEVEMENTS } from './data.js';

// ========== 游戏状态 ==========
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

// ========== 时间函数（依赖 G.player） ==========
export const getDateString = () => {
    const w = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    return `兽历${G.player.year}年${G.player.month}月${G.player.day}日 ${w[(G.player.weekDay - 1) % 7]}`;
};
export const timeStr = () => ['🌅 晨', '☀️ 午', '🌇 昏', '🌙 夜'][G.player.period] || '晨';

// ========== 辅助函数 ==========
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

// ========== 生成角色 ==========
export function generateCharacter(gender, race, nationId, ageMin, ageMax, familySurname) {
    gender = gender || pick(['雄性', '雌性']);
    race = race || pick(RACE_KEYS);
    const rd = RACE_DATA[race];
    const surname = familySurname || pick(SURNAMES);
    let given = pick(GIVEN_NAMES);
    if (Math.random() < 0.3) given += pick(GIVEN_NAMES);
    let name = surname + given;
    let attempts = 0;
    while (G._usedNames.has(name) && attempts < 30) { given = pick(GIVEN_NAMES); if (Math.random() < 0.3) given += pick(GIVEN_NAMES); name = surname + given; attempts++; }
    G._usedNames.add(name);
    if (ageMin === undefined) ageMin = 16;
    if (ageMax === undefined) ageMax = 60;
    if (race === '人鱼族') { ageMin = ageMin || 50; ageMax = ageMax || 200; }
    const maxAge = race === '人鱼族' ? 500 : 100;
    if (ageMax > maxAge) ageMax = maxAge;
    const age = rand(ageMin, ageMax);
    const personality = [pick(['豪爽', '谨慎', '温和', '狡黠', '忠厚', '傲慢', '谦逊', '热情', '冷漠', '多疑', '坦诚', '固执', '勇敢', '睿智', '沉稳', '幽默', '洒脱', '细腻', '凌厉', '温润']), pick(['坚毅', '变通', '莽撞', '果断', '柔和', '刚烈', '隐忍', '张扬', '内敛', '机敏'])];
    const appearance = { hair: pick(['银白', '墨黑', '赤红', '金棕', '玄黑', '霜白', '苍青', '琥珀']), eyes: pick(['冰蓝', '琥珀', '翠绿', '赤红', '银灰', '紫晶', '玄金', '碧波']), feature: Math.random() < 0.4 ? pick(['左眼细疤', '耳尖微缺', '尾梢银白', '翼尖带星', '鳞片暗纹', '爪痕交错', '眉间朱砂', '唇边浅痣']) : '无特殊标记', aura: pick(['冷峻威严', '温润如玉', '桀骜不驯', '慵懒神秘', '坚毅沉稳', '灵动飘逸', '沉稳内敛', '锋芒毕露']) };
    const ability = pick(rd.ability.split('、'));
    const combat = rand(10, 1000);
    const talent = rand(5, 100);
    const level = Math.min(10, Math.max(1, Math.floor((combat / 100 + talent / 10) / 2) + 1));
    return {
        id: uid(), name, race, raceEmoji: rd.emoji, raceType: rd.type,
        raceTrait: rd.trait, petForm: rd.pet, gender, age,
        personality, appearance, ability,
        likes: pick(['月光', '烈阳', '密林', '高崖', '温泉', '篝火', '雪地', '星空', '美酒', '利刃', '古籍', '草药', '兽皮', '炉火', '泉水', '野果']),
        avatar: rd.emoji, met: false, affection: rand(10, 40), loyalty: rand(20, 60), charm: rand(30, 80),
        combat, talent, level,
        inHarem: false, isLover: false, fertility: isMale(gender) ? rand(30, 80) : rand(20, 60),
        pregnant: false, pregnancyDays: 0, children: 0,
        isMale: isMale(gender), canRecruit: isMale(gender),
        nation: nationId || null, isRuler: false,
        chamberBuilt: false, isMinister: false, role: null, logs: [],
        pendingChamber: false, intimacyCount: 0,
        healthStatus: '健康', chamberName: '未命名', location: 'hou_gong',
        relations: [], familySurname: surname
    };
}

export function revealCharacter(charId) {
    const idx = G.hiddenCharacters.findIndex(c => c.id === charId);
    if (idx >= 0) {
        const c = G.hiddenCharacters.splice(idx, 1)[0];
        c.met = true;
        G.characters.push(c);
        addLog(`👤 你遇到了 ${c.name}！`, 'highlight');
        unlockAchievement('first_meet');
        return c;
    }
    return null;
}

// ========== 初始关系构建 ==========
function buildInitialRelationships() {
    const all = [...G.characters, ...G.hiddenCharacters];
    const raceGroups = {};
    all.forEach(c => { if (!raceGroups[c.race]) raceGroups[c.race] = []; raceGroups[c.race].push(c); });
    for (const race in raceGroups) {
        const list = raceGroups[race];
        if (list.length < 2) continue;
        const famMap = {};
        list.forEach(c => { const f = c.familySurname; if (!famMap[f]) famMap[f] = []; famMap[f].push(c); });
        for (const fam in famMap) {
            const members = famMap[fam];
            for (let i = 0; i < members.length; i++)
                for (let j = i + 1; j < members.length; j++)
                    if (Math.abs(members[i].age - members[j].age) <= 10) {
                        members[i].relations.push({ type: '兄弟姐妹', targetId: members[j].id, name: members[j].name });
                        members[j].relations.push({ type: '兄弟姐妹', targetId: members[i].id, name: members[i].name });
                    }
        }
        const males = list.filter(c => c.isMale && c.age >= 18 && c.age < 60);
        const females = list.filter(c => !c.isMale && c.age >= 18 && c.age < 60);
        females.forEach(f => {
            const possible = males.filter(m => !f.relations.some(r => r.type === '兄弟姐妹' && r.targetId === m.id) && Math.abs(m.age - f.age) <= 15);
            const mateCount = Math.min(rand(1, 3), possible.length);
            for (let k = 0; k < mateCount; k++) {
                if (possible.length === 0) break;
                const mate = possible.splice(Math.floor(Math.random() * possible.length), 1)[0];
                f.relations.push({ type: '配偶', targetId: mate.id, name: mate.name });
                mate.relations.push({ type: '配偶', targetId: f.id, name: f.name });
            }
        });
        females.forEach(f => {
            const spouses = f.relations.filter(r => r.type === '配偶');
            if (spouses.length && Math.random() < 0.6) {
                spouses.forEach(spRel => {
                    const father = getChar(spRel.targetId);
                    if (father && Math.random() < 0.7) {
                        const childGender = Math.random() < 0.8 ? '雄性' : '雌性';
                        const child = generateCharacter(childGender, race, null, 0, 17, father.familySurname);
                        child.met = false;
                        G.hiddenCharacters.push(child);
                        f.relations.push({ type: '子女', targetId: child.id, name: child.name });
                        father.relations.push({ type: '子女', targetId: child.id, name: child.name });
                        child.relations.push({ type: '父母', targetId: f.id, name: f.name });
                        child.relations.push({ type: '父母', targetId: father.id, name: father.name });
                        f.children = (f.children || 0) + 1;
                        father.children = (father.children || 0) + 1;
                    }
                });
            }
        });
    }
}

// ========== 初始化国家与角色 ==========
export function initNations(playerRace) {
    G.nations = [];
    const shuffled = [...NATION_DATA].sort(() => Math.random() - 0.5);
    for (let i = 0; i < 12; i++) {
        const d = shuffled[i];
        const rd = RACE_DATA[d.race];
        G.nations.push({
            id: uid(), name: d.name, race: d.race, raceEmoji: rd ? rd.emoji : '🏛️',
            desc: d.desc, environment: d.environment || '未知',
            power: rand(30, 80), wealth: rand(40, 90), military: rand(20, 70),
            relations: {}, ally: null, vassal: null, ruler: null, isPlayer: false,
            x: d.x, y: d.y
        });
    }
    const pn = G.nations[0];
    pn.isPlayer = true; pn.name = '王国'; pn.race = playerRace;
    const prd = RACE_DATA[playerRace];
    pn.raceEmoji = prd ? prd.emoji : '👑'; pn.power = 50; pn.wealth = 60; pn.military = 30;
    pn.desc = `以${playerRace}为主体的新兴王国`;
    pn.environment = prd ? prd.environment : '未知';
    pn.x = 0; pn.y = 0;
    G.player.nationId = pn.id;
    G.nations.forEach(n => G.nations.forEach(m => { if (n.id !== m.id) n.relations[m.id] = rand(-20, 40); }));
    G.nations.forEach(n => {
        const rulerGender = n.isPlayer ? '雌性' : pick(['雄性', '雌性']);
        const ageMin = n.race === '人鱼族' ? 50 : 20, ageMax = n.race === '人鱼族' ? 200 : 50;
        const ruler = generateCharacter(rulerGender, n.race, n.id, ageMin, ageMax);
        ruler.met = true; ruler.isRuler = true; ruler.loyalty = 100; ruler.affection = 50;
        ruler.combat = rand(40, 90); ruler.talent = rand(20, 80);
        ruler.level = Math.min(10, Math.max(1, Math.floor((ruler.combat / 100 + ruler.talent / 10) / 2) + 1));
        ruler.nation = n.id;
        G.characters.push(ruler);
        n.ruler = ruler.id;
    });
    if (pn) {
        const addMinister = (gender, race, role, ageMin, ageMax, combatMin, combatMax, talentMin, talentMax) => {
            const c = generateCharacter(gender, race, pn.id, ageMin, ageMax);
            c.met = true; c.isMinister = true; c.role = role; c.loyalty = rand(75, 100); c.affection = rand(40, 60);
            c.combat = rand(combatMin, combatMax); c.talent = rand(talentMin, talentMax);
            c.level = Math.min(10, Math.floor((c.combat / 100 + c.talent / 10) / 2) + 1);
            G.characters.push(c);
        };
        addMinister(pick(['雄性', '雌性']), playerRace, '国师（祭祀）', 40, 60, 30, 60, 91, 100);
        addMinister('雄性', playerRace, '大将军', 30, 45, 950, 1000, 30, 70);
        addMinister(pick(['雄性', '雌性']), playerRace, '总管（内务）', 30, 50, 20, 40, 50, 80);
        addMinister(pick(['雄性', '雌性']), playerRace, '宫医', 35, 55, 10, 30, 60, 90);
        for (let i = 0; i < 2; i++) addMinister('雌性', playerRace, '侍女', 18, 30, 5, 20, 30, 60);
        for (let i = 0; i < 2; i++) addMinister('雄性', playerRace, '亲卫', 20, 35, 300, 600, 20, 50);
    }
    const targetTotal = 120, existing = G.characters.length;
    let needed = targetTotal - existing;
    const playerRaceChars = G.characters.filter(c => c.race === playerRace).length;
    let extra = rand(20, 30) - playerRaceChars;
    if (extra < 0) extra = 0;
    for (let i = 0; i < extra; i++) {
        const gender = Math.random() < 0.8 ? '雄性' : '雌性';
        G.hiddenCharacters.push(generateCharacter(gender, playerRace, pn ? pn.id : null, 16, 60));
    }
    const otherRaces = RACE_KEYS.filter(r => r !== playerRace);
    let remain = needed - extra;
    const per = Math.floor(remain / otherRaces.length);
    otherRaces.forEach(race => {
        const count = rand(Math.max(4, per - 2), Math.min(10, per + 2));
        for (let j = 0; j < count; j++) {
            const gender = Math.random() < 0.8 ? '雄性' : '雌性';
            G.hiddenCharacters.push(generateCharacter(gender, race, null, 16, 60));
        }
    });
    buildInitialRelationships();
}

// ========== 成就系统 ==========
export function unlockAchievement(id) {
    if (G.achievements.includes(id)) return;
    G.achievements.push(id);
    const a = ALL_ACHIEVEMENTS.find(x => x.id === id);
    if (a) addLog(`🏆 解锁成就：${a.icon} ${a.name}`, 'highlight');
    localStorage.setItem('queen_achievements', JSON.stringify(G.achievements));
}
export function loadAchievements() {
    const r = localStorage.getItem('queen_achievements');
    if (r) {
        try { G.achievements = JSON.parse(r); } catch (e) { G.achievements = []; }
    }
}

// ========== 存档系统 ==========
const MAX_SLOTS = 6;
export function saveToSlot(idx) {
    if (idx < 0 || idx >= MAX_SLOTS) return;
    try {
        const d = {
            player: JSON.parse(JSON.stringify(G.player)),
            nations: JSON.parse(JSON.stringify(G.nations)),
            characters: G.characters.map(c => JSON.parse(JSON.stringify(c))),
            hiddenCharacters: G.hiddenCharacters.map(c => JSON.parse(JSON.stringify(c))),
            harem: [...G.harem], children: [...G.children],
            places: G.places.map(p => JSON.parse(JSON.stringify(p))),
            logs: G.logs.slice(0, 50),
            gameStarted: G.gameStarted,
            currentTheme: G.currentTheme,
            autoSaveMode: G.autoSaveMode,
            logSyncMode: G.logSyncMode,
            _nextId: G._nextId,
            _usedNames: [...G._usedNames],
            diplomacy: JSON.parse(JSON.stringify(G.diplomacy)),
            haremChambers: [...G.haremChambers],
            achievements: [...G.achievements]
        };
        localStorage.setItem('queen_slot_' + idx, JSON.stringify(d));
    } catch (e) { console.warn('Save failed', e); }
}

export function loadFromSlot(idx) {
    if (idx < 0 || idx >= MAX_SLOTS) return false;
    const r = localStorage.getItem('queen_slot_' + idx);
    if (!r) return false;
    try {
        const d = JSON.parse(r);
        G.player = d.player;
        G.nations = d.nations || [];
        G.characters = d.characters || [];
        G.hiddenCharacters = d.hiddenCharacters || [];
        G.harem = d.harem || [];
        G.children = d.children || [];
        G.places = d.places || [];
        G.logs = d.logs || [];
        G.gameStarted = d.gameStarted || false;
        G.currentTheme = d.currentTheme || 'royal';
        G.autoSaveMode = d.autoSaveMode || 'day';
        G.logSyncMode = d.logSyncMode || 'all';
        G._nextId = d._nextId || 1;
        G._usedNames = new Set(d._usedNames || []);
        G.diplomacy = d.diplomacy || { pending: null };
        G.haremChambers = d.haremChambers || [];
        G.achievements = d.achievements || [];
        if (!G.player.wealth) G.player.wealth = { gold: 20, silver: 0, copper: 0 };
        return true;
    } catch (e) { return false; }
}

export function hasAnySave() {
    for (let i = 0; i < MAX_SLOTS; i++) if (localStorage.getItem('queen_slot_' + i)) return true;
    return false;
}

export function autoSave() {
    if (G.autoSaveMode !== 'never') saveToSlot(5);
}

// ========== 初始化游戏（只设置数据） ==========
export function initGame(playerName, avatarType, avatarData, nationName, playerRace) {
    G.player.name = playerName || '女王';
    G.player.avatar = avatarType || '👑';
    G.player.avatarData = avatarData || null;
    G.player.race = playerRace || '狼族';
    G.player.health = 100; G.player.maxHealth = 100; G.player.stamina = 100;
    G.player.charm = 20; G.player.prestige = 20;
    G.player.wealth = { gold: 20, silver: 0, copper: 0 };
    G.player.treasury = 60; G.player.military = 20; G.player.intelligence = 20; G.player.rule = 20;
    G.player.day = 1; G.player.month = 1; G.player.year = 360; G.player.weekDay = 1; G.player.period = 0;
    G.player.location = 'qin_dian'; G.player.realm = 'palace';
    G.characters = []; G.hiddenCharacters = []; G.harem = []; G.children = [];
    G.exploredCount = {}; G.logs = [];
    G.gameStarted = true; G.gameActive = true;
    G._nextId = 1; G._usedNames = new Set();
    G.logSyncMode = 'all'; G.diplomacy = { pending: null };
    G.haremChambers = []; G.achievements = [];
    initNations(playerRace);
    const pn = getPlayerNation();
    if (pn && nationName?.trim()) pn.name = nationName.trim();
    G.places = [];
    for (const k in PLACE_DATA) PLACE_DATA[k].forEach(p => G.places.push({ ...p, devProgress: 0, garrison: null, explored: false }));
    addLog(`👑 你登基为 ${pn ? pn.name : '王国'} 的女王！`, 'highlight');
    addLog(`🌍 你的国家以 ${playerRace} 为主体。`, '');
    addLog('💰 货币：1金=1000银=1,000,000铜', '');
}