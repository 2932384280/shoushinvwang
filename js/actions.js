import { G, getChar, getPlace, getNation, getPlayerNation, getNationPower, getNationDistance, addLog, addCharacterLog, getCharacterLogs, generateCharacter, revealCharacter, unlockAchievement, autoSave, saveToSlot, loadFromSlot } from './state.js';
import { pick, rand, clamp, RACE_DATA, RACE_KEYS, isMale, genderText, wealthToCopper, formatWealth, addWealth, getDateString, timeStr } from './data.js';

// ========== 时间推进 ==========
export function advanceTime(steps) {
    steps=steps||1;
    for(let i=0;i<steps;i++){
        G.player.period=(G.player.period+1)%4;
        if(G.player.period===0){
            G.player.day++;
            G.player.weekDay=(G.player.weekDay%7)+1;
            let monthChanged = false;
            if(G.player.day>30){ G.player.day=1; G.player.month++; monthChanged = true; if(G.player.month>12){ G.player.month=1; G.player.year++; } }
            if(monthChanged){
                G.characters.forEach(c => {
                    c.age += 1;
                    const maxAge = c.race==='人鱼族'?500:100;
                    if(c.age > maxAge){
                        if(c.inHarem){ c.inHarem=false; G.harem=G.harem.filter(id=>id!==c.id); }
                        c.isMinister=false; c.met=false;
                        addLog(`💀 ${c.name} 寿终正寝。`,'danger');
                        const idx = G.characters.indexOf(c);
                        if(idx>-1) G.characters.splice(idx,1);
                    }
                });
                G.hiddenCharacters.forEach(c => {
                    c.age += 1;
                    const maxAge = c.race==='人鱼族'?500:100;
                    if(c.age > maxAge){
                        const idx = G.hiddenCharacters.indexOf(c);
                        if(idx>-1) G.hiddenCharacters.splice(idx,1);
                    }
                });
            }

            if(G.player.weekDay===1){
                let g=rand(3,6);
                G.player.prestige=clamp(G.player.prestige+g,0,200);
                G.player.wealth=addWealth(G.player.wealth,rand(500,2000));
                G.player.rule=clamp(G.player.rule+rand(1,3),0,100);
                addLog(`📜 周一会议，威望+${g}`,'highlight');
            }
            G.player.health=Math.min(G.player.maxHealth,G.player.health+3);
            G.player.stamina=Math.min(100,G.player.stamina+10);

            for(let j=0;j<G.characters.length;j++){
                const c=G.characters[j];
                if(c.pregnant && c.pregnancyDays>0){
                    c.pregnancyDays--;
                    if(c.pregnancyDays<=0){
                        const gen = pick(['皇子','公主']);
                        const nm = pick(['玄','苍','凌'])+pick(['风','云','月']);
                        G.children.push({id:G._nextId++, name:nm, gender:gen, race:c.race, father:G.player.name, mother:c.name, charm:rand(30,80), potential:rand(30,80), age:0});
                        c.children=(c.children||0)+1;
                        c.pregnant=false; c.pregnancyDays=0; c.healthStatus='健康';
                        addLog(`👶 ${c.name} 诞下 ${gen} ${nm}！`,'success');
                        unlockAchievement('first_child');
                    }
                }
            }
            G.characters.filter(c=>c.inHarem&&c.chamberBuilt).forEach(c=>{
                if(Math.random()<0.02 && !c.pregnant && c.healthStatus!='生病'){ c.healthStatus='生病'; addLog(`🤒 ${c.name} 生病了`,'danger'); }
                if(c.healthStatus=='生病' && Math.random()<0.15){ c.healthStatus='健康'; addLog(`💊 ${c.name} 康复`,'success'); }
            });
            if(G.diplomacy.pending) completeDiplomacy();
            autoSave();
        }
        G.player.stamina=clamp(G.player.stamina-rand(2,4),0,100);
    }
    if(G.player.stamina<=0){ G.player.stamina=60; addLog('💤 体力耗尽，恢复至60','danger'); }
    if(G.children.length>=1) unlockAchievement('first_child');
    if(G.harem.length>=3) unlockAchievement('harem_3');
    if(G.characters.length>=10) unlockAchievement('char_10');
    if(wealthToCopper(G.player.wealth)>=1000000) unlockAchievement('wealth_1');
    if(G.player.day + G.player.month*30 + G.player.year*360 >= 30) unlockAchievement('day_30');
    if(G.nations.some(n=>n.vassal===G.player.nationId)) unlockAchievement('vassal_1');
    renderAll();
}

