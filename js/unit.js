// js/unit.js
import { TILE_SIZE, UNIT_TYPES } from './config.js';
import { getDistance } from './utils.js';
import { Base } from './base.js';
import { Projectile } from './projectile.js';
import { findPath, isLineOfSightClear } from './pathfinding.js';

let nextUnitId = 0;

export class Unit {
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

        this.path = [];
        this.currentPathIndex = 0;
        this.moveTargetPos = null;
        this.angle = Math.random() * Math.PI * 2; // 初始随机角度
        this.targetAngle = this.angle;
        this.rotationSpeed = Math.PI * 2.0; // 略微降低转向速度，使其更平滑

        // Loitering / Strafing
        this.isLoitering = false;
        this.loiterCenter = null;
        this.loiterRadius = TILE_SIZE * 5; // 恢复较小的巡逻半径
        this.loiterAngle = 0;
        this.strafeDirection = Math.random() < 0.5 ? 1 : -1;
        
        this.isSettingUp = false;
        this.setupTimer = 0;
    }

    update(deltaTime, enemyUnits, map, enemyBase, game) {
        if (this.attackCooldown > 0) this.attackCooldown -= deltaTime;
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
            this.handleMovement(deltaTime, map);
        }

        // --- 核心修复 (需求 #4): 优化自主索敌时机 ---
        // 当单位完全空闲时（无目标、无路径）
        if (!this.target && this.path.length === 0 && !this.moveTargetPos) {
            // 索敌
            this.findTarget(enemyUnits, enemyBase);
            
            // 如果索敌后仍无目标，飞机则进入巡逻
            if (!this.target && this.stats.moveType === 'air' && (this.type === 'fighter_jet' || this.type === 'recon_drone')) {
                this.handleLoitering(deltaTime);
            }
        }
    }

    handleAttack(target, game) {
        const targetPos = { x: target.pixelX || target.x, y: target.pixelY || target.y };
        const distanceToTarget = getDistance(this, targetPos);
        const engageRange = this.stats.range * 0.8; // 最佳交战距离

        // 飞机攻击盘旋逻辑
        if (this.stats.moveType === 'air' && this.stats.speed > 0) {
            let desiredMoveTarget;
            if (distanceToTarget > this.stats.range * 0.9) {
                desiredMoveTarget = targetPos;
            } else if (distanceToTarget < engageRange * 0.9) {
                const angleFromTarget = Math.atan2(this.y - targetPos.y, this.x - targetPos.x);
                desiredMoveTarget = { x: targetPos.x + Math.cos(angleFromTarget) * engageRange, y: targetPos.y + Math.sin(angleFromTarget) * engageRange, };
            } else {
                const angleToTarget = Math.atan2(targetPos.y - this.y, targetPos.x - this.x);
                const tangentAngle = angleToTarget + (Math.PI / 2 * this.strafeDirection);
                desiredMoveTarget = { x: this.x + Math.cos(tangentAngle) * 100, y: this.y + Math.sin(tangentAngle) * 100, };
            }
            this.setTargetAngle(desiredMoveTarget);
            this.move(game.lastTime > 0 ? (performance.now() - game.lastTime) / 1000 : 0);
        } 
        // --- 核心修改 (需求 #3): 地面/海上单位的截击逻辑 ---
        else {
            if (distanceToTarget > engageRange) {
                if (!this.path.length && !this.moveTargetPos) {
                    this.issueMoveCommand(targetPos, game.map, true); // true表示这是一个自主攻击移动
                }
            } else {
                this.path = [];
                this.moveTargetPos = null;
            }
        }
        
        // 统一开火逻辑
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

    /**
     * 核心修复 (需求 #2): 恢复并优化飞机巡逻逻辑
     */
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
     * 核心修改 (需求 #3): 增加 isEngaging 参数，用于区分玩家指令和自主攻击
     */
    issueMoveCommand(targetPos, map, isEngaging = false) {
        // 如果是玩家的明确指令，则清除AI目标
        if (!isEngaging) {
            this.target = null;
        }
        this.isLoitering = false;
        this.isSettingUp = false;
        this.moveTargetPos = null;
        
        // --- 核心修改 (需求 #3): 计算截击点和阵型 ---
        let finalTargetPos = { ...targetPos };
        if (isEngaging && this.target instanceof Unit && this.target.stats.speed > 0) {
            finalTargetPos = this.calculateInterceptPoint(this.target);

            // 阵型分散
            const spread = TILE_SIZE * 2;
            finalTargetPos.x += (Math.random() - 0.5) * spread;
            finalTargetPos.y += (Math.random() - 0.5) * spread;
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
     * 核心新增 (需求 #3): 预测截击点算法
     * @param {Unit} target - The moving target unit.
     * @returns {object} - The predicted {x, y} intercept point.
     */
    calculateInterceptPoint(target) {
        const distance = getDistance(this, target);
        // 如果自己比目标慢，或目标基本不动，直接返回目标当前位置
        if (this.stats.speed <= target.stats.speed || target.stats.speed < TILE_SIZE * 0.1) {
            return { x: target.x, y: target.y };
        }

        const timeToIntercept = distance / (this.stats.speed - target.stats.speed);
        
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

    /**
     * 核心修复 (需求 #1): 移除图像翻转，直接旋转
     */
    draw(ctx, isSelected, zoom = 1, showDetails = false) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // 直接旋转到单位的角度
        ctx.rotate(this.angle + Math.PI / 2);
        
        const size = TILE_SIZE * (this.stats.drawScale ); 
        if (this.image) {
            // 绘制图像时，让它的"头"朝向正右方(0度角的方向)
            ctx.drawImage(this.image, -size / 2, -size / 2, size, size);
        }
        
        ctx.restore();

        // HP Bar 和选中效果绘制逻辑保持不变，因为它们是在世界坐标系下绘制的，不受旋转影响
        if (isSelected) {
            ctx.strokeStyle = this.owner === 'player' ? 'yellow' : 'orange';
            ctx.lineWidth = 2 / zoom;
            ctx.beginPath();
            ctx.arc(this.x, this.y, TILE_SIZE * this.stats.drawScale/2, 0, Math.PI * 2);
            ctx.stroke();
            if (showDetails) {
                if (this.stats.range > 0) { ctx.strokeStyle = 'rgba(255, 100, 100, 0.5)'; ctx.lineWidth = 1 / zoom; ctx.beginPath(); ctx.arc(this.x, this.y, this.stats.range, 0, Math.PI * 2); ctx.stroke(); }
                if (this.path && this.path.length > 0) { const endNode = this.path[this.path.length - 1]; const destX = endNode.x * TILE_SIZE + TILE_SIZE / 2; const destY = endNode.y * TILE_SIZE + TILE_SIZE / 2; ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(destX, destY); ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'; ctx.lineWidth = 2 / zoom; ctx.setLineDash([5 / zoom, 3 / zoom]); ctx.stroke(); ctx.setLineDash([]); }
            }
        }
        const hpBarWidth = TILE_SIZE; const hpBarHeight = 5 / zoom; const hpBarYOffset = TILE_SIZE * 0.8; ctx.fillStyle = '#333'; ctx.fillRect(this.x - hpBarWidth / 2, this.y - hpBarYOffset, hpBarWidth, hpBarHeight); ctx.fillStyle = this.owner === 'player' ? 'green' : '#c0392b'; ctx.fillRect(this.x - hpBarWidth / 2, this.y - hpBarYOffset, hpBarWidth * (this.hp / this.stats.hp), hpBarHeight);
    }
    
    findTarget(enemyUnits, enemyBase) {
        let potentialTargets = [...enemyUnits];
        if (enemyBase && enemyBase.hp > 0) potentialTargets.push(enemyBase);
        let closestTarget = null;
        let minDistance = Infinity;
        const validUnitTargetTypes = this.stats.canTarget || ['ground', 'air', 'sea'];
        for (const target of potentialTargets) {
            if (target.hp <= 0) continue;
            let targetMoveType = 'ground'; if (target instanceof Unit) targetMoveType = target.stats.moveType; if (!validUnitTargetTypes.includes(targetMoveType)) continue;
            const targetPos = { x: target.pixelX || target.x, y: target.pixelY || target.y };
            const distance = getDistance(this, targetPos);
            const acquisitionRange = this.stats.range * 1.5; // 索敌范围
            if (distance < acquisitionRange && distance < minDistance) {
                minDistance = distance;
                closestTarget = target;
            }
        }
        this.target = closestTarget;
    }
    
    // --- Unchanged methods below ---
    attack(game) { if (!this.target || !this.stats.ammoType) return; const pStats = { damage: this.stats.attack, ammoType: this.stats.ammoType, ammoSpeed: this.stats.ammoSpeed, splashRadius: this.stats.ammoSplashRadius, }; const proj = new Projectile(this.owner, { x: this.x, y: this.y }, this.target, pStats); game.projectiles.push(proj); this.attackCooldown = this.stats.attackSpeed; }
    takeDamage(amount) { this.hp -= amount; if (this.hp <= 0) this.hp = 0; }
    findSmoothedPathTarget(map) { if (!this.path || this.path.length === 0 || this.currentPathIndex >= this.path.length) return; for (let i = this.path.length - 1; i > this.currentPathIndex; i--) { const node = this.path[i]; const targetPos = { x: node.x * TILE_SIZE + TILE_SIZE / 2, y: node.y * TILE_SIZE + TILE_SIZE / 2 }; if (isLineOfSightClear(this, targetPos, map, this.stats.moveType)) { this.moveTargetPos = targetPos; this.currentPathIndex = i; return; } } const nextNode = this.path[this.currentPathIndex]; if (nextNode) { this.moveTargetPos = { x: nextNode.x * TILE_SIZE + TILE_SIZE / 2, y: nextNode.y * TILE_SIZE + TILE_SIZE / 2 }; } }
}