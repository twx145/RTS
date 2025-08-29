// 当前用户
let currentUser = null;
let scriptData = null; // 存储脚本数据

// 初始化函数
async function initLoadGame() {
    // 获取当前用户
    currentUser = sessionStorage.getItem('currentUser');
    if (!currentUser) {
        // 未登录，跳转到登录页
        window.location.href = 'login.html';
        return;
    }
    
    // 更新用户名显示
    document.getElementById('username').textContent = `玩家: ${JSON.parse(currentUser).username}`;
    
    // 加载脚本数据
    await loadScriptData();
    
    // 设置随机背景
    setRandomBackground();
    
    // 加载存档数据
    loadSaveData();
    
    // 绑定事件
    bindEvents();
}

// 加载脚本数据
async function loadScriptData() {
    try {
        const response = await fetch('data/script.json');
        scriptData = await response.json();
    } catch (error) {
        console.error('加载脚本数据失败:', error);
        // 即使脚本加载失败，也继续显示存档页面
        scriptData = { chapters: [] };
    }
}

// 设置随机背景
function setRandomBackground() {
    const backgrounds = [
        'url("assets/backgrounds/bg.png")',
        // 'url("assets/backgrounds/training_ground.jpg")',
        // 'url("assets/backgrounds/border_area.jpg")',
        // 'url("assets/backgrounds/command_center.jpg")',
        // 'url("assets/backgrounds/forest.jpg")'
    ];
    
    const randomBg = backgrounds[Math.floor(Math.random() * backgrounds.length)];
    document.getElementById('background-container').style.backgroundImage = randomBg;
}

// 加载存档数据
function loadSaveData() {
    // 获取用户存档数据
    const userSaves = getUserSaves();
    
    // 更新存档槽显示
    for (let i = 1; i <= 9; i++) {
        updateSaveSlot(i, userSaves[i]);
    }
}

// 更新单个存档槽
function updateSaveSlot(slot, saveData) {
    const saveSlot = document.querySelector(`.save-slot[data-slot="${slot}"]`);
    const deleteBtn = saveSlot.querySelector('.delete-slot-btn');
    
    if (saveData) {
        // 有存档数据
        saveSlot.classList.remove('empty');
        
        // 更新缩略图
        const thumbnail = saveSlot.querySelector('.save-thumbnail');
        updateThumbnail(thumbnail, saveData);
        
        // 更新存档信息
        const chapterEl = saveSlot.querySelector('.save-chapter');
        const dateEl = saveSlot.querySelector('.save-date');
        const dialogEl = saveSlot.querySelector('.save-dialog');
        
        chapterEl.textContent = `第${saveData.chapter + 1}章: ${getChapterName(saveData.chapter)}`;
        dateEl.textContent = new Date(saveData.timestamp).toLocaleString();
        dialogEl.textContent = getDialogText(saveData) || "无对话内容";
        
        // 显示删除按钮
        deleteBtn.style.display = 'block';
        deleteBtn.onclick = (e) => {
            e.stopPropagation(); // 阻止事件冒泡
            showDeleteModal(slot, getChapterName(saveData.chapter));
        };
        
        // 添加点击事件 - 加载存档
        saveSlot.onclick = () => loadGame(slot);
    } else {
        // 空存档
        saveSlot.classList.add('empty');
        
        // 重置存档信息
        const chapterEl = saveSlot.querySelector('.save-chapter');
        const dateEl = saveSlot.querySelector('.save-date');
        const dialogEl = saveSlot.querySelector('.save-dialog');
        const thumbnail = saveSlot.querySelector('.save-thumbnail');
        
        chapterEl.textContent = "空存档";
        dateEl.textContent = "-";
        dialogEl.textContent = "-";
        thumbnail.style.backgroundImage = '';
        
        // 隐藏删除按钮
        deleteBtn.style.display = 'none';
        deleteBtn.onclick = null;
        
        // 移除点击事件
        saveSlot.onclick = null;
    }
}

// 更新缩略图
function updateThumbnail(thumbnail, saveData) {
    if (scriptData && scriptData.chapters && scriptData.chapters[saveData.chapter]) {
        const chapter = scriptData.chapters[saveData.chapter];
        if (chapter.scenes && chapter.scenes[saveData.scene]) {
            const scene = chapter.scenes[saveData.scene];
            if (scene.background) {
                thumbnail.style.backgroundImage = `url('assets/backgrounds/${scene.background}')`;
                return;
            }
        }
    }
    
    // 如果无法获取背景，使用默认背景
    thumbnail.style.backgroundImage = 'url("assets/backgrounds/default_save.jpg")';
}

