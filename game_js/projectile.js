// js/projectile.js
let nextProjectileId = 0;

class Projectile {
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

        if (this.stats.ammoType === 'missile' && this.target && this.target.hp > 0) {
            const angle = Math.atan2(targetPos.y - this.y, targetPos.x - this.x);
            const targetVx = Math.cos(angle) * this.stats.ammoSpeed;
            const targetVy = Math.sin(angle) * this.stats.ammoSpeed;
            this.vx = this.vx * 0.98 + targetVx * 0.02;
            this.vy = this.vy * 0.98 + targetVy * 0.02;
        }

        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.life += deltaTime;

        if (this.stats.ammoType === 'missile' || this.stats.ammoType === 'shell') {
            if (this.trail.length === 0 || getDistance(this.trail[this.trail.length-1], this) > 5) {
                this.trail.push({ x: this.x, y: this.y, life: 1.0 });
            }
        }
        
        for (let i = this.trail.length - 1; i >= 0; i--) {
            this.trail[i].life -= deltaTime * 2.5;
            if (this.trail[i].life <= 0) {
                this.trail.splice(i, 1);
            }
        }

        const dist = getDistance(this, targetPos);
        return dist < 10 || this.life > 5;
    }

    draw(ctx) {
        if (this.stats.ammoType === 'missile' || this.stats.ammoType === 'shell') {
             ctx.fillStyle = `rgba(180, 180, 180, 0.4)`;
             this.trail.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.life * (this.stats.ammoType === 'missile' ? 4 : 2.5), 0, Math.PI * 2);
                ctx.fill();
            });
        }

        if (this.stats.ammoType === 'missile') {
            ctx.fillStyle = `rgba(255, 200, 100, 1)`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.stats.ammoType === 'bullet') {
             ctx.fillStyle = 'yellow';
             ctx.fillRect(this.x - 1, this.y - 1, 3, 3);
        } else {
             ctx.fillStyle = '#ddd';
             ctx.beginPath();
             ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
             ctx.fill();
        }
    }
}


/**
 * --- 核心升级: 全新的爆炸效果类 ---
 * 结合了径向渐变、增强的粒子系统和冲击波效果，以创造更真实的视觉体验。
 */
class Explosion {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius < 15 ? 15 : radius; // 确保最小爆炸半径
        this.maxLife = 0.8; // 延长爆炸持续时间以展示烟雾
        this.life = this.maxLife;
        
        this.particles = [];
        const smokeCount = 15 + Math.floor(this.radius / 5);
        const sparkCount = 8 + Math.floor(this.radius / 8);

        // 创建烟雾粒子
        for (let i = 0; i < smokeCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * this.radius * 0.6;
            this.particles.push({
                type: 'smoke',
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                size: Math.random() * 8 + 4,
                alpha: Math.random() * 0.4 + 0.2,
            });
        }

        // 创建火花粒子
        for (let i = 0; i < sparkCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (Math.random() * this.radius * 1.5) + this.radius * 0.5; // 火花更快
            this.particles.push({
                type: 'spark',
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                size: Math.random() * 3 + 1,
            });
        }
    }

    update(deltaTime) {
        this.life -= deltaTime;
        
        // 更新每个粒子的状态
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            
            if (p.type === 'smoke') {
                p.vx *= 0.96; // 烟雾速度衰减
                p.vy *= 0.96;
                p.life -= deltaTime * 0.6;
            } else { // spark
                p.life -= deltaTime * 1.5; // 火花消失得更快
            }

             if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        return this.life <= 0 && this.particles.length === 0;
    }

    draw(ctx) {
        const progress = 1 - (this.life / this.maxLife); // 0 -> 1
        const invLife = this.life / this.maxLife; // 1 -> 0

        // 1. 绘制粒子（烟雾和火花）
        this.particles.forEach(p => {
            if (p.type === 'smoke') {
                ctx.fillStyle = `rgba(50, 50, 50, ${p.alpha * p.life})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * (1 + progress), 0, Math.PI * 2);
                ctx.fill();
            } else { // spark
                ctx.fillStyle = `rgba(255, 220, 180, ${p.life})`;
                ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
            }
        });

        // 2. 绘制火球和冲击波
        if (invLife > 0) {
            // 使用 'lighter' 混合模式可以让颜色叠加时变得更亮，模拟发光效果
            ctx.globalCompositeOperation = 'lighter';

            // --- 绘制核心火球 ---
            // 创建一个从中心到边缘的径向渐变
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * progress);
            gradient.addColorStop(0, `rgba(255, 255, 220, ${invLife * 0.9})`); // 炽热的白黄色核心
            gradient.addColorStop(0.3, `rgba(255, 200, 50, ${invLife * 0.7})`); // 橙色火焰
            gradient.addColorStop(1, `rgba(255, 80, 0, 0)`); // 逐渐消失的红色边缘

            ctx.fillStyle = gradient;
            ctx.beginPath();
            // 添加一点随机性让火焰看起来在“跳动”
            const flickerRadius = this.radius * progress * (1 + Math.random() * 0.2);
            ctx.arc(this.x, this.y, flickerRadius, 0, Math.PI * 2);
            ctx.fill();

            // --- 绘制冲击波 ---
            // 冲击波只在爆炸的前半段出现
            if (progress < 0.5) {
                 const shockwaveProgress = progress / 0.5; // 0 -> 1 during the first half
                 ctx.strokeStyle = `rgba(255, 230, 200, ${1 - shockwaveProgress})`; // 冲击波逐渐变透明
                 ctx.lineWidth = 2;
                 ctx.beginPath();
                 ctx.arc(this.x, this.y, this.radius * shockwaveProgress * 1, 0, Math.PI * 2);
                 ctx.stroke();
            }

            // 绘制完成后，恢复默认的混合模式
            ctx.globalCompositeOperation = 'source-over';
        }
    }
}