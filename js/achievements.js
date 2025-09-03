// achievements.js
document.addEventListener('DOMContentLoaded', function() {
    // 检查用户是否登录
    const currentUser = sessionStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = './login.html';
        return;
    }
    const user = JSON.parse(currentUser);
    loadAchievements(user.username);
    setupFilterButtons();
});
// 加载成就数据
function loadAchievements(username) {
    const savedAchievements = localStorage.getItem(`ShenDun_achievements_${username}`);
    let achievementsData = {...ACHIEVEMENTS};
    if (savedAchievements) {
        const savedData = JSON.parse(savedAchievements);
        // 更新成就状态
        Object.keys(achievementsData).forEach(key => {
            if (savedData[key]) {
                achievementsData[key].unlocked = savedData[key].unlocked;
                achievementsData[key].unlockTime = savedData[key].unlockTime;
            }
        });
    }
    
    renderAchievements(achievementsData);
    updateStats(achievementsData);
}

// 渲染成就列表
function renderAchievements(achievementsData) {
    const grid = document.getElementById('achievements-grid');
    grid.innerHTML = '';
    
    Object.values(achievementsData).forEach(achievement => {
        const card = document.createElement('div');
        card.className = `achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`;
        const timeString = achievement.unlocked ? new Date(achievement.unlockTime).toLocaleString('zh-CN') : '';
        
        card.innerHTML = `
            <div class="achievement-card-header">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-type">${achievement.type}成就</div>
                </div>
            </div>
            <div class="achievement-points">${achievement.points}点</div>
            <div class="achievement-description">${achievement.description}</div>
            <div class="achievement-details">
                <div class="achievement-condition">${achievement.condition}</div>
                ${achievement.unlocked ? 
                    `<div class="achievement-time">达成时间: ${timeString}</div>` : ''}
            </div>
        `;
        
        // 添加点击展开/收起功能
        const header = card.querySelector('.achievement-card-header');
        header.addEventListener('click', () => {card.classList.toggle('expanded');});
        // 添加鼠标悬停特效
        card.addEventListener('mouseenter', () => {card.style.zIndex = '10';});// 确保悬停的卡片在最上层
        card.addEventListener('mouseleave', () => {card.style.zIndex = '';});
        grid.appendChild(card);
    });
}

// 更新统计信息
function updateStats(achievementsData) {
    const total = Object.keys(achievementsData).length;
    const unlocked = Object.values(achievementsData).filter(a => a.unlocked).length;
    const percentage = Math.round((unlocked / total) * 100);

    // 修改 计算总成就点数
    const totalPoints = Object.values(achievementsData)
        .filter(a => a.unlocked)
        .reduce((sum, achievement) => sum + achievement.points, 0);
    
    document.getElementById('total-achievements').textContent = total;
    document.getElementById('unlocked-achievements').textContent = unlocked;
    document.getElementById('completion-percentage').textContent = `${percentage}%`;
    document.getElementById('total-points').textContent = totalPoints;
}

// 设置筛选按钮
function setupFilterButtons() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const achievementsGrid = document.getElementById('achievements-grid');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 更新按钮激活状态
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // 筛选成就
            const filter = button.dataset.filter;
            const cards = achievementsGrid.querySelectorAll('.achievement-card');
            
            cards.forEach(card => {
                switch(filter) {
                    case 'all':
                        card.style.display = 'block';
                        break;
                    case 'unlocked':
                        card.style.display = card.classList.contains('unlocked') ? 'block' : 'none';
                        break;
                    case 'locked':
                        card.style.display = card.classList.contains('locked') ? 'block' : 'none';
                        break;
                }
            });
        });
    });
}

// 添加全局函数，以便从游戏其他部分更新成就点数
window.updateAchievementPoints = function(achievementsData) {
    const totalPoints = Object.values(achievementsData)
        .filter(a => a.unlocked)
        .reduce((sum, achievement) => sum + achievement.points, 0);
    const pointsElement = document.getElementById('total-points');
    if (pointsElement) {
        pointsElement.textContent = totalPoints;
        // 添加点数更新动画
        pointsElement.classList.add('points-updated');
        setTimeout(() => {
            pointsElement.classList.remove('points-updated');
        }, 1000);
    }
};