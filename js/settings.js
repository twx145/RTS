// settings.js
document.addEventListener('DOMContentLoaded', function() {
    // 检查用户是否登录
    const currentUser = sessionStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    const user = JSON.parse(currentUser);
    
    // 初始化设置
    initSettings(user.username);
    setupEventListeners();
    setupTabs();
});

// 初始化设置
function initSettings(username) {
    // 尝试加载用户设置
    const savedSettings = localStorage.getItem(`ShenDun_settings_${username}`);
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        applySettings(settings);
    } else {
        // 使用默认设置
        resetToDefaults();
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
        const settings = collectSettings();
        localStorage.setItem(`ShenDun_settings_${currentUser.username}`, JSON.stringify(settings));
    }
}

// 应用设置到界面
function applySettings(settings) {
    // 音量设置
    document.getElementById('master-volume').value = settings.masterVolume || 100;
    document.getElementById('master-volume-value').textContent = `${settings.masterVolume || 100}%`;
    
    document.getElementById('bgm-volume').value = settings.bgmVolume || 80;
    document.getElementById('bgm-volume-value').textContent = `${settings.bgmVolume || 80}%`;
    
    document.getElementById('voice-volume').value = settings.voiceVolume || 90;
    document.getElementById('voice-volume-value').textContent = `${settings.voiceVolume || 90}%`;
    
    document.getElementById('sfx-volume').value = settings.sfxVolume || 85;
    document.getElementById('sfx-volume-value').textContent = `${settings.sfxVolume || 85}%`;
    
    document.getElementById('game-volume').value = settings.gameVolume || 75;
    document.getElementById('game-volume-value').textContent = `${settings.gameVolume || 75}%`;
    
    // 显示设置
    document.getElementById('text-speed').value = settings.textSpeed || 5;
    updateSpeedLabel('text-speed', 'text-speed-value');
    
    document.getElementById('auto-speed').value = settings.autoSpeed || 5;
    updateSpeedLabel('auto-speed', 'auto-speed-value');
    
    document.getElementById('textbox-opacity').value = settings.textboxOpacity || 85;
    document.getElementById('textbox-opacity-value').textContent = `${settings.textboxOpacity || 85}%`;
    
    // 复选框设置
    document.getElementById('fullscreen-mode').checked = settings.fullscreenMode !== false;
    document.getElementById('vsync-enabled').checked = settings.vsyncEnabled !== false;
    document.getElementById('skip-read-text').checked = settings.skipReadText !== false;
    document.getElementById('auto-save-enabled').checked = settings.autoSaveEnabled !== false;
    document.getElementById('invert-mouse').checked = settings.invertMouse || false;
    
    // 选择框设置
    if (settings.resolution) {
        document.getElementById('resolution-select').value = settings.resolution;
    }
    
    if (settings.language) {
        document.getElementById('language-select').value = settings.language;
    }
    
    if (settings.textLanguage) {
        document.getElementById('text-language-select').value = settings.textLanguage;
    }
    
    if (settings.voiceLanguage) {
        document.getElementById('voice-language-select').value = settings.voiceLanguage;
    }
    
    // 灵敏度设置
    document.getElementById('mouse-sensitivity').value = settings.mouseSensitivity || 5;
    updateSensitivityLabel('mouse-sensitivity', 'mouse-sensitivity-value');
    
    document.getElementById('scroll-sensitivity').value = settings.scrollSensitivity || 5;
    updateSensitivityLabel('scroll-sensitivity', 'scroll-sensitivity-value');
}

// 设置事件监听器
function setupEventListeners() {
    // 音量滑块事件
    setupSliderEvent('master-volume', 'master-volume-value', '%');
    setupSliderEvent('bgm-volume', 'bgm-volume-value', '%');
    setupSliderEvent('voice-volume', 'voice-volume-value', '%');
    setupSliderEvent('sfx-volume', 'sfx-volume-value', '%');
    setupSliderEvent('game-volume', 'game-volume-value', '%');
    
    // 速度滑块事件
    setupSpeedSliderEvent('text-speed', 'text-speed-value');
    setupSpeedSliderEvent('auto-speed', 'auto-speed-value');
    
    // 透明度滑块事件
    setupSliderEvent('textbox-opacity', 'textbox-opacity-value', '%');
    
    // 灵敏度滑块事件
    setupSensitivitySliderEvent('mouse-sensitivity', 'mouse-sensitivity-value');
    setupSensitivitySliderEvent('scroll-sensitivity', 'scroll-sensitivity-value');
    
    // 按钮事件
    document.getElementById('save-settings').addEventListener('click', saveSettings);
    document.getElementById('cancel-settings').addEventListener('click', cancelSettings);
    document.getElementById('reset-settings').addEventListener('click', confirmResetSettings);
    document.getElementById('clear-cache').addEventListener('click', confirmClearCache);
    document.getElementById('clear-saves').addEventListener('click', confirmClearSaves);
}

// 设置标签页
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 移除所有活动状态
            tabButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
            
            // 添加当前活动状态
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
}

// 设置滑块事件
function setupSliderEvent(sliderId, valueId, suffix = '') {
    const slider = document.getElementById(sliderId);
    const value = document.getElementById(valueId);
    
    slider.addEventListener('input', () => {
        value.textContent = `${slider.value}${suffix}`;
    });
}

// 设置速度滑块事件
function setupSpeedSliderEvent(sliderId, valueId) {
    const slider = document.getElementById(sliderId);
    const value = document.getElementById(valueId);
    
    slider.addEventListener('input', () => {
        updateSpeedLabel(sliderId, valueId);
    });
}

