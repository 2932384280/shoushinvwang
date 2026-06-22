import * as actions from './actions.js';
import * as render from './render.js';
import * as ui from './ui.js';
import * as state from './state.js';

// 将所有导出暴露到 window，供 HTML onclick 调用
Object.assign(window, actions, render, ui, state);

// 额外暴露常用函数（确保 HTML 中的 onclick 能找到）
window.goToPlace = actions.goToPlace;
window.quickGoTo = actions.quickGoTo;
window.interactChar = actions.interactChar;
window.recruitCharToHarem = actions.recruitCharToHarem;
window.buildChamberForPending = actions.buildChamberForPending;
window.cancelPendingHarem = actions.cancelPendingHarem;
window.visitChamber = actions.visitChamber;
window.doIntimacy = actions.doIntimacy;
window.talkToConcubine = actions.talkToConcubine;
window.renameSubject = actions.renameSubject;
window.renameNation = actions.renameNation;
window.showNationDiplomacy = actions.showNationDiplomacy;
window.startDiplomacy = actions.startDiplomacy;
window.sendMessenger = actions.sendMessenger;
window.executeDiplomacy = actions.executeDiplomacy;
window.completeDiplomacy = actions.completeDiplomacy;
window.showAuctionHouse = actions.showAuctionHouse;
window.advanceTime = actions.advanceTime;
window.advanceTimeWithCost = actions.advanceTimeWithCost;
window.showMarriageOptions = actions.showMarriageOptions;
window.executeMarriage = actions.executeMarriage;
window.showDiplomacyOptions = actions.showDiplomacyOptions;
window.executeDiplomacyMission = actions.executeDiplomacyMission;
window.attackNation = actions.attackNation;

window.renderAll = render.renderAll;
window.switchPage = render.switchPage;
window.renderCharacters = render.renderCharacters;
window.renderPlaces = render.renderPlaces;
window.renderHarem = render.renderHarem;
window.renderHaremInterior = render.renderHaremInterior;
window.renderNations = render.renderNations;
window.renderSettings = render.renderSettings;
window.renderQueen = render.renderQueen;
window.showCharDetail = render.showCharDetail;
window.showCharLogs = render.showCharLogs;
window.setCharCategory = render.setCharCategory;
window.showCharsHelp = render.showCharsHelp;
window.tryBirth = render.tryBirth;

window.showModal = ui.showModal;
window.closeModal = ui.closeModal;
window.setAvatarEmoji = ui.setAvatarEmoji;
window.setAvatarImage = ui.setAvatarImage;
window.showAvatarChangeModal = ui.showAvatarChangeModal;
window.openSaveLoad = ui.openSaveLoad;
window.saveSlot = ui.saveSlot;
window.loadSlot = ui.loadSlot;
window.deleteSlot = ui.deleteSlot;
window.applyTheme = ui.applyTheme;
window.setAutoMode = ui.setAutoMode;
window.setLogSyncMode = ui.setLogSyncMode;
window.confirmRestart = ui.confirmRestart;
window.restartGame = ui.restartGame;
window.renderStartScreen = ui.renderStartScreen;
window.startGame = ui.startGame;
window.loadLastSave = ui.loadLastSave;

// 页面加载后绑定事件
document.addEventListener('DOMContentLoaded', () => {
    // 导航栏点击
    document.querySelectorAll('.nav-item').forEach(el => {
        el.addEventListener('click', function() {
            const p = this.dataset.page;
            if (p) render.switchPage(p);
        });
    });
    // 头像点击
    document.getElementById('avatarClickArea').addEventListener('click', () => {
        if (state.G.gameStarted) ui.showAvatarChangeModal();
    });
    // 加载主题和成就
    ui.loadTheme();
    state.loadAchievements();
    // 显示开始界面
    ui.renderStartScreen();
});