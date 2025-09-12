let nextUnitId = 0;

class Unit {
    constructor(type, owner, x, y) {
        this.id = nextUnitId++;
        this.type = type;
        this.owner = owner;
        this.stats = { ...UNIT_TYPES[type] };
        this.image = window.assetManager[this.stats.imageSrc];

        this.x = x;
        this.y = y;
        this.hp = this.stats.hp;
        
        this.target = null;
        this.attackCooldown = 0;
        this.findTargetCooldown = Math.random() * 0.5;
        this.isforcemoving = false;

        // --- 新增: 碾压伤害冷却 ---
        this.crushDamageCooldown = 0;

        this.path = [];
        this.currentPathIndex = 0;
        this.moveTargetPos = null;
        this.angle = Math.random() * Math.PI * 2;
        this.targetAngle = this.angle;
        this.rotationSpeed = Math.PI * 2.0;
        
        this.controlGroup = null;

        this.isLoitering = false;
        this.loiterCenter = null;
        this.loiterRadius = TILE_SIZE * 5;
        this.loiterAngle = 0;
        this.strafeDirection = Math.random() < 0.5 ? 1 : -1;
        
        this.isSettingUp = false;
        this.setupTimer = 0;

        this.body = this.createBody(x, y);
        if (this.body) {
            this.body.gameObject = this;
            Matter.World.add(window.game.engine.world, this.body);
        }
        this.isPatrolling = false;      // 是否正在巡逻
        this.patrolPoints = [];         // 巡逻点路径
        this.currentPatrolPointIndex = 0; // 当前目标巡逻点的索引
        this.tag = 'unit_' + Math.random().toString(36).slice(2);

        this.isEscortUnit = false;      // 是否是护送单位
        this.destination = null;        // 护送单位的目的地
        this.isTargetUnit = false;      // 是否是目标单位（刺杀模式）
        this.isSpecialBuilding = false; // 是否是特殊建筑（目标模式）
        this.buildingType = null;       // 建筑类型

        this.isBuilding = false;
    }

    createBody(x, y) {
        const radius = this.stats.drawScale * TILE_SIZE * 0.4;
        let category, mask;

        if (this.stats.moveType === 'air') {
            category = COLLISION_CATEGORIES.air_unit;
            mask = COLLISION_CATEGORIES.air_unit;
        } else {
            category = COLLISION_CATEGORIES.ground_unit;
            mask = COLLISION_CATEGORIES.terrain | COLLISION_CATEGORIES.ground_unit;
        }

        const body = Matter.Bodies.circle(x, y, radius, {
            frictionAir: 0.2,
            friction: 0.01,
            restitution: 0.1,
            slop: 0.05,
            mass: this.stats.hp / 10,
            label: `${this.owner}_${this.type}`,
            collisionFilter: {
                category: category,
                mask: mask
            }
        });

        Matter.Body.setAngle(body, this.angle);
        return body;
    }

    setTarget(newTarget) {
        if (!newTarget) {
            this.target = null;
            return;
        }

        let targetMoveType = 'ground'; // 默认为地面（例如基地或建筑物）
        if (newTarget instanceof Unit) {
            targetMoveType = newTarget.stats.moveType;
        } else if (newTarget instanceof Base || newTarget.isBuilding) {
            targetMoveType = 'ground';
        }
        
        if (this.stats.canTarget.includes(targetMoveType)) {
            this.target = newTarget;
        } else {
            this.target = null; // 确保不会设置非法目标
        }
    }

    // 新增：设置护送单位
    setAsEscortUnit(destination) {
        this.isEscortUnit = true;
        this.destination = destination;
        this.stats.speed = 0.5; // 护送单位移动较慢
    }

    // 新增：设置目标单位
    setAsTargetUnit() {
        this.isTargetUnit = true;
        this.stats.hp *= 10; // 目标单位有更多生命值
        this.hp = this.stats.hp;
    }

    // 新增：设置特殊建筑
    setAsSpecialBuilding(buildingType) {
        this.isSpecialBuilding = true;
        this.buildingType = buildingType;
        this.stats.hp *= 2; // 特殊建筑有更多生命值
        this.hp = this.stats.hp;
    }

