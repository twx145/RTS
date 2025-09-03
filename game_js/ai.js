class AIController {
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

    deployUnits(mapWidth, mapHeight, TILE_SIZE, map) {
        const deployableUnits = Object.keys(UNIT_TYPES);
        let manpowerToSpend = this.player.manpower;

        if (this.difficulty === 'hard' || this.difficulty === 'hell') {
            manpowerToSpend *= 0.7;
        }

        const rallyPointX = mapWidth - 5 - Math.random() * (mapWidth / 4);
        const rallyPointY = Math.random() * mapHeight;

        let spentManpower = 0;
        let attempts = 0;
        const maxAttempts = 20;

        while (spentManpower < manpowerToSpend && attempts < maxAttempts) {
            const unitType = deployableUnits[Math.floor(Math.random() * deployableUnits.length)];
            const cost = UNIT_TYPES[unitType].cost;

            if (this.player.canAfford(cost)) {
                const x = rallyPointX + (Math.random() - 0.5) * 8;
                const y = rallyPointY + (Math.random() - 0.5) * 8;
                
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
                }
                else {
                    attempts++;
                }
            } else {
                 attempts++;
            }
        }
    }

    update(aiUnits, playerUnits, map, deltaTime) { // 移除 spatialGrid
        if (playerUnits.length === 0 && (!this.playerBase || this.playerBase.hp <= 0)) return;

        this.macroTimer += deltaTime;
        this.microTimer += deltaTime;

        this.runSimpleLogic(aiUnits, playerUnits); // 传入 playerUnits

        if (this.macroTimer >= this.macroInterval) {
            switch (this.difficulty) {
                case 'medium':
                    this.runMediumLogic(aiUnits, map);
                    break;
                case 'hard':
                case 'hell':
                    this.runHardLogic(aiUnits, playerUnits, map); // 传入 playerUnits
                    break;
            }
            this.macroTimer = 0;
        }
        
        if (this.difficulty === 'hell' && this.microTimer >= this.microInterval) {
            this.runHellMicro(aiUnits, playerUnits); // 传入 playerUnits
            this.microTimer = 0;
        }
    }

    runSimpleLogic(aiUnits, playerUnits) { // 移除 spatialGrid
        aiUnits.forEach(unit => {
            if (!unit.target && unit.path.length === 0 && unit.findTargetCooldown <= 0) {
                // 单位自主索敌现在使用 Matter.Query，无需传递参数
                unit.findTarget(this.playerBase, playerUnits, window.game);
            }
        });
    }

    runMediumLogic(aiUnits, map) {
        if (!this.playerBase || this.playerBase.hp <= 0) return;
        const livingAttackWave = this.attackWave.filter(u => u.hp > 0);
        if (livingAttackWave.length < 3) {
            this.attackWave = aiUnits.filter(u => !u.target && u.path.length === 0).slice(0, 5); 
        }
        
        const targetPoint = { x: this.playerBase.pixelX, y: this.playerBase.pixelY };
        
        let delay = 0;
        const delayIncrement = 10;
        this.attackWave.forEach(unit => {
            if (unit.hp > 0 && !unit.target && unit.path.length === 0) {
                 setTimeout(() => {
                    if (unit && unit.hp > 0) unit.issueMoveCommand(targetPoint, map);
                 }, delay);
                 delay += delayIncrement;
            }
        });
    }

    // --- 核心重构: 使用 Matter.Query ---
    runHardLogic(aiUnits, playerUnits, map) {
        if (aiUnits.length === 0) return;
        
        const centerOfMass = aiUnits.reduce((acc, unit) => ({x: acc.x + unit.x, y: acc.y + unit.y}), {x: 0, y: 0});
        centerOfMass.x /= aiUnits.length;
        centerOfMass.y /= aiUnits.length;
        
        const searchRadius = TILE_SIZE * 40;
        const searchBounds = {
            min: { x: centerOfMass.x - searchRadius, y: centerOfMass.y - searchRadius },
            max: { x: centerOfMass.x + searchRadius, y: centerOfMass.y + searchRadius }
        };
        const playerBodies = playerUnits.map(u => u.body).filter(Boolean);
        const bodiesInRegion = Matter.Query.region(playerBodies, searchBounds);
        const nearbyEnemies = bodiesInRegion.map(body => body.gameObject).filter(u => u.hp > 0);

        let priorityTarget = null;

        if (nearbyEnemies.length === 0) {
            if (this.playerBase && this.playerBase.hp > 0) {
                priorityTarget = this.playerBase;
            } else {
                return;
            }
        } else {
            const targetPriorities = ['howitzer', 'sniper', 'sam_launcher', 'destroyer'];
            for (const type of targetPriorities) {
                priorityTarget = nearbyEnemies.find(pUnit => pUnit.type === type);
                if (priorityTarget) break;
            }
            if (!priorityTarget) {
                priorityTarget = nearbyEnemies[0];
            }
        }

        const livingAttackWave = this.attackWave.filter(u => u.hp > 0);
        if (livingAttackWave.length < 4) {
             this.attackWave = aiUnits.filter(u => !u.target && u.path.length === 0).slice(0, 6);
        }
        
        let delay = 0;
        const delayIncrement = 10;
        this.attackWave.forEach(unit => {
            if (unit.hp > 0) {
                setTimeout(() => {
                    if (unit && unit.hp > 0) unit.target = priorityTarget;
                }, delay);
                delay += delayIncrement;
            }
        });
    }

    // --- 核心重构: 使用 Matter.Query ---
    runHellMicro(aiUnits, playerUnits) {
        if (aiUnits.length === 0) return;

        const centerOfMass = aiUnits.reduce((acc, unit) => ({x: acc.x + unit.x, y: acc.y + unit.y}), {x: 0, y: 0});
        centerOfMass.x /= aiUnits.length;
        centerOfMass.y /= aiUnits.length;

        const searchRadius = TILE_SIZE * 30;
        const searchBounds = {
            min: { x: centerOfMass.x - searchRadius, y: centerOfMass.y - searchRadius },
            max: { x: centerOfMass.x + searchRadius, y: centerOfMass.y + searchRadius }
        };
        const playerBodies = playerUnits.map(u => u.body).filter(Boolean);
        const bodiesInRegion = Matter.Query.region(playerBodies, searchBounds);
        const nearbyEnemies = bodiesInRegion.map(body => body.gameObject).filter(u => u.hp > 0);

        if (nearbyEnemies.length === 0) return;

        const weakestPlayerUnit = nearbyEnemies.reduce((weakest, unit) => {
            return (unit.hp < weakest.hp) ? unit : weakest;
        }, nearbyEnemies[0]);

        if (weakestPlayerUnit) {
            let delay = 0;
            const delayIncrement = 5;
            aiUnits.forEach(aiUnit => {
                const dist = getDistance(aiUnit, weakestPlayerUnit);
                if (dist <= aiUnit.stats.range) {
                    setTimeout(() => {
                        if (aiUnit && aiUnit.hp > 0) aiUnit.target = weakestPlayerUnit;
                    }, delay);
                    delay += delayIncrement;
                }
            });
        }
    }
}