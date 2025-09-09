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
    const dialogueSettings = localStorage.getItem('ShenDun_dialogue_settings');
    const urlParams = new URLSearchParams(window.location.search);
    const fromDialogue = urlParams.get('fromDialogue');
    const user = urlParams.get('user');
    const settings = JSON.parse(dialogueSettings);
    //修改 添加教程逻辑
    let currentTutorialStep = 1;
    const totalTutorialSteps = 6;

    // 教程控制函数
    function showTutorialModal() {
        const tutorialModal = document.getElementById('tutorial-modal');
        tutorialModal.style.display = 'flex';
        updateTutorialStep(1);
    }

    function hideTutorialModal() {
        const tutorialModal = document.getElementById('tutorial-modal');
        tutorialModal.style.display = 'none';
        localStorage.setItem('ShenDun_tutorial_completed', 'true');
    }

    function updateTutorialStep(step) {
        currentTutorialStep = step;
        
        // 隐藏所有步骤
        document.querySelectorAll('.tutorial-step').forEach(el => {
            el.style.display = 'none';
        });
        
        // 显示当前步骤
        const currentStep = document.querySelector(`.tutorial-step[data-step="${step}"]`);
        if (currentStep) {
            currentStep.style.display = 'block';
        }
        
        // 更新进度条
        const progressPercent = (step / totalTutorialSteps) * 100;
        document.querySelector('.progress-fill').style.width = `${progressPercent}%`;
        document.querySelector('.progress-text').textContent = `步骤 ${step}/${totalTutorialSteps}`;
        
        updateTutorialButtons();
    }

    function updateTutorialButtons() {
        const prevBtn = document.getElementById('tutorial-prev');
        const nextBtn = document.getElementById('tutorial-next');
        const skipBtn = document.getElementById('tutorial-skip');
        
        prevBtn.disabled = currentTutorialStep === 1;
        
        if (currentTutorialStep === totalTutorialSteps) {
            nextBtn.textContent = '开始游戏';
        } else {
            nextBtn.textContent = '下一步';
        }
    }

    // 教程按钮事件监听
    document.getElementById('tutorial-prev')?.addEventListener('click', () => {
        if (currentTutorialStep > 1) {
            updateTutorialStep(currentTutorialStep - 1);
        }
    });

    document.getElementById('tutorial-next')?.addEventListener('click', () => {
        if (currentTutorialStep < totalTutorialSteps) {
            updateTutorialStep(currentTutorialStep + 1);
        } else {
            hideTutorialModal();
            // 如果是从设置界面进入，显示设置界面
            if (!window.game) {
                document.getElementById('setup-screen').style.display = 'flex';
            }
        }
    });

    document.getElementById('tutorial-skip')?.addEventListener('click', () => {
        hideTutorialModal();
        // 如果是从设置界面进入，显示设置界面
        if (!window.game) {
            document.getElementById('setup-screen').style.display = 'flex';
        }
    });

    // 修改游戏初始化逻辑，在非对话模式且需要显示教程时显示教程
    if (fromDialogue !== 'true' || settings.gameMode === 'tutorial') {
        // 隐藏设置界面，显示教程
        document.getElementById('setup-screen').style.display = 'none';
        // 延迟显示教程，让资源先加载
        setTimeout(showTutorialModal, 500);
    }

    // 添加重新查看教程的功能（在游戏设置中添加按钮）
    function addTutorialButtonToSettings() {
        const settingsForm = document.querySelector('.modal-content');
        if (settingsForm) {
            const tutorialBtn = document.createElement('button');
            tutorialBtn.type = 'button';
            tutorialBtn.id = 'show-tutorial-btn';
            tutorialBtn.textContent = '查看教程';
            tutorialBtn.style.marginTop = '15px';
            tutorialBtn.style.backgroundColor = '#6a6a6a';
            
            tutorialBtn.addEventListener('click', () => {
                document.getElementById('setup-screen').style.display = 'none';
                showTutorialModal();
            });
            
            settingsForm.appendChild(tutorialBtn);
        }
    }

    // 在资源加载完成后添加教程按钮
    assetManager.downloadAll(() => {
        startNewGameBtn.disabled = false;
        startNewGameBtn.textContent = '创建游戏';
        addTutorialButtonToSettings();
    });