    update(deltaTime, enemyUnits, map, enemyBase, game) {
        // --- 1. 通用状态更新 (始终执行) ---
        if (this.attackCooldown > 0) this.attackCooldown -= deltaTime;
        if (this.findTargetCooldown > 0) this.findTargetCooldown -= deltaTime;
        if (this.crushDamageCooldown > 0) this.crushDamageCooldown -= deltaTime;
        this.updateRotation(deltaTime);

        if (this.isSettingUp) {
            this.setupTimer -= deltaTime;
            if (this.setupTimer <= 0) this.isSettingUp = false;
            return;
        }

        // 如果当前目标死亡或无效，则清空目标
        if (this.target && this.target.hp <= 0) {
            this.setTarget(null);
            // 注意: 只有在目标死亡时，才解除对该目标的强制攻击状态
            if (this.isforcemoving) {
                 this.isforcemoving = false;
            }
        }

        // --- 2. 核心逻辑分支：强制移动 vs. 常规模式 ---

        // 分支 A: 如果处于“强制移动”状态 (无论是否有目标)
        if (this.isforcemoving) {
            // 在强制移动模式下，单位只会攻击其明确指定的 `target`
            // 如果 `target` 为 null（即强制移动到地点），则不会进行任何攻击
            if (this.target) {
                const targetPos = { x: this.target.pixelX || this.target.x, y: this.target.pixelY || this.target.y };
                const distanceToTarget = getDistance(this, targetPos);

                if (distanceToTarget <= this.stats.range) {
                    // 到达射程：停止移动并发起攻击
                    this.path = [];
                    this.moveTargetPos = null;
                    if (this.body) Matter.Body.setVelocity(this.body, { x: 0, y: 0 });
                    this.setTargetAngle(targetPos);
                    
                    if (this.attackCooldown <= 0 && !this.isSettingUp) {
                        this.attack(game);
                    }
                }
            }
            // 如果是强制移动到地点(this.target为null)，则此处的攻击逻辑完全跳过，单位只会移动。
        } 
        // 分支 B: 常规/智能模式 (非强制移动)
        else {
            // a. 自动索敌
            if (this.findTargetCooldown <= 0) {
                this.findTarget(enemyBase, enemyUnits, game);
                this.findTargetCooldown = 0.5 + Math.random() * 0.2; // 重置冷却
            }

            // b. 如果有目标，则决定是攻击还是追击
            if (this.target) {
                const targetPos = { x: this.target.pixelX || this.target.x, y: this.target.pixelY || this.target.y };
                const distanceToTarget = getDistance(this, targetPos);
                
                if (distanceToTarget <= this.stats.range) {
                    // 在射程内：停止移动并攻击
                    this.path = [];
                    this.moveTargetPos = null;
                    if (this.body) Matter.Body.setVelocity(this.body, { x: 0, y: 0 });
                    this.setTargetAngle(targetPos);

                    if (this.attackCooldown <= 0 && !this.isSettingUp) {
                        this.attack(game);
                    }
                } else {
                    // 超出射程：追击 (每隔一段时间重新寻路)
                    if (this.stats.ammoType && !this.path.length && !this.moveTargetPos) {
                        this.issueMoveCommand(targetPos, game.map, true, false);
                    }
                }
            } 
            // c. 如果没有目标且没有路径，则执行待命行为
            else if (this.path.length === 0) {
                if (this.isPatrolling) {
                    // (巡逻逻辑)
                } else if (this.stats.moveType === 'air' && (this.type === 'fighter_jet' || this.type === 'recon_drone')) {
                    this.handleLoitering(deltaTime);
                }
            }
        }

        // --- 3. 移动处理 (始终执行) ---
        // 无论在哪种模式下，只要有路径，就执行移动
        this.handleMovement(deltaTime, map);
    }

