//新增 saveGame.js - 游戏状态保存与恢复管理器
class saveGame {
    constructor(game) {
        this.game = game;
        this.autoSaveInterval = 30000; // 每30秒自动保存一次
        this.lastAutoSaveTime = 0;
        this.autoSaveEnabled = true;
        this.currentUser = null;
        
        this.init();
    }
    
    init() {
        // 获取当前用户
        this.currentUser = sessionStorage.getItem('currentUser');
        // 设置自动保存
        this.setupAutoSave();
        // 检查是否有自动保存的数据
        this.checkAutoSave();
    }
    
    // 检查自动保存数据
    checkAutoSave() {
        if (!this.currentUser) return;
        
        const autoSaveData = this.getAutoSaveData();
        // alert(autoSaveData);
        if (autoSaveData && this.game.gameState !== 'gameover') {
            this.showRestorePrompt(autoSaveData);
        }
    }
    
    // 显示恢复提示
    showRestorePrompt(autoSaveData) {
        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'save-game-modal';
        modal.innerHTML = `
            <div class="save-game-content">
                <h2>发现自动保存的游戏</h2>
                <p>是否恢复上次的游戏进度？</p>
                <div class="save-game-buttons">
                    <button id="save-restore-yes">是，恢复游戏</button>
                    <button id="save-restore-no">否，重新开始</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // 添加事件监听
        document.getElementById('save-restore-yes').addEventListener('click', () => {
            this.restoreGame(autoSaveData);
            document.body.removeChild(modal);
        });
        
        document.getElementById('save-restore-no').addEventListener('click', () => {
            this.clearAutoSave();
            document.body.removeChild(modal);
            // 如果是从对话跳转，可能需要重新初始化游戏
            if (this.game.fromDialogue) {
                this.game.setupInitialCamera();
            }
        });
    }
    
    // 设置自动保存
    setupAutoSave() {
        if (!this.autoSaveEnabled || !this.currentUser) return;
        
        // 使用requestAnimationFrame来检查是否需要自动保存
        const checkAutoSave = (currentTime) => {
            if (this.game.gameState === 'playing' && currentTime - this.lastAutoSaveTime > this.autoSaveInterval) {
                this.autoSave();
                this.lastAutoSaveTime = currentTime;
            }
            requestAnimationFrame(checkAutoSave);
        };
        
        requestAnimationFrame(checkAutoSave);
    }
    
    // 自动保存游戏
    autoSave() {
        if (!this.currentUser) return;
        
        try {
            const saveData = this.serializeGameState();
            const autoSaveKey = `ShenDun_autosave_${this.currentUser}`;
            localStorage.setItem(autoSaveKey, JSON.stringify(saveData));
            this.game.ui.showGameMessage('游戏已自动保存');
            console.log("游戏已自动保存");
        } catch (e) {
            console.error("自动保存失败", e);
        }
    }
    
    // 手动保存游戏
    manualSave() {
        if (!this.currentUser) return;
        
        try {
            const saveData = this.serializeGameState();
            const manualSaveKey = `ShenDun_autosave_${this.currentUser}`;
            localStorage.setItem(manualSaveKey, JSON.stringify(saveData));
            
            console.log("游戏已手动保存");
            return true;
        } catch (e) {
            console.error("手动保存失败", e);
            return false;
        }
    }
    
    // 序列化游戏状态
    serializeGameState() {
        return {
            timestamp: Date.now(),
            gameState: this.game.gameState,
            gameMode: this.game.gameMode,
            playerManpower: this.game.player.manpower,
            aiManpower: this.game.ai.manpower,
            playerUnits: this.serializeUnits(this.game.player.units),
            aiUnits: this.serializeUnits(this.game.ai.units),
            playerBase: this.game.playerBase ? { 
                hp: this.game.playerBase.hp,
                gridX: this.game.playerBase.gridX,
                gridY: this.game.playerBase.gridY
            } : null,
            aiBase: this.game.aiBase ? { 
                hp: this.game.aiBase.hp,
                gridX: this.game.aiBase.gridX,
                gridY: this.game.aiBase.gridY
            } : null,
            camera: {
                x: this.game.camera.x,
                y: this.game.camera.y,
                zoom: this.game.camera.zoom
            },
            mapId: this.game.map.id,
            mapgrid: this.game.map.grid,
            terrainDetails: this.serializeTerrainDetails(this.game.map.terrainDetails),
            projectiles: this.serializeProjectiles(this.game.projectiles),
            explosions: this.serializeExplosions(this.game.explosions)
        };
    }
    
    // 序列化单位
    serializeUnits(units) {
        return units.map(unit => ({
            id: unit.id,
            type: unit.type,
            owner: unit.owner,
            x: unit.x,
            y: unit.y,
            hp: unit.hp,
            angle: unit.angle,
            targetAngle: unit.targetAngle,
            path: unit.path,
            currentPathIndex: unit.currentPathIndex,
            moveTargetPos: unit.moveTargetPos,
            attackCooldown: unit.attackCooldown,
            isLoitering: unit.isLoitering,
            loiterCenter: unit.loiterCenter,
            loiterRadius: unit.loiterRadius,
            loiterAngle: unit.loiterAngle,
            isSettingUp: unit.isSettingUp,
            setupTimer: unit.setupTimer
        }));
    }
    
    // 序列化弹道
    serializeProjectiles(projectiles) {
        return projectiles.map(projectile => ({
            x: projectile.x,
            y: projectile.y,
            vx: projectile.vx,
            vy: projectile.vy,
            target: projectile.target ? this.getTargetReference(projectile.target) : null,
            stats: projectile.stats,
            life: projectile.life
        }));
    }
    
    // 序列化爆炸
    serializeExplosions(explosions) {
        return explosions.map(explosion => ({
            x: explosion.x,
            y: explosion.y,
            radius: explosion.radius,
            life: explosion.life,
            maxLife: explosion.maxLife
        }));
    }

    // 修改 序列化地形细节
    serializeTerrainDetails(terrainDetails) {
        const serializedDetails = {};
        for (const [key, value] of terrainDetails)
            serializedDetails[key] = value;
        return serializedDetails;
    }
    
    // 获取目标引用
    getTargetReference(target) {
        if (target instanceof Base) {
            return { type: 'base', owner: target.owner };
        } else if (target instanceof Unit) {
            return { type: 'unit', id: target.id, owner: target.owner };
        }
        return null;
    }
    
    // 恢复游戏
    restoreGame(saveData) {
        try {
            // 恢复游戏状态
            this.game.gameState = saveData.gameState;
            this.game.gameMode = saveData.gameMode;
            this.game.player.manpower = saveData.playerManpower;
            this.game.ai.manpower = saveData.aiManpower;
            
            // 恢复单位
            this.game.player.units = this.restoreUnits(saveData.playerUnits, 'player');
            this.game.ai.units = this.restoreUnits(saveData.aiUnits, 'ai');
            
            // 恢复基地状态
            if (this.game.playerBase && saveData.playerBase) {
                this.game.playerBase.hp = saveData.playerBase.hp;
            }
            
            if (this.game.aiBase && saveData.aiBase) {
                this.game.aiBase.hp = saveData.aiBase.hp;
            }
            
            // 恢复相机位置
            if (saveData.camera) {
                this.game.camera.x = saveData.camera.x;
                this.game.camera.y = saveData.camera.y;
                this.game.camera.zoom = saveData.camera.zoom;
            }
            // 修改 恢复地图
            this.game.map.grid = saveData.mapgrid || this.game.map.grid;
            this.restoreTerrainDetails(saveData.terrainDetails, this.game.map);
            // 恢复弹道和爆炸
            this.game.projectiles = this.restoreProjectiles(saveData.projectiles);
            this.game.explosions = this.restoreExplosions(saveData.explosions);
            
            console.log("游戏已从保存恢复");
            
        } catch (e) {
            console.error("恢复游戏失败", e);
            this.clearAutoSave();
        }
    }
    
    // 恢复单位
    restoreUnits(unitsData, owner) {
        if (!unitsData) return [];
        
        return unitsData.map(unitData => {
            const unit = new Unit(unitData.type, owner, unitData.x, unitData.y);
            unit.id = unitData.id;
            unit.hp = unitData.hp;
            unit.angle = unitData.angle;
            unit.targetAngle = unitData.targetAngle;
            unit.path = unitData.path;
            unit.currentPathIndex = unitData.currentPathIndex;
            unit.moveTargetPos = unitData.moveTargetPos;
            unit.attackCooldown = unitData.attackCooldown;
            unit.isLoitering = unitData.isLoitering;
            unit.loiterCenter = unitData.loiterCenter;
            unit.loiterRadius = unitData.loiterRadius;
            unit.loiterAngle = unitData.loiterAngle;
            unit.isSettingUp = unitData.isSettingUp;
            unit.setupTimer = unitData.setupTimer;
            return unit;
        });
    }
    
    // 恢复弹道
    restoreProjectiles(projectilesData) {
        if (!projectilesData) return [];
        
        return projectilesData.map(projData => {
            const projectile = new Projectile(
                projData.owner, 
                { x: projData.x, y: projData.y }, 
                this.restoreTargetReference(projData.target), 
                projData.stats
            );
            projectile.vx = projData.vx;
            projectile.vy = projData.vy;
            projectile.life = projData.life;
            return projectile;
        });
    }
    
    // 恢复爆炸
    restoreExplosions(explosionsData) {
        if (!explosionsData) return [];
        
        return explosionsData.map(expData => {
            const explosion = new Explosion(expData.x, expData.y, expData.radius);
            explosion.life = expData.life;
            explosion.maxLife = expData.maxLife;
            return explosion;
        });
    }
    
    // 恢复目标引用
    restoreTargetReference(targetRef) {
        if (!targetRef) return null;
        
        if (targetRef.type === 'base') {
            return targetRef.owner === 'player' ? this.game.playerBase : this.game.aiBase;
        } else if (targetRef.type === 'unit') {
            const allUnits = [...this.game.player.units, ...this.game.ai.units];
            return allUnits.find(unit => unit.id === targetRef.id);
        }
        
        return null;
    }
    
    // 修改 恢复地形细节
    restoreTerrainDetails(serializedDetails, map) {
        map.terrainDetails.clear();
        for (const [key, value] of Object.entries(serializedDetails)) {
            map.terrainDetails.set(key, value);
        }
    }

    // 获取自动保存数据
    getAutoSaveData() {
        const autoSaveKey = `ShenDun_autosave_${this.currentUser}`;
        const autoSaveData = localStorage.getItem(autoSaveKey);
        
        if (autoSaveData) {
            try {
                return JSON.parse(autoSaveData);
            } catch (e) {
                console.error("解析自动保存数据失败", e);
                return null;
            }
        }
        
        return null;
    }
    
    // 清除自动保存
    clearAutoSave() {
        if (!this.currentUser) return;
        
        const autoSaveKey = `ShenDun_autosave_${this.currentUser}`;
        localStorage.removeItem(autoSaveKey);
    }
        
    // 加载特定保存
    loadSave(saveKey) {
        try {
            const saveData = JSON.parse(localStorage.getItem(saveKey));
            if (saveData) {
                this.restoreGame(saveData);
                return true;
            }
        } catch (e) {
            console.error("加载保存失败", e);
        }
        
        return false;
    }
}