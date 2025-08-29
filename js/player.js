import { AIController } from './ai.js';

export class Player {
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
     * 核心修复：确保AI的update函数被正确调用并传递所需参数
     * @param {number} deltaTime 
     * @param {Player} enemyPlayer 
     * @param {GameMap} map 
     */
    update(deltaTime, enemyPlayer, map) {
        if (this.isAI) {
            // 将 deltaTime, enemyPlayer, map 参数正确地传递给 AI 控制器
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