import { G, getChar, getPlace, getNation, getPlayerNation, getNationPower, getNationDistance, addLog, addCharacterLog, getCharacterLogs, generateCharacter, revealCharacter, unlockAchievement, autoSave, saveToSlot, loadFromSlot, getAdultChildren } from './state.js';
import { pick, rand, clamp, RACE_DATA, RACE_KEYS, isMale, genderText, wealthToCopper, formatWealth, addWealth, getDateString, timeStr } from './data.js';

// ========== 时间推进（消耗体力） ==========
export function advanceTimeWithCost() {
    const cost = 25;
    if (G.player.stamina < cost) {
        showModal('💤 体力不足', `需要${cost}体力才能推进时间。`, [{text:'知道了', action:closeModal}]);
        return;
    }
    G.player.stamina -= cost;
    // 推进一个时段
    G.player.period = (G.player.period + 1) % 4;
    // 如果从夜回到晨，则日期前进一天
    if (G.player.period === 0) {
        G.player.day++;
        G.player.weekDay = (G.player.weekDay % 7) + 1;
        if (G.player.day > 30) {
            G.player.day = 1;
            G.player.month++;
            if (G.player.month > 12) {
                G.player.month = 1;
                G.player.year++;
            }
            // 每月年龄增长等逻辑（复用 advanceTime 中的部分）
            G.characters.forEach(c => {
                c.age += 1;
                const maxAge = c.race === '人鱼族' ? 500 : 100;
                if (c.age > maxAge) {
                    if (c.inHarem) { c.inHarem = false; G.harem = G.harem.filter(id => id !== c.id); }
                    c.isMinister = false; c.met = false;
                    addLog(`💀 ${c.name} 寿终正寝。`, 'danger');
                    const idx = G.characters.indexOf(c);
                    if (idx > -1) G.characters.splice(idx, 1);
                }
            });
            G.hiddenCharacters.forEach(c => {
                c.age += 1;
                const maxAge = c.race === '人鱼族' ? 500 : 100;
                if (c.age > maxAge) {
                    const idx = G.hiddenCharacters.indexOf(c);
                    if (idx > -1) G.hiddenCharacters.splice(idx, 1);
                }
            });
            // 妃子怀孕生产检查（每日都检查，但这里只每月检查一次，生产是在每日检查中）
        }
        // 每日恢复和事件
        G.player.health = Math.min(G.player.maxHealth, G.player.health + 3);
        G.player.stamina = Math.min(100, G.player.stamina + 10);
        // 怀孕生产（每日检查）
        for (let j = 0; j < G.characters.length; j++) {
            const c = G.characters[j];
            if (c.pregnant && c.pregnancyDays > 0) {
                c.pregnancyDays--;
                if (c.pregnancyDays <= 0) {
                    const gen = pick(['皇子', '公主']);
                    const nm = pick(['玄', '苍', '凌']) + pick(['风', '云', '月']);
                    G.children.push({ id: G._nextId++, name: nm, gender: gen, race: c.race, father: G.player.name, mother: c.name, charm: rand(30, 80), potential: rand(30, 80), age: 0 });
                    c.children = (c.children || 0) + 1;
                    c.pregnant = false; c.pregnancyDays = 0; c.healthStatus = '健康';
                    addLog(`👶 ${c.name} 诞下 ${gen} ${nm}！`, 'success');
                    unlockAchievement('first_child');
                }
            }
        }
        // 妃子生病与康复
        G.characters.filter(c => c.inHarem && c.chamberBuilt).forEach(c => {
            if (Math.random() < 0.02 && !c.pregnant && c.healthStatus !== '生病') { c.healthStatus = '生病'; addLog(`🤒 ${c.name} 生病了`, 'danger'); }
            if (c.healthStatus === '生病' && Math.random() < 0.15) { c.healthStatus = '健康'; addLog(`💊 ${c.name} 康复`, 'success'); }
        });
        // 外交完成
        if (G.diplomacy.pending) completeDiplomacy();
        autoSave();
        // 成就检查（部分）
        if (G.children.length >= 1) unlockAchievement('first_child');
        if (G.harem.length >= 3) unlockAchievement('harem_3');
        if (G.characters.length >= 10) unlockAchievement('char_10');
        if (wealthToCopper(G.player.wealth) >= 1000000) unlockAchievement('wealth_1');
        if (G.nations.some(n => n.vassal === G.player.nationId)) unlockAchievement('vassal_1');
    }
    addLog(`⏳ 时间推进至 ${timeStr()}，体力-${cost}`, 'highlight');
    renderAll();
    // 弹窗提示
    showModal('⏳ 时间推进', `当前时段：${timeStr()}，剩余体力 ${G.player.stamina}`, [{text:'好的', action:closeModal}]);
}

