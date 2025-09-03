// 游戏状态管理
const gameState = {
    currentChapter: 0,
    currentScene: 0,
    currentDialog: 0,
    autoPlay: false,
    fastForward: false,
    textSpeed: 30, // 文字显示速度（毫秒）
    scriptData: null
};

// DOM元素引用
const domElements = {
    backgroundContainer: document.getElementById('background-container'),
    characterLeft: document.getElementById('character-left'),
    characterCenter: document.getElementById('character-center'),
    characterRight: document.getElementById('character-right'),
    dialogContainer: document.getElementById('dialog-container'),
    characterName: document.getElementById('character-name'),
    dialogText: document.getElementById('dialog-text'),
    btnSave: document.getElementById('btn-save'),
    btnLoad: document.getElementById('btn-load'),
    btnAuto: document.getElementById('btn-auto'),
    btnFastForward: document.getElementById('btn-fast-forward'),
    btnToggleDialog: document.getElementById('btn-toggle-dialog'),
    btnMenu: document.getElementById('btn-menu'),
    bgm: document.getElementById('bgm'),
    voice: document.getElementById('voice'),
    saveLoadModal: document.getElementById('save-load-modal'),
    modalTitle: document.getElementById('modal-title'),
    saveSlots: document.getElementById('save-slots'),
    modalCancel: document.getElementById('modal-cancel')
};

// 文字显示相关变量
let isTyping = false;
let typeInterval = null;
// 初始化函数
var returnFromGame = false;

async function initGame() {
    // 检查当前用户
    const currentUser = sessionStorage.getItem('currentUser');
    if (!currentUser) {
        // 未登录，跳转到登录页
        window.location.href = 'login.html';
        return;
    }
    
    // 加载对话脚本
    await loadScript();
    
    // 检查URL参数
    const urlParams = new URLSearchParams(window.location.search);
    const isNewGame = urlParams.get('new') === 'true';
    returnFromGame = urlParams.get('returnFromGame') !== null;
    
    // 如果是新游戏，清除自动存档
    if (isNewGame) {
        localStorage.removeItem(`ShenDun_autosave_${currentUser}`);
    }
    
    // 检查是否有存档需要加载
    let saveData = null;
    if (!isNewGame) {
        saveData = getSaveDataFromURL() || loadAutoSave();
    }
    
    // 如果是从游戏返回，检查是否有临时进度
    if (returnFromGame) {
        const tempProgress = localStorage.getItem(`ShenDun_temp_progress_${currentUser}`);
        if (tempProgress) {
            try {
                saveData = JSON.parse(tempProgress);
                localStorage.removeItem(`ShenDun_temp_progress_${currentUser}`);
            } catch (e) {
                console.error("读取临时进度失败", e);
            }
        }
        // window.href.location = ''; 尚未修改完
    }
    
    if (saveData) {
        // 加载存档
        playChapter(saveData.chapter, saveData.scene, saveData.dialog + returnFromGame);
        // loadGameState(saveData);
    } else {
        // 开始新游戏
        playChapter(0, 0, 0);
    }
    
    // 绑定事件监听器
    bindEvents();
}

// 从URL参数获取存档数据
function getSaveDataFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const saveSlot = urlParams.get('load');
    if (saveSlot) {
        return loadSave(saveSlot);
    }
    
    return null;
}

// 加载对话脚本
async function loadScript() {
    try {
        gameState.scriptData = window.scriptData;
    } catch (error) {
        console.error('加载对话脚本失败:', error);
        alert('无法加载游戏数据，请刷新页面重试。');
    }
}

// 绑定事件处理函数
function bindEvents() {
    // 点击屏幕继续对话
    document.body.addEventListener('click', handleClick);
    
    // 功能按钮事件
    domElements.btnSave.addEventListener('click', () => showSaveModal());
    domElements.btnLoad.addEventListener('click', () => showLoadModal());
    domElements.btnAuto.addEventListener('click', toggleAutoPlay);
    domElements.btnFastForward.addEventListener('click', toggleFastForward);
    domElements.btnToggleDialog.addEventListener('click', toggleDialogVisibility);
    domElements.btnMenu.addEventListener('click', goToMainMenu);
    
    // 模态框事件
    domElements.modalCancel.addEventListener('click', hideModal);
    
    // 音频结束事件
    domElements.voice.addEventListener('ended', onVoiceEnded);
}

