// Node 类不再需要，可以删除
// class Node { ... }

/**
 * 使用 pathfinding-js 库重构的寻路函数
 * @param {GameMap} map - 游戏地图对象
 * @param {{x: number, y: number}} start - 起点网格坐标
 * @param {{x: number, y: number}} end - 终点网格坐标
 * @param {string} moveType - 移动类型 ('ground', 'air', 'sea' 等)
 * @returns {Array<{x: number, y: number}> | null} - 返回路径节点数组或 null
 */
function findPath(map, start, end, moveType) {
    // 1. 特殊单位处理：对于空中单位，路径仍然是直线。
    // 注意：你原始代码中 if (moveType === 'air'|| moveType === 'ground' ) 可能有误，
    // 地面单位（ground）应该是需要寻路的。这里我只为空中单位（air）返回直线。
    if (moveType === 'air') {
        return [start, end];
    }

    // 2. 创建一个适配 pathfinding-js 的网格（Grid）
    // 这个库需要一个二维数组来表示地图，0代表可通行，1代表障碍物。
    const grid = new PF.Grid(map.width, map.height);

    for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
            const tile = map.getTile(x, y);
            
            // 根据地形的可通行属性来设置节点是否为障碍
            const isWalkable = tile && TERRAIN_TYPES[tile.type].traversableBy.includes(moveType);
            
            // isWalkable 为 true，则设置为 0 (可通行)
            // isWalkable 为 false，则设置为 1 (障碍)
            grid.setWalkableAt(x, y, isWalkable);
        }
    }

    // 3. 初始化寻路器
    // AStarFinder 是 A* 寻路器。该库还支持其他算法。
    // allowDiagonal: true 允许斜向移动，这与你之前的实现一致。
    const finder = new PF.AStarFinder({
        allowDiagonal: true,
        dontCrossCorners: true // 防止单位穿过角落
    });

    // 4. 查找路径
    // pathfinding-js 返回的路径是 [[x1, y1], [x2, y2], ...] 格式的数组
    const path = finder.findPath(start.x, start.y, end.x, end.y, grid);

    // 5. 格式化并返回结果
    // 你的游戏需要 [{x, y}, {x, y}, ...] 格式，所以我们需要转换一下。
    if (path.length === 0) {
        // 如果找不到路径，返回 null，与之前的逻辑保持一致
        return null;
    } else {
        // 将 [x, y] 格式转换为 {x: x, y: y}
        return path.map(p => ({ x: p[0], y: p[1] }));
    }
}


// ！！！重要：这个函数不是A*寻路的一部分，而是用于路径平滑（拉直路径）的，必须保留！
// 你的 Unit.js 中的 findSmoothedPathTarget 方法依赖此函数。
function isLineOfSightClear(startPos, endPos, map, moveType) {
    // 核心修复: 空中单位永远视野清晰，无视地形
    if (moveType === 'air') {
        return true;
    }

    const dx = endPos.x - startPos.x;
    const dy = endPos.y - startPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const step = TILE_SIZE / 2;
    const steps = Math.ceil(distance / step);

    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const checkX = startPos.x + dx * t;
        const checkY = startPos.y + dy * t;

        const gridX = Math.floor(checkX / TILE_SIZE);
        const gridY = Math.floor(checkY / TILE_SIZE);

        const tile = map.getTile(gridX, gridY);
        if (!tile || !TERRAIN_TYPES[tile.type].traversableBy.includes(moveType)) {
            return false;
        }
    }
    return true;
}