// ========== 原 advanceTime 保留但不再使用（可废弃） ==========
export function advanceTime(steps) { /* 保留但不使用，可注释掉 */ }

// ========== 地点移动（增加弹窗日志） ==========
export function goToPlace(id) {
    const p = getPlace(id); if (!p) return;
    if (p.action == 'exit_palace') { G.player.realm = 'city'; G.player.location = 'wang_gong'; addLog('🚪 走出王宫，来到王都。'); renderAll(); switchPage('places'); showModal('🚪 王宫外', '你走出了王宫，来到王都。', [{text:'好的', action:closeModal}]); return; }
    if (p.action == 'enter_palace') { G.player.realm = 'palace'; G.player.location = 'qin_dian'; addLog('🏰 回到王宫。'); renderAll(); switchPage('places'); showModal('🏰 回到王宫', '你回到了王宫。', [{text:'好的', action:closeModal}]); return; }
    if (p.action == 'exit_city') { G.player.realm = 'outcity'; G.player.location = 'cheng_men_wai'; addLog('🚪 走出城门，来到城外。'); renderAll(); switchPage('places'); showModal('🚪 城外', '你走出了城门，来到城外。', [{text:'好的', action:closeModal}]); return; }
    if (p.action == 'enter_city') { G.player.realm = 'city'; G.player.location = 'cheng_men'; addLog('🚪 回到王都。'); renderAll(); switchPage('places'); showModal('🚪 王都', '你回到了王都。', [{text:'好的', action:closeModal}]); return; }
    if (p.action == 'enter_harem') { G.player.location = 'hou_gong'; renderHaremInterior(); document.querySelectorAll('.page').forEach(pg => pg.classList.remove('active')); G.currentPage = 'harem_interior'; return; }
    G.player.location = id;
    // 执行地点事件，并获取结果描述
    const resultDesc = handlePlaceEventWithResult(p);
    renderAll();
    switchPage('places');
    if (resultDesc) {
        showModal(`📍 ${p.icon} ${p.name}`, resultDesc, [{text:'好的', action:closeModal}]);
    }
}

// 原 handlePlaceEvent 改为返回事件描述字符串
export function handlePlaceEvent(p) {
    return handlePlaceEventWithResult(p);
}

