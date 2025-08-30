// js/projectile.js
import { getDistance } from './utils.js';

let nextProjectileId = 0;

export class Projectile {
    constructor(owner, startPos, target, stats) {
        this.id = nextProjectileId++;
        this.owner = owner;
        this.x = startPos.x;
        this.y = startPos.y;
        this.target = target;
        this.stats = stats;

        const targetPos = { x: target.pixelX || target.x, y: target.pixelY || target.y };
        const angle = Math.atan2(targetPos.y - this.y, targetPos.x - this.x);
        this.vx = Math.cos(angle) * this.stats.ammoSpeed;
        this.vy = Math.sin(angle) * this.stats.ammoSpeed;
        
        this.trail = [];
        this.life = 0;
    }

    update(deltaTime) {
        const targetPos = this.target ? { x: this.target.pixelX || this.target.x, y: this.target.pixelY || this.target.y } : {x: this.x + this.vx, y: this.y + this.vy};

        // 导弹的简单追踪逻辑
        if (this.stats.ammoType === 'missile' && this.target && this.target.hp > 0) {
            const angle = Math.atan2(targetPos.y - this.y, targetPos.x - this.x);
            const targetVx = Math.cos(angle) * this.stats.ammoSpeed;
            const targetVy = Math.sin(angle) * this.stats.ammoSpeed;
            // 线性插值，使导弹转向更平滑
            this.vx = this.vx * 0.98 + targetVx * 0.02;
            this.vy = this.vy * 0.98 + targetVy * 0.02;
        }

        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.life += deltaTime;

        // 优化拖尾效果
        if (this.stats.ammoType === 'missile' || this.stats.ammoType === 'shell') {
            if (this.trail.length === 0 || getDistance(this.trail[this.trail.length-1], this) > 5) {
                this.trail.push({ x: this.x, y: this.y, life: 1.0 });
            }
        }
        
        // 更新拖尾中每个粒子的生命周期
        for (let i = this.trail.length - 1; i >= 0; i--) {
            this.trail[i].life -= deltaTime * 2.5;
            if (this.trail[i].life <= 0) {
                this.trail.splice(i, 1);
            }
        }

        const dist = getDistance(this, targetPos);
        return dist < 10 || this.life > 5; // 命中判定或超时
    }

    draw(ctx) {
        // --- 视觉升级: 绘制更真实的弹道拖尾 ---
        if (this.stats.ammoType === 'missile' || this.stats.ammoType === 'shell') {
             ctx.fillStyle = `rgba(180, 180, 180, 0.4)`; // 烟雾颜色
             this.trail.forEach(p => {
                ctx.beginPath();
                // 拖尾粒子大小随生命周期减小
                ctx.arc(p.x, p.y, p.life * (this.stats.ammoType === 'missile' ? 4 : 2.5), 0, Math.PI * 2);
                ctx.fill();
            });
        }

        // --- 视觉升级: 绘制弹头 ---
        if (this.stats.ammoType === 'missile') {
            ctx.fillStyle = `rgba(255, 200, 100, 1)`; // 明亮的导弹头
            ctx.beginPath();
            ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.stats.ammoType === 'bullet') {
             ctx.fillStyle = 'yellow';
             ctx.fillRect(this.x - 1, this.y - 1, 3, 3);
        } else { // shell
             ctx.fillStyle = '#ddd';
             ctx.beginPath();
             ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
             ctx.fill();
        }
    }
}


/**
 * 核心升级 (需求 #1): 全新的爆炸效果类
 * 通过绘制多层渐变的圆形和随机的烟雾粒子来模拟真实的爆炸效果
 */
export class Explosion {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius < 10 ? 10 : radius; // 最小爆炸半径
        this.maxLife = 0.6; // 爆炸持续时间（秒）
        this.life = this.maxLife;
        
        // 创建烟雾粒子
        this.particles = [];
        const particleCount = 15 + Math.floor(this.radius / 5);
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * this.radius * 0.5;
            this.particles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0, // 粒子生命周期
                size: Math.random() * 5 + 2,
                alpha: Math.random() * 0.3 + 0.1,
            });
        }
    }

    update(deltaTime) {
        this.life -= deltaTime;
        
        // 更新每个烟雾粒子的状态
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.life -= deltaTime * 0.8;
             if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        return this.life <= 0 && this.particles.length === 0;
    }

    draw(ctx) {
        const progress = 1 - (this.life / this.maxLife);
        
        // --- 绘制烟雾 ---
        this.particles.forEach(p => {
            ctx.fillStyle = `rgba(80, 80, 80, ${p.alpha * p.life})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (1 + progress), 0, Math.PI * 2);
            ctx.fill();
        });

        // --- 绘制火光 (多层叠加) ---
        if (this.life > 0) {
            const alpha = Math.sin(Math.PI * progress); // 使用sin函数实现平滑的淡入淡出
            
            // 1. 外层橙红色火焰
            let currentRadius = this.radius * progress;
            ctx.beginPath();
            ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 120, 0, ${alpha * 0.7})`;
            ctx.fill();
            
            // 2. 中层黄色火焰
            currentRadius *= 0.7;
            ctx.beginPath();
            ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 220, 100, ${alpha * 0.9})`;
            ctx.fill();

            // 3. 核心白热化火焰
            currentRadius *= 0.5;
             ctx.beginPath();
            ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fill();
        }
    }
}