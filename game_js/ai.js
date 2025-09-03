class AIController {
    constructor(player, difficulty) {
        this.player = player;
        this.difficulty = difficulty;
        
        this.macroTimer = 0; 
        this.macroInterval = 2.0; // 宏观决策间隔
        this.microTimer = 0;
        this.microInterval = 0.5; // 微操决策间隔 (地狱难度)

        this.attackWave = [];
        this.playerBase = null;
    }

    /**
     * --- 体验优化: 让AI部署更有策略性 ---
     * AI会设定一个集结点，并围绕该点部署单位，形成集群而非散兵。
     * @param {number} mapWidth 
     * @param {number} mapHeight 
     * @param {number} TILE_SIZE 
     * @param {GameMap} map 
     */
    deployUnits(mapWidth, mapHeight, TILE_SIZE, map) {
        const deployableUnits = Object.keys(UNIT_TYPES);
        let manpowerToSpend = this.player.manpower;

        if (this.difficulty === 'hard' || this.difficulty === 'hell') {
            manpowerToSpend *= 0.7; // 困难及以上难度会保留部分资源
        }

        // 设定一个集结点
        const rallyPointX = mapWidth - 5 - Math.random() * (mapWidth / 4);
        const rallyPointY = Math.random() * mapHeight;

        let spentManpower = 0;
        let attempts = 0;
        const maxAttempts = 30; // 增加尝试次数

        while (spentManpower < manpowerToSpend && attempts < maxAttempts) {
            const unitType = deployableUnits[Math.floor(Math.random() * deployableUnits.length)];
            const cost = UNIT_TYPES[unitType].cost;

            if (this.player.canAfford(cost)) {
                // 在集结点附近随机放置
                const x = rallyPointX + (Math.random() - 0.5) * 8;
                const y = rallyPointY + (Math.random() - 0.5) * 8;
                
                // 确保不出界且地形可部署
                if (x < 0 || y < 0 || x >= mapWidth || y >= mapHeight) {
                    attempts++;
                    continue;
                }

                const tile = map.getTile(Math.floor(x), Math.floor(y));
                if(tile && TERRAIN_TYPES[tile.type].traversableBy.includes(UNIT_TYPES[unitType].moveType)){
                    const newUnit = new Unit(unitType, 'ai', x * TILE_SIZE, y * TILE_SIZE);
                    this.player.units.push(newUnit);
                    this.player.deductManpower(cost);
                    spentManpower += cost;
                } else {
                    attempts++;
                }
            } else {
                 attempts++; // 资源不足以购买此单位，换一个试试
            }
        }
    }

    // --- AI主更新函数，将spatialGrid传递给下级逻辑 ---
    update(aiUnits, playerUnits, map, deltaTime, spatialGrid) {
        if (playerUnits.length === 0 && (!this.playerBase || this.playerBase.hp <= 0)) return;

        this.macroTimer += deltaTime;
        this.microTimer += deltaTime;

        // 单位级的微操（所有难度都需要），使用空间网格高效索敌
        this.runSimpleLogic(aiUnits, spatialGrid);

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
        
        // 地狱难度的微操
        if (this.difficulty === 'hell' && this.microTimer >= this.microInterval) {
            this.runHellMicro(aiUnits, playerUnits);
            this.microTimer = 0;
        }
    }

    /**
     * AI单位的自主索敌逻辑 (所有难度)
     * @param {Array<Unit>} aiUnits
     * @param {SpatialGrid} spatialGrid
     */
    runSimpleLogic(aiUnits, spatialGrid) {
        aiUnits.forEach(unit => {
            // 如果单位空闲，就让它使用空间网格寻找最近的敌人
            if (!unit.target && unit.path.length === 0 && unit.findTargetCooldown <= 0) {
                unit.findTarget(this.playerBase, spatialGrid);
            }
        });
    }

    /**
     * 中等难度：组织波次进攻玩家基地
     */
    runMediumLogic(aiUnits, playerUnits, map) {
        if (!this.playerBase || this.playerBase.hp <= 0) return;

        const livingAttackWave = this.attackWave.filter(u => u.hp > 0);

        if (livingAttackWave.length < 3) {
            // 重新集结5个空闲单位作为新的攻击波次
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
        let priorityTarget = null;
        
        // 定义高价值目标的类型
        const targetPriorities = ['howitzer', 'sniper', 'sam_launcher', 'destroyer', 'main_battle_tank'];
        for (const type of targetPriorities) {
            priorityTarget = playerUnits.find(pUnit => pUnit.type === type && pUnit.hp > 0);
            if (priorityTarget) break;
        }

        // 如果没有高价值目标，则攻击基地
        if (!priorityTarget && this.playerBase && this.playerBase.hp > 0) {
            priorityTarget = this.playerBase;
        }

        if (priorityTarget) {
            const livingAttackWave = this.attackWave.filter(u => u.hp > 0);
            if (livingAttackWave.length < 4) {
                 this.attackWave = aiUnits.filter(u => !u.target && u.path.length === 0).slice(0, 6);
            }

            // 命令攻击波次中的所有单位攻击该优先目标
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
        if (playerUnits.length === 0) return;

        // 找出玩家血量最低的单位
        const weakestPlayerUnit = playerUnits.reduce((weakest, unit) => {
            return (unit.hp < weakest.hp) ? unit : weakest;
        }, playerUnits[0]);

        if (weakestPlayerUnit) {
            // 命令所有在射程内的AI单位集火该最弱单位
            aiUnits.forEach(aiUnit => {
                const dist = getDistance(aiUnit, weakestPlayerUnit);
                if (dist <= aiUnit.stats.range) {
                    aiUnit.target = weakestPlayerUnit;
                }
            });
        }
    }
}