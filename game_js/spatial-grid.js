// js/spatial-grid.js

/**
 * 空间网格，用于快速查询附近的单位，是RTS游戏性能优化的核心。
 * 它将游戏世界划分为一个网格，每个单位被放置在对应的格子里。
 * 当需要查询一个单位附近的其它单位时，只需检查其所在格子及周围的格子即可，
 * 避免了全局遍历，从而将 O(n^2) 的复杂度降低到接近 O(n)。
 */
export class SpatialGrid {
    /**
     * @param {number} mapWidth - 地图的总像素宽度
     * @param {number} mapHeight - 地图的总像素高度
     * @param {number} cellSize - 每个格子的像素尺寸
     */
    constructor(mapWidth, mapHeight, cellSize) {
        this.cellSize = cellSize;
        this.gridWidth = Math.ceil(mapWidth / cellSize);
        this.gridHeight = Math.ceil(mapHeight / cellSize);
        this.grid = new Map(); // 使用Map来存储格子，key是 "x,y"，value是单位数组
    }

    /**
     * 将网格坐标转换为唯一的字符串键。
     * @param {number} gridX 
     * @param {number} gridY 
     * @returns {string}
     */
    _getKey(gridX, gridY) {
        return `${gridX},${gridY}`;
    }

    /**
     * 清空所有格子，为新的一帧做准备。
     */
    clear() {
        this.grid.clear();
    }

    /**
     * 将一个单位插入到它所在的格子中。
     * @param {Unit} unit 
     */
    insert(unit) {
        const gridX = Math.floor(unit.x / this.cellSize);
        const gridY = Math.floor(unit.y / this.cellSize);
        const key = this._getKey(gridX, gridY);

        if (!this.grid.has(key)) {
            this.grid.set(key, []);
        }
        this.grid.get(key).push(unit);
    }

    /**
     * 获取一个单位附近（自身格子 + 周围8个格子）的所有单位。
     * @param {Unit} unit 
     * @returns {Array<Unit>}
     */
    getNearby(unit) {
        const nearbyUnits = [];
        const centralGridX = Math.floor(unit.x / this.cellSize);
        const centralGridY = Math.floor(unit.y / this.cellSize);

        for (let y = -1; y <= 1; y++) {
            for (let x = -1; x <= 1; x++) {
                const checkGridX = centralGridX + x;
                const checkGridY = centralGridY + y;
                const key = this._getKey(checkGridX, checkGridY);

                if (this.grid.has(key)) {
                    nearbyUnits.push(...this.grid.get(key));
                }
            }
        }
        return nearbyUnits;
    }
    
    /**
     * 获取一个点周围指定半径内的所有单位
     * @param {object} position - {x, y}
     * @param {number} radius - 查询半径
     * @returns {Array<Unit>}
     */
    getNearbyWithRadius(position, radius) {
        const nearbyUnits = [];
        const minGridX = Math.floor((position.x - radius) / this.cellSize);
        const maxGridX = Math.floor((position.x + radius) / this.cellSize);
        const minGridY = Math.floor((position.y - radius) / this.cellSize);
        const maxGridY = Math.floor((position.y + radius) / this.cellSize);

        for (let y = minGridY; y <= maxGridY; y++) {
            for (let x = minGridX; x <= maxGridX; x++) {
                const key = this._getKey(x, y);
                 if (this.grid.has(key)) {
                    nearbyUnits.push(...this.grid.get(key));
                }
            }
        }
        return nearbyUnits;
    }
}