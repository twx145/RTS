// js/pathfinding.js
import { TILE_SIZE, TERRAIN_TYPES } from './config.js';

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

export function findPath(map, start, end, moveType) {
    // 对于空中单位，路径就是起点到终点的直线
    if (moveType === 'air') {
        // A* 算法需要一系列节点，所以即使是直线，也返回包含起点和终点的数组
        return [start, end];
    }
    
    const startNode = new Node(null, start);
    const endNode = new Node(null, end);

    let openList = [];
    let closedList = [];

    openList.push(startNode);
    
    const maxIterations = map.width * map.height * 1.5;
    let iterations = 0;

    while (openList.length > 0 && iterations < maxIterations) {
        iterations++;
        let currentNode = openList[0];
        let currentIndex = 0;
        for (let i = 1; i < openList.length; i++) {
            if (openList[i].f < currentNode.f) {
                currentNode = openList[i];
                currentIndex = i;
            }
        }

        openList.splice(currentIndex, 1);
        closedList.push(currentNode);

        if (currentNode.equals(endNode)) {
            let path = [];
            let current = currentNode;
            while (current !== null) {
                path.push(current.position);
                current = current.parent;
            }
            return path.reverse();
        }

        const adjacentSquares = [
            { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 },
            { x: -1, y: -1 }, { x: -1, y: 1 }, { x: 1, y: -1 }, { x: 1, y: 1 }
        ];

        childLoop: for (const newPosition of adjacentSquares) {
            const nodePosition = {
                x: currentNode.position.x + newPosition.x,
                y: currentNode.position.y + newPosition.y,
            };

            const tile = map.getTile(nodePosition.x, nodePosition.y);
            if (!tile || !TERRAIN_TYPES[tile.type].traversableBy.includes(moveType)) {
                continue;
            }
            
            const childNode = new Node(currentNode, nodePosition);
            if (closedList.find(node => node.equals(childNode))) {
                 continue childLoop;
            }

            const moveCost = (newPosition.x !== 0 && newPosition.y !== 0) ? 1.414 : 1;
            childNode.g = currentNode.g + moveCost;
            childNode.h = Math.sqrt(((childNode.position.x - endNode.position.x) ** 2) + ((childNode.position.y - endNode.position.y) ** 2));
            childNode.f = childNode.g + childNode.h;

            const existingNode = openList.find(node => node.equals(childNode));
            if (existingNode && childNode.g >= existingNode.g) {
                continue childLoop;
            }
            
            if (existingNode) {
                existingNode.parent = currentNode;
                existingNode.g = childNode.g;
                existingNode.f = childNode.f;
            } else {
                openList.push(childNode);
            }
        }
    }

    return null;
}


/**
 * 检查两点之间是否有地形障碍（用于路径平滑）
 */
export function isLineOfSightClear(startPos, endPos, map, moveType) {
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