// 处理点击事件
function handleClick(e) {
    // 如果点击的是功能按钮区域或模态框，不处理对话继续
    if (e.target.closest('#function-buttons') || e.target.closest('.modal')) return;
    
    //修改 如果对话框是隐藏状态，先显示对话框
    if (domElements.dialogContainer.classList.contains('hidden')) {
        domElements.dialogContainer.classList.remove('hidden');
        return; // 显示对话框后立即返回，不执行后续操作
    }

    // 如果当前正在显示文字，立即完成显示
    if (isTyping) {
        completeTextDisplay();
        return;
    }
    
    // 否则继续下一句对话
    nextDialog();
}

// 播放章节
function playChapter(chapterIndex, sceneIndex = 0, dialogIndex = 0) {
    const chapter = gameState.scriptData.chapters[chapterIndex];
    if (!chapter) {
        // 没有更多章节，游戏结束
        showEnding();
        return;
    }
    
    // 更新游戏状态
    gameState.currentChapter = chapterIndex;
    gameState.currentScene = sceneIndex;
    gameState.currentDialog = dialogIndex;
    
    // 播放场景
    playScene(sceneIndex, dialogIndex);
}

// 播放场景
function playScene(sceneIndex, dialogIndex = 0) {
    const chapter = gameState.scriptData.chapters[gameState.currentChapter];
    const scene = chapter.scenes[sceneIndex];
    if (!scene) {
        // 没有更多场景，尝试下一章节
        if (gameState.currentChapter + 1 < gameState.scriptData.chapters.length) {
            playChapter(gameState.currentChapter + 1, 0, 0);
        } else {
            // 没有更多章节，游戏结束
            showEnding();
        }
        return;
    }
    
    // 更新游戏状态
    gameState.currentScene = sceneIndex;
    gameState.currentDialog = dialogIndex;
    
    // 设置背景
    // domElements.backgroundContainer.style.backgroundImage = `url('assets/backgrounds/${scene.background}')`;
    // 背景没找全,先用bg.png

    domElements.backgroundContainer.style.backgroundImage = `url('assets/backgrounds/bg.png')`;
    
    // 播放背景音乐
    if (scene.bgm) {
        domElements.bgm.src = `assets/bgm/${scene.bgm}`;
        domElements.bgm.play().catch(e => console.log("自动播放被阻止，需要用户交互"));
    }
    
    // 开始对话
    playDialog(sceneIndex, dialogIndex);
}

// 播放对话
function playDialog(sceneIndex, dialogIndex) {
    const chapter = gameState.scriptData.chapters[gameState.currentChapter];
    const scene = chapter.scenes[sceneIndex];
    
    // 检查对话是否存在
    if (!scene || !scene.dialogs || !scene.dialogs[dialogIndex]) {
        // 没有更多对话，尝试下一场景
        if (sceneIndex + 1 < chapter.scenes.length) {
            playScene(sceneIndex + 1, 0);
        } else if (gameState.currentChapter + 1 < gameState.scriptData.chapters.length) {
            // 下一章节
            playChapter(gameState.currentChapter + 1, 0, 0);
        } else {
            // 游戏结束
            showEnding();
        }
        return;
    }
    
    const dialog = scene.dialogs[dialogIndex];
    
    // 更新游戏状态
    gameState.currentScene = sceneIndex;
    gameState.currentDialog = dialogIndex;
    
    // // 检查是否有特殊动作 修改
    // if (dialog.action) {
    //     handleAction(dialog.action);
    //     return;
    // }
    
    // 设置角色名称
    domElements.characterName.textContent = dialog.character;
    
    // 设置角色立绘
    updateCharacters(dialog);
    
    // 播放语音
    if (dialog.voice) {
        domElements.voice.src = `assets/voices/${dialog.voice}`;
        domElements.voice.play().catch(e => console.log("语音播放失败"));
    }
    
    // 显示文字（打字机效果）
    displayText(dialog.text);
    
    // 自动保存
    autoSave();

    if (dialog.action) {//修改
        handleAction(dialog.action);
        return;
    }
}