// ========== 地点移动 ==========
export function goToPlace(id) {
    const p = getPlace(id); if(!p) return;
    if(p.action=='exit_palace'){ G.player.realm='city'; G.player.location='wang_gong'; addLog('🚪 走出王宫，来到王都。'); renderAll(); switchPage('places'); return; }
    if(p.action=='enter_palace'){ G.player.realm='palace'; G.player.location='qin_dian'; addLog('🏰 回到王宫。'); renderAll(); switchPage('places'); return; }
    if(p.action=='exit_city'){ G.player.realm='outcity'; G.player.location='cheng_men_wai'; addLog('🚪 走出城门，来到城外。'); renderAll(); switchPage('places'); return; }
    if(p.action=='enter_city'){ G.player.realm='city'; G.player.location='cheng_men'; addLog('🚪 回到王都。'); renderAll(); switchPage('places'); return; }
    if(p.action=='enter_harem'){ G.player.location='hou_gong'; renderHaremInterior(); document.querySelectorAll('.page').forEach(pg=>pg.classList.remove('active')); G.currentPage='harem_interior'; return; }
    G.player.location = id; handlePlaceEvent(p); renderAll(); switchPage('places');
}

export function quickGoTo(realm) {
    if(realm=='palace'){ G.player.realm='palace'; G.player.location='qin_dian'; addLog('🏰 回到王宫。'); }
    else if(realm=='city'){ G.player.realm='city'; G.player.location='cheng_men'; addLog('🏙️ 来到王都。'); }
    else if(realm=='outcity'){ G.player.realm='outcity'; G.player.location='cheng_men_wai'; addLog('🌄 来到城外。'); }
    renderAll(); switchPage('places');
}

