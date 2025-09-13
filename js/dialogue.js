// 游戏状态管理
const gameState = {
    currentChapter: 0,
    currentScene: 0,
    currentDialog: 0,
    autoPlay: false,
    fastForward: false,
    textSpeed: 60, // 文字显示速度（毫秒）
    scriptData: null,
    bgmPlayed: false,
    userInteracted: false, // 添加用户交互标志
    interactionOverlay: null // 存储交互覆盖层引用
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
async function initGame() {
    // 检查当前用户
    const currentUser = sessionStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    // 加载对话脚本
    await loadScript();
    showFirstDialog();
    bindEvents();
}

// 显示第一句对话
function showFirstDialog() {
    const urlParams = new URLSearchParams(window.location.search);
    const failChapter = urlParams.get('failChapter');
    const isNewGame = urlParams.get('new') === 'true';
    
    const currentUser = sessionStorage.getItem('currentUser');
    
    if (isNewGame) {
        localStorage.removeItem(`ShenDun_savedialog_${currentUser}`);
    }
    
    let saveData = null;
    if (!isNewGame) {
        saveData = getSaveDataFromURL() || loadAutoSave();
    }
    
    if (urlParams.get('returnFromGame')) {
        const tempProgress = localStorage.getItem(`ShenDun_temp_progress_${currentUser}`);
        if (tempProgress) {
            try {
                saveData = JSON.parse(tempProgress);
                localStorage.removeItem(`ShenDun_temp_progress_${currentUser}`);
            } catch (e) {
                console.error("读取临时进度失败", e);
            }
        }
    }
    
    let chapterIndex = 0;
    let sceneIndex = 0;
    let dialogIndex = 0;
    if (failChapter) {
        chapterIndex = parseInt(failChapter);
    } else if (saveData) {
        chapterIndex = saveData.chapter;
        sceneIndex = saveData.scene;
        dialogIndex = saveData.dialog;
    }
    
    // 播放第一句对话
    playChapter(chapterIndex, sceneIndex, dialogIndex);
    
    // 创建透明交互覆盖层
    createTransparentOverlay();
}

// 创建透明交互覆盖层
function createTransparentOverlay() {
    // 创建覆盖层元素
    gameState.interactionOverlay = document.createElement('div');
    gameState.interactionOverlay.id = 'transparent-overlay';
    gameState.interactionOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: transparent;
        z-index: 9999;
        cursor: default;
    `;
    
    // 添加到文档
    document.body.appendChild(gameState.interactionOverlay);
    
    // 添加点击事件
    gameState.interactionOverlay.addEventListener('click', handleFirstInteraction);
}

// 处理首次交互
function handleFirstInteraction() {
    // 移除透明覆盖层
    if (gameState.interactionOverlay) {
        document.body.removeChild(gameState.interactionOverlay);
        gameState.interactionOverlay = null;
    }
    
    // 设置用户已交互标志
    gameState.userInteracted = true;
    
    // 播放BGM（如果场景有BGM）
    playBGMForCurrentScene();
}

// 播放当前场景的BGM
function playBGMForCurrentScene() {
    const chapter = gameState.scriptData.chapters[gameState.currentChapter];
    const scene = chapter.scenes[gameState.currentScene];
    
    if (scene && scene.bgm) {
        // 设置BGM源
        domElements.bgm.src = `../assets/bgm/${scene.bgm}`;
        
        // 获取用户设置的音乐音量
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
        let bgmVolume = 80; // 默认音量
        
        if (currentUser) {
            const userSettings = localStorage.getItem(`ShenDun_settings_${currentUser.username}`);
            if (userSettings) {
                const settings = JSON.parse(userSettings);
                bgmVolume = settings.bgmVolume || 80;
            }
        }
        
        // 设置音量
        domElements.bgm.volume = bgmVolume / 100;
        
        // 用户已交互，可以播放BGM
        const playPromise = domElements.bgm.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                gameState.bgmPlayed = true;
                console.log("BGM开始播放");
            }).catch(error => {
                console.log("BGM播放失败:", error);
            });
        }
    }
}

function getSaveDataFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const saveSlot = urlParams.get('load');
    if (saveSlot) {
        return loadSave(saveSlot);
    }
    return null;
}

async function loadScript() {
    try {
        gameState.scriptData = window.scriptData;
    } catch (error) {
        console.error('加载对话脚本失败:', error);
        showAlert('无法加载游戏数据','请刷新页面重试。');
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
    domElements.btnMenu.addEventListener('click', checkGoToMainMenu);
    
    // 模态框事件
    domElements.modalCancel.addEventListener('click', hideModal);
    
    // 音频结束事件
    domElements.voice.addEventListener('ended', onVoiceEnded);
    
    // BGM播放失败事件处理
    domElements.bgm.addEventListener('error', handleBGMError);
}

// 处理BGM播放错误
function handleBGMError(e) {
    console.error("BGM播放失败:", e);
}

// 添加显示选择分支的函数
function displayChoices(choices) {
    // 创建选择容器
    const choicesContainer = document.createElement('div');
    choicesContainer.id = 'choices-container';
    choicesContainer.style.cssText = `
        position: absolute;
        bottom: 200px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        gap: 15px;
        z-index: 10;
        width: 80%;
        max-width: 600px;
    `;
    
    // 添加每个选择按钮
    choices.forEach((choice, index) => {
        const button = document.createElement('button');
        button.className = 'choice-btn';
        button.textContent = choice.text;
        button.dataset.index = index;
        button.style.cssText = `
        padding: 15px 20px;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        border: 2px solid rgba(255, 157, 0, 0.5);
        border-radius: 8px;
        cursor: pointer;
        font-size: 1.1em;
        transition: all 0.2s ease;
        backdrop-filter: blur(5px);
        `;
        
        button.addEventListener('mouseover', () => {
        button.style.background = 'rgba(50, 50, 50, 0.8)';
        button.style.borderColor = 'rgba(255, 157, 0, 0.8)';
        });
        
        button.addEventListener('mouseout', () => {
        button.style.background = 'rgba(0, 0, 0, 0.7)';
        button.style.borderColor = 'rgba(255, 157, 0, 0.5)';
        });
        
        button.addEventListener('click', () => {
        // 记录选择后果
        if (choice.consequence) {
            recordConsequence(choice.consequence);
        }
        
        // 移除选择容器
        choicesContainer.remove();
        
        // 跳转到指定的对话节点
        const next = choice.next;
        playChapter(next.chapter, next.scene, next.dialog);
        });
        
        choicesContainer.appendChild(button);
    });
    
    document.body.appendChild(choicesContainer);
}

// 添加记录选择后果的函数
function recordConsequence(consequence) {
    const currentUser = sessionStorage.getItem('currentUser');
    if (!currentUser) return;
    
    let playerChoices = JSON.parse(localStorage.getItem(`ShenDun_choices_${currentUser}`)) || [];
    playerChoices.push({
        consequence: consequence,
        timestamp: new Date().getTime(),
        chapter: gameState.currentChapter,
        scene: gameState.currentScene,
        dialog: gameState.currentDialog
    });
    
    localStorage.setItem(`ShenDun_choices_${currentUser}`, JSON.stringify(playerChoices));
}

// 处理点击事件
function handleClick(e) {
    // 如果存在选择容器，不处理点击继续
    if (document.getElementById('choices-container')) return;
    // 如果用户尚未交互，先处理交互
    if (!gameState.userInteracted) {
        handleFirstInteraction();
        return;
    }
    
    // 如果点击的是功能按钮区域或模态框，不处理对话继续
    if (e.target.closest('#function-buttons') || e.target.closest('.modal') || e.target.closest('.Mmodal')) return;
    
    // 修改 如果对话框是隐藏状态，先显示对话框
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
        if (gameState.currentChapter + 1 < gameState.scriptData.chapters.length) {
            playChapter(gameState.currentChapter + 1, 0, 0);
        } else {
            showEnding();
        }
        return;
    }
    
    gameState.currentScene = sceneIndex;
    gameState.currentDialog = dialogIndex;
    domElements.backgroundContainer.style.backgroundImage = `url('../assets/backgrounds/${scene.background}')`;
    
    // 播放BGM（修改部分）
    // 现在BGM在用户交互后播放，所以这里不播放BGM
    // 只设置BGM源和音量，但不播放
    
    if (scene.bgm) {
        // 设置BGM源
        domElements.bgm.src = `../assets/bgm/${scene.bgm}`;
        
        // 获取用户设置的音乐音量
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
        let bgmVolume = 80; // 默认音量
        
        if (currentUser) {
            const userSettings = localStorage.getItem(`ShenDun_settings_${currentUser.username}`);
            if (userSettings) {
                const settings = JSON.parse(userSettings);
                bgmVolume = settings.bgmVolume || 80;
            }
        }
        
        // 设置音量
        domElements.bgm.volume = bgmVolume / 100;

        if(gameState.userInteracted){
            playBGMForCurrentScene();
        }
    } else {
        // 如果没有BGM，停止当前播放的BGM
        domElements.bgm.pause();
        domElements.bgm.currentTime = 0;
    }
    
    playDialog(sceneIndex, dialogIndex);
}

// 播放对话
function playDialog(sceneIndex, dialogIndex) {
    const chapter = gameState.scriptData.chapters[gameState.currentChapter];
    const scene = chapter.scenes[sceneIndex];
    
    if (!scene || !scene.dialogs || !scene.dialogs[dialogIndex]) {
        if (sceneIndex + 1 < chapter.scenes.length) {
            playScene(sceneIndex + 1, 0);
        } else if (gameState.currentChapter + 1 < gameState.scriptData.chapters.length) {
            playChapter(gameState.currentChapter + 1, 0, 0);
        } else {
            showEnding();
        }
        return;
    }
    
    const dialog = scene.dialogs[dialogIndex];
    
    // 更新游戏状态
    gameState.currentScene = sceneIndex;
    gameState.currentDialog = dialogIndex;
    domElements.characterName.textContent = dialog.character;
    updateCharacters(dialog);

    // 如果有选择分支，显示选择按钮
    if (dialog.choices) {
        displayChoices(dialog.choices);
        // 跳过自动播放和自动继续
        domElements.dialogText.textContent = dialog.text;
        isTyping = false;
        return;
    }
    
    if (dialog.voice) {
        domElements.voice.src = `../assets/voices/${dialog.voice}`;
        // 语音也等待用户交互后再播放
        if (gameState.userInteracted) {
            domElements.voice.play().catch(e => console.log("语音播放失败"));
        }
    }
    
    displayText(dialog.text);
    autoSave();

    if (dialog.action) {
        handleAction(dialog.action);
        return;
    }
}

// 处理特殊动作
function handleAction(action) {
    // 保存当前进度
    const currentUser = sessionStorage.getItem('currentUser');
    var tempProgress = {
        chapter: gameState.currentChapter,
        scene: gameState.currentScene,
        dialog: gameState.currentDialog,
        timestamp: new Date().getTime()
    };
    
    switch (action.type) {
        case 'show_ending':
            showEnding(action.ending);
            break;
            
        case 'jump_to_game':
            tempProgress.dialog += 1;
            localStorage.setItem(`ShenDun_temp_progress_${currentUser}`, JSON.stringify(tempProgress));
            const { type, description, ...gameSettings } = action;
            localStorage.setItem('ShenDun_dialogue_settings', JSON.stringify(gameSettings));
            window.location.href = `loading.html?target=game.html&fromDialogue=true&user=${JSON.parse(currentUser).username}`;
            break;
            
        case 'jump_to_chapter':
            tempProgress = {
                chapter: action.chapter,
                scene: 0,
                dialog: 0,
                timestamp: new Date().getTime()
            };
            localStorage.setItem(`ShenDun_temp_progress_${currentUser}`, JSON.stringify(tempProgress));
            window.location.href = `loading.html?target=dialogue.html&returnFromGame=false&user=${JSON.parse(currentUser).username}`;
            break;
            
        case 'change_background':
            // 更改背景
            domElements.backgroundContainer.style.backgroundImage = `url('../assets/backgrounds/${action.background}')`;
            nextDialog();
            break;
            
        case 'play_sound':
            // 播放音效
            const sound = new Audio(`../assets/sounds/${action.sound}`);
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
        domElements.characterLeft.style.backgroundImage = `url('../assets/characters/${dialog.characterLeft.image}')`;
        domElements.characterLeft.style.opacity = 1;
    }
    
    // 设置中间角色
    if (dialog.characterCenter) {
        domElements.characterCenter.style.backgroundImage = `url('../assets/characters/${dialog.characterCenter.image}')`;
        domElements.characterCenter.style.opacity = 1;
    }
    
    // 设置右侧角色
    if (dialog.characterRight) {
        domElements.characterRight.style.backgroundImage = `url('../assets/characters/${dialog.characterRight.image}')`;
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
                    <div class="save-slot-chapter">第${saveData.chapter}章</div>
                    <div class="save-slot-scene">${getSceneName(saveData.chapter, saveData.scene)}</div>
                    <div class="save-slot-date">${new Date(saveData.timestamp).toLocaleString()}</div>
                </div>
            `;
        } else {
            slot.textContent = '空存档';
        }
        
        slot.addEventListener('click', () => checkSaveGame(i));
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
                    <div class="save-slot-chapter">第${saveData.chapter}章</div>
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
    // 修改 更新按钮状态提示
    const isHidden = domElements.dialogContainer.classList.contains('hidden');
    domElements.btnToggleDialog.title = isHidden ? '显示对话框' : '隐藏对话框';
}

