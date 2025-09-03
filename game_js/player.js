class Player {
    constructor(id, name, manpower, isAI = false, baseArea, aiDifficulty = 'medium') {
        this.id = id;
        this.name = name;
        this.manpower = manpower;
        this.isAI = isAI;
        this.units = [];
        this.baseArea = baseArea; 
        this.baseCaptureTimer = 0;

        if (isAI) {
            this.aiController = new AIController(this, aiDifficulty);
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
}