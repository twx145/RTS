class Base {
    constructor(owner, gridX, gridY) {
        this.owner = owner; // 'player' or 'ai'
        this.gridX = gridX;
        this.gridY = gridY;
        this.width = 3;
        this.height = 3;
        this.maxHp = 2500;
        this.hp = this.maxHp;
        this.pixelX = (gridX + this.width / 2) * TILE_SIZE;
        this.pixelY = (gridY + this.height / 2) * TILE_SIZE;
        this.body = this.createBody();
        if (this.body) {this.body.gameObject = this;
            Matter.World.add(window.game.engine.world, this.body);
        }
    }

    createBody() {
        return Matter.Bodies.rectangle(
            this.pixelX,
            this.pixelY,
            this.width * TILE_SIZE,
            this.height * TILE_SIZE,
            {
                isStatic: true,
                label: `${this.owner}_base`,
                collisionFilter: {
                    category: COLLISION_CATEGORIES.terrain, // 视作地形
                    mask: COLLISION_CATEGORIES.ground_unit // 只与地面单位碰撞
                }
            }
        );
    }


    takeDamage(amount) {
        this.hp -= amount;if (this.hp < 0)this.hp = 0;
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