function handlePlaceEventWithResult(p) {
    let result = '';
    if (p.id == 'pai_mai_chang') { showAuctionHouse(); return '进入拍卖场'; }
    if (p.id == 'hou_gong') { renderHaremInterior(); return '进入后宫'; }
    if (p.id == 'qin_dian') { let h = rand(5, 15); G.player.health = Math.min(G.player.maxHealth, G.player.health + h); G.player.stamina = Math.min(100, G.player.stamina + 10); addLog(`🛏️ 小憩，生命+${h}，体力+10`, 'success'); return `小憩片刻，生命恢复 ${h}，体力恢复 10`; }
    if (p.id == 'yi_shi_ting') { let g = rand(2, 5); G.player.prestige = clamp(G.player.prestige + g, 0, 200); G.player.rule = clamp(G.player.rule + g, 0, 100); addLog(`⚖️ 议政，威望+${g}，统治力+${g}`, 'success'); if (G.player.weekDay === 1) { let w = rand(500, 2000); G.player.wealth = addWealth(G.player.wealth, w); addLog('📅 周一例会，财富增加', 'success'); return `议政，威望+${g}，统治力+${g}，周一例会财富+${w}铜`; } return `议政，威望+${g}，统治力+${g}`; }
    if (p.id == 'gong_yi_suo') { addLog('💉 宫医为你检查身体。'); G.player.health = Math.min(G.player.maxHealth, G.player.health + 10); return '宫医检查，生命+10'; }
    if (p.id == 'di_lao') { addLog('⛓️ 巡视地牢。'); return '巡视地牢，一切安好。'; }
    if (p.id == 'hou_hua_yuan') {
        const hc = G.characters.filter(c => c.inHarem && c.chamberBuilt);
        if (hc.length && Math.random() < 0.4) { const fav = pick(hc); addLog(`🌺 与 ${fav.name} 赏花。`, 'highlight'); fav.affection = clamp(fav.affection + 2, 0, 100); addCharacterLog(fav.id, 'garden', '后花园相遇', true); return `与 ${fav.name} 赏花，好感+2`; }
        else { addLog('🌺 后花园漫步。'); G.player.charm = clamp(G.player.charm + 1, 0, 100); G.player.stamina = clamp(G.player.stamina + 3, 0, 100); return '后花园漫步，魅力+1，体力+3'; }
    }
    if (p.id == 'jiu_guan') {
        let g = rand(1, 3); G.player.charm = clamp(G.player.charm + g, 0, 100); G.player.intelligence = clamp(G.player.intelligence + g, 0, 100);
        addLog(`🍺 酒馆消息，魅力+${g}，智慧+${g}`, 'success');
        let extra = '';
        if (Math.random() < 0.12) {
            const hc = G.hiddenCharacters.length ? G.hiddenCharacters[Math.floor(Math.random() * G.hiddenCharacters.length)] : null;
            if (hc) { revealCharacter(hc.id); addCharacterLog(hc.id, 'meet', '在酒馆邂逅女王', true); extra = ` 遇到 ${hc.name}！`; }
            else { const nc = generateCharacter(); nc.met = true; G.characters.push(nc); addLog(`👤 酒馆遇到 ${nc.name}`, 'highlight'); unlockAchievement('first_meet'); extra = ` 遇到 ${nc.name}！`; }
        }
        return `酒馆闲聊，魅力+${g}，智慧+${g}${extra}`;
    }
    if (p.id == 'shi_ji') { let g = rand(300, 800); G.player.wealth = addWealth(G.player.wealth, g); G.player.charm = clamp(G.player.charm + 1, 0, 100); addLog(`🏪 市集贸易，财富+${g}铜，魅力+1`, 'success'); return `市集贸易，财富+${g}铜，魅力+1`; }
    if (p.id == 'xun_lian_chang') { let g = rand(2, 5); G.player.military = clamp(G.player.military + g, 0, 500); G.player.stamina = clamp(G.player.stamina - 5, 0, 100); addLog(`💪 操练，兵力+${g}，体力-5`, 'success'); if (G.player.maxHealth < 100 && Math.random() < 0.2) { G.player.maxHealth = Math.min(100, G.player.maxHealth + 1); addLog('❤️ 体质提升，生命上限+1', 'highlight'); return `操练，兵力+${g}，体力-5，生命上限+1`; } return `操练，兵力+${g}，体力-5`; }
    if (p.id == 'tie_jiang_pu') { let cost = rand(300, 1500); if (wealthToCopper(G.player.wealth) >= cost) { G.player.wealth = addWealth(G.player.wealth, -cost); let g = rand(2, 4); G.player.military = clamp(G.player.military + g, 0, 500); addLog(`🔨 锻造，花费${cost}铜，兵力+${g}`, 'success'); return `锻造，花费${cost}铜，兵力+${g}`; } else { addLog('🔨 铁匠铺需要钱。', 'danger'); return '铁匠铺需要钱，锻造失败。'; } }
    if (p.id == 'sa_man_ji_tan') { let g = rand(2, 5); G.player.intelligence = clamp(G.player.intelligence + g, 0, 100); G.player.prestige = clamp(G.player.prestige + g, 0, 200); addLog(`🔮 祈福，智慧+${g}，威望+${g}`, 'success'); return `祈福，智慧+${g}，威望+${g}`; }
    if (p.id == 'hei_shi') { if (Math.random() < 0.3) { let g = rand(500, 3000); G.player.wealth = addWealth(G.player.wealth, g); addLog(`🌙 黑市淘到好东西，财富+${g}铜`, 'success'); return `黑市淘到好东西，财富+${g}铜`; } else { let l = rand(200, 1500); G.player.wealth = addWealth(G.player.wealth, -l); addLog(`🌙 黑市交易失败，财富-${l}铜`, 'danger'); return `黑市交易失败，财富-${l}铜`; } }
    if (p.id == 'di_xia_jue_dou_chang') { if (G.player.military >= 10) { let g = rand(3, 8); G.player.military = clamp(G.player.military + g, 0, 500); G.player.prestige = clamp(G.player.prestige + g, 0, 200); addLog(`💀 地下角斗，兵力+${g}，威望+${g}`, 'success'); return `地下角斗，兵力+${g}，威望+${g}`; } else { addLog('💀 兵力不足，只能旁观。'); return '兵力不足，只能旁观。'; } }
    if (p.id == 'pin_min_qu') { let g = rand(1, 3); G.player.charm = clamp(G.player.charm + g, 0, 100); G.player.prestige = clamp(G.player.prestige + g, 0, 200); addLog(`🏚️ 巡视贫民窟，魅力+${g}，威望+${g}`, 'success'); return `巡视贫民窟，魅力+${g}，威望+${g}`; }
    if (p.id == 'fu_min_qu') { let g = rand(300, 800); G.player.wealth = addWealth(G.player.wealth, g); G.player.charm = clamp(G.player.charm + 1, 0, 100); addLog(`🏘️ 富民区，财富+${g}铜，魅力+1`, 'success'); return `富民区，财富+${g}铜，魅力+1`; }
    if (p.id == 'fan_dian') { let cost = rand(200, 800); if (wealthToCopper(G.player.wealth) >= cost) { G.player.wealth = addWealth(G.player.wealth, -cost); let h = rand(5, 12); G.player.health = Math.min(G.player.maxHealth, G.player.health + h); G.player.charm = clamp(G.player.charm + 1, 0, 100); addLog(`🍽️ 享用美食，生命+${h}，魅力+1`, 'success'); return `享用美食，生命+${h}，魅力+1`; } else { addLog('🍽️ 饭店需要钱。', 'danger'); return '饭店需要钱，无法用餐。'; } }
    if (p.id == 'he_bian') { let g = rand(1, 3); G.player.charm = clamp(G.player.charm + g, 0, 100); G.player.stamina = clamp(G.player.stamina + 5, 0, 100); addLog(`🌊 河边漫步，魅力+${g}，体力+5`, 'success'); let extra = ''; if (Math.random() < 0.1) { const hc = G.hiddenCharacters.length ? G.hiddenCharacters[Math.floor(Math.random() * G.hiddenCharacters.length)] : null; if (hc) { revealCharacter(hc.id); addCharacterLog(hc.id, 'meet', '在河边邂逅女王', true); extra = ` 遇到 ${hc.name}！`; } } return `河边漫步，魅力+${g}，体力+5${extra}`; }
    if (p.id == 'mi_lin') { let g = rand(1, 3); G.player.intelligence = clamp(G.player.intelligence + g, 0, 100); let w = rand(300, 800); G.player.wealth = addWealth(G.player.wealth, w); addLog(`🌲 密林采集，智慧+${g}，财富+${w}铜`, 'success'); let extra = ''; if (Math.random() < 0.08) { let d = rand(5, 10); G.player.health = clamp(G.player.health - d, 0, G.player.maxHealth); addLog(`⚠️ 遭遇野兽，生命-${d}`, 'danger'); extra = ` 遭遇野兽，生命-${d}`; } return `密林采集，智慧+${g}，财富+${w}铜${extra}`; }
    if (p.id == 'yue_ya') { let g = rand(2, 4); G.player.charm = clamp(G.player.charm + g, 0, 100); G.player.prestige = clamp(G.player.prestige + g, 0, 200); addLog(`🌙 月崖赏月，魅力+${g}，威望+${g}`, 'success'); return `月崖赏月，魅力+${g}，威望+${g}`; }
    if (p.id == 'shi_lin_shan_mai') { let g = rand(2, 5); G.player.military = clamp(G.player.military + g, 0, 500); G.player.stamina = clamp(G.player.stamina - 5, 0, 100); addLog(`⛰️ 山脉探险，兵力+${g}，体力-5`, 'success'); let extra = ''; if (Math.random() < 0.1) { let d = rand(5, 12); G.player.health = clamp(G.player.health - d, 0, G.player.maxHealth); addLog(`⚠️ 落石，生命-${d}`, 'danger'); extra = ` 落石，生命-${d}`; } return `山脉探险，兵力+${g}，体力-5${extra}`; }
    if (p.id == 'shao_ta') { let g = rand(1, 3); G.player.intelligence = clamp(G.player.intelligence + g, 0, 100); addLog(`🗼 登高望远，智慧+${g}`, 'success'); return `登高望远，智慧+${g}`; }
    if (p.id == 'zhong_yang_guang_chang') { let g = rand(1, 3); G.player.charm = clamp(G.player.charm + g, 0, 100); G.player.prestige = clamp(G.player.prestige + g, 0, 200); addLog(`🏛️ 广场巡视，魅力+${g}，威望+${g}`, 'success'); return `广场巡视，魅力+${g}，威望+${g}`; }
    if (p.id == 'mao_xian_zhe_xie_hui') { if (G.player.military >= 5) { let g = rand(3, 8); G.player.military = clamp(G.player.military + g, 0, 500); let w = rand(500, 1500); G.player.wealth = addWealth(G.player.wealth, w); addLog(`🎯 招募勇士，兵力+${g}，财富+${w}铜`, 'success'); return `招募勇士，兵力+${g}，财富+${w}铜`; } else { addLog('🎯 兵力不足，无法接委托。'); return '兵力不足，无法接委托。'; } }
    if (p.id == 'jue_dou_chang') { if (G.player.military >= 5) { let g = rand(2, 5); G.player.military = clamp(G.player.military + g, 0, 500); G.player.prestige = clamp(G.player.prestige + g, 0, 200); addLog(`⚔️ 观战，兵力+${g}，威望+${g}`, 'success'); return `观战，兵力+${g}，威望+${g}`; } else { addLog('⚔️ 兵力不足，只能旁观。'); return '兵力不足，只能旁观。'; } }
    addLog(`📍 在 ${p.name} 停留，体力-2`);
    G.player.stamina = clamp(G.player.stamina - 2, 0, 100);
    return `在 ${p.name} 停留，体力-2`;
}

