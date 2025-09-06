class Node {
    constructor(parent = null, position = null) {
        this.parent = parent;
        this.position = position;
        this.g = 0;
        this.h = 0;
        this.f = 0;
    }
    equals(other) {
        return this.position.x === other.position.x && this.position.y === other.position.y;
    }
}

// 这个函数现在可以正常工作了，因为 PF 对象已经通过 <script> 标签加载了
function findPath(map, start, end, moveType) {
    if (moveType === 'air') {
        // 对于空中单位，直接返回直线路径
        return [{x: start.x, y: start.y}, {x: end.x, y: end.y}];
    }

    // 1. 创建一个 pathfinding-js 的 Grid 对象
    // 注意：这里的 new PF.Grid(...) 中的 PF 就是库提供的全局对象
    const grid = new PF.Grid(map.width, map.height);

    // 2. 根据你的地图数据设置障碍物
    for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
            const tile = map.getTile(x, y);
            if (tile && !TERRAIN_TYPES[tile.type].traversableBy.includes(moveType)) {
                // 将不可通行的地块设置为障碍
                grid.setWalkableAt(x, y, false);
            }
        }
    }

    // 3. 创建一个 JPS 寻路器实例
    const finder = new PF.JumpPointFinder({
        allowDiagonal: true,      // 允许对角线移动
        dontCrossCorners: true  // 不允许穿过墙角
    });

    // 4. 寻路，注意这里的输入是 x, y 坐标，不是 {x, y} 对象
    const path = finder.findPath(start.x, start.y, end.x, end.y, grid);

    // 5. 将结果 [ [x1, y1], [x2, y2] ] 转换为你的游戏需要的格式 [ {x, y}, {x, y} ]
    return path.map(p => ({ x: p[0], y: p[1] }));
}

function isLineOfSightClear(startPos, endPos, map, moveType) {
    if (moveType === 'air') {
        return true;
    }

    const startGrid = { x: Math.floor(startPos.x / TILE_SIZE), y: Math.floor(startPos.y / TILE_SIZE) };
    const endGrid = { x: Math.floor(endPos.x / TILE_SIZE), y: Math.floor(endPos.y / TILE_SIZE) };

    let x0 = startGrid.x;
    let y0 = startGrid.y;
    const x1 = endGrid.x;
    const y1 = endGrid.y;

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = (x0 < x1) ? 1 : -1;
    const sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;

    while (true) {
        const tile = map.getTile(x0, y0);
        if (!tile || !TERRAIN_TYPES[tile.type].traversableBy.includes(moveType)) {
            // 如果起点或终点本身不可通行，也算作没有视线
            if (x0 !== startGrid.x || y0 !== startGrid.y) {
                 return false;
            }
        }

        if ((x0 === x1) && (y0 === y1)) break;

        const e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x0 += sx;
        }
        if (e2 < dx) {
            err += dx;
            y0 += sy;
        }
    }

    return true;
}