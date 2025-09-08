let Slot = null;
// 存档管理 - 多用户支持
// 获取当前用户
function getCurrentUser() {
    return sessionStorage.getItem('currentUser');
}

// 获取用户存档键名
function getUserSavesKey() {
    const user = getCurrentUser();
    return `ShenDun_saves_${user}`;
}

// 获取用户存档数据
function getUserSaves() {
    const userSavesKey = getUserSavesKey();
    const savesJson = localStorage.getItem(userSavesKey);
    
    if (savesJson) {
        try {
            return JSON.parse(savesJson);
        } catch (e) {
            console.error("读取用户存档失败", e);
            showAlert("读取失败","读取用户存档失败");
            return {};
        }
    }
    
    return {};
}

// 保存用户存档数据
function saveUserSaves(saves) {
    const userSavesKey = getUserSavesKey();
    localStorage.setItem(userSavesKey, JSON.stringify(saves));
}

// 保存游戏
function checkSaveGame(slot){
    const userSaves = getUserSaves();
    const existingSave = userSaves[slot];
    Slot = slot;
    // 如果有现有存档，请求确认
    if (existingSave) {
        showConfirmDialog(
            '覆盖存档',
            `存档位 ${slot} 已有存档，是否覆盖？`,
            saveGame
        );
        return;
    }saveGame();
}

function saveGame() {
    const userSaves = getUserSaves();
    const saveData = {
        chapter: gameState.currentChapter,
        scene: gameState.currentScene,
        dialog: gameState.currentDialog,
        timestamp: new Date().getTime(),
        gameState: {
            currentChapter: gameState.currentChapter,
            currentScene: gameState.currentScene,
            currentDialog: gameState.currentDialog
        },
        gameMode: window.game?.gameMode,
        mapId: window.game?.map?.id,
        gameSpeed: window.game?.gameSpeedModifier,
        aiDifficulty: window.game?.ai?.difficulty
    };
    
    // 更新用户存档
    userSaves[Slot] = saveData;
    saveUserSaves(userSaves);
    // 显示保存成功提示
    showAlert('保存成功',`游戏已保存到存档位 ${Slot}！`);
    hideModal();
}

// 加载存档
function loadSave(slot) {
    slot = Number(slot);
    const userSaves = getUserSaves();
    return userSaves[slot] || null;
}

// 自动保存
function autoSave() {
    const saveData = {
        chapter: gameState.currentChapter,
        scene: gameState.currentScene,
        dialog: gameState.currentDialog,
        timestamp: new Date().getTime()
    };
    
    // 存储自动存档
    const user = getCurrentUser();
    localStorage.setItem(`ShenDun_savedialog_${user}`, JSON.stringify(saveData));
}

// 加载自动存档
function loadAutoSave() {
    const user = getCurrentUser();
    const savedData = localStorage.getItem(`ShenDun_savedialog_${user}`);
    
    if (savedData) {
        try {
            return JSON.parse(savedData);
        } catch (e) {
            console.error("读取自动存档失败", e);
        }
    }
    
    return null;
}

// 加载游戏状态
function loadGameState(saveData) {
    if (saveData && gameState.scriptData) {
        // 验证存档数据是否有效
        if (saveData.chapter >= 0 && saveData.chapter < gameState.scriptData.chapters.length) {
            const chapter = gameState.scriptData.chapters[saveData.chapter];
            if (saveData.scene >= 0 && saveData.scene < chapter.scenes.length) {
                const scene = chapter.scenes[saveData.scene];
                if (saveData.dialog >= 0 && saveData.dialog < scene.dialogs.length) {
                    // 存档有效，加载游戏
                    playChapter(saveData.chapter, saveData.scene, saveData.dialog);
                    return;
                }
            }
        }
    }
    showAlert("存档出错","存档数据无效，开始新游戏。");
    playChapter(0, 0, 0);
}