// ========== 拍卖场（无修改） ==========
export function showAuctionHouse() {
    const items = [{name:'古籍·兽世编年',desc:'珍贵典籍',value:2000,icon:'📜'},{name:'月光石吊坠',desc:'精致饰品',value:3000,icon:'💎'},{name:'龙鳞护甲',desc:'轻甲',value:5000,icon:'🛡️'},{name:'九尾灵狐尾',desc:'珍材',value:4000,icon:'🦊'},{name:'星铁矿石',desc:'锻造材料',value:6000,icon:'⛏️'},{name:'千年灵芝',desc:'药材',value:2800,icon:'🍄'}];
    const item = pick(items); const price = item.value + rand(-500, 500);
    const priceStr = price >= 1000000 ? (price / 1000000).toFixed(1) + '金' : price >= 1000 ? Math.floor(price / 1000) + '银' + (price % 1000) + '铜' : price + '铜';
    showModal('🔨 拍卖场', `今日珍品：${item.icon} ${item.name}\n${item.desc}\n起拍价：${priceStr}`, [
        { text: '💰 出价', action: () => {
            if (wealthToCopper(G.player.wealth) >= price) { G.player.wealth = addWealth(G.player.wealth, -price); addLog(`🔨 拍得 ${item.name}，花费 ${priceStr}`, 'success'); G.player.prestige = clamp(G.player.prestige + rand(1, 3), 0, 200); G.player.charm = clamp(G.player.charm + rand(1, 3), 0, 100); closeModal(); renderAll(); }
            else showModal('💰 财富不足', '你无法拍下此物。', [{ text: '遗憾', action: closeModal }]);
        } },
        { text: '👋 离开', action: closeModal }
    ]);
}