// ========== 地点事件处理 ==========
export function handlePlaceEvent(p) {
    if(p.id=='pai_mai_chang'){ showAuctionHouse(); return; }
    if(p.id=='hou_gong'){ renderHaremInterior(); return; }
    if(p.id=='qin_dian'){ let h=rand(5,15); G.player.health=Math.min(G.player.maxHealth,G.player.health+h); G.player.stamina=Math.min(100,G.player.stamina+10); addLog(`🛏️ 小憩，生命+${h}，体力+10`,'success'); return; }
    if(p.id=='yi_shi_ting'){ let g=rand(2,5); G.player.prestige=clamp(G.player.prestige+g,0,200); G.player.rule=clamp(G.player.rule+g,0,100); addLog(`⚖️ 议政，威望+${g}，统治力+${g}`,'success'); if(G.player.weekDay===1){ G.player.wealth=addWealth(G.player.wealth,rand(500,2000)); addLog('📅 周一例会，财富增加','success'); } return; }
    if(p.id=='gong_yi_suo'){ addLog('💉 宫医为你检查身体。'); G.player.health=Math.min(G.player.maxHealth,G.player.health+10); return; }
    if(p.id=='di_lao'){ addLog('⛓️ 巡视地牢。'); return; }
    if(p.id=='hou_hua_yuan'){
        const hc=G.characters.filter(c=>c.inHarem&&c.chamberBuilt);
        if(hc.length&&Math.random()<0.4){ const fav=pick(hc); addLog(`🌺 与 ${fav.name} 赏花。`,'highlight'); fav.affection=clamp(fav.affection+2,0,100); addCharacterLog(fav.id,'garden','后花园相遇',true); }
        else addLog('🌺 后花园漫步。');
        G.player.charm=clamp(G.player.charm+1,0,100); G.player.stamina=clamp(G.player.stamina+3,0,100);
        return;
    }
    if(p.id=='jiu_guan'){
        let g=rand(1,3); G.player.charm=clamp(G.player.charm+g,0,100); G.player.intelligence=clamp(G.player.intelligence+g,0,100);
        addLog(`🍺 酒馆消息，魅力+${g}，智慧+${g}`,'success');
        if(Math.random()<0.12){
            const hc=G.hiddenCharacters.length?G.hiddenCharacters[Math.floor(Math.random()*G.hiddenCharacters.length)]:null;
            if(hc){ revealCharacter(hc.id); addCharacterLog(hc.id,'meet','在酒馆邂逅女王',true); }
            else { const nc=generateCharacter(); nc.met=true; G.characters.push(nc); addLog(`👤 酒馆遇到 ${nc.name}`,'highlight'); unlockAchievement('first_meet'); }
        }
        return;
    }
    if(p.id=='shi_ji'){ let g=rand(300,800); G.player.wealth=addWealth(G.player.wealth,g); G.player.charm=clamp(G.player.charm+1,0,100); addLog(`🏪 市集贸易，财富+${g}铜，魅力+1`,'success'); return; }
    if(p.id=='xun_lian_chang'){ let g=rand(2,5); G.player.military=clamp(G.player.military+g,0,500); G.player.stamina=clamp(G.player.stamina-5,0,100); addLog(`💪 操练，兵力+${g}，体力-5`,'success'); if(G.player.maxHealth<100&&Math.random()<0.2){ G.player.maxHealth=Math.min(100,G.player.maxHealth+1); addLog('❤️ 体质提升，生命上限+1','highlight'); } return; }
    if(p.id=='tie_jiang_pu'){ let cost=rand(300,1500); if(wealthToCopper(G.player.wealth)>=cost){ G.player.wealth=addWealth(G.player.wealth,-cost); let g=rand(2,4); G.player.military=clamp(G.player.military+g,0,500); addLog(`🔨 锻造，花费${cost}铜，兵力+${g}`,'success'); } else addLog('🔨 铁匠铺需要钱。','danger'); return; }
    if(p.id=='sa_man_ji_tan'){ let g=rand(2,5); G.player.intelligence=clamp(G.player.intelligence+g,0,100); G.player.prestige=clamp(G.player.prestige+g,0,200); addLog(`🔮 祈福，智慧+${g}，威望+${g}`,'success'); return; }
    if(p.id=='hei_shi'){ if(Math.random()<0.3){ let g=rand(500,3000); G.player.wealth=addWealth(G.player.wealth,g); addLog(`🌙 黑市淘到好东西，财富+${g}铜`,'success'); } else { let l=rand(200,1500); G.player.wealth=addWealth(G.player.wealth,-l); addLog(`🌙 黑市交易失败，财富-${l}铜`,'danger'); } return; }
    if(p.id=='di_xia_jue_dou_chang'){ if(G.player.military>=10){ let g=rand(3,8); G.player.military=clamp(G.player.military+g,0,500); G.player.prestige=clamp(G.player.prestige+g,0,200); addLog(`💀 地下角斗，兵力+${g}，威望+${g}`,'success'); } else addLog('💀 兵力不足，只能旁观。'); return; }
    if(p.id=='pin_min_qu'){ let g=rand(1,3); G.player.charm=clamp(G.player.charm+g,0,100); G.player.prestige=clamp(G.player.prestige+g,0,200); addLog(`🏚️ 巡视贫民窟，魅力+${g}，威望+${g}`,'success'); return; }
    if(p.id=='fu_min_qu'){ let g=rand(300,800); G.player.wealth=addWealth(G.player.wealth,g); G.player.charm=clamp(G.player.charm+1,0,100); addLog(`🏘️ 富民区，财富+${g}铜，魅力+1`,'success'); return; }
    if(p.id=='fan_dian'){ let cost=rand(200,800); if(wealthToCopper(G.player.wealth)>=cost){ G.player.wealth=addWealth(G.player.wealth,-cost); let h=rand(5,12); G.player.health=Math.min(G.player.maxHealth,G.player.health+h); G.player.charm=clamp(G.player.charm+1,0,100); addLog(`🍽️ 享用美食，生命+${h}，魅力+1`,'success'); } else addLog('🍽️ 饭店需要钱。','danger'); return; }
    if(p.id=='he_bian'){ let g=rand(1,3); G.player.charm=clamp(G.player.charm+g,0,100); G.player.stamina=clamp(G.player.stamina+5,0,100); addLog(`🌊 河边漫步，魅力+${g}，体力+5`,'success'); if(Math.random()<0.1){ const hc=G.hiddenCharacters.length?G.hiddenCharacters[Math.floor(Math.random()*G.hiddenCharacters.length)]:null; if(hc){ revealCharacter(hc.id); addCharacterLog(hc.id,'meet','在河边邂逅女王',true); } } return; }
    if(p.id=='mi_lin'){ let g=rand(1,3); G.player.intelligence=clamp(G.player.intelligence+g,0,100); let w=rand(300,800); G.player.wealth=addWealth(G.player.wealth,w); addLog(`🌲 密林采集，智慧+${g}，财富+${w}铜`,'success'); if(Math.random()<0.08){ let d=rand(5,10); G.player.health=clamp(G.player.health-d,0,G.player.maxHealth); addLog(`⚠️ 遭遇野兽，生命-${d}`,'danger'); } return; }
    if(p.id=='yue_ya'){ let g=rand(2,4); G.player.charm=clamp(G.player.charm+g,0,100); G.player.prestige=clamp(G.player.prestige+g,0,200); addLog(`🌙 月崖赏月，魅力+${g}，威望+${g}`,'success'); return; }
    if(p.id=='shi_lin_shan_mai'){ let g=rand(2,5); G.player.military=clamp(G.player.military+g,0,500); G.player.stamina=clamp(G.player.stamina-5,0,100); addLog(`⛰️ 山脉探险，兵力+${g}，体力-5`,'success'); if(Math.random()<0.1){ let d=rand(5,12); G.player.health=clamp(G.player.health-d,0,G.player.maxHealth); addLog(`⚠️ 落石，生命-${d}`,'danger'); } return; }
    if(p.id=='shao_ta'){ let g=rand(1,3); G.player.intelligence=clamp(G.player.intelligence+g,0,100); addLog(`🗼 登高望远，智慧+${g}`,'success'); return; }
    if(p.id=='zhong_yang_guang_chang'){ let g=rand(1,3); G.player.charm=clamp(G.player.charm+g,0,100); G.player.prestige=clamp(G.player.prestige+g,0,200); addLog(`🏛️ 广场巡视，魅力+${g}，威望+${g}`,'success'); return; }
    if(p.id=='mao_xian_zhe_xie_hui'){ if(G.player.military>=5){ let g=rand(3,8); G.player.military=clamp(G.player.military+g,0,500); let w=rand(500,1500); G.player.wealth=addWealth(G.player.wealth,w); addLog(`🎯 招募勇士，兵力+${g}，财富+${w}铜`,'success'); } else addLog('🎯 兵力不足，无法接委托。'); return; }
    if(p.id=='jue_dou_chang'){ if(G.player.military>=5){ let g=rand(2,5); G.player.military=clamp(G.player.military+g,0,500); G.player.prestige=clamp(G.player.prestige+g,0,200); addLog(`⚔️ 观战，兵力+${g}，威望+${g}`,'success'); } else addLog('⚔️ 兵力不足，只能旁观。'); return; }
    addLog(`📍 在 ${p.name} 停留，体力-2`);
    G.player.stamina=clamp(G.player.stamina-2,0,100);
}

