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

    /**
     * 核心重构：实现地形边缘混合渲染
     */
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
                
                // 1. 绘制基础地形颜色
                const baseColor = TERRAIN_TYPES[tile.type].color;
                ctx.fillStyle = baseColor;
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE + 1, TILE_SIZE + 1); // +1 修复缝隙

                // 2. 检查邻居并绘制地形混合效果
                const neighbors = [ { dx: 0, dy: -1, dir: 'top' }, { dx: 1, dy: 0, dir: 'right' }, { dx: 0, dy: 1, dir: 'bottom' }, { dx: -1, dy: 0, dir: 'left' } ];

                for (const neighbor of neighbors) {
                    const nx = x + neighbor.dx;
                    const ny = y + neighbor.dy;

                    const currentType = TERRAIN_TYPES[tile.type];
                    if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                        const neighborTile = this.grid[ny][nx];
                        const neighborType = TERRAIN_TYPES[neighborTile.type];

                        // 如果邻居优先级更高，并且两者都参与混合，则绘制混合图案
                        if (neighborType.priority > currentType.priority && currentType.priority > 0) {
                            this._drawBlendPattern(ctx, x, y, neighbor.dir, neighborType.color);
                        }
                    }
                }

                // 3. 绘制原有的地形细节（小杂色点）
                const detailKey = `${x},${y}`;
                if (!this.terrainDetails.has(detailKey)) {
                    // ... (这部分逻辑保持不变)
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

    /**
     * 核心新增：根据方向绘制确定的随机混合图案
     * @param {CanvasRenderingContext2D} ctx - 绘图上下文
     * @param {number} x - 当前瓦片的格子X坐标
     * @param {number} y - 当前瓦片的格子Y坐标
     * @param {string} direction - 邻居的方向 ('top', 'right', 'bottom', 'left')
     * @param {string} blendColor - 邻居（高优先级地形）的颜色
     */
    _drawBlendPattern(ctx, x, y, direction, blendColor) {
        ctx.fillStyle = blendColor;
        const subTileCount = 8; // 将瓦片边缘分为4个小块
        const subTileSize = TILE_SIZE / subTileCount + 2; 
        const pixelX = x * TILE_SIZE;
        const pixelY = y * TILE_SIZE;

        for (let i = 0; i < subTileCount; i++) {
            // 使用瓦片坐标和块索引作为种子，确保图案唯一且固定
            const seed = x * 13 + y * 31 + i * 7 + direction.charCodeAt(0);
            const randomVal = seededRandom(seed);
            
            if (randomVal < 0.6) { // 约60%的概率绘制混合块
                const blendDepth = Math.ceil(seededRandom(seed * 2) * 2) * subTileSize; // 混合深度为1或2个小块
                
                let rectX, rectY, rectW, rectH;

                switch (direction) {
                    case 'top': // 上方邻居侵入下方（当前瓦片）
                        rectX = pixelX + i * subTileSize;
                        rectY = pixelY;
                        rectW = subTileSize;
                        rectH = blendDepth;
                        break;
                    case 'bottom': // 下方邻居侵入上方
                        rectX = pixelX + i * subTileSize;
                        rectY = pixelY + TILE_SIZE - blendDepth;
                        rectW = subTileSize;
                        rectH = blendDepth;
                        break;
                    case 'left': // 左方邻居侵入右方
                        rectX = pixelX;
                        rectY = pixelY + i * subTileSize;
                        rectW = blendDepth;
                        rectH = subTileSize;
                        break;
                    case 'right': // 右方邻居侵入左方
                        rectX = pixelX + TILE_SIZE - blendDepth;
                        rectY = pixelY + i * subTileSize;
                        rectW = blendDepth;
                        rectH = subTileSize;
                        break;
                }
                 ctx.fillRect(rectX, rectY, rectW, rectH);
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