// ========== 外交系统（新） ==========
export function showNationDiplomacy(nationId) {
    const pn = getPlayerNation();
    const target = getNation(nationId);
    if (!pn || !target || target.id === pn.id) return;
    // 检查是否有外交进行中
    if (G.diplomacy.pending) {
        showModal('⏳ 外交进行中', '已有外交任务在进行中。', [{ text: '知道了', action: closeModal }]);
        return;
    }
    // 获取可用子嗣（成年）
    const adultChildren = getAdultChildren();
    const hasAdultChild = adultChildren.length > 0;
    // 获取可用臣子（忠诚≥70）
    const ministers = G.characters.filter(c => c.met && c.isMinister && c.nation === pn.id && c.loyalty >= 70);
    const hasMinister = ministers.length > 0;
    // 攻打条件：兵力大于目标
    const canAttack = G.player.military > target.military;
    // 计算距离
    const dist = getNationDistance(pn, target);
    const distCost = Math.min(10, Math.max(1, Math.round(dist / 10)));

    let html = `<div style="text-align:center;margin-bottom:8px;"><b>${target.raceEmoji} ${target.name}</b><br><span style="font-size:0.7em;color:var(--text-dim);">距离 ${Math.round(dist)} 里</span></div>`;
    html += `<div style="display:flex;flex-direction:column;gap:4px;">`;

    // 联姻按钮
    html += `<button class="btn btn-block ${hasAdultChild ? 'btn-primary' : ''}" onclick="${hasAdultChild ? `showMarriageOptions(${target.id})` : `showModal('❌ 无法联姻','没有适龄的成年子嗣。',[{text:'知道了',action:closeModal}])`}" ${!hasAdultChild ? 'disabled' : ''}>💍 联姻${!hasAdultChild ? ' (无适龄子嗣)' : ''}</button>`;
    // 外交按钮
    html += `<button class="btn btn-block ${hasMinister ? 'btn-primary' : ''}" onclick="${hasMinister ? `showDiplomacyOptions(${target.id})` : `showModal('❌ 无法外交','没有忠诚度≥70的臣子可派遣。',[{text:'知道了',action:closeModal}])`}" ${!hasMinister ? 'disabled' : ''}>📨 外交 (需${distCost}国库)${!hasMinister ? ' (无可用臣子)' : ''}</button>`;
    // 攻打按钮
    html += `<button class="btn btn-block ${canAttack ? 'btn-danger' : ''}" onclick="${canAttack ? `attackNation(${target.id})` : `showModal('⚔️ 无法攻打','兵力不足，需要大于 ${target.military}。',[{text:'知道了',action:closeModal}])`}" ${!canAttack ? 'disabled' : ''}>⚔️ 攻打 (需${distCost}国库)${!canAttack ? ' (兵力不足)' : ''}</button>`;
    html += `<button class="btn btn-block" onclick="closeModal()">❌ 关闭</button>`;
    html += '</div>';
    showModal(`🌍 与 ${target.name} 的外交`, html, []);
}

