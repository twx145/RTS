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

        this.path = [];
        this.currentPathIndex = 0;
        this.moveTargetPos = null;
        this.angle = Math.random() * Math.PI * 2;
        this.targetAngle = this.angle;
        this.rotationSpeed = Math.PI * 2.0;

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
        this.isPatrolling = false;
        this.patrolPoints = [];
        this.currentPatrolPointIndex = 0;
        this.tag = 'unit_' + Math.random().toString(36).slice(2);

        this.isEscortUnit = false;
        this.destination = null;
        this.isTargetUnit = false;
        this.isSpecialBuilding = false;
        this.buildingType = null;
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

        let targetMoveType = 'ground';
        if (newTarget instanceof Unit) {
            targetMoveType = newTarget.stats.moveType;
        } else if (newTarget instanceof Base) {
            targetMoveType = 'ground';
        }
        
        if (this.stats.canTarget.includes(targetMoveType)) {
            this.target = newTarget;
        } else {
            this.target = null;
        }
    }

    setAsEscortUnit(destination) {
        this.isEscortUnit = true;
        this.destination = destination;
        this.stats.speed = 0.5;
    }

    setAsTargetUnit() {
        this.isTargetUnit = true;
        this.stats.hp *= 1.5;
        this.hp = this.stats.hp;
    }

    setAsSpecialBuilding(buildingType) {
        this.isSpecialBuilding = true;
        this.buildingType = buildingType;
        this.stats.hp *= 2;
        this.hp = this.stats.hp;
    }

    // unit.js

    // unit.js

    update(deltaTime, enemyUnits, map, enemyBase, game) {
        // --- 0. 特殊单位逻辑优先 ---
        if (this.isEscortUnit) {
            this.updateEscortBehavior(deltaTime, game);
            return;
        }
        if (this.isTargetUnit) {
            this.updateTargetUnitBehavior(deltaTime, enemyUnits, game);
            return;
        }

        // --- 1. 通用状态更新 ---
        if (this.attackCooldown > 0) this.attackCooldown -= deltaTime;
        if (this.findTargetCooldown > 0) this.findTargetCooldown -= deltaTime;
        this.updateRotation(deltaTime);

        if (this.isSettingUp) {
            this.setupTimer -= deltaTime;
            if (this.setupTimer <= 0) this.isSettingUp = false;
            return;
        }

        if (this.target && this.target.hp <= 0) {
            this.setTarget(null);
            // 目标死亡后，如果不是强制移动到某一点，就取消强制状态
            if (this.path.length === 0) {
                this.isforcemoving = false;
            }
        }
        
        // --- 2. 核心决策逻辑 (新!) ---

        // A. 如果有目标 (无论是玩家指定的还是自己找的)
        if (this.target) {
            const targetPos = { x: this.target.pixelX || this.target.x, y: this.target.pixelY || this.target.y };
            const distanceToTarget = getDistance(this, targetPos);

            // A1. 在射程内 -> 攻击
            if (distanceToTarget <= this.stats.range) {
                // 停下所有移动
                if (this.path.length > 0) {
                    this.stop();
                }
                
                // 转向并攻击
                this.setTargetAngle(targetPos);
                let angleDiff = Math.abs(this.angle - this.targetAngle);
                if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

                if (this.attackCooldown <= 0 && !this.isSettingUp && angleDiff < 0.2) {
                    this.attack(game);
                }
            } 
            // A2. 在射程外 -> 继续移动 (由 handleMovement 处理)
            // 不需要额外代码，因为 issueMoveCommand 已经设置了路径
        } 
        // B. 如果没有目标
        else {
            // B1. 如果不是在强制移动去一个地点，就可以自主索敌
            if (!this.isforcemoving && this.findTargetCooldown <= 0) {
                this.findTarget(enemyBase, enemyUnits, game);
                this.findTargetCooldown = 0.5 + Math.random() * 0.2;
            }
            // B2. 如果是在强制移动去一个地点，则什么都不做，让 handleMovement 继续执行
        }
        
        // C. 到达强制移动目的地后，清除状态
        if (this.isforcemoving && !this.target && this.path.length === 0) {
            this.isforcemoving = false;
        }

        // --- 3. 统一处理移动 ---
        // 无论在哪种模式下，只要有路径，就执行移动
        this.handleMovement(deltaTime, map);
    }
    
    updateEscortBehavior(deltaTime, game) {
        if (this.destination && getDistance(this, this.destination) < TILE_SIZE * 2) {
            return;
        }
        if (this.path.length === 0 && this.destination) {
            this.issueMoveCommand(this.destination, game.map, false, false);
        }
        this.handleMovement(deltaTime, game.map);
    }

    updateTargetUnitBehavior(deltaTime, enemyUnits, game) {
        const closestEnemy = this.findClosestEnemy(enemyUnits);
        
        if (closestEnemy && getDistance(this, closestEnemy) < TILE_SIZE * 10) {
            const fleeDirection = { x: this.x - closestEnemy.x, y: this.y - closestEnemy.y };
            const distance = Math.sqrt(fleeDirection.x * fleeDirection.x + fleeDirection.y * fleeDirection.y);
            if (distance > 0) {
                const normalizedDir = { x: fleeDirection.x / distance, y: fleeDirection.y / distance };
                const fleeTarget = { x: this.x + normalizedDir.x * TILE_SIZE * 15, y: this.y + normalizedDir.y * TILE_SIZE * 15 };
                if (this.path.length === 0) {
                    this.issueMoveCommand(fleeTarget, game.map, false, false);
                }
            }
        } else {
            if (this.body) Matter.Body.setVelocity(this.body, { x: 0, y: 0 });
            this.path = [];
            this.moveTargetPos = null;
        }
        this.handleMovement(deltaTime, game.map);
    }

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

    issueMoveCommand(targetPos, map, isEngaging = false, isforcemoving = false) {
        this.isforcemoving = isforcemoving;
        if (!isEngaging) {
            this.setTarget(null);
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
        
        // 寻路前先停止当前移动，避免冲量影响
        if(this.body) Matter.Body.setVelocity(this.body, { x: 0, y: 0 });

        const path = findPath(map, startGrid, endGrid, this.stats.moveType);
        
        if (path && path.length > 0) {
            this.path = path;
            this.currentPathIndex = 0;
        } else {
            this.path = [];
        }
    }

    stop() {
        this.path = [];
        this.moveTargetPos = null;
        this.currentPathIndex = 0;
        this.setTarget(null);
        this.isforcemoving = false;
        if (this.body) {
            Matter.Body.setVelocity(this.body, { x: 0, y: 0 });
        }
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
        
        if (this.image) {
            ctx.drawImage(this.image, -size / 2, -size / 2, size, size);
        }
        ctx.restore();

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
        
        if (closestTarget) {
            this.setTarget(closestTarget);
            
            // 核心修复：自主索敌后，如果目标在射程外，则立即发出移动指令
            const distanceToTarget = getDistance(this, closestTarget);
            if (distanceToTarget > this.stats.range) {
                const targetPosition = {
                    x: closestTarget.pixelX || closestTarget.x,
                    y: closestTarget.pixelY || closestTarget.y
                };
                this.issueMoveCommand(targetPosition, game.map, true, false);
            }
        } else {
            this.setTarget(null);
        }
    }
    
    attack(game) { 
        if (!this.target || !this.stats.ammoType) return; 
        const pStats = { damage: this.stats.attack, ammoType: this.stats.ammoType, ammoSpeed: this.stats.ammoSpeed, splashRadius: this.stats.ammoSplashRadius, };
        const proj = new Projectile(this.owner, { x: this.x, y: this.y }, this.target, pStats); 
        game.projectiles.push(proj); 
        this.attackCooldown = this.stats.attackSpeed; 
    }
    
    takeDamage(amount) { this.hp -= amount; if (this.hp <= 0) this.hp = 0; }
    
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