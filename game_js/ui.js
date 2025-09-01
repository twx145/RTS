class UI {
    constructor(game) {
        this.game = game;
        this.unitListContainer = document.getElementById('unit-selection');
        this.playerManpower = document.getElementById('player-manpower');
        this.gameStatus = document.getElementById('game-status');
        this.startBattleBtn = document.getElementById('start-battle-btn');
        this.selectedUnitInfo = document.getElementById('selected-unit-info');
        
        this.selectedUnitToDeploy = null;
        this.messageTimeout = null;
        // 修改 新增:保存按钮
        this.addSaveButton();
        
        this.init();
    }

    // 修改 添加保存按钮
    addSaveButton() {
        const saveBtn = document.createElement('button');
        saveBtn.textContent = '手动保存';
        saveBtn.id = 'manual-save-btn';
        saveBtn.addEventListener('click', () => {
            if (this.game.savegame.manualSave()) {
                this.showGameMessage('游戏已保存');
            } else {
                this.showGameMessage('保存失败');
            }
        });
        
        const gameControls = document.getElementById('game-controls');
        if (gameControls) {
            gameControls.appendChild(saveBtn);
        }
    }

    init() {
        this.populateUnitList();
        
        if (this.startBattleBtn) {
            this.startBattleBtn.addEventListener('click', () => this.game.startGame());
        }
    }

    populateUnitList() {
        if (!this.unitListContainer) return;
        
        this.unitListContainer.innerHTML = `
            <h3>可部署兵种</h3>
            <div id="unit-list-wrapper"></div>
        `;
        const listWrapper = this.unitListContainer.querySelector('#unit-list-wrapper');

        const groupedUnits = {};
        // 修改 新增：过滤可用兵种
        const availableUnits = this.game.availableUnits || Object.keys(UNIT_TYPES);
        
        for (const type in availableUnits) {
            const unit = UNIT_TYPES[availableUnits[type]];
            if (!groupedUnits[unit.unitClass]) {
                groupedUnits[unit.unitClass] = [];
            }
            groupedUnits[unit.unitClass].push({ id: availableUnits[type], ...unit });
        }

        const categoryOrder = ['步兵', '装甲', '飞行', '炮兵', '海军'];
        for (const category of categoryOrder) {
            if (!groupedUnits[category]) continue;

            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'unit-category';
            categoryDiv.innerHTML = `<h4>${category}</h4>`;
            
            const ul = document.createElement('ul');
            ul.className = 'unit-list';

            groupedUnits[category].forEach(unit => {
                const li = document.createElement('li');
                li.dataset.unitType = unit.id;
                li.title = unit.description;

                li.innerHTML = `
                    <div class="unit-icon">${unit.icon}</div>
                    <div class="unit-details">
                        <strong>${unit.name}</strong>
                        <div class="unit-stats">费用: ${unit.cost} | HP: ${unit.hp} | 攻击: ${unit.attack}</div>
                    </div>
                `;
                
                li.addEventListener('click', () => {
                    const wasSelected = li.classList.contains('selected');
                    this.clearAllSelectionsInList();
                    
                    if (!wasSelected) {
                        li.classList.add('selected');
                        this.selectedUnitToDeploy = unit.id;
                        // 核心交互优化: 选择部署单位时，取消地图上的单位选择
                        this.game.selectedUnits = [];
                    } else {
                        this.selectedUnitToDeploy = null;
                    }
                });
                ul.appendChild(li);
            });

            categoryDiv.appendChild(ul);
            listWrapper.appendChild(categoryDiv);
        }
    }

    //新增辅助函数：清除部署列表中的所有选中状态
    clearAllSelectionsInList() {
        if (!this.unitListContainer) return;
        this.unitListContainer.querySelectorAll('li.selected').forEach(item => item.classList.remove('selected'));
    }

    //新增辅助函数：被game.js调用，用于清除待部署状态
    clearDeploymentSelection() {
        if (this.selectedUnitToDeploy) {
            this.selectedUnitToDeploy = null;
            this.clearAllSelectionsInList();
        }
    }

    update() {
        if (this.playerManpower) this.playerManpower.textContent = this.game.player.manpower;
        if (this.gameStatus) this.gameStatus.textContent = `状态: ${this.game.gameState}`;
        if (this.startBattleBtn) this.startBattleBtn.disabled = this.game.gameState !== 'deployment';
        
        const playerBaseHPDisplay = document.getElementById('player-base-hp-display');
        const aiBaseHPDisplay = document.getElementById('ai-base-hp-display');
        
        if (this.game.playerBase && playerBaseHPDisplay) {
            playerBaseHPDisplay.style.display = 'block';
            const playerHPBar = document.getElementById('player-base-hp-bar');
            if(playerHPBar) playerHPBar.style.width = `${(this.game.playerBase.hp / this.game.playerBase.maxHp) * 100}%`;
        } else if (playerBaseHPDisplay) {
            playerBaseHPDisplay.style.display = 'none';
        }

        if (this.game.aiBase && aiBaseHPDisplay) {
            aiBaseHPDisplay.style.display = 'block';
            const aiHPBar = document.getElementById('ai-base-hp-bar');
            if(aiHPBar) aiHPBar.style.width = `${(this.game.aiBase.hp / this.game.aiBase.maxHp) * 100}%`;
        } else if (aiBaseHPDisplay) {
            aiBaseHPDisplay.style.display = 'none';
        }

        this.updateSelectedUnitInfo();
    }

    updateSelectedUnitInfo() {
        if (!this.selectedUnitInfo) return;
        const selectedCount = this.game.selectedUnits.length;

        if (selectedCount === 1) {
            const unit = this.game.selectedUnits[0]; 
            const stats = unit.stats;
            
            let statusText = '待命';
            if (unit.target) statusText = '攻击中';
            else if (unit.path && unit.path.length > 0) statusText = '移动中';
            else if (unit.isLoitering) statusText = '巡逻中';
            else if (unit.isSettingUp) statusText = '部署中';


            this.selectedUnitInfo.innerHTML = `
                <h4>${stats.name}</h4>
                <p>HP: ${unit.hp.toFixed(0)} / ${stats.hp}</p>
                <div class="hp-bar-container small">
                   <div class="hp-bar" style="width: ${(unit.hp / stats.hp) * 100}%; background-color: green;"></div>
                </div>
                <p>攻击: ${stats.attack} | 防御: ${stats.defense}</p>
                <p>射程: ${stats.range / TILE_SIZE}格 | 状态: ${statusText}</p> 
            `;
        } else if (selectedCount > 1) {
            this.selectedUnitInfo.innerHTML = `
                <h4>选中多个单位</h4>
                <p>${selectedCount} 个单位被选中。</p>
            `;
        } else {
            this.selectedUnitInfo.innerHTML = '<h4>选中单位信息</h4><p>无</p>';
        }
    }
    
    showWinner(winnerName) {
        const winnerDiv = document.createElement('div');
        winnerDiv.className = 'winner-announcement';
        winnerDiv.textContent = `${winnerName} 获胜!`;
        document.body.appendChild(winnerDiv);
    }

    showGameMessage(message) {
        let messageDiv = document.getElementById('game-message');
        if (!messageDiv) {
            messageDiv = document.createElement('div');
            messageDiv.id = 'game-message';
            document.body.appendChild(messageDiv);
        }
        messageDiv.textContent = message;
        messageDiv.classList.add('show');

        if (this.messageTimeout) clearTimeout(this.messageTimeout);
        this.messageTimeout = setTimeout(() => {
            messageDiv.classList.remove('show');
        }, 3000);
    }
}