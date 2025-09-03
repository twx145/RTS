class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        this.gameState = 'setup';
        this.gameMode = 'annihilation';
        this.showDetails = false;
        this.lastTime = 0;
        this.gameSpeedModifier = 1;

        this.map = null;
        this.player = null;
        this.ai = null;
        this.playerBase = null;
        this.aiBase = null;
        
        this.fogOfWar = null;
        this.spatialGrid = null;
        this.projectiles = [];
        this.explosions = [];
        this.selectedUnits = [];
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.dragEnd = { x: 0, y: 0 };
        this.mousePos = { x: 0, y: 0 };
        this.globalMousePos = { x: 0, y: 0 };
        this.camera = { x: 0, y: 0, zoom: 1.2, minZoom: 1, maxZoom: 2.5 };
        this.isDraggingMap = false;
        this.lastDragPos = { x: 0, y: 0 };

        this.activeTouches = new Map();
        this.lastTouchDistance = 0;
        this.lastTouchCenter = null;
        
        this.dialogueSettings = null;
        this.enableFogOfWar = null;
        this.availableUnits = null;

        this.savegame = null;
    }

    init(settings) {
        const dialogueSettings = localStorage.getItem('ShenDun_dialogue_settings');
        if (dialogueSettings) {
            try {
                const dialogueConfig = JSON.parse(dialogueSettings);
                settings = {...settings, ...dialogueConfig};
            } catch (e) {
                console.error('解析对话设置失败', e);
            }
        }
        this.gameMode = settings.gameMode;
        this.showDetails = settings.showDetails;
        this.fromDialogue = settings.fromDialogue || false;
        this.user = settings.user || null;

        this.enableFogOfWar = settings.enableFogOfWar !== false;
        this.availableUnits = settings.availableUnits || Object.keys(UNIT_TYPES);

        const selectedMapData = MAP_DEFINITIONS.find(m => m.id === settings.mapId);
        this.map = new GameMap();
        this.map.load(selectedMapData);
        
        const mapWidthPixels = this.map.width * TILE_SIZE;
        const mapHeightPixels = this.map.height * TILE_SIZE;
        const gridCellSize = TILE_SIZE * 15; 
        this.spatialGrid = new SpatialGrid(mapWidthPixels, mapHeightPixels, gridCellSize);
        
        this.fogOfWar = new FogOfWar(this.map.width * TILE_SIZE, this.map.height * TILE_SIZE);
        this.camera.minZoom = Math.max(this.camera.minZoom,Math.max(this.canvas.width / this.map.width , this.canvas.height / this.map.height)/TILE_SIZE);

        const baseGridY = Math.floor(this.map.height / 2) - 1; 
        if (this.gameMode === 'annihilation' || this.gameMode === 'defend') {
            this.playerBase = new Base('player', 6, baseGridY);
            this.placeBaseOnMap(this.playerBase);
        }
        if (this.gameMode === 'annihilation' || this.gameMode === 'attack') {
            this.aiBase = new Base('ai', this.map.width - 9, baseGridY);
            this.placeBaseOnMap(this.aiBase);
        }

        const initialManpower = 100;
        this.player = new Player('player', '玩家', initialManpower);
        const aiManpower = settings.aiDifficulty === 'hell' ? Math.round(initialManpower * 1.5) : initialManpower;
        this.ai = new Player('ai', '电脑', aiManpower, true, {}, settings.aiDifficulty);
        
        this.ui = new UI(this);
        this.ai.aiController.playerBase = this.playerBase;
        this.ai.aiController.deployUnits(this.map.width, this.map.height, TILE_SIZE, this.map);
        
        this.gameSpeedModifier = GAME_SPEEDS[settings.gameSpeed];
        this.gameState = 'deployment';
        this.savegame = new saveGame(this);

        this.addEventListeners();
        this.setupInitialCamera();

        window.game = this;
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    setupInitialCamera() {
        this.camera.zoom = Math.max(1.2,this.camera.minZoom);
        let focusPoint = this.playerBase 
            ? { x: this.playerBase.pixelX, y: this.playerBase.pixelY }
            : { x: (this.map.width * TILE_SIZE) / 2, y: (this.map.height * TILE_SIZE) / 2 };
        
        this.camera.x = focusPoint.x - (this.canvas.width / 2) / this.camera.zoom;
        this.camera.y = focusPoint.y - (this.canvas.height / 2) / this.camera.zoom;
        
        this.globalMousePos = { x: this.camera.x, y: this.camera.y };

        this.constrainCamera();
    }
    
    gameLoop(currentTime) {
        const deltaTime = (currentTime - this.lastTime) / 1000 || 0;
        this.lastTime = currentTime;
        const adjustedDeltaTime = deltaTime / this.gameSpeedModifier;
        this.update(adjustedDeltaTime);
        this.draw();
        this.ui.update();
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    update(deltaTime) {
        if (this.gameState === 'gameover' || this.gameState === 'setup') return;
        this.handleEdgeScrolling(deltaTime);
        this.constrainCamera();
        
        const allPlayerUnits = [...this.player.units];
        const allAiUnits = [...this.ai.units];
        const allUnits = [...allPlayerUnits, ...allAiUnits];
        
        this.spatialGrid.clear();
        allUnits.forEach(unit => this.spatialGrid.insert(unit));
        
        if (this.gameState === 'playing' ){
            allPlayerUnits.forEach(unit => unit.update(deltaTime, allAiUnits, this.map, this.aiBase, this, this.spatialGrid));
            allAiUnits.forEach(unit => unit.update(deltaTime, allPlayerUnits, this.map, this.playerBase, this, this.spatialGrid));
            
            this.ai.update(deltaTime, this.player, this.map);
            
        }
        
        this.updatePhysics(deltaTime,allUnits);

        const remainingProjectiles = [];
        for (const p of this.projectiles) {
            const hasHitTarget = p.update(deltaTime);
            if (hasHitTarget) {
                this.handleProjectileHit(p);
            } else {
                remainingProjectiles.push(p);
            }
        }
        this.projectiles = remainingProjectiles;

        this.explosions = this.explosions.filter(e => !e.update(deltaTime));
        this.player.units = this.player.units.filter(u => u.hp > 0);
        this.ai.units = this.ai.units.filter(u => u.hp > 0);
        this.selectedUnits = this.selectedUnits.filter(u => u.hp > 0);
        if (this.enableFogOfWar) {
            this.fogOfWar.update([...this.player.units, this.playerBase].filter(Boolean));
        }

        if (this.gameState === 'playing') {
            this.checkWinConditions();
        }
    }

    draw() {
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        this.ctx.translate(-this.camera.x, -this.camera.y);

        const viewBounds = {
            left: this.camera.x,
            top: this.camera.y,
            right: this.camera.x + this.canvas.width / this.camera.zoom,
            bottom: this.camera.y + this.canvas.height / this.camera.zoom
        };

        this.map.draw(this.ctx, this.camera);
        
        if (this.playerBase) this.playerBase.draw(this.ctx, this.camera.zoom);
        if (this.aiBase) this.aiBase.draw(this.ctx, this.camera.zoom);

        const allUnits = [...this.player.units, ...this.ai.units];
        const groundSeaUnits = allUnits.filter(u => u.stats.moveType !== 'air');
        const airUnits = allUnits.filter(u => u.stats.moveType === 'air');

        const isVisible = (entity, padding = TILE_SIZE * 2) => {
            return entity.x > viewBounds.left - padding && entity.x < viewBounds.right + padding &&
                   entity.y > viewBounds.top - padding && entity.y < viewBounds.bottom + padding;
        };

        groundSeaUnits.forEach(unit => {
            if (isVisible(unit)) {
                unit.draw(this.ctx, this.selectedUnits.includes(unit), this.camera.zoom, this.showDetails)
            }
        });
        
        this.projectiles.forEach(p => { if(isVisible(p)) p.draw(this.ctx) });
        this.explosions.forEach(e => { if(isVisible(e)) e.draw(this.ctx) });
        
        airUnits.forEach(unit => {
             if (isVisible(unit)) {
                unit.draw(this.ctx, this.selectedUnits.includes(unit), this.camera.zoom, this.showDetails)
            }
        });

        if (this.enableFogOfWar) {this.fogOfWar.draw(this.ctx);}

        this.ctx.restore();
        
        if (this.isDragging && !this.isDraggingMap) {
            this.ctx.strokeStyle = 'rgba(100, 255, 100, 0.7)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(this.dragStart.x, this.dragStart.y, this.dragEnd.x - this.dragStart.x, this.dragEnd.y - this.dragStart.y);
        }
    }

    addEventListeners() {
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.selectedUnits = [];
                this.ui.clearDeploymentSelection();
            }
        });

        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        this.canvas.addEventListener('touchcancel', (e) => this.handleTouchEnd(e));
    }

    handleMouseDown(e) {
        const pos = this.getMousePos(e);
        if (e.button === 0) {
            if (e.ctrlKey) {
                this.isDraggingMap = true;
                this.lastDragPos = { x: e.clientX, y: e.clientY };
                this.canvas.style.cursor = 'grabbing';
            } else {
                this.isDragging = true;
                this.dragStart = pos;
                this.dragEnd = pos;
            }
        } else if (e.button === 1) {
             this.isDraggingMap = true;
             this.lastDragPos = { x: e.clientX, y: e.clientY };
             this.canvas.style.cursor = 'grabbing';
        }
    }

    handleMouseMove(e) {
        this.mousePos = this.getMousePos(e);
        this.globalMousePos = { x: e.clientX, y: e.clientY };

        if (this.isDraggingMap) {
            const dx = e.clientX - this.lastDragPos.x;
            const dy = e.clientY - this.lastDragPos.y;
            this.camera.x -= dx / this.camera.zoom;
            this.camera.y -= dy / this.camera.zoom;
            this.lastDragPos = { x: e.clientX, y: e.clientY };
        } else if (this.isDragging) {
            this.dragEnd = this.mousePos;
        }
    }

    handleMouseUp(e) {
         if (e.button === 2) {
            const pos = this.getMousePos(e);
            this.handleRightClick(pos.x, pos.y);
            return;
        }
        if (this.isDraggingMap) {
            this.isDraggingMap = false;
            this.canvas.style.cursor = 'default';
        } else if (this.isDragging) {
            this.isDragging = false;
            const pos = this.getMousePos(e);
            if (getDistance(this.dragStart, pos) < 10) {
                this.handleLeftClick(pos.x, pos.y);
            } else {
                this.handleBoxSelection();
            }
        }
    }

    handleLeftClick(x, y) {
        const worldPos = this.screenToWorld(x, y);
        if (this.ui.selectedUnitToDeploy) {
            this.tryDeployUnit(worldPos, this.ui.selectedUnitToDeploy);
            return;
        }
        const clickedUnit = this.player.units.find(unit => getDistance(worldPos, unit) < TILE_SIZE / 2);
        if(this.selectedUnits.length > 0 && !clickedUnit) {
             // Classic RTS behavior: left clicking ground deselects.
             this.selectedUnits = [];
        } else {
            this.selectedUnits = clickedUnit ? [clickedUnit] : [];
        }
    }
    
    handleRightClick(x, y) {
        if (this.selectedUnits.length > 0) {
            const worldPos = this.screenToWorld(x, y);
            this.issueCommandForSelectedUnits(worldPos);
        }
    }

    /**
     * --- 核心修复(最终版): 正确处理攻击和移动指令的分流 ---
     */
    issueCommandForSelectedUnits(worldPos) {
        let targetEnemy = null;
        const allEnemies = [...this.ai.units, this.aiBase].filter(Boolean);
        for (const enemy of allEnemies) {
            const enemyPos = { x: enemy.pixelX || enemy.x, y: enemy.pixelY || enemy.y };
            const clickRadius = (enemy instanceof Base) ? (enemy.width * TILE_SIZE / 2) : (TILE_SIZE / 2);
            if (getDistance(worldPos, enemyPos) < clickRadius) {
                targetEnemy = enemy;
                break;
            }
        }
        
        let delay = 0;
        const delayIncrement = 5; // 5ms delay between each unit's command processing

        if (targetEnemy) {
            // --- 攻击指令 ---
            // 我们通过节流循环来分散设置每个单位的'target'。
            // 这样，每个单位的 'update' 逻辑会在不同时间点触发寻路，从而避免卡顿。
            // 这种方法可以正确触发单位自己的 'handleAttack' 逻辑，使其在射程外停下。
            this.selectedUnits.forEach(unit => {
                setTimeout(() => {
                    if (unit && unit.hp > 0) {
                        unit.target = targetEnemy;
                    }
                }, delay);
                delay += delayIncrement;
            });

        } else {
            // --- 移动指令 ---
            // 清除所有单位的目标，然后调用已经优化好的 issueGroupMoveCommand。
            this.selectedUnits.forEach(unit => unit.target = null);
            this.issueGroupMoveCommand(worldPos, this.map);
        }
    }

    tryDeployUnit(worldPos, unitType) {
        const cost = UNIT_TYPES[unitType].cost;
        if (this.player.canAfford(cost) && worldPos.x < (this.map.width * TILE_SIZE) / 3) {
            const gridX = Math.floor(worldPos.x / TILE_SIZE);
            const gridY = Math.floor(worldPos.y / TILE_SIZE);
            const tile = this.map.getTile(gridX, gridY);
            const unitStats = UNIT_TYPES[unitType];
            if (unitStats.moveType === 'air' || (tile && TERRAIN_TYPES[tile.type].traversableBy.includes(unitStats.moveType))) {
                this.player.units.push(new Unit(unitType, 'player', worldPos.x + Math.random()*2 - 1, worldPos.y +Math.random()*2 - 1));
                this.player.deductManpower(cost);
                this.ui.update();
            } else { this.ui.showGameMessage("该单位无法部署在此地形上！"); }
        } else {
            if(!this.player.canAfford(cost)) { this.ui.showGameMessage("资源不足！"); }
            else { this.ui.showGameMessage("只能在左侧1/3区域部署！"); }
        }
    }

    handleBoxSelection() {
        this.ui.clearDeploymentSelection();
        this.selectedUnits = [];
        const rect = { x: Math.min(this.dragStart.x, this.dragEnd.x), y: Math.min(this.dragStart.y, this.dragEnd.y), w: Math.abs(this.dragStart.x - this.dragEnd.x), h: Math.abs(this.dragStart.y - this.dragEnd.y) };
        this.player.units.forEach(unit => {
            const screenPos = this.worldToScreen(unit.x, unit.y);
            if (screenPos.x > rect.x && screenPos.x < rect.x + rect.w && screenPos.y > rect.y && screenPos.y < rect.y + rect.h) {
                this.selectedUnits.push(unit);
            }
        });
    }

    // 这个函数现在只用于纯粹的移动指令
    issueGroupMoveCommand(targetPos, map) {
        if (this.selectedUnits.length === 0) return;
        
        const formation = this.calculateFormation(this.selectedUnits.length, targetPos, TILE_SIZE * 2);
        const sortedUnits = [...this.selectedUnits].sort((a, b) => getDistance(a, targetPos) - getDistance(b, targetPos));

        let delay = 0;
        const delayIncrement = 5;

        sortedUnits.forEach((unit, index) => {
            const unitTargetPos = formation[index] || targetPos;
            
            setTimeout(() => {
                if (unit && unit.hp > 0) {
                     // false 代表这不是一个攻击移动，单位应该清除自己的旧目标
                     unit.issueMoveCommand(unitTargetPos, map, false);
                }
            }, delay);

            delay += delayIncrement;
        });
    }

    calculateFormation(count, center, spacing) {
        const positions = [];
        const cols = Math.ceil(Math.sqrt(count));
        const rows = Math.ceil(count / cols);
        
        const startX = center.x - ((cols - 1) * spacing) / 2;
        const startY = center.y - ((rows - 1) * spacing) / 2;

        for (let i = 0; i < count; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            positions.push({
                x: startX + col * spacing,
                y: startY + row * spacing
            });
        }
        return positions;
    }

    getMousePos(e) { const rect = this.canvas.getBoundingClientRect(); const scaleX = this.canvas.width / rect.width; const scaleY = this.canvas.height / rect.height; return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }; }
    worldToScreen(worldX, worldY) { return { x: (worldX - this.camera.x) * this.camera.zoom, y: (worldY - this.camera.y) * this.camera.zoom }; }
    screenToWorld(screenX, screenY) { return { x: screenX / this.camera.zoom + this.camera.x, y: screenY / this.camera.zoom + this.camera.y }; }
    constrainCamera() { if (!this.map) return; const mapWidthPixels = this.map.width * TILE_SIZE; const mapHeightPixels = this.map.height * TILE_SIZE; const viewWidth = this.canvas.width / this.camera.zoom; const viewHeight = this.canvas.height / this.camera.zoom; this.camera.x = Math.max(0, Math.min(this.camera.x, mapWidthPixels - viewWidth)); this.camera.y = Math.max(0, Math.min(this.camera.y, mapHeightPixels - viewHeight)); }
    
    handleWheel(e) { e.preventDefault(); const zoomFactor = e.deltaY > 0 ? 1.01 : 0.99; this.zoomAtPoint(zoomFactor, this.getMousePos(e)); }
    zoomAtPoint(factor, point) { const oldZoom = this.camera.zoom; const newZoom = Math.max(this.camera.minZoom, Math.min(this.camera.maxZoom, oldZoom / factor)); if (newZoom === oldZoom) return; const worldMouseX = point.x / oldZoom + this.camera.x; const worldMouseY = point.y / oldZoom + this.camera.y; this.camera.zoom = newZoom; this.camera.x = worldMouseX - point.x / newZoom; this.camera.y = worldMouseY - point.y / newZoom; }
    handleTouchStart(e) { e.preventDefault(); for (const touch of e.changedTouches) { this.activeTouches.set(touch.identifier, this.getTouchPos(touch)); } this.updateTouchState(); }
    getTouchPos(touch) { const rect = this.canvas.getBoundingClientRect(); const scaleX = this.canvas.width / rect.width; const scaleY = this.canvas.height / rect.height; return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY }; }
    handleTouchMove(e) { e.preventDefault(); for (const touch of e.changedTouches) { this.activeTouches.set(touch.identifier, this.getTouchPos(touch)); } const touches = Array.from(this.activeTouches.values()); if (touches.length === 2) { const currentCenter = { x: (touches[0].x + touches[1].x) / 2, y: (touches[0].y + touches[1].y) / 2 }; const currentDistance = getDistance(touches[0], touches[1]); if (this.lastTouchCenter) { const dx = currentCenter.x - this.lastTouchCenter.x; const dy = currentCenter.y - this.lastTouchCenter.y; this.camera.x -= dx / this.camera.zoom; this.camera.y -= dy / this.camera.zoom; } if (this.lastTouchDistance > 0) { const zoomFactor = this.lastTouchDistance / currentDistance; this.zoomAtPoint(zoomFactor, currentCenter); } this.lastTouchCenter = currentCenter; this.lastTouchDistance = currentDistance; } }
    handleTouchEnd(e) { for (const touch of e.changedTouches) { this.activeTouches.delete(touch.identifier); } this.updateTouchState(); }
    updateTouchState() { if (this.activeTouches.size < 2) { this.lastTouchDistance = 0; this.lastTouchCenter = null; } }


    handleEdgeScrolling(deltaTime) {
        if (this.isDraggingMap || this.isDragging || this.activeTouches.size > 0) return;
        
        const edgeMargin = 20;
        const scrollSpeed = 600 / this.camera.zoom;
        
        if (this.globalMousePos.x < edgeMargin) this.camera.x -= scrollSpeed * deltaTime;
        if (this.globalMousePos.x > window.innerWidth - edgeMargin) this.camera.x += scrollSpeed * deltaTime;
        if (this.globalMousePos.y < edgeMargin) this.camera.y -= scrollSpeed * deltaTime;
        if (this.globalMousePos.y > window.innerHeight - edgeMargin) this.camera.y += scrollSpeed * deltaTime;
    }

    updatePhysics(deltaTime) {
        const PUSH_FORCE = 30;
        const processedPairs = new Set();

        for (const cell of this.spatialGrid.grid.values()) {
            if (cell.length < 2) continue;

            for (let i = 0; i < cell.length; i++) {
                for (let j = i + 1; j < cell.length; j++) {
                    const unitA = cell[i];
                    const unitB = cell[j];

                    const pairKey = unitA.id < unitB.id ? `${unitA.id}-${unitB.id}` : `${unitB.id}-${unitA.id}`;
                    if (processedPairs.has(pairKey)) continue;
                    processedPairs.add(pairKey);
                    
                    const isAirA = unitA.stats.moveType === 'air';
                    const isAirB = unitB.stats.moveType === 'air';
                    if (isAirA !== isAirB) {
                        continue;
                    }

                    const distance = getDistance(unitA, unitB);
                    const collisionRadius = (unitA.stats.drawScale + unitB.stats.drawScale) * 0.25 * TILE_SIZE; 
                    
                    if (distance > 0 && distance < collisionRadius) {
                        const overlap = collisionRadius - distance;
                        const angle = Math.atan2(unitB.y - unitA.y, unitB.x - unitA.x);
                        const pushAmount = overlap * PUSH_FORCE * deltaTime;
                        const pushX = Math.cos(angle) * pushAmount;
                        const pushY = Math.sin(angle) * pushAmount;
                        
                        unitA.x -= pushX * 0.5;
                        unitA.y -= pushY * 0.5;
                        unitB.x += pushX * 0.5;
                        unitB.y += pushY * 0.5;
                    }
                }
            }
        }
    }
    
    handleProjectileHit(p) { this.explosions.push(new Explosion(p.x, p.y, p.stats.splashRadius || 10)); if (p.target.hp > 0) p.target.takeDamage(p.stats.damage); if (p.stats.splashRadius > 0) { const allTargets = [...this.player.units, ...this.ai.units, this.playerBase, this.aiBase].filter(Boolean); allTargets.forEach(entity => { if (entity.owner !== p.owner && entity.id !== p.target.id && entity.hp > 0) { const entityPos = { x: entity.pixelX || entity.x, y: entity.pixelY || entity.y }; const distance = getDistance(entityPos, p); if (distance < p.stats.splashRadius) { const splashDamage = p.stats.damage * (1 - distance / p.stats.splashRadius); entity.takeDamage(splashDamage); } } }); } }
    startGame() { if (this.gameState === 'deployment') this.gameState = 'playing'; }
    checkWinConditions() { 
        if (this.gameState !== 'playing') return; 
        const pCanDeploy = this.player.manpower >= Math.min(...Object.values(UNIT_TYPES).map(u => u.cost)); 
        const pOutOfForces = this.player.units.length === 0 && !pCanDeploy;
        switch (this.gameMode) { 
            case 'annihilation': 
                if (this.playerBase?.hp <= 0) this.endGame(this.ai); 
                else if (this.aiBase?.hp <= 0) this.endGame(this.player); 
                break; 
            case 'attack': 
                if (this.aiBase?.hp <= 0) this.endGame(this.player); 
                else if (pOutOfForces) this.endGame(this.ai); 
                break; 
            case 'defend': 
                if (this.playerBase?.hp <= 0) this.endGame(this.ai); 
                else if (this.ai.units.length === 0 && this.ai.manpower < 2) 
                    this.endGame(this.player); 
                break; 
        } 
    }
    endGame(winner) {
        if (this.gameState === 'gameover') return;
        this.gameState = 'gameover';
        
        console.log(`${winner.name} 获胜!`);
        this.ui.showWinner(winner.name);
        localStorage.removeItem('ShenDun_dialogue_settings');
        this.savegame.clearAutoSave();

        if (this.returnToDialogue())return;
    }
    returnToDialogue() {
        const currentUser = sessionStorage.getItem('currentUser');
        if (currentUser) {
            const urlParams = new URLSearchParams(window.location.search);
            const fromDialogue = urlParams.get('fromDialogue');
            if (fromDialogue === 'true') {
                const tempProgress = {
                    chapter: window.game?.gameState?.currentChapter || 0,
                    scene: window.game?.gameState?.currentScene || 0,
                    dialog: window.game?.gameState?.currentDialog || 0,
                    timestamp: new Date().getTime()
                };
                localStorage.setItem(`ShenDun_temp_progress_${currentUser}`, JSON.stringify(tempProgress));
                setTimeout(() => {window.location.href = `loading.html?target=dialogue.html&returnFromGame=true&user=${JSON.parse(currentUser).username}`;},2000);
                return true;
            }
        }
        return false;
    }
    placeBaseOnMap(base) { for (let y = 0; y < base.height; y++) { for (let x = 0; x < base.width; x++) { this.map.setTileType(base.gridX + x, base.gridY + y, 'base'); } } }

    getSaveData() {
        return {
            gameState: this.gameState,
            gameMode: this.gameMode,
            player: {
                manpower: this.player.manpower,
                units: this.player.units.map(unit => ({
                    type: unit.type,
                    x: unit.x,
                    y: unit.y,
                    hp: unit.hp
                }))
            },
            ai: {
                manpower: this.ai.manpower,
                units: this.ai.units.map(unit => ({
                    type: unit.type,
                    x: unit.x,
                    y: unit.y,
                    hp: unit.hp
                }))
            },
            playerBase: this.playerBase ? { hp: this.playerBase.hp } : null,
            aiBase: this.aiBase ? { hp: this.aiBase.hp } : null,
            timestamp: new Date().getTime()
        };
    }
    
    loadSaveData(saveData) {
        console.log('加载存档:', saveData);
    }
    
    skipCurrentScenario() {
        if (this.gameMode === 'annihilation' || this.gameMode === 'attack') {
            this.aiBase.hp = 0;
        } else if (this.gameMode === 'defend') {
            this.playerBase.hp = 0;
        }
        this.gameState = 'playing';
        
        this.checkWinConditions();
    }
    
    returnToMainMenu() {
        this.cleanup();
        window.location.href = 'index.html';
    }
    
    cleanup() {
        cancelAnimationFrame(this.animationFrameId);
    }
}