// 更新速度标签
function updateSpeedLabel(sliderId, valueId) {
    const slider = document.getElementById(sliderId);
    const value = document.getElementById(valueId);
    const speedValue = parseInt(slider.value);
    
    let speedText;
    if (speedValue <= 3) {
        speedText = '慢速';
    } else if (speedValue <= 7) {
        speedText = '中速';
    } else {
        speedText = '快速';
    }
    
    value.textContent = speedText;
}

// 设置灵敏度滑块事件
function setupSensitivitySliderEvent(sliderId, valueId) {
    const slider = document.getElementById(sliderId);
    const value = document.getElementById(valueId);
    
    slider.addEventListener('input', () => {
        updateSensitivityLabel(sliderId, valueId);
    });
}

// 更新灵敏度标签
function updateSensitivityLabel(sliderId, valueId) {
    const slider = document.getElementById(sliderId);
    const value = document.getElementById(valueId);
    const sensitivityValue = parseInt(slider.value);
    
    let sensitivityText;
    if (sensitivityValue <= 3) {
        sensitivityText = '低';
    } else if (sensitivityValue <= 7) {
        sensitivityText = '中等';
    } else {
        sensitivityText = '高';
    }
    
    value.textContent = sensitivityText;
}

// 收集当前设置
function collectSettings() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    
    return {
        masterVolume: parseInt(document.getElementById('master-volume').value),
        bgmVolume: parseInt(document.getElementById('bgm-volume').value),
        voiceVolume: parseInt(document.getElementById('voice-volume').value),
        sfxVolume: parseInt(document.getElementById('sfx-volume').value),
        gameVolume: parseInt(document.getElementById('game-volume').value),
        
        textSpeed: parseInt(document.getElementById('text-speed').value),
        autoSpeed: parseInt(document.getElementById('auto-speed').value),
        textboxOpacity: parseInt(document.getElementById('textbox-opacity').value),
        
        fullscreenMode: document.getElementById('fullscreen-mode').checked,
        vsyncEnabled: document.getElementById('vsync-enabled').checked,
        resolution: document.getElementById('resolution-select').value,
        
        skipReadText: document.getElementById('skip-read-text').checked,
        autoSaveEnabled: document.getElementById('auto-save-enabled').checked,
        language: document.getElementById('language-select').value,
        textLanguage: document.getElementById('text-language-select').value,
        voiceLanguage: document.getElementById('voice-language-select').value,
        
        mouseSensitivity: parseInt(document.getElementById('mouse-sensitivity').value),
        scrollSensitivity: parseInt(document.getElementById('scroll-sensitivity').value),
        invertMouse: document.getElementById('invert-mouse').checked,
        
        lastUpdated: new Date().getTime(),
        username: currentUser.username
    };
}

// 保存设置
function saveSettings() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    const settings = collectSettings();
    
    localStorage.setItem(`ShenDun_settings_${currentUser.username}`, JSON.stringify(settings));
    
    // 显示保存成功消息 - 使用自定义对话框
    showAlert('设置已保存成功！', '保存成功');
    
    // 应用设置到游戏（如果游戏正在运行）
    if (window.game && window.game.applySettings) {
        window.game.applySettings(settings);
    }
}

// 取消设置
function cancelSettings() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    initSettings(currentUser.username);
}

// 重置为默认设置
function resetToDefaults() {
    const defaultSettings = {
        masterVolume: 100,
        bgmVolume: 80,
        voiceVolume: 90,
        sfxVolume: 85,
        gameVolume: 75,
        
        textSpeed: 5,
        autoSpeed: 5,
        textboxOpacity: 85,
        
        fullscreenMode: true,
        vsyncEnabled: true,
        resolution: '1920x1080',
        
        skipReadText: true,
        autoSaveEnabled: true,
        language: 'zh-CN',
        textLanguage: 'zh-CN',
        voiceLanguage: 'zh-CN',
        
        mouseSensitivity: 5,
        scrollSensitivity: 5,
        invertMouse: false
    };
    
    applySettings(defaultSettings);
    showAlert('恢复成功', '设置已恢复为默认值！');
}

// 确认重置设置
function confirmResetSettings() {
    showConfirmDialog(
        '恢复默认设置',
        '您确定要恢复所有设置为默认值吗？此操作无法撤销。',
        resetToDefaults
    );
}

// 确认清除缓存
function confirmClearCache() {
    showConfirmDialog(
        '清除所有缓存',
        '您确定要清除所有缓存数据吗？这包括临时文件和设置，但不会删除存档。',
        clearCache
    );
}

// 确认清除存档
function confirmClearSaves() {
    showConfirmDialog(
        '清除所有存档',
        '您确定要永久删除所有游戏存档吗？此操作无法撤销！',
        clearSaves
    );
}

// 清除缓存
function clearCache() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    // 移除设置
    localStorage.removeItem(`ShenDun_settings_${currentUser.username}`);
    // 移除其他缓存数据（这里可以根据需要添加）
    showAlert('清除成功', '缓存已清除成功！');
    resetToDefaults();
}

// 清除存档
function clearSaves() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    
    // 移除存档
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(`ShenDun_save_${currentUser.username}`)) {
            localStorage.removeItem(key);
        }
    }
    // 移除自动存档
    localStorage.removeItem(`ShenDun_autosave_${currentUser.username}`);
    showAlert('清除成功', '所有存档已删除成功！');
}