     // 新增：护送单位行为
    updateEscortBehavior(deltaTime, game) {
        // 如果已经到达目的地，不需要做任何事情
        if (this.destination && getDistance(this, this.destination) < TILE_SIZE * 2) {
            return;
        }
        
        // 如果没有路径或已经完成路径，计算新路径
        if (this.path.length === 0 && this.destination) {
            this.issueMoveCommand(this.destination, game.map, false, false);
        }
        
        // 处理移动
        this.handleMovement(deltaTime, game.map);
    }

    // 新增：目标单位行为
    updateTargetUnitBehavior(deltaTime, enemyUnits, game) {
        // 目标单位会尝试逃离敌人
        const closestEnemy = this.findClosestEnemy(enemyUnits);
        
        if (closestEnemy && getDistance(this, closestEnemy) < TILE_SIZE * 10) {
            // 逃离最近的敌人
            const fleeDirection = {
                x: this.x - closestEnemy.x,
                y: this.y - closestEnemy.y
            };
            
            const distance = Math.sqrt(fleeDirection.x * fleeDirection.x + fleeDirection.y * fleeDirection.y);
            if (distance > 0) {
                const normalizedDir = {
                    x: fleeDirection.x / distance,
                    y: fleeDirection.y / distance
                };
                
                const fleeTarget = {
                    x: this.x + normalizedDir.x * TILE_SIZE * 15,
                    y: this.y + normalizedDir.y * TILE_SIZE * 15
                };
                
                // 如果没有路径或已经完成路径，计算新路径
                if (this.path.length === 0) {
                    this.issueMoveCommand(fleeTarget, game.map, false, false);
                }
            }
        } else {
            // 没有威胁，停止移动
            if (this.body) {
                Matter.Body.setVelocity(this.body, { x: 0, y: 0 });
            }
            this.path = [];
            this.moveTargetPos = null;
        }
        
        // 处理移动
        this.handleMovement(deltaTime, game.map);
    }

    // 新增：找到最近的敌人
    findClosestEnemy(enemyUnits) {
        let closestEnemy = null;
        let minDistance = Infinity;
        
        for (const enemy of enemyUnits) {
            if (enemy.hp <= 0) continue;
            
            const distance = getDistance(this, enemy);
            if (distance < minDistance) {
                minDistance = distance;
                closestEnemy = enemy;
            }
        }
        
        return closestEnemy;
    }

    startPatrol(points) {
        if (points && points.length > 0) {
            this.isPatrolling = true;
            this.patrolPoints = points;
            this.currentPatrolPointIndex = 0;
        }
    }

    stopPatrol() {
        this.isPatrolling = false;
        this.patrolPoints = [];
    }
    
    handleMovement(deltaTime, map) {
        if (this.path.length > 0 && !this.moveTargetPos) {
            this.findSmoothedPathTarget(map);
        }
        
        if (this.moveTargetPos) {
            this.setTargetAngle(this.moveTargetPos);
            const distanceToNode = getDistance(this, this.moveTargetPos);
            
            if (distanceToNode < TILE_SIZE * 0.75) {
                if (this.currentPathIndex >= this.path.length - 1) {
                    this.path = [];
                    this.moveTargetPos = null;
                    if (this.body) Matter.Body.setVelocity(this.body, { x: 0, y: 0 });

                    if (this.stats.special === 'SETUP_TO_FIRE') {
                        this.isSettingUp = true;
                        this.setupTimer = 2.0;
                    }
                    this.isforcemoving = false;
                } else {
                    this.moveTargetPos = null; 
                }
            } else {
                this.move(deltaTime);
            }
        }
    }
    
    handleLoitering(deltaTime) {
        if (!this.isLoitering) {
            this.isLoitering = true;
            this.loiterCenter = { x: this.x, y: this.y };
            this.loiterAngle = Math.atan2(this.y - this.loiterCenter.y, this.x - this.loiterCenter.x);
        }
        
        this.loiterAngle += 0.8 * deltaTime;
        
        const targetX = this.loiterCenter.x + Math.cos(this.loiterAngle) * this.loiterRadius;
        const targetY = this.loiterCenter.y + Math.sin(this.loiterAngle) * this.loiterRadius;
        
        this.setTargetAngle({x: targetX, y: targetY});
        this.move(deltaTime);
    }

