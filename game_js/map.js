import { TILE_SIZE, TERRAIN_TYPES } from './config.js';

function seededRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

export class GameMap {
    constructor() {
        this.width = 0;
        this.height = 0;
        this.grid = [];
        this.terrainDetails = new Map();
    }

    load(mapData) {
        this.width = mapData.width;
        this.height = mapData.height;
        const terrainMap = { 'g': 'grass', 'f': 'forest', 'r': 'road', 'w': 'water', 'b': 'building' };
        this.grid = Array(this.height).fill(null).map(() => Array(this.width).fill(null));
        for (let y = 0; y < this.height; y++) {
            const rowString = mapData.grid[y] || '';
            for (let x = 0; x < this.width; x++) {
                const char = rowString[x] || 'g';
                const type = terrainMap[char];
                this.grid[y][x] = { type };
            }
        }
    }

    draw(ctx, camera) {
        const startX = Math.floor(camera.x / TILE_SIZE);
        const startY = Math.floor(camera.y / TILE_SIZE);
        const endX = Math.ceil((camera.x + ctx.canvas.width / camera.zoom) / TILE_SIZE);
        const endY = Math.ceil((camera.y + ctx.canvas.height / camera.zoom) / TILE_SIZE);

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                if (x < 0 || y < 0 || x >= this.width || y >= this.height) continue;
                
                const tile = this.grid[y][x];
                if (!tile) continue;
                
                const baseColor = TERRAIN_TYPES[tile.type].color;
                ctx.fillStyle = baseColor;

                // --- 核心修复: 绘制稍大的瓦片以覆盖像素间隙（黑线） ---
                const drawSize = TILE_SIZE + 1;
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, drawSize, drawSize);

                 const detailKey = `${x},${y}`;
                if (!this.terrainDetails.has(detailKey)) {
                    const details = [];
                    const numDetails = Math.floor(seededRandom(y * this.width + x + 1) * 5);
                    for (let i = 0; i < numDetails; i++) {
                        details.push({
                            x: seededRandom(i + x * y + 2) * TILE_SIZE,
                            y: seededRandom(i * 2 + x * y + 3) * TILE_SIZE,
                            size: seededRandom(i * 3 + x * y + 4) * (TILE_SIZE / 4) + 2,
                            color: this.adjustColor(baseColor, (seededRandom(i * 4 + x * y + 5) - 0.5) * 0.2)
                        });
                    }
                    this.terrainDetails.set(detailKey, details);
                }
                const cachedDetails = this.terrainDetails.get(detailKey);
                for(const detail of cachedDetails) {
                    ctx.fillStyle = detail.color;
                    ctx.fillRect(x * TILE_SIZE + detail.x, y * TILE_SIZE + detail.y, detail.size, detail.size);
                }
            }
        }
    }

    adjustColor(hex, percent) {
        let r = parseInt(hex.substring(1, 3), 16);
        let g = parseInt(hex.substring(3, 5), 16);
        let b = parseInt(hex.substring(5, 7), 16);
        const amount = Math.floor(255 * percent);
        r = Math.max(0, Math.min(255, r + amount));
        g = Math.max(0, Math.min(255, g + amount));
        b = Math.max(0, Math.min(255, b + amount));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    getTile(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.grid[y][x];
        }
        return null;
    }

    setTileType(x, y, newType) {
        const tile = this.getTile(x, y);
        if (tile && TERRAIN_TYPES[newType]) {
            tile.type = newType;
        }
    }
}