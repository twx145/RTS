// 加载页面逻辑
class LoadingManager {
    constructor() {
        this.progress = 0;
        this.totalResources = 0;
        this.loadedResources = 0;
        this.targetPage = '';
        this.loadingParams = {};
        this.resourcesToLoad = [];
        this.tips = [
            "小提示: 在战斗中合理分配兵力可以获得优势",
            "小提示: 不同兵种有不同的优势和弱点",
            "小提示: 善用地形可以增加防御优势",
            "小提示: 及时保存游戏进度以防意外",
            "小提示: 完成任务可以获得额外奖励"
        ];
        
        this.init();
    }
    
    init() {
        // 解析URL参数
        this.parseUrlParams();
        // 设置随机提示
        this.setRandomTip();
        // 根据目标页面确定要加载的资源
        this.determineResources();
        // 开始加载
        this.startLoading();
        // 绑定跳过按钮事件
        document.getElementById('skip-button').addEventListener('click', () => {
            this.skipLoading();
        });
    }
    
    parseUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        this.targetPage = urlParams.get('target') || 'dialogue.html';
        
        // 收集所有参数
        this.loadingParams = {};
        for (const [key, value] of urlParams.entries()) {
            if (key !== 'target') {
                this.loadingParams[key] = value;
            }
        }
    }
    
    setRandomTip() {
        const randomTip = this.tips[Math.floor(Math.random() * this.tips.length)];
        document.getElementById('loading-tip').textContent = randomTip;
    }
    
    determineResources() {//修改
        // 根据目标页面确定需要加载的资源
        const urlParams = new URLSearchParams(window.location.search);
        const fromSave = urlParams.get('fromSave');
        if (fromSave === 'true') {
            // 从存档加载游戏
            this.setPreviewInfo('加载存档', '正在恢复游戏进度');
            // 获取存档信息
            const currentUser = sessionStorage.getItem('currentUser');
            const saveInfo = localStorage.getItem(`modernWarfare_load_save_${currentUser}`);
            
            if (saveInfo) {
                try {
                    const { saveData } = JSON.parse(saveInfo);
                    
                    // 根据存档信息设置预览
                    this.setPreviewInfo(
                        `第${saveData.chapter + 1}章`, 
                        this.getSceneName(saveData.chapter, saveData.scene)
                    );
                    
                    // 加载存档相关的资源
                    this.loadResourcesForSave(saveData);
                    
                    // 清理临时存储
                    localStorage.removeItem(`modernWarfare_load_save_${currentUser}`);
                } catch (e) {
                    console.error('解析存档信息失败', e);
                    this.loadDefaultResources();
                }
            } else {
                this.loadDefaultResources();
            }
        } 
        else if (this.targetPage.includes('dialogue.html')) {
            // 对话页面需要加载的资源
            // 如果是新游戏，加载第一章第一场景的资源
            if (this.loadingParams.new === 'true') {
                this.setPreviewInfo('剧情加载中', '正在准备第一章剧情内容');
                this.resourcesToLoad = [
                    { type: 'script', url: 'data/script.js' },
                    { type: 'image', url: 'assets/backgrounds/bg.png' },
                    { type: 'image', url: 'assets/characters/commander.jpg' },
                    { type: 'image', url: 'assets/characters/player.jpg' }
                ];
            } 
            // 如果是从游戏返回，加载之前场景的资源
            else if (this.loadingParams.returnFromGame === 'true') {
                this.setPreviewInfo('剧情加载中', '正在准备剧情内容');
                // 这里需要根据保存的进度确定要加载的资源
                const currentUser = sessionStorage.getItem('currentUser');
                const tempProgress = localStorage.getItem(`modernWarfare_temp_progress_${currentUser}`);
                if (tempProgress) {
                    try {
                        const progress = JSON.parse(tempProgress);
                        // 根据进度信息加载相应资源
                        this.loadResourcesForProgress(progress);
                    } catch (e) {
                        console.error('解析进度信息失败', e);
                        this.loadDefaultResources();
                    }
                } else {
                    this.loadDefaultResources();
                }
            }
            // 其他情况加载默认资源
            else {
                this.loadDefaultResources();
            }
        } 
        else if (this.targetPage.includes('game.html')) {
            // 游戏页面需要加载的资源
            this.setPreviewInfo('游戏加载中', '正在准备战场环境');
            this.resourcesToLoad = [
                { type: 'image', url: 'assets/backgrounds/bg.png' },
                // { type: 'image', url: 'assets/units/infantry.png' },
                // { type: 'image', url: 'assets/units/tank.png' },
                // { type: 'image', url: 'assets/units/artillery.png' },
                { type: 'script', url: 'js/game.js' },
                { type: 'script', url: 'js/map.js' },
                { type: 'script', url: 'js/unit.js' }
            ];
        }
        
        this.totalResources = this.resourcesToLoad.length;
    }
    
    loadResourcesForProgress(progress) {
        // 根据进度信息加载相应的资源
        // 这里需要根据您的脚本结构来确定需要加载哪些资源
        fetch('data/script.js')
            .then(response => response.json())
            .then(scriptData => {
                const chapter = scriptData.chapters[progress.chapter];
                if (chapter) {
                    const scene = chapter.scenes[progress.scene];
                    if (scene) {
                        this.setPreviewInfo(chapter.title, scene.name);
                        
                        // 加载场景背景
                        this.resourcesToLoad.push({
                            type: 'image', 
                            url: `assets/backgrounds/${scene.background}`
                        });
                        
                        // 加载当前对话的角色立绘
                        const dialog = scene.dialogs[progress.dialog];
                        if (dialog) {
                            if (dialog.characterLeft) {
                                this.resourcesToLoad.push({
                                    type: 'image', 
                                    url: `assets/characters/${dialog.characterLeft.image}`
                                });
                            }
                            if (dialog.characterCenter) {
                                this.resourcesToLoad.push({
                                    type: 'image', 
                                    url: `assets/characters/${dialog.characterCenter.image}`
                                });
                            }
                            if (dialog.characterRight) {
                                this.resourcesToLoad.push({
                                    type: 'image', 
                                    url: `assets/characters/${dialog.characterRight.image}`
                                });
                            }
                        }
                    }
                }
            })
            .catch(error => {
                console.error('加载脚本数据失败', error);
                this.loadDefaultResources();
            });
    }
    
    loadDefaultResources() {
        // 加载默认资源
        this.setPreviewInfo('剧情加载中', '正在准备剧情内容');
        this.resourcesToLoad = [
            { type: 'script', url: 'data/script.js' },
            { type: 'image', url: 'assets/backgrounds/bg.png' },
            { type: 'image', url: 'assets/characters/commander_normal.png' }
        ];
    }

    // 新增：为存档加载资源  修改
    loadResourcesForSave(saveData) {
        // 根据存档信息加载相应的资源
        fetch('data/script.js')
            .then(response => response.json())
            .then(scriptData => {
                const chapter = scriptData.chapters[saveData.chapter];
                if (chapter) {
                    const scene = chapter.scenes[saveData.scene];
                    if (scene) {
                        // 加载场景背景
                        this.resourcesToLoad.push({
                            type: 'image', 
                            url: `assets/backgrounds/${scene.background}`
                        });
                        
                        // 设置预览背景
                        document.getElementById('scene-preview').style.backgroundImage = `url('assets/backgrounds/${scene.background}')`;
                    }
                }
                
                // 加载游戏资源
                this.resourcesToLoad.push(
                    { type: 'image', url: 'assets/backgrounds/battlefield.jpg' },
                    { type: 'image', url: 'assets/units/infantry.png' },
                    { type: 'image', url: 'assets/units/tank.png' },
                    { type: 'image', url: 'assets/units/artillery.png' },
                    { type: 'script', url: 'js/game.js' },
                    { type: 'script', url: 'js/map.js' },
                    { type: 'script', url: 'js/unit.js' }
                );
            })
            .catch(error => {
                console.error('加载脚本数据失败', error);
                this.loadDefaultResources();
            });
    }
    
    setPreviewInfo(title, description) {
        document.getElementById('preview-title').textContent = title;
        document.getElementById('preview-description').textContent = description;
    }
    
    startLoading() {
        if (this.totalResources === 0) {
            this.completeLoading();
            return;
        }
        
        // 显示跳过按钮（3秒后）
        setTimeout(() => {
            document.getElementById('skip-button').style.display = 'block';
        }, 3000);
        
        // 加载所有资源
        this.resourcesToLoad.forEach(resource => {
            if (resource.type === 'image') {
                this.loadImage(resource.url);
            } else if (resource.type === 'script') {
                this.loadScript(resource.url);
            } else if (resource.type === 'audio') {
                this.loadAudio(resource.url);
            }
        });
    }
    
    loadImage(url) {
        const img = new Image();
        img.onload = () => {
            this.resourceLoaded();
            
            // 如果是第一个背景图片，设置为预览
            if (url.includes('backgrounds/') && !document.getElementById('scene-preview').style.backgroundImage) {
                document.getElementById('scene-preview').style.backgroundImage = `url('${url}')`;
            }
        };
        img.onerror = () => {
            console.error(`加载图片失败: ${url}`);
            this.resourceLoaded();
        };
        img.src = url;
    }
    
    loadScript(url) {
        // 对于脚本文件，我们只计算加载完成，不实际执行
        fetch(url)
            .then(response => {
                if (response.ok) {
                    this.resourceLoaded();
                } else {
                    console.error(`加载脚本失败: ${url}`);
                    this.resourceLoaded();
                }
            })
            .catch(error => {
                console.error(`加载脚本失败: ${url}`, error);
                this.resourceLoaded();
            });
    }
    
    loadAudio(url) {
        // 对于音频文件，我们只计算加载完成，不实际播放
        fetch(url)
            .then(response => {
                if (response.ok) {
                    this.resourceLoaded();
                } else {
                    console.error(`加载音频失败: ${url}`);
                    this.resourceLoaded();
                }
            })
            .catch(error => {
                console.error(`加载音频失败: ${url}`, error);
                this.resourceLoaded();
            });
    }
    
    resourceLoaded() {
        this.loadedResources++;
        this.progress = Math.min(100, Math.floor((this.loadedResources / this.totalResources) * 100));
        
        // 更新进度条和文本
        document.getElementById('loading-progress').style.width = `${this.progress}%`;
        document.getElementById('loading-text').textContent = `${this.progress}%`;
        
        // 检查是否全部加载完成
        if (this.loadedResources >= this.totalResources) {
            setTimeout(() => {
                this.completeLoading();
            }, 500); // 稍作延迟，让用户看到100%的进度
        }
    }
    
    completeLoading() {//修改
        // 确保进度显示为100%
        document.getElementById('loading-progress').style.width = '100%';
        document.getElementById('loading-text').textContent = '100%';
        
        // 构建目标URL
        const params = new URLSearchParams(this.loadingParams);
        const targetUrl = `${this.targetPage}?${params.toString()}`;
        
        // 延迟一下让用户看到加载完成
        setTimeout(() => {
            // 如果是从存档加载，需要传递存档信息
            if (this.loadingParams.fromSave === 'true') {
                const currentUser = sessionStorage.getItem('currentUser');
                const saveInfo = localStorage.getItem(`modernWarfare_load_save_${currentUser}`);
                
                if (saveInfo) {
                    try {
                        const { slot } = JSON.parse(saveInfo);
                        window.location.href = `${targetUrl}&load=${slot}`;
                        return;
                    } catch (e) {
                        console.error('解析存档信息失败', e);
                    }
                }
            }
            
            // 普通跳转
            window.location.href = targetUrl;
        }, 1000);
    }

    skipLoading() {
        // 跳过加载，直接跳转
        const params = new URLSearchParams(this.loadingParams);
        const targetUrl = `${this.targetPage}?${params.toString()}`;
        window.location.href = targetUrl;
    }
}

// 初始化加载管理器
document.addEventListener('DOMContentLoaded', () => {
    new LoadingManager();
});