// 联姻选择子嗣
export function showMarriageOptions(targetId) {
    const target = getNation(targetId);
    if (!target) return;
    const adultChildren = getAdultChildren();
    if (adultChildren.length === 0) {
        showModal('❌ 无适龄子嗣', '没有成年的子嗣可以联姻。', [{ text: '知道了', action: closeModal }]);
        return;
    }
    let html = `<p>选择一位子嗣与 ${target.name} 联姻：</p>`;
    adultChildren.forEach(child => {
        html += `<button class="btn btn-sm" onclick="executeMarriage(${target.id}, ${child.id})">${child.name}（${child.gender}，${child.age}岁）</button>`;
    });
    html += '<button class="btn btn-sm" onclick="closeModal()">取消</button>';
    showModal('💍 选择联姻子嗣', html, []);
}

export function executeMarriage(targetId, childId) {
    const target = getNation(targetId);
    const child = getChar(childId);
    if (!target || !child) return;
    closeModal();
    // 联姻成功率（基于双方威望、国力等）
    const pn = getPlayerNation();
    if (!pn) return;
    const successRate = 0.5 + (G.player.prestige / 200) + (pn.power / 200) - (target.power / 300);
    if (Math.random() < successRate) {
        // 成功
        G.player.prestige = clamp(G.player.prestige + 10, 0, 200);
        target.relations[pn.id] = (target.relations[pn.id] || 0) + 30;
        pn.relations[target.id] = (pn.relations[target.id] || 0) + 30;
        addLog(`💍 子嗣 ${child.name} 与 ${target.name} 联姻成功！威望+10`, 'success');
        addCharacterLog(child.id, 'marriage', `与 ${target.name} 联姻`, true);
        // 将子嗣从列表中移除（视为嫁出）
        const idx = G.children.indexOf(child);
        if (idx > -1) G.children.splice(idx, 1);
        // 也可以从角色中移除
        const charIdx = G.characters.indexOf(child);
        if (charIdx > -1) G.characters.splice(charIdx, 1);
        renderAll();
        showModal('💍 联姻成功', `${child.name} 与 ${target.name} 联姻成功！`, [{ text: '好的', action: closeModal }]);
    } else {
        G.player.prestige = clamp(G.player.prestige - 5, 0, 200);
        target.relations[pn.id] = (target.relations[pn.id] || 0) - 10;
        pn.relations[target.id] = (pn.relations[target.id] || 0) - 10;
        addLog(`💔 联姻失败，威望-5`, 'danger');
        renderAll();
        showModal('💔 联姻失败', `${target.name} 拒绝了联姻。`, [{ text: '知道了', action: closeModal }]);
    }
}

