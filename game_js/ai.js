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
        this.patrolPoints = []; 
        
        this.patrollingUnitTags = new Set();
        this.maxPatrollingUnits = 10;
    }

    calculatePatrolPoints(map) {
        
        const patrolX = map.width - 50; 
        
        const patrolYTop = 100;
        const patrolYBottom = map.height - 50;

        this.patrolPoints = [
            { x: patrolX, y: patrolYTop },
            { x: patrolX, y: patrolYBottom }
        ];

        console.log("Patrol points calculated:", this.patrolPoints); // 可以在控制台输出，方便调试
    }

    assignFixedPatrolTasks(aiUnits) {
        if (this.patrolPoints.length === 0) {
            return;
        }

        if (this.patrollingUnitTags.size >= this.maxPatrollingUnits) {
            return;
        }

        for (const unit of aiUnits) {
            if (!this.patrollingUnitTags.has(unit.tag)) {
                unit.startPatrol(this.patrolPoints);
                this.patrollingUnitTags.add(unit.tag);
                
                if (this.patrollingUnitTags.size >= this.maxPatrollingUnits) {
                    break;
                }
            }
        }
    }

    deployUnits(mapWidth, mapHeight, TILE_SIZE, map) {
        const deployableUnits = Object.keys(UNIT_TYPES);
        let manpowerToSpend = this.player.manpower;

        if (this.difficulty === 'hard' || this.difficulty === 'hell') {
            manpowerToSpend *= 0.8;
        }

        const rallyPointX = mapWidth - 5 - Math.random() * (mapWidth / 4);
        const rallyPointY = (Math.random() - 0.5) * mapHeight * 0.25 + mapHeight * 0.5;

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

    update(aiUnits, playerUnits, map, deltaTime) { 
        if (this.patrolPoints.length === 0 && map) {
            this.calculatePatrolPoints(map);
        }
        this.assignFixedPatrolTasks(aiUnits);

        if (playerUnits.length === 0 && (!this.playerBase || this.playerBase.hp <= 0)) return;

        this.macroTimer += deltaTime;
        this.microTimer += deltaTime;

        if (this.macroTimer >= this.macroInterval) {
            switch (this.difficulty) {
                case 'medium':
                    this.runMediumLogic(aiUnits, map);
                    break;
                case 'hard':
                case 'hell':
                    this.runHardLogic(aiUnits, playerUnits, map);
                    break;
                default: // 包含 simple 难度
                    this.runSimpleAttackLogic(aiUnits, map);
                    break;
            }
            this.macroTimer = 0;
        }
        
        if (this.difficulty === 'hell' && this.microTimer >= this.microInterval) {
            this.runHellMicro(aiUnits, playerUnits, map);
            this.microTimer = 0;
        }
    }
    
    // simple难度的进攻逻辑
    runSimpleAttackLogic(aiUnits, map) {
        if (!this.playerBase || this.playerBase.hp <= 0) return;

        const availableUnits = aiUnits.filter(u => !u.target && u.path.length === 0);
        if (availableUnits.length > 0) {
            const target = this.playerBase;
            const targetPosition = { x: target.pixelX, y: target.pixelY };
            
            availableUnits.forEach(unit => {
                unit.setTarget(target);
                unit.issueMoveCommand(targetPosition, map, true, false);
            });
        }
    }

    runMediumLogic(aiUnits, map) {
        if (!this.playerBase || this.playerBase.hp <= 0) return;
        const livingAttackWave = this.attackWave.filter(u => u.hp > 0);
        if (livingAttackWave.length < 3) {
            this.attackWave = aiUnits.filter(u => !u.target && u.path.length === 0).slice(0, 5); 
        }
        
        const target = this.playerBase;
        const targetPoint = { x: target.pixelX, y: target.pixelY };
        
        let delay = 0;
        const delayIncrement = 10;
        this.attackWave.forEach(unit => {
            if (unit.hp > 0 && !unit.target && unit.path.length === 0) {
                 setTimeout(() => {
                    if (unit && unit.hp > 0) {
                        unit.setTarget(target);
                        unit.issueMoveCommand(targetPoint, map, true, false);
                    }
                 }, delay);
                 delay += delayIncrement;
            }
        });
    }

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
        
        if (!priorityTarget) return;

        const livingAttackWave = this.attackWave.filter(u => u.hp > 0);
        if (livingAttackWave.length < 4) {
             this.attackWave = aiUnits.filter(u => !u.target && u.path.length === 0).slice(0, 6);
        }
        
        let delay = 0;
        const delayIncrement = 10;
        this.attackWave.forEach(unit => {
            if (unit.hp > 0) {
                setTimeout(() => {
                    if (unit && unit.hp > 0 && priorityTarget && priorityTarget.hp > 0) {
                        unit.setTarget(priorityTarget);
                        const targetPosition = { 
                            x: priorityTarget.pixelX || priorityTarget.x, 
                            y: priorityTarget.pixelY || priorityTarget.y 
                        };
                        unit.issueMoveCommand(targetPosition, map, true, false);
                    }
                }, delay);
                delay += delayIncrement;
            }
        });
    }

    runHellMicro(aiUnits, playerUnits, map) {
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
                // 让超出射程的单位移动过去
                if (dist > aiUnit.stats.range) {
                    setTimeout(() => {
                        if (aiUnit && aiUnit.hp > 0 && weakestPlayerUnit && weakestPlayerUnit.hp > 0) {
                            aiUnit.setTarget(weakestPlayerUnit);
                            aiUnit.issueMoveCommand({ x: weakestPlayerUnit.x, y: weakestPlayerUnit.y }, map, true, false);
                        }
                    }, delay);
                    delay += delayIncrement;
                }
            });
        }
    }
}