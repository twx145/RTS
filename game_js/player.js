class Player {
    // 修改 添加单位损失监听
    set units(value) {
        this._units = value;
        // 检查是否有单位损失
        if (this._units.length < this._previousUnitCount) {
            const unitsLost = this._previousUnitCount - this._units.length;
            // 通知游戏实例单位损失
            if (window.game && window.game.onUnitLost) {
                for (let i = 0; i < unitsLost; i++) {
                    window.game.onUnitLost();
                }
            }
        }
        this._previousUnitCount = this._units.length;
    }

    get units() {return this._units;}

    constructor(id, name, manpower, isAI = false, baseArea, aiDifficulty = 'medium') {
        this.id = id;
        this.name = name;
        this.manpower = manpower;
        this.isAI = isAI;
        this.units = [];
        this.baseArea = baseArea; 
        this.baseCaptureTimer = 0;
        // 修改 单位损失计数
        this._previousUnitCount = this.units.length;
        this._units = this.units;

        if (isAI) {
            this.aiController = new AIController(this, aiDifficulty);
        }
    }

    update(deltaTime, enemyPlayer, map) {
        if (this.isAI) {
            this.aiController.update(this.units, enemyPlayer.units, map, deltaTime);
        }
    }
    
    canAfford(unitCost) {
        return this.manpower >= unitCost;
    }
    
    deductManpower(amount) {
        this.manpower -= amount;
    }

    addManpower(amount) {
        this.manpower += amount;
    }
}