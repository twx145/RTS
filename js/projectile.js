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

        // Simple homing for missiles if target is alive
        if (this.stats.ammoType === 'missile' && this.target && this.target.hp > 0) {
            const angle = Math.atan2(targetPos.y - this.y, targetPos.x - this.x);
            const targetVx = Math.cos(angle) * this.stats.ammoSpeed;
            const targetVy = Math.sin(angle) * this.stats.ammoSpeed;
            // Lerp towards target velocity
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
        
        this.trail = this.trail.filter(p => {
            p.life -= deltaTime * 2.5;
            return p.life > 0;
        });

        const dist = getDistance(this, targetPos);
        return dist < 10 || this.life > 5; // Hit condition or timeout
    }

    draw(ctx) {
        // Trail
        if (this.stats.ammoType === 'missile') {
            ctx.fillStyle = `rgba(200, 200, 200, 0.4)`;
            this.trail.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.life * 4, 0, Math.PI * 2);
                ctx.fill();
            });
        } else if (this.stats.ammoType === 'shell') {
            ctx.fillStyle = `rgba(180, 180, 180, 0.5)`;
            this.trail.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.life * 2, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        // Projectile head
        if (this.stats.ammoType === 'missile') {
            ctx.fillStyle = `rgba(255, 180, 50, 0.9)`;
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

export class Explosion {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius < 10 ? 10 : radius;
        this.maxLife = 0.5;
        this.life = this.maxLife;
    }

    update(deltaTime) {
        this.life -= deltaTime;
        return this.life <= 0;
    }

    draw(ctx) {
        const progress = 1 - (this.life / this.maxLife);
        const currentRadius = this.radius * progress;
        const alpha = Math.sin(Math.PI * progress); // Fade in and out smoothly

        ctx.beginPath();
        ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 159, 0, ${alpha * 0.8})`;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentRadius * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
    }
}