// 处理特殊动作
function handleAction(action) {
    // 保存当前进度
    const currentUser = sessionStorage.getItem('currentUser');
    const tempProgress = {
        chapter: gameState.currentChapter,
        scene: gameState.currentScene,
        dialog: gameState.currentDialog,
        timestamp: new Date().getTime()
    };
    localStorage.setItem(`ShenDun_temp_progress_${currentUser}`, JSON.stringify(tempProgress));

    switch (action.type) {
        case 'jump_to_game':
            // 修改 新增：保存游戏设置
            const gameSettings = {
                mapId: action.mapId || 'map_new_01', 
                availableUnits: action.availableUnits || Object.keys(UNIT_TYPES),
                enableFogOfWar: action.enableFogOfWar !== false , // 默认启用
                aiDifficulty: action.aiDifficulty || 'medium',
                gameMode: action.gameMode || 'annihilation'
            };
            localStorage.setItem('ShenDun_dialogue_settings', JSON.stringify(gameSettings));
            window.location.href = `loading.html?target=game.html&fromDialogue=true`;
            break;
            
        case 'jump_to_chapter':// 跳转到指定章节' 修改
            window.location.href = `loading.html?target=dialogue.html&returnFromGame=false&user=${JSON.parse(currentUser).username}`;
            break;
            
        case 'change_background':
            // 更改背景
            domElements.backgroundContainer.style.backgroundImage = `url('assets/backgrounds/${action.background}')`;
            nextDialog();
            break;
            
        case 'play_sound':
            // 播放音效
            const sound = new Audio(`assets/sounds/${action.sound}`);
            sound.play();
            nextDialog();
            break;
            
        default:
            // 未知动作，继续下一句对话
            nextDialog();
    }
}

// 更新角色立绘
function updateCharacters(dialog) {
    // 重置所有角色透明度
    [domElements.characterLeft, domElements.characterCenter, domElements.characterRight].forEach(el => {
        el.style.opacity = 0;
    });
    
    // 设置左侧角色
    if (dialog.characterLeft) {
        domElements.characterLeft.style.backgroundImage = `url('assets/characters/${dialog.characterLeft.image}')`;
        domElements.characterLeft.style.opacity = 1;
    }
    
    // 设置中间角色
    if (dialog.characterCenter) {
        domElements.characterCenter.style.backgroundImage = `url('assets/characters/${dialog.characterCenter.image}')`;
        domElements.characterCenter.style.opacity = 1;
    }
    
    // 设置右侧角色
    if (dialog.characterRight) {
        domElements.characterRight.style.backgroundImage = `url('assets/characters/${dialog.characterRight.image}')`;
        domElements.characterRight.style.opacity = 1;
    }
}

// 显示文字（打字机效果）
function displayText(text) {
    isTyping = true;
    let index = 0;
    const speed = gameState.fastForward ? 0 : gameState.textSpeed;
    
    domElements.dialogText.textContent = "";
    
    clearInterval(typeInterval);
    typeInterval = setInterval(() => {
        if (index < text.length) {
            domElements.dialogText.textContent += text.charAt(index);
            index++;
        } else {
            clearInterval(typeInterval);
            isTyping = false;
            
            // 如果是自动播放模式，设置下一句对话的计时器
            if (gameState.autoPlay) {
                setTimeout(nextDialog, 2000);
            }
        }
    }, speed);
    
}

// 立即完成文字显示
function completeTextDisplay() {
    if (isTyping) {
        clearInterval(typeInterval);
        const chapter = gameState.scriptData.chapters[gameState.currentChapter];
        const scene = chapter.scenes[gameState.currentScene];
        const dialog = scene.dialogs[gameState.currentDialog];
        domElements.dialogText.textContent = dialog.text;
        isTyping = false;
        
        // 如果是自动播放模式，设置下一句对话的计时器
        if (gameState.autoPlay) {
            setTimeout(nextDialog, 2000);
        }
    }
}

// 下一句对话
function nextDialog() {
    const chapter = gameState.scriptData.chapters[gameState.currentChapter];
    const scene = chapter.scenes[gameState.currentScene];
    
    // 检查是否有更多对话
    if (gameState.currentDialog + 1 < scene.dialogs.length) {
        // 同一场景中的下一句对话
        playDialog(gameState.currentScene, gameState.currentDialog + 1);
    } else {
        // 下一场景
        playScene(gameState.currentScene + 1, 0);
    }
}

