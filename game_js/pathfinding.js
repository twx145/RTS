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

function findPath(map, start, end, moveType) {
    if (moveType === 'air') {
        return [{x: start.x, y: start.y}, {x: end.x, y: end.y}];
    }

    const grid = new PF.Grid(map.width, map.height);

    for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
            const tile = map.getTile(x, y);
            if (tile && !TERRAIN_TYPES[tile.type].traversableBy.includes(moveType)) {
                grid.setWalkableAt(x, y, false);
            }
        }
    }

    const finder = new PF.JumpPointFinder({
        allowDiagonal: true,      
        dontCrossCorners: true  
    });

    const path = finder.findPath(start.x, start.y, end.x, end.y, grid);

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