// js/ai.js
import { UNIT_TYPES } from './config.js';
import { Unit } from './unit.js';
import { getDistance } from './utils.js';
import { Base } from './base.js';

export class AIController {
    constructor(player, difficulty) {
        this.player = player;
        this.difficulty = difficulty;
        
        this.macroTimer = 0; 
        this.macroInterval = 2.0; 
        this.microTimer = 0;
        this.microInterval = 0.5;

        this.attackWave = [];
        this.playerBase = null;
    }

    deployUnits(mapWidth, mapHeight, TILE_SIZE) {
        // ... 此函数无变化 ...
        const deployableUnits = Object.keys(UNIT_TYPES);
        let manpowerToSpend = this.player.manpower;

        if (this.difficulty === 'hard' || this.difficulty === 'hell') {
            manpowerToSpend *= 0.7;
        }

        let spentManpower = 0;
        let attempts = 0;
        const maxAttempts = deployableUnits.length * 3;

        while (spentManpower < manpowerToSpend && attempts < maxAttempts) {
            const unitType = deployableUnits[Math.floor(Math.random() * deployableUnits.length)];
            const cost = UNIT_TYPES[unitType].cost;

            if (this.player.canAfford(cost)) {
                const x = mapWidth * TILE_SIZE - (Math.random() * mapWidth / 3 * TILE_SIZE);
                const y = Math.random() * mapHeight * TILE_SIZE;
                const newUnit = new Unit(unitType, 'ai', x, y);
                this.player.units.push(newUnit);
                
                this.player.deductManpower(cost);
                spentManpower += cost;
                attempts = 0;
            } else {
                attempts++;
            }
        }
    }

    /**
     * 核心修复：接收并使用 spatialGrid
     * @param {SpatialGrid} spatialGrid // <-- 新增参数
     */
    update(aiUnits, playerUnits, map, deltaTime, spatialGrid) { // <-- 新增参数
        if (playerUnits.length === 0 && (!this.playerBase || this.playerBase.hp <= 0)) return;

        this.macroTimer += deltaTime;
        this.microTimer += deltaTime;

        // 单位级的微操（所有难度都需要）
        // 将 spatialGrid 传递下去，用于高效索敌
        this.runSimpleLogic(aiUnits, spatialGrid); // <-- 修改参数

        // 宏观决策（按难度和频率执行）
        if (this.macroTimer >= this.macroInterval) {
            switch (this.difficulty) {
                case 'medium':
                    this.runMediumLogic(aiUnits, playerUnits, map);
                    break;
                case 'hard':
                case 'hell':
                    this.runHardLogic(aiUnits, playerUnits, map);
                    break;
            }
            this.macroTimer = 0;
        }
        
        if (this.difficulty === 'hell' && this.microTimer >= this.microInterval) {
            this.runHellMicro(aiUnits, playerUnits);
            this.microTimer = 0;
        }
    }

    /**
     * 核心修复：使用 spatialGrid 调用新的 findTarget 方法
     * @param {Array<Unit>} aiUnits
     * @param {SpatialGrid} spatialGrid
     */
    runSimpleLogic(aiUnits, spatialGrid) {
        aiUnits.forEach(unit => {
            // 如果单位空闲，就让它自己寻找最近的敌人
            // 注意：这里不再需要 playerUnits 列表，因为索敌将通过空间网格完成
            if (!unit.target && unit.path.length === 0 && unit.findTargetCooldown <= 0) {
                 // 使用新的索敌函数签名
                unit.findTarget(this.playerBase, spatialGrid);
            }
        });
    }

    /**
     * 中等难度：组织波次进攻玩家基地
     */
    runMediumLogic(aiUnits, playerUnits, map) {
        // ... 此函数无变化 ...
        if (!this.playerBase || this.playerBase.hp <= 0) return;

        const livingAttackWave = this.attackWave.filter(u => u.hp > 0);

        if (livingAttackWave.length < 3) {
            this.attackWave = aiUnits.filter(u => !u.target && u.path.length === 0).slice(0, 5); 
        }
        
        const targetPoint = { x: this.playerBase.pixelX, y: this.playerBase.pixelY };
        this.attackWave.forEach(unit => {
            if (unit.hp > 0 && !unit.target && unit.path.length === 0) {
                 unit.issueMoveCommand(targetPoint, map); 
            }
        });
    }

    /**
     * 困难难度：优先攻击高价值目标，其次攻击基地
     */
    runHardLogic(aiUnits, playerUnits, map) {
        // ... 此函数无变化 ...
        let priorityTarget = null;
        
        const targetPriorities = ['howitzer', 'sniper', 'sam_launcher', 'destroyer'];
        for (const type of targetPriorities) {
            priorityTarget = playerUnits.find(pUnit => pUnit.type === type && pUnit.hp > 0);
            if (priorityTarget) break;
        }

        if (!priorityTarget && this.playerBase && this.playerBase.hp > 0) {
            priorityTarget = this.playerBase;
        }

        if (priorityTarget) {
            const livingAttackWave = this.attackWave.filter(u => u.hp > 0);
            if (livingAttackWave.length < 4) {
                 this.attackWave = aiUnits.filter(u => !u.target && u.path.length === 0).slice(0, 6);
            }

            this.attackWave.forEach(unit => {
                if (unit.hp > 0) {
                    unit.target = priorityTarget;
                }
            });
        }
    }

    /**
     * 地狱难度：完美的集火微操
     */
    runHellMicro(aiUnits, playerUnits) {
        // ... 此函数无变化 ...
        if (playerUnits.length === 0) return;

        const weakestPlayerUnit = playerUnits.reduce((weakest, unit) => {
            return (unit.hp < weakest.hp) ? unit : weakest;
        }, playerUnits[0]);

        if (weakestPlayerUnit) {
            aiUnits.forEach(aiUnit => {
                const dist = getDistance(aiUnit, weakestPlayerUnit);
                if (dist <= aiUnit.stats.range) {
                    aiUnit.target = weakestPlayerUnit;
                }
            });
        }
    }
}