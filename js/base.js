// js/base.js
import { TILE_SIZE } from './config.js';

export class Base {
    constructor(owner, gridX, gridY) {
        this.owner = owner; // 'player' or 'ai'
        this.gridX = gridX; // 大本营左上角的格子X坐标
        this.gridY = gridY; // 大本營左上角的格子Y坐标
        this.width = 3; // 3个格子宽
        this.height = 3; // 3个格子高
        
        this.maxHp = 2500;
        this.hp = this.maxHp;

        // 计算像素中心点，用于单位寻路
        this.pixelX = (gridX + this.width / 2) * TILE_SIZE;
        this.pixelY = (gridY + this.height / 2) * TILE_SIZE;
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp < 0) {
            this.hp = 0;
        }
        console.log(`${this.owner}'s base took ${amount} damage, remaining HP: ${this.hp}`);
    }

    draw(ctx, zoom = 1) {
        const barWidth = this.width * TILE_SIZE;
        const barHeight = 10;
        const barX = this.gridX * TILE_SIZE;
        const barY = this.gridY * TILE_SIZE - barHeight - 5;

        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.fillStyle = this.owner === 'player' ? 'cyan' : 'red';
        ctx.fillRect(barX, barY, barWidth * (this.hp / this.maxHp), barHeight);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1 / zoom; // 调整线宽以适应缩放
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
}