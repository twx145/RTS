// js/main.js
import { Game } from './game.js';
import { MAP_DEFINITIONS } from './maps-data.js';
import { UNIT_TYPES } from './config.js';

class AssetManager {
    constructor() { this.assets = {}; this.downloadQueue = []; this.successCount = 0; this.errorCount = 0; }
    queueDownload(path) { if (!this.downloadQueue.includes(path)) this.downloadQueue.push(path); }
    isDone() { return this.downloadQueue.length === this.successCount + this.errorCount; }
    downloadAll(callback) { if (this.downloadQueue.length === 0) return callback(); this.downloadQueue.forEach(path => { const img = new Image(); img.onload = () => { this.successCount++; if (this.isDone()) callback(); }; img.onerror = () => { this.errorCount++; console.error("Error loading image: " + path); if (this.isDone()) callback(); }; img.src = path; this.assets[path] = img; }); }
}

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const setupScreen = document.getElementById('setup-screen');
    const startNewGameBtn = document.getElementById('start-new-game-btn');
    const mapSelect = document.getElementById('map-select');
    
    MAP_DEFINITIONS.forEach(map => {
        const option = document.createElement('option');
        option.value = map.id;
        option.textContent = map.name;
        mapSelect.appendChild(option);
    });

    const assetManager = new AssetManager();
    Object.values(UNIT_TYPES).forEach(unit => {
        if (unit.imageSrc) assetManager.queueDownload(unit.imageSrc);
    });
    window.assetManager = assetManager.assets; 
    startNewGameBtn.disabled = true;
    startNewGameBtn.textContent = '正在加载资源...';
    assetManager.downloadAll(() => {
        startNewGameBtn.disabled = false;
        startNewGameBtn.textContent = '创建游戏';
    });
    
    function resizeGame() {
        const sidebar = document.getElementById('sidebar');
        const sidebarWidth = sidebar ? sidebar.offsetWidth : 0;
        canvas.width = window.innerWidth - sidebarWidth;
        canvas.height = window.innerHeight;
        if (window.game && window.game.constrainCamera) {
            window.game.constrainCamera();
        }
    }

    resizeGame();
    window.addEventListener('resize', resizeGame);

    startNewGameBtn.addEventListener('click', () => {
        const urlParams = new URLSearchParams(window.location.search);
        const fromDialogue = urlParams.get('fromDialogue');
        const user = urlParams.get('user');
        
        // --- 核心新增 (需求 #3): 读取复选框的状态 ---
        const showDetailsCheckbox = document.getElementById('show-details-checkbox');
        const settings = {
            gameMode: document.getElementById('game-mode-select').value,
            mapId: mapSelect.value,
            gameSpeed: document.getElementById('game-speed-select').value,
            aiDifficulty: document.getElementById('ai-difficulty-select').value,
            showDetails: showDetailsCheckbox.checked,// 将状态存入设置
            fromDialogue: fromDialogue === 'true',
            user: user
        };
        
        setupScreen.style.display = 'none';
        
        const game = new Game(canvas);
        game.init(settings);
    });
});