// 显示保存模态框
function showSaveModal() {
    domElements.modalTitle.textContent = "选择存档位置";
    domElements.saveSlots.innerHTML = '';
    
    for (let i = 1; i <= 9; i++) {
        const saveData = loadSave(i);
        const slot = document.createElement('div');
        slot.className = `save-slot ${saveData ? '' : 'empty'}`;
        slot.dataset.slot = i;
        
        if (saveData) {
            slot.innerHTML = `
                <div class="save-slot-content">
                    <div class="save-slot-chapter">第${saveData.chapter + 1}章</div>
                    <div class="save-slot-scene">${getSceneName(saveData.chapter, saveData.scene)}</div>
                    <div class="save-slot-date">${new Date(saveData.timestamp).toLocaleString()}</div>
                </div>
            `;
        } else {
            slot.textContent = '空存档';
        }
        
        slot.addEventListener('click', () => saveGame(i));
        domElements.saveSlots.appendChild(slot);
    }
    
    domElements.saveLoadModal.style.display = 'flex';
}

// 显示读取模态框
function showLoadModal() {
    domElements.modalTitle.textContent = "选择存档";
    domElements.saveSlots.innerHTML = '';
    
    for (let i = 1; i <= 9; i++) {
        const saveData = loadSave(i);
        const slot = document.createElement('div');
        slot.className = `save-slot ${saveData ? '' : 'empty'}`;
        slot.dataset.slot = i;
        
        if (saveData) {
            slot.innerHTML = `
                <div class="save-slot-content">
                    <div class="save-slot-chapter">第${saveData.chapter + 1}章</div>
                    <div class="save-slot-scene">${getSceneName(saveData.chapter, saveData.scene)}</div>
                    <div class="save-slot-date">${new Date(saveData.timestamp).toLocaleString()}</div>
                </div>
            `;
            
            slot.addEventListener('click', () => {
                loadGameState(saveData);
                hideModal();
            });
        } else {
            slot.textContent = '空存档';
        }
        
        domElements.saveSlots.appendChild(slot);
    }
    
    domElements.saveLoadModal.style.display = 'flex';
}

// 隐藏模态框
function hideModal() {
    domElements.saveLoadModal.style.display = 'none';
}

// 获取场景名称
function getSceneName(chapterIndex, sceneIndex) {
    if (!gameState.scriptData || !gameState.scriptData.chapters[chapterIndex]) return "未知场景";
    
    const chapter = gameState.scriptData.chapters[chapterIndex];
    if (chapter.scenes[sceneIndex]) {
        return chapter.scenes[sceneIndex].name || `场景 ${sceneIndex + 1}`;
    }
    
    return "未知场景";
}

// 切换自动播放
function toggleAutoPlay() {
    gameState.autoPlay = !gameState.autoPlay;
    domElements.btnAuto.textContent = gameState.autoPlay ? '⏸️' : '▶️';
    domElements.btnAuto.title = gameState.autoPlay ? '暂停自动播放' : '自动播放';
    
    // 如果开启自动播放且当前没有在打字，继续下一句
    if (gameState.autoPlay && !isTyping) {
        nextDialog();
    }
}

// 切换快进模式
function toggleFastForward() {
    gameState.fastForward = !gameState.fastForward;
    domElements.btnFastForward.style.backgroundColor = gameState.fastForward ? 
        'rgba(100, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.7)';
}

// 切换对话框可见性
function toggleDialogVisibility() {
    domElements.dialogContainer.classList.toggle('hidden');
    //修改 更新按钮状态提示
    const isHidden = domElements.dialogContainer.classList.contains('hidden');
    domElements.btnToggleDialog.title = isHidden ? '显示对话框' : '隐藏对话框';
}

// 返回主菜单
function goToMainMenu() {
    if (confirm("确定要返回主菜单吗？未保存的进度将会丢失。")) {
        window.location.href = 'index.html';
    }
}

// 语音播放结束处理
function onVoiceEnded() {
    // 可以在语音结束后执行一些操作
}

// 显示结局
function showEnding() {
    // 根据游戏进度显示不同的结局
    alert("游戏结束！感谢您的游玩。");
    window.location.href = 'index.html';
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', initGame);