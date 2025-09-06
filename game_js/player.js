class Player {
    constructor(id, name, initialManpower, isAI = false, aiLogic = {}, aiDifficulty = 'normal') {
        this.id = id;
        this.name = name;
        this.manpower = initialManpower;
        this.units = [];
        this.isAI = isAI;
        if (isAI) {
            this.aiController = new AIController(this, aiLogic, aiDifficulty);
        }
    }

    /**
     * 核心修复：移除 spatialGrid 参数
     */
    update(deltaTime, enemyPlayer, map) {
        if (this.isAI) {
            // 不再需要传递 spatialGrid
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