// ========== 拍卖场 ==========
export function showAuctionHouse() {
    const items = [{name:'古籍·兽世编年',desc:'珍贵典籍',value:2000,icon:'📜'},{name:'月光石吊坠',desc:'精致饰品',value:3000,icon:'💎'},{name:'龙鳞护甲',desc:'轻甲',value:5000,icon:'🛡️'},{name:'九尾灵狐尾',desc:'珍材',value:4000,icon:'🦊'},{name:'星铁矿石',desc:'锻造材料',value:6000,icon:'⛏️'},{name:'千年灵芝',desc:'药材',value:2800,icon:'🍄'}];
    const item = pick(items); const price = item.value+rand(-500,500);
    const priceStr = price>=1000000?(price/1000000).toFixed(1)+'金':price>=1000?Math.floor(price/1000)+'银'+(price%1000)+'铜':price+'铜';
    showModal('🔨 拍卖场',`今日珍品：${item.icon} ${item.name}\n${item.desc}\n起拍价：${priceStr}`,[
        {text:'💰 出价',action:()=>{
            if(wealthToCopper(G.player.wealth)>=price){ G.player.wealth=addWealth(G.player.wealth,-price); addLog(`🔨 拍得 ${item.name}，花费 ${priceStr}`,'success'); G.player.prestige=clamp(G.player.prestige+rand(1,3),0,200); G.player.charm=clamp(G.player.charm+rand(1,3),0,100); closeModal(); renderAll(); }
            else showModal('💰 财富不足','你无法拍下此物。',[{text:'遗憾',action:closeModal}]);
        }},
        {text:'👋 离开',action:closeModal}
    ]);
}