// 修改 增加设置 获取DOM元素
    const settingsButton = document.getElementById('settings-button');
    const settingsMenu = document.getElementById('settings-menu');
    const closeSettings = document.getElementById('close-settings');
    const bgmVolumeSlider = document.getElementById('bgm-volume');
    const sfxVolumeSlider = document.getElementById('sfx-volume');
    const bgmVolumeValue = document.getElementById('bgm-volume-value');
    const sfxVolumeValue = document.getElementById('sfx-volume-value');
    const showTutorialBtn = document.getElementById('show-tutorial');
    const saveGameBtn = document.getElementById('save-game');
    const loadGameBtn = document.getElementById('load-game');
    const skipScenarioBtn = document.getElementById('skip-scenario');
    const returnMainBtn = document.getElementById('return-main');
    const exitGameBtn = document.getElementById('exit-game');

    // 设置按钮点击事件
    settingsButton.addEventListener('click', function() {
        settingsMenu.style.display = settingsMenu.style.display === 'block' ? 'none' : 'block';
    });

    // 关闭设置菜单
    closeSettings.addEventListener('click', function() {
        settingsMenu.style.display = 'none';
    });

    // 音量控制
    bgmVolumeSlider.addEventListener('input', function() {
        bgmVolumeValue.textContent = this.value + '%';
        // 这里添加背景音乐音量控制逻辑
        if (window.game && window.game.audioManager) {
            window.game.audioManager.setBGMVolume(this.value / 100);
        }
    });

    sfxVolumeSlider.addEventListener('input', function() {
        sfxVolumeValue.textContent = this.value + '%';
        // 这里添加音效音量控制逻辑
        if (window.game && window.game.audioManager) {
            window.game.audioManager.setSFXVolume(this.value / 100);
        }
    });

    // 查看教程
    showTutorialBtn.addEventListener('click', function() {
        settingsMenu.style.display = 'none';
        // 显示教程
        if (typeof showTutorialModal === 'function') {
            showTutorialModal();
        }
    });

    // 保存游戏
    saveGameBtn.addEventListener('click', function() {
        if (window.game && window.game.gameState !== 'setup') {
            // 这里添加保存游戏逻辑
            const saveData = window.game.getSaveData();
            localStorage.setItem('ShenDun_save', JSON.stringify(saveData));
            showAlert('提示', '游戏已保存！');
        } else {
            showAlert('提示', '没有游戏进度可保存！');
        }
    });

    // 读取存档
    loadGameBtn.addEventListener('click', function() {
        const saveData = localStorage.getItem('ShenDun_save');
        if (saveData) {
            showConfirmDialog('确认', '加载存档将丢失当前进度，确定要继续吗？', function() {
                // 这里添加读取存档逻辑
                window.game.loadSaveData(JSON.parse(saveData));
                settingsMenu.style.display = 'none';
            }, 'main');
        } else {
            showAlert('提示', '没有找到存档！');
        }
    });

    // 跳过当前关卡
    skipScenarioBtn.addEventListener('click', function() {
        if (window.game) {
            showConfirmDialog('确认', '确定要跳过当前关卡吗？', function() {
                window.game.skipCurrentScenario();
                settingsMenu.style.display = 'none';
            }, 'game');
        } else {
            alert('当前没有正在进行的关卡！');
        }
    });

    // 返回主菜单
    returnMainBtn.addEventListener('click', function() {
        showConfirmDialog('确认', '确定要返回主菜单吗？未保存的进度将会丢失。', function() {
            // 这里添加返回主菜单逻辑
            if (window.game && window.game.returnToMainMenu) {
                window.game.returnToMainMenu();
            } else {
                window.location.href = 'index.html';
            }
        }, 'main');
    });

    // 退出游戏
    exitGameBtn.addEventListener('click', function() {
        showConfirmDialog('确认', '确定要退出游戏吗？', function() {
            // 这里添加退出游戏逻辑
            if (window.game && window.game.cleanup) {
                window.game.cleanup();
            }
            window.close();
            window.location.href = 'index.html';
        }, 'main');
    });

    // 点击菜单外部关闭菜单
    document.addEventListener('click', function(event) {
        if (!settingsButton.contains(event.target) && !settingsMenu.contains(event.target)) {
            settingsMenu.style.display = 'none';
        }
    });

    // 防止菜单内的点击事件冒泡
    settingsMenu.addEventListener('click', function(event) {
        event.stopPropagation();
    });

    
    if (fromDialogue === 'true') {//修改
        // 自动开始游戏，使用默认设置或从对话传递的设置
        const defaultSettings = {
            gameMode: 'annihilation',
            mapId: 'map_new_01',
            gameSpeed: '1',
            aiDifficulty: 'medium',
            showDetails: true,
            fromDialogue: true,
            user: user
        };
        if (dialogueSettings) {
            try {
                const settings = JSON.parse(dialogueSettings);
                Object.assign(defaultSettings, settings);
            } catch (e) {
                console.error('解析对话设置失败', e);
            }
        }
        
        // 隐藏设置界面，显示游戏界面
        document.getElementById('setup-screen').style.display = 'none';
        
        // 初始化游戏
        const canvas = document.getElementById('game-canvas');
        window.game = new Game(canvas);
        window.game.init(defaultSettings);
        return ;
    }

    setupScreen.style.display = 'flex';//显示复选框

    startNewGameBtn.addEventListener('click', () => {
        //修改 直接打开游戏文件清除
        // localStorage.getItem('ShenDun_dialogue_settings');
        localStorage.removeItem('ShenDun_dialogue_settings');
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