// 获取对话文本
function getDialogText(saveData) {
    if (scriptData && scriptData.chapters && scriptData.chapters[saveData.chapter]) {
        const chapter = scriptData.chapters[saveData.chapter];
        if (chapter.scenes && chapter.scenes[saveData.scene]) {
            const scene = chapter.scenes[saveData.scene];
            if (scene.dialogs && scene.dialogs[saveData.dialog]) {
                const dialog = scene.dialogs[saveData.dialog];
                // 截取前40个字符作为预览
                return dialog.text.length > 40 ? 
                    dialog.text.substring(0, 40) + "..." : 
                    dialog.text;
            }
        }
    }
    
    return null;
}

// 获取用户存档数据
function getUserSaves() {
    const userSavesKey = `modernWarfare_saves_${currentUser}`;
    const savesJson = localStorage.getItem(userSavesKey);
    
    if (savesJson) {
        try {
            return JSON.parse(savesJson);
        } catch (e) {
            console.error("读取用户存档失败", e);
            return {};
        }
    }
    
    return {};
}

// 获取章节名称
function getChapterName(chapterIndex) {
    if (scriptData && scriptData.chapters && scriptData.chapters[chapterIndex]) {
        const title = scriptData.chapters[chapterIndex].title;
        return title && title.length > 15 ? 
            title.substring(0, 15) + "..." : 
            title || `章节 ${chapterIndex + 1}`;
    }
    return `章节 ${chapterIndex + 1}`;
}

// 加载游戏
function loadGame(slot) {
    // 获取存档数据
    const userSaves = getUserSaves();
    const saveData = userSaves[slot];
    
    if (saveData) {
        // 跳转到对话页面并加载存档
        window.location.href = `dialogue.html?load=${slot}&user=${currentUser}`;
    }
}

// 绑定事件
function bindEvents() {
    // 返回主菜单按钮
    document.getElementById('btn-back').addEventListener('click', () => {
        window.location.href = 'start.html';
    });
    
    // 删除所有存档按钮
    document.getElementById('btn-delete-all').addEventListener('click', () => {
        const userSaves = getUserSaves();
        const saveCount = Object.keys(userSaves).length;
        
        if (saveCount > 0) {
            showDeleteModal(null, "所有存档");
        } else {
            showToast('没有存档可删除！');
        }
    });
    
    // 退出登录按钮
    document.getElementById('btn-logout').addEventListener('click', () => {
        if (confirm('确定要退出登录吗？')) {
            sessionStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        }
    });
    
    // 删除确认模态框
    document.getElementById('delete-cancel').addEventListener('click', hideDeleteModal);
    document.getElementById('delete-confirm').addEventListener('click', confirmDelete);
}

// 显示删除确认模态框
function showDeleteModal(slot, targetName) {
    const modal = document.getElementById('delete-modal');
    const message = document.getElementById('delete-message');
    
    if (slot === null) {
        // 删除所有存档
        message.textContent = "确定要删除所有存档吗？此操作不可撤销。";
    } else {
        // 删除单个存档
        message.textContent = `确定要删除"${targetName}"的存档吗？此操作不可撤销。`;
    }
    
    // 存储要删除的存档槽位
    modal.dataset.slot = slot;
    modal.style.display = 'flex';
}

// 隐藏删除确认模态框
function hideDeleteModal() {
    document.getElementById('delete-modal').style.display = 'none';
}

// 确认删除
function confirmDelete() {
    const modal = document.getElementById('delete-modal');
    const slot = modal.dataset.slot;
    
    if (slot === "null") {
        // 删除所有存档
        deleteAllSaves();
    } else {
        // 删除单个存档
        deleteSave(parseInt(slot));
    }
    
    // 隐藏模态框
    hideDeleteModal();
}

// 删除单个存档
function deleteSave(slot) {
    const userSaves = getUserSaves();
    
    if (userSaves[slot]) {
        // 删除指定存档
        delete userSaves[slot];
        
        // 更新本地存储
        const userSavesKey = `modernWarfare_saves_${currentUser}`;
        localStorage.setItem(userSavesKey, JSON.stringify(userSaves));
        
        // 立即更新界面
        updateSaveSlot(slot, null);
        
        // 显示成功消息
        showToast('存档已成功删除！');
    }
}

// 删除所有存档
function deleteAllSaves() {
    const userSavesKey = `modernWarfare_saves_${currentUser}`;
    localStorage.removeItem(userSavesKey);
    
    // 立即更新所有存档槽
    for (let i = 1; i <= 9; i++) {
        updateSaveSlot(i, null);
    }
    
    // 显示成功消息
    showToast('所有存档已成功删除！');
}

// 显示Toast消息
function showToast(message) {
    // 创建Toast元素
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.bottom = '70px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    toast.style.color = 'white';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '5px';
    toast.style.zIndex = '1000';
    toast.style.transition = 'opacity 0.3s';
    toast.style.fontSize = '0.9rem';
    
    // 添加到页面
    document.body.appendChild(toast);
    
    // 3秒后淡出并移除
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// 初始化页面
document.addEventListener('DOMContentLoaded', initLoadGame);