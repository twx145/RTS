// js/player.js
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
     * 核心修复：增加 spatialGrid 参数，并将其传递给 AI 控制器
     * @param {number} deltaTime 
     * @param {Player} enemyPlayer 
     * @param {GameMap} map 
     * @param {SpatialGrid} spatialGrid // <-- 新增参数
     */
    update(deltaTime, enemyPlayer, map, spatialGrid) { // <-- 新增参数
        if (this.isAI) {
            // 将 spatialGrid 正确地传递给 AI 控制器
            this.aiController.update(this.units, enemyPlayer.units, map, deltaTime, spatialGrid); // <-- 新增参数
        }
    }
    
    canAfford(unitCost) {
        return this.manpower >= unitCost;
    }
    
    deductManpower(amount) {
        this.manpower -= amount;
    }
}