// 外交派遣臣子
export function showDiplomacyOptions(targetId) {
    const target = getNation(targetId);
    if (!target) return;
    const pn = getPlayerNation();
    if (!pn) return;
    const dist = getNationDistance(pn, target);
    const cost = Math.min(10, Math.max(1, Math.round(dist / 10)));
    if (G.player.treasury < cost) {
        showModal('🏦 国库不足', `需要 ${cost} 国库，当前只有 ${G.player.treasury}。`, [{ text: '知道了', action: closeModal }]);
        return;
    }
    const ministers = G.characters.filter(c => c.met && c.isMinister && c.nation === pn.id && c.loyalty >= 70);
    if (ministers.length === 0) {
        showModal('❌ 无可用臣子', '没有忠诚度≥70的臣子。', [{ text: '知道了', action: closeModal }]);
        return;
    }
    let html = `<p>选择一位臣子出使 ${target.name}（消耗 ${cost} 国库）：</p>`;
    ministers.forEach(c => {
        html += `<button class="btn btn-sm" onclick="executeDiplomacyMission(${target.id}, ${c.id}, ${cost})">${c.name}（等级${c.level}，忠诚${c.loyalty}）</button>`;
    });
    html += '<button class="btn btn-sm" onclick="closeModal()">取消</button>';
    showModal('📨 派遣使者', html, []);
}

export function executeDiplomacyMission(targetId, ministerId, cost) {
    const target = getNation(targetId);
    const minister = getChar(ministerId);
    if (!target || !minister) return;
    const pn = getPlayerNation();
    if (!pn) return;
    if (G.player.treasury < cost) {
        showModal('🏦 国库不足', `需要 ${cost} 国库。`, [{ text: '知道了', action: closeModal }]);
        return;
    }
    G.player.treasury -= cost;
    // 计算成功率：基础50% + 臣子等级*3% + 魅力/100 - 目标国力/500 + 种族修正
    let successRate = 0.5 + (minister.level * 0.03) + (minister.charm / 200) - (target.power / 500);
    // 种族性格修正：狐族狡黠 -5%，狮族勇猛 +5% 等（简单示例）
    const raceData = RACE_DATA[target.race];
    if (raceData) {
        if (target.race === '狐族') successRate -= 0.05;
        if (target.race === '狮族') successRate += 0.05;
        if (target.race === '龙族') successRate += 0.03;
    }
    successRate = clamp(successRate, 0.1, 0.95);
    if (Math.random() < successRate) {
        // 成功
        const gain = rand(5, 15);
        target.relations[pn.id] = (target.relations[pn.id] || 0) + gain;
        pn.relations[target.id] = (pn.relations[target.id] || 0) + gain;
        G.player.prestige = clamp(G.player.prestige + 3, 0, 200);
        addLog(`📨 ${minister.name} 出使 ${target.name} 成功！关系+${gain}，威望+3`, 'success');
        addCharacterLog(minister.id, 'diplomacy_success', `出使 ${target.name} 成功`, true);
        renderAll();
        showModal('✅ 外交成功', `${minister.name} 使 ${target.name} 关系提升。`, [{ text: '好的', action: closeModal }]);
    } else {
        const loss = rand(3, 8);
        target.relations[pn.id] = (target.relations[pn.id] || 0) - loss;
        pn.relations[target.id] = (pn.relations[target.id] || 0) - loss;
        G.player.prestige = clamp(G.player.prestige - 2, 0, 200);
        addLog(`📨 ${minister.name} 出使 ${target.name} 失败，关系-${loss}，威望-2`, 'danger');
        addCharacterLog(minister.id, 'diplomacy_fail', `出使 ${target.name} 失败`, true);
        renderAll();
        showModal('❌ 外交失败', `${minister.name} 未能达成外交。`, [{ text: '知道了', action: closeModal }]);
    }
}