    move(deltaTime) {
        if (!this.body || !this.moveTargetPos) return;

        const direction = {
            x: this.moveTargetPos.x - this.x,
            y: this.moveTargetPos.y - this.y
        };
        const dist = getDistance(direction, {x:0, y:0});
        
        if (dist > 0) {
            const normalizedDir = { x: direction.x / dist, y: direction.y / dist };
            const velocity = {
                x: normalizedDir.x * this.stats.speed,
                y: normalizedDir.y * this.stats.speed
            };
            Matter.Body.setVelocity(this.body, velocity);
        }
    }

    issueMoveCommand(targetPos, map, isEngaging = false,isforcemoving = false) {

        this.isforcemoving = isforcemoving;
        if (!isEngaging) {
            this.setTarget(null); // 使用 setTarget 清空目标
        }
        this.isLoitering = false;
        this.isSettingUp = false;
        this.moveTargetPos = null;
        
        let finalTargetPos = { ...targetPos };
        if (isEngaging && this.target instanceof Unit && this.target.stats.speed > 0) {
            finalTargetPos = this.calculateInterceptPoint(this.target);
        }
        
        const startGrid = { x: Math.floor(this.x / TILE_SIZE), y: Math.floor(this.y / TILE_SIZE) };
        const endGrid = { x: Math.floor(finalTargetPos.x / TILE_SIZE), y: Math.floor(finalTargetPos.y / TILE_SIZE) };
        const path = findPath(map, startGrid, endGrid, this.stats.moveType);
        
        if (path && path.length > 0) {
            this.path = path;
            this.currentPathIndex = 0;
        } else {
            this.path = [];
        }
    }

    stop() {
        // 1. 清空寻路数据
        this.path = [];
        this.moveTargetPos = null;
        this.currentPathIndex = 0;

        // 2. 清空目标和强制移动状态
        this.setTarget(null); // 使用 setTarget 来确保逻辑统一
        this.isforcemoving = false;

        // 3. 立即停止物理移动 (非常重要，否则单位会继续滑行)
        if (this.body) {
            Matter.Body.setVelocity(this.body, { x: 0, y: 0 });
        }

        // // 4. (可选) 清空其他特殊状态，让单位更彻底地“停下”
        // this.isPatrolling = false;
        // this.isLoitering = false;
        // this.isSettingUp = false;
    }

    calculateInterceptPoint(target) {
        const distance = getDistance(this, target);
        if (this.stats.speed <= target.stats.speed || target.stats.speed < TILE_SIZE * 0.1) {
            return { x: target.x, y: target.y };
        }
        const timeToIntercept = distance / (this.stats.speed - target.stats.speed);
        const targetSpeed = target.stats.speed;
        const targetAngle = target.angle;
        const predictedX = target.x + Math.cos(targetAngle) * targetSpeed * timeToIntercept;
        const predictedY = target.y + Math.sin(targetAngle) * targetSpeed * timeToIntercept;
        return { x: predictedX, y: predictedY };
    }

    updateRotation(deltaTime) {
        let diff = this.targetAngle - this.angle;
        while (diff <= -Math.PI) diff += 2 * Math.PI;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        
        const turnStep = this.rotationSpeed * deltaTime;
        let newAngle;
        if (Math.abs(diff) < turnStep) {
            newAngle = this.targetAngle;
        } else {
            newAngle = this.angle + Math.sign(diff) * turnStep;
        }
        newAngle = (newAngle + 2 * Math.PI) % (2 * Math.PI);

        if (this.body) {
            Matter.Body.setAngle(this.body, newAngle);
        }
        this.angle = newAngle;
    }
    
    setTargetAngle(targetPos) {
        this.targetAngle = Math.atan2(targetPos.y - this.y, targetPos.x - this.x);
    }