// 返回主菜单
function checkGoToMainMenu(){
    showConfirmDialog(
        '返回主菜单',
        '确定要返回主菜单吗？未保存的进度将会丢失。',
        goToMainMenu
    );
}

function goToMainMenu() {
    window.location.href = '../index.html';
}

// 语音播放结束处理
function onVoiceEnded() {
    // 可以在语音结束后执行一些操作
}

// 显示结局
async function showEnding(endingType) {
    // 如果没有指定结局类型，根据玩家选择判断
    if (!endingType) {
        endingType = determineEnding();
    }
    
    let title, message, background;
    
    switch(endingType) {
        case 'perfect':
            title = '和平的黎明 - 完美结局';
            message = '干得漂亮！我们成功避免了全球灾难。历史将会铭记您。';
            background = 'sunrise.jpg';
        break;
        case 'sacrifice':
            title = '和平的黎明 - 牺牲结局';
            message = '我们已经尽力......虽然避免了最坏的结果，但代价是惨重的。';
            background = 'sunrise_dark.jpg';
        break;
        case 'cost':
            title = '和平的黎明 - 代价结局';
            message = '空间站被摧毁......但，必须付出如此大的代价吗？';
            background = 'sunrise_dark.jpg';
        break;
        case 'fail':
            title = '任务失败';
            message = '行动失败了，但战争还没有结束，重振旗鼓，正义总会到来。';
            background = 'command_center_fail.jpg';
        break;
        default:
            title = '游戏结束';
            message = '感谢您的游玩';
            background = 'bg.png';
    }
    
    domElements.backgroundContainer.style.backgroundImage = `url('../assets/backgrounds/${background}')`;
    showAlert(title, message, () => {
        window.location.href = '../index.html';
    });
}

// 添加判断结局的函数
function determineEnding() {
    const currentUser = sessionStorage.getItem('currentUser');
    if (!currentUser) return 'fail';
    
    const playerChoices = JSON.parse(localStorage.getItem(`ShenDun_choices_${currentUser}`)) || [];
    
    // 统计各种选择的次数
    const choiceCounts = {};
    playerChoices.forEach(choice => {
        choiceCounts[choice.consequence] = (choiceCounts[choice.consequence] || 0) + 1;
    });
    
    // 根据选择判断结局
    if (choiceCounts.aggressive > 2 && choiceCounts.sacrifice) {
        return 'cost'; // 过于激进且做出牺牲选择
    } else if (choiceCounts.stealth && choiceCounts.merciful) {
        return 'perfect'; //  stealth策略且仁慈选择
    } else if (choiceCounts.loyal && !choiceCounts.deceptive) {
        return 'sacrifice'; // 忠诚但不够灵活
    }
    return 'fail'; // 默认失败结局
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', initGame);