// ========== 外交系统 ==========
export function showNationDiplomacy(nationId) {
    const pn = getPlayerNation(); const target = getNation(nationId);
    if(!pn||!target||target.id===pn.id) return;
    const dist = getNationDistance(pn,target);
    const needMessenger = dist>50;
    if(G.diplomacy.pending){ showModal('⏳ 外交进行中','已有外交任务在进行中。',[{text:'知道了',action:closeModal}]); return; }
    const messengers = G.characters.filter(c=>c.met&&c.isMinister&&c.nation===pn.id&&c.loyalty>=70);
    let html = `<div style="text-align:center;margin-bottom:8px;"><b>${target.raceEmoji} ${target.name}</b><br><span style="font-size:0.7em;color:var(--text-dim);">距离 ${Math.round(dist)} 里</span><br>`;
    if(needMessenger){ html+= '<span style="font-size:0.6em;color:var(--gold-light);">📨 需要派遣使者（忠诚≥70）</span>'; if(messengers.length===0) html+= '<br><span style="font-size:0.6em;color:#e8a080;">⚠️ 没有符合条件的使者</span>'; } else html+= '<span style="font-size:0.6em;color:#80b080;">✅ 可直接外交</span>';
    html += '</div><div style="display:flex;flex-direction:column;gap:4px;">';
    const options = [{text:'💍 联姻',action:'marry'},{text:'⚔️ 攻打',action:'attack'},{text:'📜 附属',action:'vassal'},{text:'❌ 关闭',action:'close'}];
    options.forEach(o=>{
        let disabled = false;
        if(o.action!=='close' && needMessenger && messengers.length===0) disabled=true;
        if(o.action==='attack' && G.player.military < target.military*0.7) disabled=true;
        if(G.diplomacy.pending && o.action!=='close') disabled=true;
        html += `<button class="btn btn-block${o.action==='close'?' btn-primary':''}" onclick="${o.action==='close'?'closeModal()':`closeModal();startDiplomacy('${o.action}',${target.id})`}" style="margin:0;" ${disabled?'disabled':''}>${o.text}${disabled?' ⚠️':''}</button>`;
    });
    html += '</div>';
    showModal('🌍 外交选项',html,[]);
}

export function startDiplomacy(action,targetId) {
    const target = getNation(targetId); if(!target) return;
    const pn = getPlayerNation(); if(!pn) return;
    const dist = getNationDistance(pn,target);
    const needMessenger = dist>50;
    if(G.diplomacy.pending){ showModal('⏳ 外交进行中','已有外交任务进行中。',[{text:'知道了',action:closeModal}]); return; }
    if(needMessenger){
        const messengers = G.characters.filter(c=>c.met&&c.isMinister&&c.nation===pn.id&&c.loyalty>=70);
        if(messengers.length===0){ showModal('📨 无使者可用','没有忠诚度≥70的臣子可派遣。',[{text:'知道了',action:closeModal}]); return; }
        let html = `<p>选择一位使者出访 ${target.name}：</p>`;
        messengers.forEach(c=> html += `<button class="btn btn-sm" onclick="sendMessenger('${action}',${target.id},${c.id})">${c.name}（忠诚${c.loyalty}）</button>`);
        html += '<button class="btn btn-sm" onclick="closeModal()">取消</button>';
        showModal('📨 派遣使者',html,[]);
    } else executeDiplomacy(action,target,null);
}

export function sendMessenger(action,targetId,messengerId) {
    const target = getNation(targetId); const messenger = getChar(messengerId);
    if(!target||!messenger) return;
    closeModal();
    const pn = getPlayerNation(); if(!pn) return;
    const dist = getNationDistance(pn,target);
    const travelDays = Math.max(1,Math.round(dist/10));
    G.diplomacy.pending = {action,targetId:target.id,targetName:target.name,messengerId:messenger.id,remainingDays:travelDays,totalDays:travelDays,completed:false};
    addLog(`📨 派遣 ${messenger.name} 出使 ${target.name}，预计 ${travelDays} 天后到达。`,'highlight');
    addCharacterLog(messenger.id,'diplomacy',`出使 ${target.name}（${action}）`,true);
    renderAll();
    showModal('📨 使者已出发',`使者 ${messenger.name} 已前往 ${target.name}，预计 ${travelDays} 天返回结果。`,[{text:'好的',action:closeModal}]);
}

export function completeDiplomacy() {
    const pending = G.diplomacy.pending; if(!pending) return;
    pending.remainingDays--;
    if(pending.remainingDays<=0){
        const target = getNation(pending.targetId);
        if(target) executeDiplomacy(pending.action,target,pending.messengerId);
        G.diplomacy.pending=null;
        const messenger = getChar(pending.messengerId);
        if(messenger) addCharacterLog(messenger.id,'diplomacy_done',`出使 ${target?target.name:'未知'} 完成`,true);
        addLog(`📨 ${messenger?messenger.name:'使者'} 从 ${target?target.name:'未知'} 返回，外交任务完成。`,'success');
        renderAll();
    } else renderAll();
}

