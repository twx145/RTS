// 音效管理器
const SoundManager = {
    // 播放音效并返回Promise
    playSound: function(soundId) {
        return new Promise((resolve) => {
            const sound = document.getElementById(soundId);
            if (!sound) {
                resolve();
                return;
            }
            
            // 设置音量
            const savedVolume = localStorage.getItem('sfxVolume') || 85;
            sound.volume = savedVolume / 100;
            
            // 播放音效
            sound.currentTime = 0;
            const playPromise = sound.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(e => {
                    console.log("音效播放失败:", e);
                    resolve();
                });
            }
            
            // 音效结束后resolve
            sound.onended = () => {
                resolve();
            };
            
            // 设置超时，防止音效无法正常结束
            setTimeout(() => {
                resolve();
            }, 1000);
        });
    },
    
    // 带延迟的页面跳转
    navigateWithSound: function(url, soundId = 'buttonSound', delay = 0) {
        // 显示加载提示
        document.getElementById('loading-overlay').style.display = 'flex';
        
        // 播放音效并等待
        this.playSound(soundId).then(() => {
            // 音效播放完成后等待额外延迟
            return new Promise(resolve => setTimeout(resolve, delay));
        }).then(() => {
            // 进行页面跳转
            window.location.href = url;
        });
    }
};

// 背景音乐管理器
const BackgroundMusicManager = {
    isPlaying: false,
    
    // 初始化背景音乐
    init: function() {
        const bgMusic = document.getElementById('backgroundMusic');
        const musicControl = document.getElementById('musicControl');
        const musicIcon = document.getElementById('musicIcon');
        
        // 获取用户设置
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
        let bgmVolume = 80; // 默认音量
        
        if (currentUser) {
            const userSettings = localStorage.getItem(`ShenDun_settings_${currentUser.username}`);
            if (userSettings) {
                const settings = JSON.parse(userSettings);
                bgmVolume = settings.bgmVolume;
            }
        }
        
        // 设置音量
        bgMusic.volume = bgmVolume / 100;
        
        // 尝试自动播放
        this.playBackgroundMusic();
        
        // 点击控制按钮事件
        musicControl.addEventListener('click', () => {
            this.toggleMusic();
        });
    },
    
    // 播放背景音乐
    playBackgroundMusic: function() {
        const bgMusic = document.getElementById('backgroundMusic');
        const musicIcon = document.getElementById('musicIcon');
        
        const playPromise = bgMusic.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                this.isPlaying = true;
                musicIcon.className = 'fas fa-volume-up';
            }).catch(error => {
                console.log('自动播放被阻止:', error);
                this.isPlaying = false;
                musicIcon.className = 'fas fa-volume-mute';
            });
        }
    },
    
    // 切换音乐播放状态
    toggleMusic: function() {
        const bgMusic = document.getElementById('backgroundMusic');
        const musicIcon = document.getElementById('musicIcon');
        
        if (this.isPlaying) {
            bgMusic.pause();
            musicIcon.className = 'fas fa-volume-mute';
        } else {
            bgMusic.play().catch(error => {
                console.log('播放失败:', error);
            });
            musicIcon.className = 'fas fa-volume-up';
        }
        
        this.isPlaying = !this.isPlaying;
    },
    
    // 更新音量
    updateVolume: function(volume) {
        const bgMusic = document.getElementById('backgroundMusic');
        bgMusic.volume = volume / 100;
    }
};

// 透明覆盖层管理器
const TransparentOverlayManager = {
    overlay: null,
    
    // 初始化透明覆盖层
    init: function() {
        this.overlay = document.getElementById('transparent-overlay');
        
        // 设置覆盖层样式
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: transparent;
            z-index: 9999;
            cursor: default;
        `;
        
        // 添加点击事件
        this.overlay.addEventListener('click', () => this.handleOverlayClick());
    },
    
    // 处理覆盖层点击事件
    handleOverlayClick: function() {
        // 移除覆盖层
        this.overlay.style.display = 'none';
        
        // 初始化背景音乐
        BackgroundMusicManager.init();
        
        // 播放点击音效
        SoundManager.playSound('buttonSound');
    }
};

// 为所有带有sound-btn类的元素添加点击音效和延迟跳转
document.addEventListener('DOMContentLoaded', function() {
    const buttons = document.querySelectorAll('.sound-btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            // 如果是退出按钮，特殊处理
            if (this.id === 'btnExit') {
                e.preventDefault();
                SoundManager.playSound('buttonSound').then(() => {
                    sessionStorage.removeItem('currentUser');
                    window.location.href = 'html/login.html';
                });
                return;
            }
            
            // 其他按钮
            if (this.href) {
                e.preventDefault();
                const delay = parseInt(this.getAttribute('data-delay')) || 0;
                SoundManager.navigateWithSound(this.href, 'buttonSound', delay);
            }
        });
    });
    
    // 初始化透明覆盖层
    TransparentOverlayManager.init();
});

// 原有的检查用户登录状态代码
window.addEventListener('DOMContentLoaded', () => {
    if (!sessionStorage.getItem('currentUser')) {
        window.location.href = 'html/login.html';
    }
});