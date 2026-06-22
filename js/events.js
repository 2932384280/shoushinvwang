import * as actions from './actions.js';
import * as render from './render.js';
import * as ui from './ui.js';
import * as state from './state.js';

// 将所有导出暴露到 window
Object.assign(window, actions, render, ui, state);

// 额外暴露常用函数（确保 HTML onclick 能找到）
window.goToPlace = actions.goToPlace;
window.quickGoTo = actions.quickGoTo;
// ... 其他你需要的

document.addEventListener('DOMContentLoaded', () => {
    // 绑定导航栏点击
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