export function executeDiplomacy(action,target,messengerId) {
    const pn = getPlayerNation(); if(!pn) return;
    let successRate = 0.7 + (G.player.prestige/200);
    if(messengerId){ const messenger = getChar(messengerId); if(messenger) successRate += messenger.charm/200; }
    if(action=='marry'){
        if(G.player.prestige<20){ showModal('💍 联姻失败','威望不足20。',[{text:'知道了',action:closeModal}]); return; }
        if(Math.random()>successRate){ showModal('💍 联姻被拒',`${target.name} 拒绝了联姻。`,[]); target.relations[pn.id]=(target.relations[pn.id]||0)-5; return; }
        G.player.prestige-=20; target.relations[pn.id]=(target.relations[pn.id]||0)+25; pn.relations[target.id]=(pn.relations[target.id]||0)+25;
        addLog(`💍 与 ${target.name} 联姻成功！`,'success');
        const spouse = generateCharacter('雄性',target.race,target.id,20,40); spouse.met=true; spouse.nation=target.id; G.characters.push(spouse);
        addCharacterLog(spouse.id,'marry',`作为联姻使者来到 ${pn.name}`,true);
        renderAll(); switchPage('nations'); return;
    }
    if(action=='attack'){
        if(G.player.military<target.military){ showModal('⚔️ 攻打失败','兵力不足。',[]); return; }
        if(Math.random()>successRate){ showModal('⚔️ 攻打被拒','战争爆发！',[]); G.player.military=clamp(G.player.military-rand(10,20),0,500); target.relations[pn.id]=(target.relations[pn.id]||0)-40; return; }
        const gain=rand(500,3000); G.player.wealth=addWealth(G.player.wealth,gain); G.player.prestige=clamp(G.player.prestige+10,0,200);
        target.military=Math.max(0,target.military-rand(5,15)); G.player.military=clamp(G.player.military-rand(3,8),0,500);
        addLog(`⚔️ 战胜 ${target.name}！获得 ${gain}铜，威望+10`,'success');
        target.relations[pn.id]=(target.relations[pn.id]||0)-30; pn.relations[target.id]=(pn.relations[target.id]||0)-30;
        if(Math.random()<0.3){ target.vassal=pn.id; addLog(`📜 ${target.name} 成为附属国！`,'highlight'); unlockAchievement('vassal_1'); }
        renderAll(); switchPage('nations'); return;
    }
    if(action=='vassal'){
        if(G.player.prestige<40){ showModal('📜 附属失败','威望不足40。',[]); return; }
        if(getNationPower(pn)<getNationPower(target)*1.2){ showModal('📜 附属失败','国力不足。',[]); return; }
        if(Math.random()>successRate){ showModal('📜 附属被拒',`${target.name} 拒绝臣服。`,[]); target.relations[pn.id]=(target.relations[pn.id]||0)-10; return; }
        target.vassal=pn.id; G.player.prestige=clamp(G.player.prestige+15,0,200); target.relations[pn.id]=(target.relations[pn.id]||0)-10;
        addLog(`📜 ${target.name} 成为附属国！威望+15`,'success');
        unlockAchievement('vassal_1');
        renderAll(); switchPage('nations'); return;
    }
}

// ========== 纳妃（仅限雄性兽人） ==========
export function recruitCharToHarem(id) {
    const c = getChar(id); if(!c) return;
    const pn = getPlayerNation();

    // 只允许雄性入宫
    if (!c.isMale) {
        showModal('❌ 不可纳妃', '只有雄性兽人可以纳入后宫。', [{text:'知道了', action:closeModal}]);
        return;
    }

    if(c.isRuler && c.nation!==pn?.id){ showModal('❌ 不可纳妃','外国国王不可纳入后宫。',[{text:'知道了',action:closeModal}]); return; }
    if(c.inHarem){ showModal('💕 已在后宫',`${c.name} 已经是妃子。`,[]); return; }
    if(c.relations?.some(r=>r.type==='配偶')){ showModal('❌ 已有配偶',`${c.name} 已有配偶，无法纳入后宫。`,[]); return; }
    if(c.affection<50){ if(Math.random()<0.5){ c.affection=clamp(c.affection-5,0,100); addLog(`😤 ${c.name} 拒绝纳妃，好感-5。`,'danger'); renderAll(); showModal('💔 被拒绝',`${c.name} 婉拒了你的心意。`,[{text:'知道了',action:closeModal}]); return; } }
    if(wealthToCopper(G.player.wealth)<20000){ showModal('💰 财富不足','纳妃需要20银（20,000铜）。',[]); return; }
    G.player.wealth=addWealth(G.player.wealth,-20000);
    c.inHarem=true; c.pendingChamber=true; c.chamberBuilt=false; c.isMinister=false;
    addLog(`💕 ${c.name} 同意入宫！消耗20银。`,'success');
    addCharacterLog(c.id,'recruit','同意入宫，等待建造寝殿',true);
    unlockAchievement('first_harem');
    renderAll(); switchPage('harem');
    showModal('💕 纳妃成功',`${c.name} 已同意入宫，请前往「后宫」页面建造寝殿（消耗50国库）。`,[{text:'好的',action:closeModal}]);
}

