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

        // --- 核心新增: 创建 Matter.js 物理实体 ---
        this.body = this.createBody(x, y);
        if (this.body) {
             // 添加一个反向引用，方便从 body 找到 unit 对象
            this.body.gameObject = this;
            Matter.World.add(window.game.engine.world, this.body);
        }
    }

    createBody(x, y) {
        const radius = this.stats.drawScale * TILE_SIZE * 0.4; // 碰撞半径稍小一些
        let category, mask;

        if (this.stats.moveType === 'air') {
            category = COLLISION_CATEGORIES.air_unit;
            // 空中单位只与其他空中单位碰撞
            mask = COLLISION_CATEGORIES.air_unit;
        } else { // 'ground', 'sea', 'amphibious'
            category = COLLISION_CATEGORIES.ground_unit;
            // 地面单位与地形和其他地面单位碰撞
            mask = COLLISION_CATEGORIES.terrain | COLLISION_CATEGORIES.ground_unit;
        }

        const body = Matter.Bodies.circle(x, y, radius, {
            frictionAir: 0.1, // 增加空气阻力，防止单位滑行过远
            friction: 0.01,
            restitution: 0.1, // 低弹性
            label: `${this.owner}_${this.type}`,
            collisionFilter: {
                category: category,
                mask: mask
            }
        });

        // 初始角度
        Matter.Body.setAngle(body, this.angle);
        return body;
    }


    update(deltaTime, enemyUnits, map, enemyBase, game) {
        if (this.attackCooldown > 0) this.attackCooldown -= deltaTime;
        if (this.findTargetCooldown > 0) this.findTargetCooldown -= deltaTime;
        
        this.updateRotation(deltaTime);

        if (this.isSettingUp) {
            this.setupTimer -= deltaTime;
            if (this.setupTimer <= 0) this.isSettingUp = false;
            return;
        }
        
        if (this.target && this.target.hp > 0) {
            this.handleAttack(this.target, game);
        } else {
            this.target = null;
            if (this.path.length === 0 && !this.moveTargetPos && this.findTargetCooldown <= 0) {
                this.findTarget(enemyBase, enemyUnits, game);
                this.findTargetCooldown = 0.5 + Math.random() * 0.2;
                
                if (!this.target && this.stats.moveType === 'air' && (this.type === 'fighter_jet' || this.type === 'recon_drone')) {
                    this.handleLoitering(deltaTime);
                }
            }
        }

        this.handleMovement(deltaTime, map);
    }

    handleAttack(target, game) {
        const targetPos = { x: target.pixelX || target.x, y: target.pixelY || target.y };
        const distanceToTarget = getDistance(this, targetPos);
        const engageRange = this.stats.range * 0.95;

        if (distanceToTarget > engageRange) {
            if (!this.path.length && !this.moveTargetPos) {
                this.issueMoveCommand(targetPos, game.map, true);
            }
        } else {
            this.path = [];
            this.moveTargetPos = null;
            // --- 核心修改: 停止移动 ---
            if (this.body) Matter.Body.setVelocity(this.body, { x: 0, y: 0 });
        }
        
        this.setTargetAngle(targetPos);
        if (distanceToTarget <= this.stats.range) {
            let angleDiff = Math.abs(this.angle - this.targetAngle);
            if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
            
            if (this.attackCooldown <= 0 && !this.isSettingUp && angleDiff < 0.2) {
                this.attack(game);
            }
        }
    }
    
    handleMovement(deltaTime, map) {
        if (this.path.length > 0 && !this.moveTargetPos) {
            this.findSmoothedPathTarget(map);
        }
        
        if (this.moveTargetPos) {
            this.setTargetAngle(this.moveTargetPos);
            const distanceToNode = getDistance(this, this.moveTargetPos);
            
            if (distanceToNode < TILE_SIZE / 2) {
                this.moveTargetPos = null; 
                if (this.currentPathIndex >= this.path.length -1) {
                    this.path = [];
                    // --- 核心修改: 到达终点，停止移动 ---
                    if (this.body) Matter.Body.setVelocity(this.body, { x: 0, y: 0 });
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
        const normalizedDir = getDistance(direction, {x:0, y:0}) > 0 
            ? { x: direction.x / getDistance(direction, {x:0, y:0}), y: direction.y / getDistance(direction, {x:0, y:0}) }
            : { x: 0, y: 0 };
        
        const velocity = {
            x: normalizedDir.x * this.stats.speed,
            y: normalizedDir.y * this.stats.speed
        };
        // --- 核心修改: 使用 Matter.js 设置速度 ---
        Matter.Body.setVelocity(this.body, velocity);
    }

    issueMoveCommand(targetPos, map, isEngaging = false) {
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
        let newAngle;
        if (Math.abs(diff) < turnStep) {
            newAngle = this.targetAngle;
        } else {
            newAngle = this.angle + Math.sign(diff) * turnStep;
        }
        newAngle = (newAngle + 2 * Math.PI) % (2 * Math.PI);

        // --- 核心修改: 使用 Matter.js 设置角度 ---
        if (this.body) {
            Matter.Body.setAngle(this.body, newAngle);
        }
        this.angle = newAngle; // 立即更新游戏对象角度以便渲染
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
    
    // --- 核心重构: 使用 Matter.Query.region 索敌 ---
    findTarget(enemyBase, enemyUnits, game) {
        let closestTarget = null;
        let minDistance = this.stats.visionRange;
        const validUnitTargetTypes = this.stats.canTarget || ['ground', 'air', 'sea'];

        // 1. 定义搜索区域
        const searchBounds = {
            min: { x: this.x - minDistance, y: this.y - minDistance },
            max: { x: this.x + minDistance, y: this.y + minDistance }
        };

        // 2. 获取所有敌方单位的物理实体
        const enemyBodies = enemyUnits.map(unit => unit.body).filter(Boolean);

        // 3. 执行查询
        const bodiesInRegion = Matter.Query.region(enemyBodies, searchBounds);
        const potentialTargets = bodiesInRegion.map(body => body.gameObject);
        
        // 4. 从查询结果中筛选最近的目标
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

        // 5. 如果没有找到单位，检查基地
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