    draw(ctx, isSelected, zoom = 1, showDetails = false) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + Math.PI / 2);
        const size = TILE_SIZE * this.stats.drawScale;

         // 新增：特殊单位外观
        if (this.isEscortUnit) {
            // 护送单位有特殊外观
            ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.isTargetUnit) {
            // 目标单位有特殊外观
            ctx.fillStyle = 'rgba(255, 165, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
            ctx.fill();
        }

        if (this.image) {
            ctx.drawImage(this.image, -size / 2, -size / 2, size, size);
        }
        ctx.restore();

        // --- 新增: 绘制编队指示器 ---
        // 这段逻辑必须放在 ctx.restore() 之后，以防止指示器跟着单位旋转
        if (this.controlGroup !== null) {
            const indicatorSize = 12 / zoom;
            const offsetX = (TILE_SIZE * this.stats.drawScale / 2) * 0.8;
            const offsetY = -(TILE_SIZE * this.stats.drawScale / 2) * 0.8;

            const indicatorX = this.x + offsetX;
            const indicatorY = this.y + offsetY;

            // 蓝色方块背景
            ctx.fillStyle = 'rgba(0, 100, 255, 0.9)';
            ctx.fillRect(indicatorX, indicatorY, indicatorSize, indicatorSize);

            // 编队数字
            ctx.fillStyle = 'white';
            ctx.font = `bold ${indicatorSize * 0.9}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.controlGroup, indicatorX + indicatorSize / 2, indicatorY + indicatorSize / 2 + 1 / zoom);
        }
        
        if (isSelected) {
            ctx.strokeStyle = this.owner === 'player' ? 'yellow' : 'orange';
            ctx.lineWidth = 2 / zoom;
            ctx.beginPath();
            ctx.arc(this.x, this.y, TILE_SIZE * this.stats.drawScale/2, 0, Math.PI * 2);
            ctx.stroke();
            if (showDetails) {
                if (this.stats.range > 0) { 
                    ctx.strokeStyle = 'rgba(255, 100, 100, 0.5)'; ctx.lineWidth = 1 / zoom; 
                    ctx.beginPath(); ctx.arc(this.x, this.y, this.stats.range, 0, Math.PI * 2); 
                    ctx.setLineDash([4 / zoom, 2 / zoom]); ctx.stroke(); ctx.setLineDash([]);
                }
                if (this.path && this.path.length > 0) { 
                    const endNode = this.path[this.path.length - 1]; 
                    const destX = endNode.x * TILE_SIZE + TILE_SIZE / 2; 
                    const destY = endNode.y * TILE_SIZE + TILE_SIZE / 2; 
                    ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(destX, destY); 
                    ctx.strokeStyle = this.target ? 'rgba(255, 50, 50, 0.7)' : 'rgba(255, 255, 255, 0.7)'; 
                    ctx.lineWidth = 2 / zoom; ctx.setLineDash([5 / zoom, 3 / zoom]); 
                    ctx.stroke(); ctx.setLineDash([]); 
                }
            }
        }

        // 新增：特殊单位标记
        if (this.isEscortUnit) {
            ctx.fillStyle = 'green';
            ctx.beginPath();
            ctx.arc(this.x, this.y + TILE_SIZE * this.stats.drawScale / 2 + 10 / zoom, 5 / zoom, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.isTargetUnit) {
            ctx.fillStyle = 'orange';
            ctx.beginPath();
            ctx.arc(this.x, this.y + TILE_SIZE * this.stats.drawScale / 2 + 10 / zoom, 5 / zoom, 0, Math.PI * 2);
            ctx.fill();
        }

        const hpBarWidth = TILE_SIZE * this.stats.hp / UNIT_TYPES.assault_infantry.hp * 0.9;
        const hpBarHeight = 5 / zoom; 
        const hpBarYOffset = TILE_SIZE * this.stats.drawScale / 2 + 5 / zoom;
        ctx.fillStyle = '#333'; 
        ctx.fillRect(this.x - hpBarWidth / 2, this.y - hpBarYOffset, hpBarWidth, hpBarHeight);
        ctx.fillStyle = this.owner === 'player' ? 'green' : '#c0392b'; 
        ctx.fillRect(this.x - hpBarWidth / 2, this.y - hpBarYOffset, hpBarWidth * (this.hp / this.stats.hp), hpBarHeight);
    }
    
    findTarget(enemyBase, enemyUnits, game) {
        let closestTarget = null;
        let minDistance = this.stats.visionRange;
        const validUnitTargetTypes = this.stats.canTarget || ['ground', 'air', 'sea'];

        const searchBounds = {
            min: { x: this.x - minDistance, y: this.y - minDistance },
            max: { x: this.x + minDistance, y: this.y + minDistance }
        };

        const enemyBodies = enemyUnits.map(unit => unit.body).filter(Boolean);

        const bodiesInRegion = Matter.Query.region(enemyBodies, searchBounds);
        const potentialTargets = bodiesInRegion.map(body => body.gameObject);
        
        for (const target of potentialTargets) {
            if (target.owner === this.owner || target.hp <= 0) continue;
            
            let targetMoveType = 'ground';
            if (target instanceof Unit) {
                targetMoveType = target.stats.moveType;
            }
            if (!validUnitTargetTypes.includes(targetMoveType)) continue;

            const distance = getDistance(this, target);
            if (distance < minDistance) {
                minDistance = distance;
                closestTarget = target;
            }
        }

        if (!closestTarget && enemyBase && enemyBase.hp > 0 && validUnitTargetTypes.includes('ground')) {
            const distanceToBase = getDistance(this, {x: enemyBase.pixelX, y: enemyBase.pixelY});
            if (distanceToBase < minDistance) {
                closestTarget = enemyBase;
            }
        }
        // 新增：检查建筑物
        if (!closestTarget && game.buildingsManager && validUnitTargetTypes.includes('ground') && this.owner !== 'ai') {
            const buildings = game.buildingsManager.buildings;
            for (const building of buildings) {
                if (building.hp <= 0 || building.isDestroyed) continue;
                const buildingPos = { x: building.pixelX, y: building.pixelY };
                const distance = getDistance(this, buildingPos);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestTarget = building;
                }
            }
        }
        this.setTarget(closestTarget);
    }
    
    attack(game) { 
        if (!this.target || !this.stats.ammoType) return; 
        const pStats = { damage: this.stats.attack, ammoType: this.stats.ammoType, ammoSpeed: this.stats.ammoSpeed, splashRadius: this.stats.ammoSplashRadius, };
        const proj = new Projectile(this.owner, this ,{ x: this.x, y: this.y }, this.target, pStats); 
        game.projectiles.push(proj); 
        this.attackCooldown = this.stats.attackSpeed; 
    }
    takeDamage(amount, attacker) {
        let finalDamage = amount;

        // 如果有攻击者，且攻击者有克制定义
        if (attacker && attacker.stats && attacker.stats.counters) {
            const targetClass = this.stats.unitClass;
            const multiplier = attacker.stats.counters[targetClass];
            
            if (multiplier !== undefined) {
                finalDamage *= multiplier;
            }
        }

        this.hp -= finalDamage;
        if (this.hp <= 0) {
            this.hp = 0;
            if(window.game && attacker && attacker.stats && attacker.owner === 'player'){
                window.game.onUnitDestroyed(attacker, this);
            }
        }

        if (this.hp > 0 && attacker && this.owner === 'player') {
            if (window.game && window.game.requestAssistance) {
                window.game.requestAssistance(this, attacker);
            }
        }
    }
    findSmoothedPathTarget(map) { 
        if (!this.path || this.path.length === 0 || this.currentPathIndex >= this.path.length) return; 
        for (let i = this.path.length - 1; i > this.currentPathIndex; i--) { 
            const node = this.path[i]; 
            const targetPos = { x: node.x * TILE_SIZE + TILE_SIZE / 2, y: node.y * TILE_SIZE + TILE_SIZE / 2 }; 
            if (isLineOfSightClear(this, targetPos, map, this.stats.moveType)) { 
                this.moveTargetPos = targetPos; this.currentPathIndex = i; return; 
            } 
        } 
        const nextNode = this.path[this.currentPathIndex];
        if (nextNode) { this.moveTargetPos = { x: nextNode.x * TILE_SIZE + TILE_SIZE / 2, y: nextNode.y * TILE_SIZE + TILE_SIZE / 2 }; } 
    }
}