// ========== 后宫寝殿建造 ==========
export function buildChamberForPending(charId) {
    const c = getChar(charId); if(!c||!c.inHarem||c.chamberBuilt) return;
    if(G.player.treasury<50){ showModal('🏦 国库不足','建造寝殿需要50国库。',[{text:'知道了',action:closeModal}]); return; }
    G.player.treasury-=50; c.chamberBuilt=true; c.pendingChamber=false;
    if(!c.chamberName||c.chamberName=='未命名') c.chamberName = c.name+'殿';
    G.harem.push(c.id); G.haremChambers.push({id:G._nextId++, name:c.chamberName, ownerId:c.id});
    addLog(`🏛️ 为 ${c.name} 建造寝殿「${c.chamberName}」，消耗50国库。`,'success');
    addCharacterLog(c.id,'chamber_built',`建造寝殿「${c.chamberName}」`,true);
    renderAll(); switchPage('harem');
    showModal('✅ 入宫完成',`${c.name} 已正式入住后宫，寝殿名为「${c.chamberName}」。`,[{text:'好的',action:closeModal}]);
}

export function cancelPendingHarem(charId) {
    const c = getChar(charId); if(!c) return;
    if(!confirm(`确定取消 ${c.name} 的入宫资格吗？`)) return;
    c.inHarem=false; c.pendingChamber=false; c.isMinister=false;
    addLog(`❌ 取消 ${c.name} 入宫资格。`,'danger');
    renderAll(); switchPage('harem');
}

// ========== 后宫互动 ==========
export function visitChamber(chamberId) {
    const ch = G.haremChambers.find(c=>c.id===chamberId); if(!ch) return;
    const owner = getChar(ch.ownerId); if(!owner) return;
    const status = owner.pregnant?'🤰 怀孕':(owner.healthStatus||'健康');
    document.getElementById('content').innerHTML = `<div style="padding:4px 0;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><button class="btn btn-sm" onclick="renderHaremInterior()">← 返回后宫</button><span style="font-size:0.85em;font-weight:700;color:var(--gold-light);">🏛️ ${ch.name}</span></div>
        <div class="card"><div class="card-title">👤 妃子信息</div><div style="display:flex;align-items:center;gap:8px;"><span style="font-size:1.8em;">${owner.raceEmoji}</span><div><div style="font-weight:700;color:${isMale(owner.gender)?'var(--male-color)':'var(--female-color)'};">${owner.name} ${genderText(owner.gender)}</div><div style="font-size:0.7em;color:var(--text-dim);">${owner.race} ｜ 好感 ${owner.affection} ｜ 忠诚 ${owner.loyalty}</div></div></div><div class="tags" style="margin-top:4px;"><span class="tag">状态：${status}</span><span class="tag">侍寝 ${owner.intimacyCount}次</span></div></div>
        <div class="card"><div class="card-title">💬 互动</div><button class="btn btn-sm btn-primary" onclick="doIntimacy(${owner.id})">🛏️ 侍寝</button><button class="btn btn-sm" onclick="talkToConcubine(${owner.id})">💬 聊天</button><button class="btn btn-sm" onclick="renderHaremInterior()">↩️ 返回</button></div></div>`;
    owner.location = 'chamber';
}