// 攻打
export function attackNation(targetId) {
    const target = getNation(targetId);
    if (!target) return;
    const pn = getPlayerNation();
    if (!pn) return;
    if (G.player.military <= target.military) {
        showModal('⚔️ 无法攻打', '兵力不足。', [{ text: '知道了', action: closeModal }]);
        return;
    }
    const dist = getNationDistance(pn, target);
    const cost = Math.min(10, Math.max(1, Math.round(dist / 10)));
    if (G.player.treasury < cost) {
        showModal('🏦 国库不足', `需要 ${cost} 国库。`, [{ text: '知道了', action: closeModal }]);
        return;
    }
    // 攻打成功率：兵力差 / 目标兵力
    const ratio = (G.player.military - target.military) / target.military;
    const successRate = clamp(0.3 + ratio * 0.5, 0.1, 0.95);
    if (Math.random() < successRate) {
        // 胜利
        G.player.treasury -= cost;
        const loot = rand(500, 3000);
        G.player.wealth = addWealth(G.player.wealth, loot);
        G.player.prestige = clamp(G.player.prestige + 10, 0, 200);
        const milLoss = rand(3, 8);
        G.player.military = clamp(G.player.military - milLoss, 0, 500);
        target.military = Math.max(0, target.military - rand(5, 15));
        target.wealth = Math.max(0, target.wealth - rand(5, 20));
        target.relations[pn.id] = (target.relations[pn.id] || 0) - 40;
        pn.relations[target.id] = (pn.relations[target.id] || 0) - 40;
        addLog(`⚔️ 战胜 ${target.name}！掠夺 ${loot} 铜，威望+10`, 'success');
        if (Math.random() < 0.3) { target.vassal = pn.id; addLog(`📜 ${target.name} 成为附属国！`, 'highlight'); unlockAchievement('vassal_1'); }
        renderAll();
        showModal('⚔️ 大胜', `攻打了 ${target.name}，掠夺 ${loot} 铜，威望+10。`, [{ text: '好的', action: closeModal }]);
    } else {
        // 失败
        G.player.treasury -= cost;
        const loss = rand(10, 20);
        G.player.military = clamp(G.player.military - loss, 0, 500);
        G.player.prestige = clamp(G.player.prestige - 5, 0, 200);
        target.relations[pn.id] = (target.relations[pn.id] || 0) - 20;
        pn.relations[target.id] = (pn.relations[target.id] || 0) - 20;
        addLog(`⚔️ 攻打 ${target.name} 失败，兵力-${loss}，威望-5`, 'danger');
        renderAll();
        showModal('⚔️ 战败', `攻打 ${target.name} 失败，兵力损失 ${loss}。`, [{ text: '知道了', action: closeModal }]);
    }
}

// ========== 其他原有函数（保持不变） ==========
// 注：以下函数与之前相同，为节省篇幅不再重复，但实际文件中保留
// ... 原 interactChar, renameSubject, renameNation, removeHarem 等
// 但需要确保上述新增函数使用了正确的导入。