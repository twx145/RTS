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
        this.findTargetCooldown = Math.random() * 0.5; // AI索敌计时器，错开计算

        this.path = [];
        this.currentPathIndex = 0;
        this.moveTargetPos = null;
        this.angle = Math.random() * Math.PI * 2;
        this.targetAngle = this.angle;
        this.rotationSpeed = Math.PI * 2.0;

        // Loitering / Strafing
        this.isLoitering = false;
        this.loiterCenter = null;
        this.loiterRadius = TILE_SIZE * 5;
        this.loiterAngle = 0;
        this.strafeDirection = Math.random() < 0.5 ? 1 : -1;
        
        this.isSettingUp = false;
        this.setupTimer = 0;
    }

    /**
     * --- 核心修复: 重构整个update方法以解决移动与攻击的逻辑冲突 ---
     * @param {SpatialGrid} spatialGrid - 用于高效索敌
     */
    update(deltaTime, enemyUnits, map, enemyBase, game, spatialGrid) {
        if (this.attackCooldown > 0) this.attackCooldown -= deltaTime;
        if (this.findTargetCooldown > 0) this.findTargetCooldown -= deltaTime;
        
        this.updateRotation(deltaTime);

        // 如果单位正在部署（如炮兵），则不执行任何其他操作
        if (this.isSettingUp) {
            this.setupTimer -= deltaTime;
            if (this.setupTimer <= 0) this.isSettingUp = false;
            return;
        }
        
        // --- 决策阶段 ---
        // 1. 处理现有目标
        if (this.target && this.target.hp > 0) {
            this.handleAttack(this.target, game);
        } else {
            // 目标已死亡或不存在，清空目标
            this.target = null;
            
            // 2. 如果单位空闲（没有移动路径），则自主索敌
            if (this.path.length === 0 && !this.moveTargetPos && this.findTargetCooldown <= 0) {
                this.findTarget(enemyBase, spatialGrid);
                this.findTargetCooldown = 0.5 + Math.random() * 0.2; // 重置索敌冷却
                
                // 如果索敌后仍无目标，飞行单位进入巡逻模式
                if (!this.target && this.stats.moveType === 'air' && (this.type === 'fighter_jet' || this.type === 'recon_drone')) {
                    this.handleLoitering(deltaTime);
                }
            }
        }

        // --- 执行阶段 ---
        // 3. **无条件地**处理移动。只要有路径，就应该移动。
        this.handleMovement(deltaTime, map);
    }

    /**
     * --- 核心修复: handleAttack现在只负责决策（移动或开火），不再包含移动执行代码 ---
     */
    handleAttack(target, game) {
        const targetPos = { x: target.pixelX || target.x, y: target.pixelY || target.y };
        const distanceToTarget = getDistance(this, targetPos);
        const engageRange = this.stats.range * 0.95; // 在稍小于最大射程时就停下

        // 决策：根据距离判断是该移动还是该停下
        if (distanceToTarget > engageRange) {
            // 在射程外：需要移动。仅在没有路径时才创建新路径，避免每帧都重新寻路
            if (!this.path.length && !this.moveTargetPos) {
                this.issueMoveCommand(targetPos, game.map, true); // true表示这是一个自主攻击移动
            }
        } else {
            // 在射程内：停下移动，准备开火
            this.path = [];
            this.moveTargetPos = null;
        }
        
        // 统一开火逻辑
        this.setTargetAngle(targetPos);
        if (distanceToTarget <= this.stats.range) {
            let angleDiff = Math.abs(this.angle - this.targetAngle);
            if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
            
            // 必须在冷却完成、未部署且大致朝向目标时才能开火
            if (this.attackCooldown <= 0 && !this.isSettingUp && angleDiff < 0.2) {
                this.attack(game);
            }
        }
    }
    
    /**
     * --- 核心修复: handleMovement现在是纯粹的路径执行器 ---
     */
    handleMovement(deltaTime, map) {
        // 如果有路径但没有具体的下一个目标点，说明需要平滑路径以找到更远的点
        if (this.path.length > 0 && !this.moveTargetPos) {
            this.findSmoothedPathTarget(map);
        }
        
        // 如果有移动目标点，就朝它移动
        if (this.moveTargetPos) {
            this.setTargetAngle(this.moveTargetPos);
            const distanceToNode = getDistance(this, this.moveTargetPos);
            
            // 如果已到达路径节点
            if (distanceToNode < TILE_SIZE / 4) {
                this.moveTargetPos = null; // 清除当前节点目标，下一帧会寻找新节点
                // 如果这是路径的最后一个节点
                if (this.currentPathIndex >= this.path.length -1) {
                    this.path = []; // 清空路径
                    // 如果是需要部署的单位，则开始部署
                    if (this.stats.special === 'SETUP_TO_FIRE') {
                        this.isSettingUp = true;
                        this.setupTimer = 2.0;
                    }
                }
            } else {
                // 未到达节点，继续移动
                this.move(deltaTime);
            }
        }
    }

    //优化飞机巡逻逻辑
    handleLoitering(deltaTime) {
        if (!this.isLoitering) {
            this.isLoitering = true;
            this.loiterCenter = { x: this.x, y: this.y };
            this.loiterAngle = Math.atan2(this.y - this.loiterCenter.y, this.x - this.loiterCenter.x);
        }
        
        this.loiterAngle += 0.8 * deltaTime; // 控制盘旋速度
        
        const targetX = this.loiterCenter.x + Math.cos(this.loiterAngle) * this.loiterRadius;
        const targetY = this.loiterCenter.y + Math.sin(this.loiterAngle) * this.loiterRadius;
        
        this.setTargetAngle({x: targetX, y: targetY});
        this.move(deltaTime);
    }

    move(deltaTime) {
        const speed = this.stats.speed * deltaTime;
        this.x += Math.cos(this.angle) * speed;
        this.y += Math.sin(this.angle) * speed;
    }

    issueMoveCommand(targetPos, map, isEngaging = false) {
        // 如果是玩家的明确指令，则清除AI目标
        if (!isEngaging) {
            this.target = null;
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
        if (Math.abs(diff) < turnStep) {
            this.angle = this.targetAngle;
        } else {
            this.angle += Math.sign(diff) * turnStep;
        }
        this.angle = (this.angle + 2 * Math.PI) % (2 * Math.PI);
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
        const hpBarYOffset = TILE_SIZE * this.stats.drawScale / 2;
        ctx.fillStyle = '#333'; 
        ctx.fillRect(this.x - hpBarWidth / 2, this.y - hpBarYOffset, hpBarWidth, hpBarHeight);
        ctx.fillStyle = this.owner === 'player' ? 'green' : '#c0392b'; 
        ctx.fillRect(this.x - hpBarWidth / 2, this.y - hpBarYOffset, hpBarWidth * (this.hp / this.stats.hp), hpBarHeight);
    }
    
    findTarget(enemyBase, spatialGrid) {
        let closestTarget = null;
        let minDistance = this.stats.visionRange;
        const validUnitTargetTypes = this.stats.canTarget || ['ground', 'air', 'sea'];
        const potentialTargets = spatialGrid.getNearbyWithRadius(this, minDistance);
        
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
        this.target = closestTarget;
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