export function doIntimacy(charId) {
    const c = getChar(charId); if(!c) return;
    if(c.healthStatus=='生病'){ showModal('💔 无法侍寝',`${c.name} 正在生病。`,[{text:'知道了',action:closeModal}]); return; }
    if(c.pregnant){ showModal('💔 无法侍寝',`${c.name} 正在怀孕。`,[{text:'知道了',action:closeModal}]); return; }
    c.intimacyCount = (c.intimacyCount||0)+1;
    c.affection = clamp(c.affection+2,0,100);
    G.player.charm = clamp(G.player.charm+1,0,100);
    addLog(`🛏️ 与 ${c.name} 侍寝，感情升温。`,'highlight');
    addCharacterLog(c.id,'intimacy','侍寝一次',true);
    if(c.isMale && c.fertility>30 && Math.random()<0.08){
        c.pregnant=true; c.pregnancyDays=c.race==='人鱼族'?300:90; c.healthStatus='怀孕';
        addLog(`🤰 ${c.name} 怀孕了！`,'success');
        addCharacterLog(c.id,'pregnant','怀孕了',true);
    }
    renderAll();
    const chamber = G.haremChambers.find(ch=>ch.ownerId===charId);
    if(chamber) visitChamber(chamber.id);
}

export function talkToConcubine(charId) {
    const c = getChar(charId); if(!c) return;
    const gain = rand(3,6);
    c.affection = clamp(c.affection+gain,0,100);
    c.loyalty = clamp(c.loyalty+2,0,100);
    addLog(`💬 与 ${c.name} 聊天，好感 +${gain}。`,'success');
    addCharacterLog(c.id,'chat',`聊天，好感+${gain}`,true);
    renderAll();
    const chamber = G.haremChambers.find(ch=>ch.ownerId===charId);
    if(chamber) visitChamber(chamber.id);
}

// ========== 角色互动 ==========
export function interactChar(id) {
    const c = getChar(id); if(!c) return;
    const pn = getPlayerNation();
    if(c.nation!==pn?.id){ showModal('❌ 无法邀请','只有本国兽人可以邀请入职。',[{text:'知道了',action:closeModal}]); return; }
    if(c.isMinister){ showModal('📜 已入职',`${c.name} 已经是臣子。`,[]); return; }
    if(c.inHarem||c.isRuler){ showModal('❌ 无法邀请','后宫或统治者不能担任臣子。',[]); return; }
    c.isMinister=true; c.loyalty=clamp(c.loyalty+10,0,100);
    addLog(`📜 ${c.name} 受邀入职，忠诚+10`,'success');
    addCharacterLog(c.id,'join','受邀入职成为臣子',true);
    renderAll();
    showModal('✅ 邀请成功',`${c.name} 已加入朝堂。`,[{text:'好的',action:closeModal}]);
}

export function renameSubject(id) {
    const c = getChar(id); if(!c) return;
    const pn = getPlayerNation();
    if(c.nation!==pn?.id){ showModal('❌ 无权改名','只有本国臣民可以改名。',[]); return; }
    showModal('✏️ 改名',`<input type="text" id="renameInput" value="${c.name}" style="width:100%;padding:5px 10px;border-radius:10px;border:2px solid rgba(212,167,74,0.2);background:rgba(255,255,255,0.05);color:#fff;font-size:0.85em;text-align:center;">`,[
        {text:'✅ 确认',action:()=>{ const inp=document.getElementById('renameInput'); if(inp&&inp.value.trim()){ const newName=inp.value.trim(); if(G._usedNames.has(newName)&&newName!==c.name){ showModal('❌ 重名','名字已被使用。',[]); return; } G._usedNames.delete(c.name); G._usedNames.add(newName); c.name=newName; addLog(`✏️ 更名为 ${newName}`,'highlight'); addCharacterLog(c.id,'rename',`更名为 ${newName}`,true); closeModal(); renderAll(); renderCharacters(); } }},
        {text:'❌ 取消',action:closeModal}
    ]);
}

export function renameNation() {
    const pn = getPlayerNation(); if(!pn) return;
    showModal('✏️ 更改国名',`<input type="text" id="nationNameInput" value="${pn.name}" style="width:100%;padding:5px 10px;border-radius:10px;border:2px solid rgba(212,167,74,0.2);background:rgba(255,255,255,0.05);color:#fff;font-size:0.85em;text-align:center;">`,[
        {text:'✅ 确认',action:()=>{ const inp=document.getElementById('nationNameInput'); if(inp&&inp.value.trim()){ pn.name=inp.value.trim(); addLog(`✏️ 国名更改为 ${pn.name}`,'highlight'); closeModal(); renderAll(); switchPage('nations'); } }},
        {text:'❌ 取消',action:closeModal}
    ]);
}

// ========== 删除后宫（未实现） ==========
export function removeHarem(charId) {
    // 可以后续实现
}