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
        this.angle = Math.random() * Math.PI * 2; // 初始随机角度
        this.targetAngle = this.angle;
        this.rotationSpeed = Math.PI * 2.0;

        // --- 体验优化: 飞行单位巡逻/缠斗逻辑 ---
        this.isLoitering = false;
        this.loiterCenter = null;
        this.loiterRadius = TILE_SIZE * 5;
        this.loiterAngle = 0;
        this.strafeDirection = Math.random() < 0.5 ? 1 : -1; // 缠斗方向
        
        // --- 单位特殊状态 ---
        this.isSettingUp = false; // 用于炮兵等单位
        this.setupTimer = 0;
    }

    update(deltaTime, enemyUnits, map, enemyBase, game, spatialGrid) {
        if (this.attackCooldown > 0) this.attackCooldown -= deltaTime;
        if (this.findTargetCooldown > 0) this.findTargetCooldown -= deltaTime;
        
        this.updateRotation(deltaTime);

        if (this.isSettingUp) {
            this.setupTimer -= deltaTime;
            if (this.setupTimer <= 0) this.isSettingUp = false;
            return; // 部署中，不进行其他操作
        }
        
        // 核心逻辑: 优先处理目标，其次处理移动，最后自主索敌
        if (this.target && this.target.hp > 0) {
            this.handleAttack(this.target, game);
        } else {
            this.target = null;
            this.handleMovement(deltaTime, map);
        }

        // --- 性能优化：使用空间网格进行节流索敌 ---
        // 仅当单位空闲时（无目标、无路径）才自主寻找敌人
        if (!this.target && this.path.length === 0 && !this.moveTargetPos && this.findTargetCooldown <= 0) {
            this.findTarget(enemyBase, spatialGrid);
            this.findTargetCooldown = 0.5 + Math.random() * 0.2; // 无论是否找到，都重置计时器，避免频繁搜索
            
            // --- 体验优化: 空闲的飞行单位自动进入巡逻模式 ---
            if (!this.target && this.stats.moveType === 'air' && (this.type === 'fighter_jet' || this.type === 'recon_drone')) {
                this.handleLoitering(deltaTime);
            }
        }
    }

    handleAttack(target, game) {
        const targetPos = { x: target.pixelX || target.x, y: target.pixelY || target.y };
        const distanceToTarget = getDistance(this, targetPos);
        const engageRange = this.stats.range * 0.95; // 稍微小于最大射程，确保能稳定开火

        // 停止当前移动，准备攻击
        if (distanceToTarget <= engageRange) {
             this.path = [];
             this.moveTargetPos = null;
        } 
        // 如果超出射程，则移动到可攻击位置
        else {
             // 仅在没有路径时才发布新的移动命令，避免频繁重新计算
            if (!this.path.length && !this.moveTargetPos) {
                this.issueMoveCommand(targetPos, game.map, true); // true表示这是一个自主攻击移动
            }
        }
        
        // 统一开火逻辑
        this.setTargetAngle(targetPos);
        if (distanceToTarget <= this.stats.range) {
            // 检查武器是否对准目标
            let angleDiff = Math.abs(this.angle - this.targetAngle);
            if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
            
            if (this.attackCooldown <= 0 && !this.isSettingUp && angleDiff < 0.2) { // 容忍小角度偏差
                this.attack(game);
            }
        }
    }
    
    handleMovement(deltaTime, map) {
        // 如果有路径但没有具体的移动目标点，说明需要平滑路径
        if (this.path.length > 0 && !this.moveTargetPos) {
            this.findSmoothedPathTarget(map);
        }
        
        if (this.moveTargetPos) {
            this.setTargetAngle(this.moveTargetPos);
            const distanceToNode = getDistance(this, this.moveTargetPos);
            
            // 到达路径节点
            if (distanceToNode < TILE_SIZE / 4) {
                this.moveTargetPos = null; 
                // 如果是路径的最后一个节点
                if (this.currentPathIndex >= this.path.length -1) {
                    this.path = [];
                    // 如果单位是炮兵等需要部署的单位
                    if (this.stats.special === 'SETUP_TO_FIRE') {
                        this.isSettingUp = true;
                        this.setupTimer = 2.0;
                    }
                }
            } else {
                this.move(deltaTime);
            }
        }
    }

    // --- 体验优化: 空中单位巡逻逻辑 ---
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

    /**
     * --- 核心修改: 增加 isEngaging 参数，用于区分玩家指令和自主攻击 ---
     */
    issueMoveCommand(targetPos, map, isEngaging = false) {
        // 如果是玩家的明确指令，则清除AI自主索敌的目标
        if (!isEngaging) {
            this.target = null;
        }
        this.isLoitering = false;
        this.isSettingUp = false;
        this.moveTargetPos = null;
        
        // --- 核心体验优化 (截击逻辑): 如果是攻击移动，则计算截击点 ---
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

    /**
     * --- 核心体验优化 (新增): 预测截击点算法 ---
     * @param {Unit} target - The moving target unit.
     * @returns {object} - The predicted {x, y} intercept point.
     */
    calculateInterceptPoint(target) {
        const distance = getDistance(this, target);
        // 如果自己比目标慢，或者弹速不存在，直接返回目标当前位置
        const projectileSpeed = this.stats.ammoSpeed || this.stats.speed;
        if (projectileSpeed <= target.stats.speed) {
            return { x: target.x, y: target.y };
        }

        const timeToIntercept = distance / projectileSpeed;
        
        // 预测目标在 timeToIntercept 秒后的位置
        const targetSpeed = target.stats.speed;
        const targetAngle = target.angle; // 假设目标会沿当前方向前进
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
        ctx.rotate(this.angle + Math.PI / 2); // 加 PI/2 是因为大部分素材的头部是朝上的
        const size = TILE_SIZE * this.stats.drawScale;
        if (this.image) {
            ctx.drawImage(this.image, -size / 2, -size / 2, size, size);
        }
        ctx.restore();

        // --- 绘制选中效果和详细信息 ---
        if (isSelected) {
            ctx.strokeStyle = this.owner === 'player' ? 'rgba(255, 255, 0, 0.9)' : 'rgba(255, 165, 0, 0.9)';
            ctx.lineWidth = 2 / zoom;
            ctx.beginPath();
            ctx.arc(this.x, this.y, TILE_SIZE * this.stats.drawScale / 2 + 2 / zoom, 0, Math.PI * 2);
            ctx.stroke();

            if (showDetails) {
                // 绘制攻击范围 (虚线)
                if (this.stats.range > 0) { 
                    ctx.strokeStyle = 'rgba(255, 100, 100, 0.6)'; ctx.lineWidth = 1 / zoom; 
                    ctx.beginPath(); ctx.arc(this.x, this.y, this.stats.range, 0, Math.PI * 2); 
                    ctx.setLineDash([4 / zoom, 2 / zoom]); ctx.stroke(); ctx.setLineDash([]);
                }
                // 绘制移动路径
                if (this.path && this.path.length > 0) { 
                    const endNode = this.path[this.path.length - 1]; 
                    const destX = endNode.x * TILE_SIZE + TILE_SIZE / 2; 
                    const destY = endNode.y * TILE_SIZE + TILE_SIZE / 2; 
                    ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(destX, destY); 
                    ctx.strokeStyle = this.target ? 'rgba(255, 50, 50, 0.7)' : 'rgba(200, 200, 200, 0.7)'; 
                    ctx.lineWidth = 2 / zoom; ctx.setLineDash([5 / zoom, 3 / zoom]); 
                    ctx.stroke(); ctx.setLineDash([]); 
                }
            }
        }
        // --- 体验优化: 根据单位最大HP和尺寸调整血条 ---
        const hpBarWidth = TILE_SIZE * Math.max(1, this.stats.hp / 150); // 以150HP为基准调整长度
        const hpBarHeight = 5 / zoom; 
        const hpBarYOffset = (TILE_SIZE * this.stats.drawScale / 2) + hpBarHeight; // 放在单位头上
        
        ctx.fillStyle = 'rgba(50, 50, 50, 0.7)'; 
        ctx.fillRect(this.x - hpBarWidth / 2, this.y - hpBarYOffset, hpBarWidth, hpBarHeight);
        ctx.fillStyle = this.owner === 'player' ? '#2ecc71' : '#c0392b'; 
        ctx.fillRect(this.x - hpBarWidth / 2, this.y - hpBarYOffset, hpBarWidth * (this.hp / this.stats.hp), hpBarHeight);
    }
    
    /**
     * --- 核心性能优化: 使用空间网格进行高效索敌 ---
     * 不再遍历全局敌人列表，而是只查询自身视野范围内的网格，极大提升效率。
     * @param {Base} enemyBase 敌方基地
     * @param {SpatialGrid} spatialGrid 空间网格实例
     */
    findTarget(enemyBase, spatialGrid) {
        let closestTarget = null;
        let minDistance = this.stats.visionRange;
        const validUnitTargetTypes = this.stats.canTarget || ['ground', 'air', 'sea', 'amphibious'];

        // 1. 从空间网格获取附近的潜在目标
        const potentialTargets = spatialGrid.getNearbyWithRadius(this, minDistance);
        
        for (const target of potentialTargets) {
            // 排除友军、死亡单位和无法攻击的类型
            if (target.owner === this.owner || target.hp <= 0) continue;
            if (target instanceof Unit && !validUnitTargetTypes.includes(target.stats.moveType)) continue;

            const distance = getDistance(this, target);
            if (distance < minDistance) {
                minDistance = distance;
                closestTarget = target;
            }
        }

        // 2. 如果没有找到单位，再检查基地
        if (!closestTarget && enemyBase && enemyBase.hp > 0 && validUnitTargetTypes.includes('ground')) {
            const distanceToBase = getDistance(this, {x: enemyBase.pixelX, y: enemyBase.pixelY});
            if (distanceToBase < minDistance) {
                closestTarget = enemyBase;
            }
        }
        
        this.target = closestTarget;
    }
    
    // --- Unchanged methods below ---
    attack(game) { 
        if (!this.target || !this.stats.ammoType) return; 
        const pStats = { damage: this.stats.attack, ammoType: this.stats.ammoType, ammoSpeed: this.stats.ammoSpeed, splashRadius: this.stats.ammoSplashRadius, };
        game.projectiles.push(new Projectile(this.owner, { x: this.x, y: this.y }, this.target, pStats));
        this.attackCooldown = this.stats.attackSpeed; 
    }
    takeDamage(amount) { this.hp -= amount; if (this.hp <= 0) this.hp = 0; }
    findSmoothedPathTarget(map) { 
        if (!this.path || this.path.length === 0 || this.currentPathIndex >= this.path.length) return; 
        // 从路径终点向前查找，找到第一个可以直接到达的节点
        for (let i = this.path.length - 1; i > this.currentPathIndex; i--) { 
            const node = this.path[i]; 
            const targetPos = { x: node.x * TILE_SIZE + TILE_SIZE / 2, y: node.y * TILE_SIZE + TILE_SIZE / 2 }; 
            if (isLineOfSightClear(this, targetPos, map, this.stats.moveType)) { 
                this.moveTargetPos = targetPos; this.currentPathIndex = i; return; 
            } 
        } 
        // 如果都不能，则朝向下一个节点移动
        const nextNode = this.path[this.currentPathIndex];
        if (nextNode) { this.moveTargetPos = { x: nextNode.x * TILE_SIZE + TILE_SIZE / 2, y: nextNode.y * TILE_SIZE + TILE_SIZE / 2 }; } 
    }
}