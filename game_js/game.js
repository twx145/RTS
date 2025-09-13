class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        this.gameState = 'setup';
        this.gameMode = 'annihilation';
        this.showDetails = false;
        this.lastTime = 0;
        this.gameSpeedModifier = 1;

        this.engine = null; 

        this.map = null;
        this.mapId = null;
        this.player = null;
        this.ai = null;
        this.playerBase = null;
        this.aiBase = null;
        
        this.fogOfWar = null;
        this.projectiles = [];
        this.explosions = [];
        this.selectedUnits = [];
        this.isDragging = false; // Mouse drag for selection
        this.dragStart = { x: 0, y: 0 };
        this.dragEnd = { x: 0, y: 0 };
        this.mousePos = { x: 0, y: 0 };
        this.globalMousePos = { x: 0, y: 0 };
        this.camera = { x: 0, y: 0, zoom: 1.2, minZoom: 1.0, maxZoom: 4.0 };
        this.isDraggingMap = false;
        this.lastDragPos = { x: 0, y: 0 };

        this.controlGroups = Array.from({ length: 10 }, () => []);

        // --- MOBILE ADAPTATION: Properties for touch controls ---
        this.activeTouches = new Map();
        this.lastTouchDistance = 0;
        this.lastTouchCenter = null;
        this.touchStartTime = 0;
        this.touchStartPos = { x: 0, y: 0 };
        this.isTouchSelectDragging = false; // Touch drag for selection

        // --- CORE CHANGE: Add properties to detect double-taps ---
        this.lastTapTime = 0;
        this.lastTapPos = { x: 0, y: 0 };
        this.DOUBLE_TAP_THRESHOLD = 300; // Milliseconds between taps for a double tap

        this.dialogueSettings = null;
        this.enableFogOfWar = null;
        this.availableUnits = null;

        this.savegame = null;
        this.achievements = null;
        this.skip = false;
        this.gameObjectives = null;
        this.escortUnit = null;
        this.targetUnit = null;
        this.objectiveMarkers = [];
        this.destination = null;
        this.buildingsManager = null;
        this.userInteracted = false;
        this.audioManager = {
            bgm: null,
            currentBGM: null,
            bgmVolume: 0.8,
            sfxVolume: 0.8,
            bgmQueue: null, 
            playBGM: function(src, loop = true) { if (this.currentBGM === src) return; if (this.bgm) { this.bgm.pause(); this.bgm = null; } if (src) { this.bgm = new Audio(`../assets/bgm/${src}`); this.bgm.volume = this.bgmVolume; this.bgm.loop = loop; if (this.userInteracted) { this.bgm.play().catch(e => console.log("BGM播放失败")); } else { this.bgmQueue = src; } this.currentBGM = src; } },
            handleUserInteraction: function() { this.userInteracted = true; if (this.bgmQueue && this.bgm) { this.bgm.play().catch(e => console.log("BGM播放失败")); this.bgmQueue = null; } },
            setBGMVolume: function(volume) { this.bgmVolume = volume; if (this.bgm) { this.bgm.volume = volume; } },
            setSFXVolume: function(volume) { this.sfxVolume = volume; },
            stopBGM: function() { if (this.bgm) { this.bgm.pause(); this.bgm = null; this.currentBGM = null; } this.bgmQueue = null; }
        };
    }

    init(settings) {
        window.game = this;
        this.mapId = settings.mapId;
        const dialogueSettings = localStorage.getItem('ShenDun_dialogue_settings');
        if (dialogueSettings) {
            try { const dialogueConfig = JSON.parse(dialogueSettings); settings = {...settings, ...dialogueConfig}; } catch (e) { console.error('解析对话设置失败', e); }
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
        if (settings.bgm) { this.audioManager.playBGM(settings.bgm); } else { const mapBGM = selectedMapData.bgm; if (mapBGM) { this.audioManager.playBGM(mapBGM); } }
        this.engine = Matter.Engine.create({ positionIterations: 8, velocityIterations: 6 });
        this.engine.world.gravity.y = 0;
        Matter.Events.on(this.engine, 'collisionStart', (event) => { const pairs = event.pairs; for (let i = 0; i < pairs.length; i++) { const pair = pairs[i]; const bodyA = pair.bodyA; const bodyB = pair.bodyB; const unitA = bodyA.gameObject; const unitB = bodyB.gameObject; if (unitA instanceof Unit && unitB instanceof Unit) { this.handleUnitCollision(unitA, unitB, bodyA, bodyB); } } });
        this.fogOfWar = new FogOfWar(this.map.width * TILE_SIZE, this.map.height * TILE_SIZE);
        this.camera.minZoom = Math.max(this.camera.minZoom,Math.max(this.canvas.width / this.map.width , this.canvas.height / this.map.height)/TILE_SIZE);
        const baseGridY = Math.floor(this.map.height / 2) - 1; 
        if (this.gameMode === 'tutorial' || this.gameMode === 'annihilation' || this.gameMode === 'defend') { this.playerBase = new Base('player', 6, baseGridY); this.placeBaseOnMap(this.playerBase); }
        if (this.gameMode === 'tutorial' || this.gameMode === 'annihilation' || this.gameMode === 'attack') { this.aiBase = new Base('ai', this.map.width - 9, baseGridY); this.placeBaseOnMap(this.aiBase); }
        this.createTerrainBodies();
        this.buildingsManager = new BuildingsManager(this);
        this.buildingsManager.initialize();
        const playerManpower = settings.playerManpower || 50;
        const aiManpower = settings.aiManpower || (settings.aiDifficulty === 'hell' ? Math.round(playerManpower * 1.5) : playerManpower);
        this.player = new Player('player', '玩家', playerManpower);
        this.ai = new Player('ai', '电脑', aiManpower, true, {}, settings.aiDifficulty);
        this.ui = new UI(this);
        this.ai.aiController.playerBase = this.playerBase;
        this.ai.aiController.deployUnits(this.map.width, this.map.height, TILE_SIZE, this.map, settings.aiDeployments);
        this.gameObjectives = settings.objectives || [];
        this.escortUnit = settings.escortUnit || null;
        this.targetUnit = settings.targetUnit || null;
        if(settings.destination){ this.destination = {x: settings.destination.x * TILE_SIZE, y: settings.destination.y * TILE_SIZE} ; }
        this.setupObjectiveMarkers();
        this.gameSpeedModifier = GAME_SPEEDS[settings.gameSpeed];
        this.gameState = 'deployment';
        this.savegame = new saveGame(this);
        this.achievements = this.loadAchievements();
        this.achievementStats = { unitsDeployed: new Set(), unitsLost: 0, enemyTanksDestroyed: 0, enemyShipsDestroyed: 0, infantryVsVehicles: 0, maxUnitsAlive: 0, navalVsLandKills: 0, landVsNavalKills: 0, difficulty: settings.aiDifficulty };
        this.levelStartTime = Date.now();
        this.levelCompleted = false;
        this.addEventListeners();
        this.setupInitialCamera();
        window.game = this;
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    updateTouchState() {
    if (this.activeTouches.size < 2) {
        this.lastTouchDistance = 0;
        this.lastTouchCenter = null;
    }
}
    handleUserInteraction() { this.userInteracted = true; this.audioManager.handleUserInteraction(); }
    handleUnitCollision(unitA, unitB, bodyA, bodyB) { let crusher = null; let crushed = null; let crusherBody = null; if (unitA.stats.canCrush && unitB.stats.isCrushable) { crusher = unitA; crushed = unitB; crusherBody = bodyA; } else if (unitB.stats.canCrush && unitA.stats.isCrushable) { crusher = unitB; crushed = unitA; crusherBody = bodyB; } if (crusher && crushed) { if (crusher.owner !== crushed.owner && crusherBody.speed > 0.5 && crushed.crushDamageCooldown <= 0) { crushed.takeDamage(CRUSH_DAMAGE, crusher); crushed.crushDamageCooldown = 1.0; } } }
    createTerrainBodies() { const staticBodies = []; for (let y = 0; y < this.map.height; y++) { for (let x = 0; x < this.map.width; x++) { const tile = this.map.getTile(x, y); if (tile && TERRAIN_TYPES[tile.type].traversableBy.length === 0) { const body = Matter.Bodies.rectangle( x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE, TILE_SIZE, { isStatic: true, label: 'terrain', collisionFilter: { category: COLLISION_CATEGORIES.terrain, mask: COLLISION_CATEGORIES.ground_unit } } ); staticBodies.push(body); } } } Matter.World.add(this.engine.world, staticBodies); }
    setupInitialCamera() { let focusPoint = this.playerBase ? { x: this.playerBase.pixelX, y: this.playerBase.pixelY } : { x: (this.map.width * TILE_SIZE) / 2, y: (this.map.height * TILE_SIZE) / 2 }; let zoomLevel = 1.5; switch (this.mapId) { case 'map_chapter1': focusPoint = { x: TILE_SIZE * 15, y: TILE_SIZE * 30 }; zoomLevel = 1.5; break; case 'map_chapter2': focusPoint = { x: TILE_SIZE * 40, y: TILE_SIZE * 30 }; zoomLevel = 1.5; break; case 'map_chapter3': focusPoint = { x: TILE_SIZE * 15, y: TILE_SIZE * 35 }; zoomLevel = 1.5; break; case 'map_chapter4': focusPoint = { x: TILE_SIZE * 15, y: TILE_SIZE * 40 }; zoomLevel = 1.5; break; case 'map_chapter5_1': focusPoint = { x: TILE_SIZE, y: TILE_SIZE }; zoomLevel = 3.0; break; case 'map_chapter5_2': focusPoint = { x: TILE_SIZE * 35, y: TILE_SIZE * 35 }; zoomLevel = 1.5; break; case 'map_new_01': zoomLevel = 1.3; break; case 'map01': zoomLevel = 1.1; break; case 'map_new': zoomLevel = 1.8; break; default: break; } this.camera.zoom = Math.max(zoomLevel, this.camera.minZoom); this.camera.x = focusPoint.x - (this.canvas.width / 2) / this.camera.zoom; this.camera.y = focusPoint.y - (this.canvas.height / 2) / this.camera.zoom; this.globalMousePos = { x: window.innerWidth / 2, y: window.innerHeight / 2 }; this.constrainCamera(); }
    setupObjectiveMarkers() { this.objectiveMarkers = []; switch (this.gameMode) { case 'objective': if (this.gameObjectives && this.gameObjectives.length > 0) { this.gameObjectives.forEach(obj => { const parts = obj.split(':'); if (parts[0] === 'destroy_building') { const buildingType = parts[1]; const position = this.findBuildingPosition(buildingType); if (position) { this.objectiveMarkers.push({ type: 'destroy', x: position.x, y: position.y, buildingType: buildingType }); } } else if (parts[0] === 'guide_debris') { const targetType = parts[1]; const position = this.findTrenchPosition(targetType); if (position) { this.objectiveMarkers.push({ type: 'guide', x: position.x, y: position.y, targetType: targetType }); } } }); } break; case 'assassination': if (this.targetUnit) { this.createTargetUnit(this.targetUnit); this.objectiveMarkers.push({ type: 'assassinate', unit: this.targetUnit }); } break; case 'escort': if (this.escortUnit && this.destination) { this.createEscortUnit(this.escortUnit, this.destination); this.objectiveMarkers.push({ type: 'escortdestination', destination: this.destination }); this.objectiveMarkers.push({ type: 'escort', unit: this.escortUnit, }); } break; } }
    findBuildingPosition(buildingType) { const specialbuildings = this.buildingsManager.specialBuildings; const positions = { 'barracks': specialbuildings['barracks']?{ x: specialbuildings['barracks'][0].pixelX, y: specialbuildings['barracks'][0].pixelY}:null, 'armory': specialbuildings['armory']?{ x: specialbuildings['armory'][0].pixelX, y: specialbuildings['armory'][0].pixelY}:null, 'command_center': specialbuildings['command_center']?{ x: specialbuildings['command_center'][0]?.pixelX, y: specialbuildings['command_center'][0]?.pixelY}:null, 'power_station_1': specialbuildings['power_station']?{ x: specialbuildings['power_station'][0]?.pixelX, y: specialbuildings['power_station'][0]?.pixelY}:null, 'power_station_2': specialbuildings['power_station']?{ x: specialbuildings['power_station'][1]?.pixelX, y: specialbuildings['power_station'][1]?.pixelY}:null, 'power_station_3': specialbuildings['power_station']?{ x: specialbuildings['power_station'][2]?.pixelX, y: specialbuildings['power_station'][2]?.pixelY}:null, 'control_tower': specialbuildings['control_tower']?{ x: specialbuildings['control_tower'][0]?.pixelX, y: specialbuildings['control_tower'][0]?.pixelY}:null }; return positions[buildingType] || null; }
    findTrenchPosition(trenchType) { return { x: this.map.width * TILE_SIZE * 0.9, y: this.map.height * TILE_SIZE * 0.9 }; }
    createTargetUnit(targetType) { const position = { x: this.map.width * TILE_SIZE * 0.5, y: this.map.height * TILE_SIZE * 0.5 }; const targetUnit = new Unit(targetType, 'ai', position.x, position.y); targetUnit.isTargetUnit = true; targetUnit.name = "毒蛇指挥单位"; this.ai.units.push(targetUnit); this.targetUnit = targetUnit; }
    createEscortUnit(unitType, destination) { const startPosition = { x: TILE_SIZE * 5, y: TILE_SIZE }; const escortUnit = new Unit(unitType, 'player', startPosition.x, startPosition.y); escortUnit.isEscortUnit = true; escortUnit.destination = destination; escortUnit.speed = 0.5; this.player.units.push(escortUnit); this.escortUnit = escortUnit; }
    
    gameLoop(currentTime) { if (!this.lastTime) this.lastTime = currentTime; const deltaTime = (currentTime - this.lastTime) / 1000; this.lastTime = currentTime; const adjustedDeltaTime = deltaTime / this.gameSpeedModifier; this.update(adjustedDeltaTime); this.draw(); this.ui.update(); requestAnimationFrame(this.gameLoop.bind(this)); }
    update(deltaTime) { if (this.gameState === 'gameover' || this.gameState === 'setup') return; Matter.Engine.update(this.engine, deltaTime * 1000); this.handleEdgeScrolling(deltaTime); this.constrainCamera(); if (this.buildingsManager) { this.buildingsManager.update(deltaTime); } const allPlayerUnits = [...this.player.units]; const allAiUnits = [...this.ai.units]; const allUnits = [...allPlayerUnits, ...allAiUnits]; allUnits.forEach(unit => { if (unit.body) { unit.x = unit.body.position.x; unit.y = unit.body.position.y; unit.angle = unit.body.angle; } }); if (this.gameState === 'playing' ){ this.updateObjectives(); allPlayerUnits.forEach(unit => unit.update(deltaTime, allAiUnits, this.map, this.aiBase, this)); allAiUnits.forEach(unit => unit.update(deltaTime, allPlayerUnits, this.map, this.playerBase, this)); this.ai.update(deltaTime, this.player, this.map); } const remainingProjectiles = []; for (const p of this.projectiles) { const hasHitTarget = p.update(deltaTime); if (hasHitTarget) { this.handleProjectileHit(p); } else { remainingProjectiles.push(p); } } this.projectiles = remainingProjectiles; this.explosions = this.explosions.filter(e => !e.update(deltaTime)); this.player.units = this.player.units.filter(u => this.filterDeadUnits(u)); this.ai.units = this.ai.units.filter(u => this.filterDeadUnits(u)); this.selectedUnits = this.selectedUnits.filter(u => u.hp > 0); if (this.enableFogOfWar) this.fogOfWar.update([...this.player.units, this.playerBase].filter(Boolean)); this.updateUnitCount(); if (this.gameState === 'playing') this.checkWinConditions(); }
    updateObjectives() { if (this.player.units.length === 0 && this.player.manpower < 1) this.endGame(this.ai); switch (this.gameMode) { case 'tutorial': this.updateTutorialMode(); break; case 'objective': this.updateObjectiveMode(); break; case 'assassination': this.updateAssassinationMode(); break; case 'escort': this.updateEscortMode(); break; } }
    updateTutorialMode() { if (this.playerBase?.hp <= 0) this.endGame(this.ai); else if (this.aiBase?.hp <= 0){ this.levelCompleted = true; this.endGame(this.player); } }
    updateObjectiveMode(){ if (this.skip || this.buildingsManager.checkWinCondition()){ this.levelCompleted = true; this.checkLightningStrikeAchievement(); this.endGame(this.player); return; } if (this.buildingsManager.checkLossCondition()) { this.endGame(this.ai); return; } }
    updateAssassinationMode() { if ( (this.targetUnit && this.targetUnit.hp <= 0) || this.skip) { this.levelCompleted = true; this.checkLightningStrikeAchievement(); this.endGame(this.player); } }
    updateEscortMode() { if ((this.escortUnit && this.escortUnit.hp > 0) || this.skip){ const distance = getDistance(this.escortUnit, this.escortUnit.destination); if (distance < TILE_SIZE * 2|| this.skip) { this.levelCompleted = true; this.checkLightningStrikeAchievement(); this.endGame(this.player); } } else if (this.escortUnit && this.escortUnit.hp <= 0) { this.endGame(this.ai); } }
    findBuildingByType(buildingType) { if (buildingType === 'control_tower' && this.aiBase) { return this.aiBase; } return null; }
    filterDeadUnits(unit) { if (unit.hp > 0) { return true; } if (unit.body) { Matter.World.remove(this.engine.world, unit.body); unit.body = null; } return false; }

    draw() {
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        const viewBounds = { left: this.camera.x, top: this.camera.y, right: this.camera.x + this.canvas.width / this.camera.zoom, bottom: this.camera.y + this.canvas.height / this.camera.zoom };
        this.map.draw(this.ctx, this.camera);
        if (this.playerBase) this.playerBase.draw(this.ctx, this.camera.zoom);
        if (this.aiBase) this.aiBase.draw(this.ctx, this.camera.zoom);
        if (this.buildingsManager) { this.buildingsManager.draw(this.ctx, this.camera.zoom); }
        const allUnits = [...this.player.units, ...this.ai.units];
        const groundSeaUnits = allUnits.filter(u => u.stats.moveType !== 'air');
        const airUnits = allUnits.filter(u => u.stats.moveType === 'air');
        const isVisible = (entity, padding = TILE_SIZE * 2) => { return entity.x > viewBounds.left - padding && entity.x < viewBounds.right + padding && entity.y > viewBounds.top - padding && entity.y < viewBounds.bottom + padding; };
        groundSeaUnits.forEach(unit => { if (isVisible(unit)) { unit.draw(this.ctx, this.selectedUnits.includes(unit), this.camera.zoom, this.showDetails) } });
        this.projectiles.forEach(p => { if(isVisible(p)) p.draw(this.ctx) });
        this.explosions.forEach(e => { if(isVisible(e)) e.draw(this.ctx) });
        airUnits.forEach(unit => { if (isVisible(unit)) { unit.draw(this.ctx, this.selectedUnits.includes(unit), this.camera.zoom, this.showDetails); } });
        if (this.enableFogOfWar) {this.fogOfWar.draw(this.ctx);}
        this.ctx.restore();
        
        // --- MOBILE ADAPTATION: Draw selection box for both mouse and touch ---
        if (this.isDragging || this.isTouchSelectDragging) {
            this.ctx.strokeStyle = 'rgba(100, 255, 100, 0.7)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(this.dragStart.x, this.dragStart.y, this.dragEnd.x - this.dragStart.x, this.dragEnd.y - this.dragStart.y);
        }

        this.drawObjectiveMarkers();
    }
    
    drawObjectiveMarkers() { this.objectiveMarkers.forEach(marker => { const screenPos = this.worldToScreen(marker.x, marker.y); switch (marker.type) { case 'destroy': this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'; this.ctx.beginPath(); this.ctx.arc(screenPos.x, screenPos.y, 15, 0, Math.PI * 2); this.ctx.fill(); this.ctx.strokeStyle = 'red'; this.ctx.lineWidth = 2; this.ctx.beginPath(); this.ctx.arc(screenPos.x, screenPos.y, 15, 0, Math.PI * 2); this.ctx.stroke(); this.ctx.fillStyle = 'white'; this.ctx.font = '12px Arial'; this.ctx.fillText('摧毁', screenPos.x - 15, screenPos.y - 20); break; case 'guide': this.ctx.fillStyle = 'rgba(0, 0, 255, 0.3)'; this.ctx.beginPath(); this.ctx.arc(screenPos.x, screenPos.y, 15, 0, Math.PI * 2); this.ctx.fill(); this.ctx.strokeStyle = 'blue'; this.ctx.lineWidth = 2; this.ctx.beginPath(); this.ctx.arc(screenPos.x, screenPos.y, 15, 0, Math.PI * 2); this.ctx.stroke(); this.ctx.fillStyle = 'white'; this.ctx.font = '12px Arial'; this.ctx.fillText('引导', screenPos.x - 15, screenPos.y - 20); break; case 'assassinate': if (marker.unit && marker.unit.hp > 0) { const unitScreenPos = this.worldToScreen(marker.unit.x, marker.unit.y); this.ctx.fillStyle = 'rgba(255, 165, 0, 0.3)'; this.ctx.beginPath(); this.ctx.arc(unitScreenPos.x, unitScreenPos.y, 20, 0, Math.PI * 2); this.ctx.fill(); this.ctx.strokeStyle = 'orange'; this.ctx.lineWidth = 2; this.ctx.beginPath(); this.ctx.arc(unitScreenPos.x, unitScreenPos.y, 20, 0, Math.PI * 2); this.ctx.stroke(); this.ctx.fillStyle = 'white'; this.ctx.font = '12px Arial'; this.ctx.fillText('刺杀目标：毒蛇', unitScreenPos.x - 25, unitScreenPos.y - 25); } break; case 'escortdestination': const destScreenPos = this.worldToScreen(marker.destination.x, marker.destination.y); this.ctx.fillStyle = 'rgba(0, 255, 0, 0.3)'; this.ctx.beginPath(); this.ctx.arc(destScreenPos.x, destScreenPos.y, 15, 0, Math.PI * 2); this.ctx.fill(); this.ctx.strokeStyle = 'green'; this.ctx.lineWidth = 2; this.ctx.beginPath(); this.ctx.arc(destScreenPos.x, destScreenPos.y, 15, 0, Math.PI * 2); this.ctx.stroke(); this.ctx.fillStyle = 'white'; this.ctx.font = '12px Arial'; this.ctx.fillText('目的地', destScreenPos.x - 20, destScreenPos.y - 20); break; case 'escort': if (marker.unit && marker.unit.hp > 0) { const unitScreenPos = this.worldToScreen(marker.unit.x, marker.unit.y); this.ctx.fillStyle = 'rgba(0, 255, 0, 0.3)'; this.ctx.beginPath(); this.ctx.arc(unitScreenPos.x, unitScreenPos.y, 20, 0, Math.PI * 2); this.ctx.fill(); this.ctx.strokeStyle = 'green'; this.ctx.lineWidth = 2; this.ctx.beginPath(); this.ctx.arc(unitScreenPos.x, unitScreenPos.y, 20, 0, Math.PI * 2); this.ctx.stroke(); this.ctx.fillStyle = 'white'; this.ctx.font = '12px Arial'; this.ctx.fillText('保护目标：充能车', unitScreenPos.x - 25, unitScreenPos.y - 25); } break; } }); }

    addEventListeners() {
        const handleInteraction = () => { if (!this.userInteracted) { this.handleUserInteraction(); } };
        this.canvas.addEventListener('click', handleInteraction);
        this.canvas.addEventListener('mousedown', handleInteraction);
        this.canvas.addEventListener('touchstart', handleInteraction);
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        window.addEventListener('keydown', (e) => { if (e.key === 'Escape') { this.selectedUnits = []; this.ui.clearDeploymentSelection(); } else if (e.key === 'r' || e.key === 'R') { if (this.gameState === 'deployment') { this.undoLastDeployment(); } } else if (e.key === 'q' || e.key === 'Q') { if (this.gameState === 'playing' && this.selectedUnits.length > 0) { this.selectedUnits.forEach(unit => { unit.stop(); }); this.ui.showGameMessage("单位已停下"); } } else if (e.key === 't' || e.key === 'T') { if (this.selectedUnits.length > 0) { const typeToSelect = this.selectedUnits[0].type; this.ui.clearDeploymentSelection(); this.selectedUnits = this.player.units.filter(unit => unit.type === typeToSelect && unit.hp > 0); } } else if (e.key === 'n' || e.key === 'N') { if (this.buildingsManager) { this.buildingsManager.showBuildingNames = !this.buildingsManager.showBuildingNames; this.ui.showGameMessage(`建筑名称显示: ${this.buildingsManager.showBuildingNames ? '开启' : '关闭'}`); } } else if (e.key >= '0' && e.key <= '9') { const groupNumber = parseInt(e.key, 10); if (e.ctrlKey) { e.preventDefault(); const unitsToAssign = this.selectedUnits; if (unitsToAssign.length === 0) { this.controlGroups[groupNumber].forEach(unit => { if (unit) unit.controlGroup = null; }); this.controlGroups[groupNumber] = []; this.ui.showGameMessage(`${groupNumber} 号队伍已解散`); return; } unitsToAssign.forEach(unit => { if (unit.controlGroup !== null && unit.controlGroup !== groupNumber) { this.controlGroups[unit.controlGroup] = this.controlGroups[unit.controlGroup].filter(u => u.id !== unit.id); } }); this.controlGroups[groupNumber].forEach(oldUnit => { if (!unitsToAssign.includes(oldUnit)) { oldUnit.controlGroup = null; } }); this.controlGroups[groupNumber] = [...unitsToAssign]; this.controlGroups[groupNumber].forEach(unit => { unit.controlGroup = groupNumber; }); this.ui.showGameMessage(`部队已编入 ${groupNumber} 号队伍`); } else { this.controlGroups[groupNumber] = this.controlGroups[groupNumber].filter(u => u.hp > 0); if (this.controlGroups[groupNumber].length > 0) { this.ui.clearDeploymentSelection(); this.selectedUnits = [...this.controlGroups[groupNumber]]; } } } });
        
        // --- MOBILE ADAPTATION: Use dedicated touch event listeners ---
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        this.canvas.addEventListener('touchcancel', (e) => this.handleTouchEnd(e));
    }

    handleMouseDown(e) { const pos = this.getMousePos(e); if (e.button === 0) { if (e.ctrlKey) { this.isDraggingMap = true; this.lastDragPos = { x: e.clientX, y: e.clientY }; this.canvas.style.cursor = 'grabbing'; } else { this.isDragging = true; this.dragStart = pos; this.dragEnd = pos; } } else if (e.button === 1) { this.isDraggingMap = true; this.lastDragPos = { x: e.clientX, y: e.clientY }; this.canvas.style.cursor = 'grabbing'; } }
    handleMouseMove(e) { this.mousePos = this.getMousePos(e); this.globalMousePos = { x: e.clientX, y: e.clientY }; if (this.isDraggingMap) { const dx = e.clientX - this.lastDragPos.x; const dy = e.clientY - this.lastDragPos.y; this.camera.x -= dx / this.camera.zoom; this.camera.y -= dy / this.camera.zoom; this.lastDragPos = { x: e.clientX, y: e.clientY }; } else if (this.isDragging) { this.dragEnd = this.mousePos; } }
    handleMouseUp(e) { if (e.button === 2) { const pos = this.getMousePos(e); this.handleRightClick(pos.x, pos.y); return; } if (this.isDraggingMap) { this.isDraggingMap = false; this.canvas.style.cursor = 'default'; } else if (this.isDragging) { this.isDragging = false; const pos = this.getMousePos(e); if (getDistance(this.dragStart, pos) < 10) { this.handleLeftClick(pos.x, pos.y); } else { this.handleBoxSelection(); } } }
    handleLeftClick(x, y) { const worldPos = this.screenToWorld(x, y); if (this.ui.selectedUnitToDeploy) { this.tryDeployUnit(worldPos, this.ui.selectedUnitToDeploy); return; } const clickedUnit = this.player.units.find(unit => getDistance(worldPos, unit) < TILE_SIZE / 2); if (this.selectedUnits.length > 0 && !clickedUnit) { this.selectedUnits.forEach(unit => unit.setTarget(null)); this.issueGroupMoveCommand(worldPos, this.map); } else { this.selectedUnits = clickedUnit ? [clickedUnit] : []; } }
    handleRightClick(x, y) { if (this.selectedUnits.length > 0) { const worldPos = this.screenToWorld(x, y); if (this.buildingsManager) { const building = this.buildingsManager.findBuildingAt( Math.floor(worldPos.x / TILE_SIZE), Math.floor(worldPos.y / TILE_SIZE) ); if (building && !building.isDestroyed) { this.selectedUnits.forEach(unit => { unit.setTarget(building); unit.issueMoveCommand( { x: building.pixelX, y: building.pixelY }, this.map, true, true ); }); return; } } let targetEnemy = null; const allEnemies = [...this.ai.units, this.aiBase].filter(Boolean); for (const enemy of allEnemies) { const enemyPos = { x: enemy.pixelX || enemy.x, y: enemy.pixelY || enemy.y }; const clickRadius = (enemy instanceof Base) ? (enemy.width * TILE_SIZE / 2) : (enemy.stats.drawScale * TILE_SIZE / 2); if (getDistance(worldPos, enemyPos) < clickRadius) { targetEnemy = enemy;break; } } if (targetEnemy) { const targetPosition = { x: targetEnemy.pixelX || targetEnemy.x, y: targetEnemy.pixelY || targetEnemy.y }; this.selectedUnits.forEach(unit => { let targetMoveType = 'ground'; if (targetEnemy instanceof Unit) { targetMoveType = targetEnemy.stats.moveType; } if (unit.stats.canTarget.includes(targetMoveType)) { unit.setTarget(targetEnemy); unit.issueMoveCommand(targetPosition, this.map, true, true); } }); } else { this.selectedUnits.forEach(unit => unit.setTarget(null)); this.issueGroupMoveCommand(worldPos, this.map); } } }
    
    // --- MOBILE ADAPTATION: New method to handle a unified tap action ---
    handleTap(pos) {
        const worldPos = this.screenToWorld(pos.x, pos.y);

        // 1. Deployment logic
        if (this.ui.selectedUnitToDeploy) {
            this.tryDeployUnit(worldPos, this.ui.selectedUnitToDeploy);
            return;
        }

        // 2. Selection and Command logic
        if (this.selectedUnits.length > 0) {
            // If units are selected, a tap issues a command (move or attack)
            this.issueCommandForSelectedUnits(worldPos); 
        } else {
            // If no units are selected, a tap is for selecting a single unit
            const clickedUnit = this.player.units.find(unit => getDistance(worldPos, unit) < TILE_SIZE / 2);
            this.selectedUnits = clickedUnit ? [clickedUnit] : [];
        }
    }

    issueCommandForSelectedUnits(worldPos) {
        // This function consolidates the attack/move logic from handleRightClick
        let targetEnemy = null;
        const allEnemies = [...this.ai.units, this.aiBase].filter(Boolean);
        for (const enemy of allEnemies) {
            const enemyPos = { x: enemy.pixelX || enemy.x, y: enemy.pixelY || enemy.y };
            const clickRadius = (enemy instanceof Base) ? (enemy.width * TILE_SIZE / 2) : (enemy.stats.drawScale * TILE_SIZE / 2);
            if (getDistance(worldPos, enemyPos) < clickRadius) {
                targetEnemy = enemy; break;
            }
        }
        if (targetEnemy) {
            const targetPosition = { x: targetEnemy.pixelX || targetEnemy.x, y: targetEnemy.pixelY || targetEnemy.y };
            this.selectedUnits.forEach(unit => {
                unit.setTarget(targetEnemy);
                if (unit.target) {
                    unit.issueMoveCommand(targetPosition, this.map, true, true);
                }
            });
        } else {
            this.selectedUnits.forEach(unit => unit.setTarget(null));
            this.issueGroupMoveCommand(worldPos, this.map);
        }
    }

    tryDeployUnit(worldPos, unitType) { const cost = UNIT_TYPES[unitType].cost; if (this.player.canAfford(cost) && worldPos.x < (this.map.width * TILE_SIZE) / 3) { const gridX = Math.floor(worldPos.x / TILE_SIZE); const gridY = Math.floor(worldPos.y / TILE_SIZE); const tile = this.map.getTile(gridX, gridY); const unitStats = UNIT_TYPES[unitType]; if (unitStats.moveType === 'air' || (tile && TERRAIN_TYPES[tile.type].traversableBy.includes(unitStats.moveType))) { const newUnit = new Unit(unitType, 'player', worldPos.x + Math.random()*2 - 1, worldPos.y + Math.random()*2 - 1); this.player.units.push(newUnit); this.player.deductManpower(cost); if (this.onUnitDeployed) { this.onUnitDeployed(unitStats.unitClass); } this.ui.update(); } else { this.ui.showGameMessage("该单位无法部署在此地形上！"); } } else { if(!this.player.canAfford(cost)) { this.ui.showGameMessage("资源不足！"); } else { this.ui.showGameMessage("只能在左侧1/3区域部署！"); } } }
    handleBoxSelection() { this.ui.clearDeploymentSelection(); this.selectedUnits = []; const rect = { x: Math.min(this.dragStart.x, this.dragEnd.x), y: Math.min(this.dragStart.y, this.dragEnd.y), w: Math.abs(this.dragStart.x - this.dragEnd.x), h: Math.abs(this.dragStart.y - this.dragEnd.y) }; this.player.units.forEach(unit => { const screenPos = this.worldToScreen(unit.x, unit.y); if (screenPos.x > rect.x && screenPos.x < rect.x + rect.w && screenPos.y > rect.y && screenPos.y < rect.y + rect.h) { this.selectedUnits.push(unit); } }); }
    issueGroupMoveCommand(targetPos, map) { if (this.selectedUnits.length === 0) return; const groupCenter = this.selectedUnits.reduce((acc, unit) => { acc.x += unit.x; acc.y += unit.y; return acc; }, { x: 0, y: 0 }); groupCenter.x /= this.selectedUnits.length; groupCenter.y /= this.selectedUnits.length; const formation = this.calculateFormation(this.selectedUnits, targetPos, TILE_SIZE * 2); const sortedUnits = [...this.selectedUnits].sort((a, b) => getDistance(a, targetPos) - getDistance(b, targetPos)); let delay = 0; const delayIncrement = 5; sortedUnits.forEach((unit, index) => { const idealTargetPos = formation[index] || targetPos; const finalTargetPos = this.findNearestValidPosition( idealTargetPos, map, unit.stats.moveType, groupCenter, targetPos ); setTimeout(() => { if (unit && unit.hp > 0) { unit.issueMoveCommand(finalTargetPos, map, false, true); } }, delay); delay += delayIncrement; }); }
    findNearestValidPosition(idealPos, map, moveType, groupCenter, mainTargetPos, maxSearchRadius = 15) { const startGridX = Math.floor(idealPos.x / TILE_SIZE); const startGridY = Math.floor(idealPos.y / TILE_SIZE); const maxDistance = getDistance(groupCenter, mainTargetPos) + TILE_SIZE; let tile = map.getTile(startGridX, startGridY); if (tile && TERRAIN_TYPES[tile.type].traversableBy.includes(moveType) && getDistance(idealPos, groupCenter) <= maxDistance) { return idealPos; } for (let r = 1; r <= maxSearchRadius; r++) { for (let dx = -r; dx <= r; dx++) { for (let dy = -r; dy <= r; dy++) { if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue; const checkX = startGridX + dx; const checkY = startGridY + dy; tile = map.getTile(checkX, checkY); if (tile && TERRAIN_TYPES[tile.type].traversableBy.includes(moveType)) { const candidatePos = { x: checkX * TILE_SIZE + TILE_SIZE / 2, y: checkY * TILE_SIZE + TILE_SIZE / 2 }; if (getDistance(candidatePos, groupCenter) <= maxDistance) { return candidatePos; } } } } } return idealPos; }
    calculateFormation(units, targetPos, spacing) { if (units.length === 0) return []; let minX = Math.min(...units.map(u => u.x)); let maxX = Math.max(...units.map(u => u.x)); let minY = Math.min(...units.map(u => u.y)); let maxY = Math.max(...units.map(u => u.y)); const originalCenter = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }; const offsets = units.map(unit => ({ x: unit.x - originalCenter.x, y: unit.y - originalCenter.y })); const originalRadius = Math.max( ...units.map(unit => Math.sqrt( Math.pow(unit.x - originalCenter.x, 2) + Math.pow(unit.y - originalCenter.y, 2) ) ) ); if (originalRadius === 0) { return units.map(() => ({ ...targetPos })); } const scaleFactor = 0.8; return offsets.map(offset => ({ x: targetPos.x + offset.x * scaleFactor, y: targetPos.y + offset.y * scaleFactor })); }
    getMousePos(e) { const rect = this.canvas.getBoundingClientRect(); const scaleX = this.canvas.width / rect.width; const scaleY = this.canvas.height / rect.height; return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }; }
    worldToScreen(worldX, worldY) { return { x: (worldX - this.camera.x) * this.camera.zoom, y: (worldY - this.camera.y) * this.camera.zoom }; }
    screenToWorld(screenX, screenY) { return { x: screenX / this.camera.zoom + this.camera.x, y: screenY / this.camera.zoom + this.camera.y }; }
    constrainCamera() { if (!this.map) return; const mapWidthPixels = this.map.width * TILE_SIZE; const mapHeightPixels = this.map.height * TILE_SIZE; const viewWidth = this.canvas.width / this.camera.zoom; const viewHeight = this.canvas.height / this.camera.zoom; this.camera.x = Math.max(0, Math.min(this.camera.x, mapWidthPixels - viewWidth)); this.camera.y = Math.max(0, Math.min(this.camera.y, mapHeightPixels - viewHeight)); }
    handleWheel(e) { e.preventDefault(); if (e.ctrlKey) { const zoomFactor = e.deltaY > 0 ? 1.04: 0.96; this.zoomAtPoint(zoomFactor, this.getMousePos(e)); } else { this.camera.x += e.deltaX / this.camera.zoom; this.camera.y += e.deltaY / this.camera.zoom; } }
    zoomAtPoint(factor, point) { const oldZoom = this.camera.zoom; const newZoom = Math.max(this.camera.minZoom, Math.min(this.camera.maxZoom, oldZoom / factor)); if (newZoom === oldZoom) return; const worldMouseX = point.x / oldZoom + this.camera.x; const worldMouseY = point.y / oldZoom + this.camera.y; this.camera.zoom = newZoom; this.camera.x = worldMouseX - point.x / newZoom; this.camera.y = worldMouseY - point.y / newZoom; }
    
    // --- MOBILE ADAPTATION: Rewritten touch handlers ---
    getTouchPos(touch) { const rect = this.canvas.getBoundingClientRect(); const scaleX = this.canvas.width / rect.width; const scaleY = this.canvas.height / rect.height; return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY }; }
    handleTouchStart(e) {
        e.preventDefault();
        for (const touch of e.changedTouches) {
            this.activeTouches.set(touch.identifier, this.getTouchPos(touch));
        }

        if (this.activeTouches.size === 1) {
            const touch = e.changedTouches[0];
            const pos = this.getTouchPos(touch);
            this.isTouchSelectDragging = true;
            this.touchStartTime = Date.now();
            this.touchStartPos = pos;
            this.dragStart = pos; // For drawing the selection box
            this.dragEnd = pos;
        } else {
            // More than one finger, so it's not a selection drag
            this.isTouchSelectDragging = false;
        }
        this.updateTouchState();
    }
    handleTouchMove(e) {
        e.preventDefault();
        for (const touch of e.changedTouches) {
            this.activeTouches.set(touch.identifier, this.getTouchPos(touch));
        }
        
        const touches = Array.from(this.activeTouches.values());

        if (touches.length === 2) {
            // Two-finger pan and zoom
            this.isTouchSelectDragging = false; // Cancel any potential selection drag
            const currentCenter = { x: (touches[0].x + touches[1].x) / 2, y: (touches[0].y + touches[1].y) / 2 };
            const currentDistance = getDistance(touches[0], touches[1]);
            if (this.lastTouchCenter) {
                const dx = currentCenter.x - this.lastTouchCenter.x;
                const dy = currentCenter.y - this.lastTouchCenter.y;
                this.camera.x -= dx / this.camera.zoom;
                this.camera.y -= dy / this.camera.zoom;
            }
            if (this.lastTouchDistance > 0) {
                const zoomFactor = this.lastTouchDistance / currentDistance;
                this.zoomAtPoint(zoomFactor, currentCenter);
            }
            this.lastTouchCenter = currentCenter;
            this.lastTouchDistance = currentDistance;
        } else if (touches.length === 1 && this.isTouchSelectDragging) {
            // Single-finger drag for selection box
            this.dragEnd = touches[0];
        }
    }
    handleTouchEnd(e) {
        const wasSingleTouch = this.activeTouches.size === 1;

        if (this.isTouchSelectDragging && wasSingleTouch) {
            const tapDuration = Date.now() - this.touchStartTime;
            const dragDistance = getDistance(this.touchStartPos, this.dragEnd);

            if (tapDuration < 300 && dragDistance < 15) {
                // It's a TAP. Now we check if it's a single or double tap.
                const pos = this.touchStartPos;
                const currentTime = Date.now();
                
                const timeSinceLastTap = currentTime - this.lastTapTime;
                const distanceSinceLastTap = getDistance(pos, this.lastTapPos);

                // --- CORE CHANGE: Double-tap logic ---
                if (timeSinceLastTap < this.DOUBLE_TAP_THRESHOLD && distanceSinceLastTap < 30) {
                    // This is a DOUBLE TAP, simulate a right-click
                    this.handleRightClick(pos.x, pos.y);
                    
                    // Reset the tap time to prevent a third tap from also being a double tap
                    this.lastTapTime = 0; 
                } else {
                    // This is a SINGLE TAP, simulate a left-click
                    this.handleLeftClick(pos.x, pos.y);
                    
                    // Record this tap's time and position for the next potential double tap
                    this.lastTapTime = currentTime;
                    this.lastTapPos = pos;
                }
            } else {
                // It's a DRAG-SELECT
                this.handleBoxSelection();
            }
        }

        // Cleanup
        for (const touch of e.changedTouches) {
            this.activeTouches.delete(touch.identifier);
        }
        this.isTouchSelectDragging = false;
        this.updateTouchState();
    }

    undoLastDeployment() { if (this.player.units.length === 0) { this.ui.showGameMessage("没有可撤销的部署"); return; } const lastUnit = this.player.units.pop(); if (lastUnit) { if (lastUnit.body) { Matter.World.remove(this.engine.world, lastUnit.body); } const cost = UNIT_TYPES[lastUnit.type].cost; this.player.addManpower(cost); this.ui.update(); this.ui.showGameMessage(`已撤销部署: ${UNIT_TYPES[lastUnit.type].name}`); } }
    handleEdgeScrolling(deltaTime) { if (this.isDraggingMap || this.isDragging || this.isTouchSelectDragging || this.activeTouches.size > 0) return; const edgeMargin = 20; const scrollSpeed = 600 / this.camera.zoom; if (this.globalMousePos.x < edgeMargin) this.camera.x -= scrollSpeed * deltaTime; if (this.globalMousePos.x > window.innerWidth - edgeMargin) this.camera.x += scrollSpeed * deltaTime; if (this.globalMousePos.y < edgeMargin) this.camera.y -= scrollSpeed * deltaTime; if (this.globalMousePos.y > window.innerHeight - edgeMargin) this.camera.y += scrollSpeed * deltaTime; }
    requestAssistance(attackedUnit, attacker) { const ASSISTANCE_RADIUS = 15 * TILE_SIZE; const potentialAllies = this.player.units; for (const ally of potentialAllies) { if (ally.id === attackedUnit.id || ally.hp <= 0 || ally.isforcemoving || ally.target) { continue; } const distance = getDistance(ally, attackedUnit); if (distance <= ASSISTANCE_RADIUS) { let attackerMoveType = 'ground'; if (attacker instanceof Unit) { attackerMoveType = attacker.stats.moveType; } if (ally.stats.canTarget.includes(attackerMoveType)) { ally.setTarget(attacker); ally.issueMoveCommand({ x: attacker.x, y: attacker.y }, this.map, true, false); } } } }
    handleProjectileHit(p) { this.explosions.push(new Explosion(p.x, p.y, p.stats.splashRadius || 2)); if (this.buildingsManager && p.owner !== 'ai') { const targetGridX = Math.floor(p.target.x / TILE_SIZE); const targetGridY = Math.floor(p.target.y / TILE_SIZE); if (this.buildingsManager.damageBuilding(targetGridX, targetGridY, p.stats.damage)) { return; } } if (p.target.hp > 0) p.target.takeDamage(p.stats.damage, p.attacker); if (p.stats.splashRadius > 0) { const allTargets = [...this.player.units, ...this.ai.units, this.playerBase, this.aiBase].filter(Boolean); allTargets.forEach(entity => { if (entity.owner !== p.owner.owner && entity.id !== p.target.id && entity.hp > 0) { const entityPos = { x: entity.pixelX || entity.x, y: entity.pixelY || entity.y }; const distance = getDistance(entityPos, p); if (distance < p.stats.splashRadius) { const splashDamage = p.stats.damage * (1 - distance / p.stats.splashRadius); entity.takeDamage(splashDamage, p.attacker); } } }); } }
    startGame() { if (this.gameState === 'deployment') this.gameState = 'playing'; }
    checkWinConditions() { if (this.gameState !== 'playing') return; const pCanDeploy = this.player.manpower >= Math.min(...Object.values(UNIT_TYPES).map(u => u.cost)); const pOutOfForces = this.player.units.length === 0 && !pCanDeploy; switch (this.gameMode) { case 'annihilation': if (this.playerBase?.hp <= 0) this.endGame(this.ai); else if (this.aiBase?.hp <= 0){ this.levelCompleted = true; this.checkLightningStrikeAchievement(); this.endGame(this.player); } break; case 'attack': if (this.aiBase?.hp <= 0){ this.levelCompleted = true; this.checkLightningStrikeAchievement(); this.endGame(this.player); } else if (pOutOfForces) this.endGame(this.ai); break; case 'defend': if (this.playerBase?.hp <= 0) this.endGame(this.ai); else if (this.ai.units.length === 0 && this.ai.manpower < 2){ this.levelCompleted = true; this.checkLightningStrikeAchievement(); this.endGame(this.player); } break; case 'tutorial': case 'objective': case 'assassination': case 'escort': break; default : this.levelCompleted = true; this.checkLightningStrikeAchievement(); this.endGame(this.player); break; } }
    endGame(winner) { if (this.gameState === 'gameover') return; this.gameState = 'gameover'; console.log(`${winner.name} 获胜!`); this.ui.showWinner(winner.name); localStorage.removeItem('ShenDun_dialogue_settings'); this.savegame.clearAutoSave(); if(winner.name === '电脑'){ const currentUser = sessionStorage.getItem('currentUser'); const tempProgress = JSON.parse(localStorage.getItem(`ShenDun_temp_progress_${currentUser}`)); if(tempProgress.chapter === 5 && tempProgress.scene !== 0) setTimeout(() => {window.location.href = `loading.html?target=dialogue.html&returnFromGame=true&failChapter=9&user=${JSON.parse(currentUser).username}`;},2000); else setTimeout(() => {window.location.href = `loading.html?target=dialogue.html&returnFromGame=true&failChapter=7&user=${JSON.parse(currentUser).username}`;},2000); return; } if (this.returnToDialogue())return; }
    unlockAchievement(achievementId) { if (!this.achievements) this.achievements = this.loadAchievements(); if (!this.achievements[achievementId].unlocked) { this.achievements[achievementId].unlocked = true; this.achievements[achievementId].unlockTime = new Date().getTime(); this.saveAchievements(); this.ui.showAchievementUnlocked(achievementId); if (window.updateAchievementPoints) { window.updateAchievementPoints(this.achievements); } } }
    loadAchievements() { const defaultAchievements = {...ACHIEVEMENTS}; const saved = localStorage.getItem(`ShenDun_achievements_${this.user}`); if (saved) { const savedAchievements = JSON.parse(saved); Object.keys(defaultAchievements).forEach(id => { if (savedAchievements[id]) { defaultAchievements[id].unlocked = savedAchievements[id].unlocked; defaultAchievements[id].unlockTime = savedAchievements[id].unlockTime; } }); } return defaultAchievements; }
    saveAchievements() { localStorage.setItem(`ShenDun_achievements_${this.user}`, JSON.stringify(this.achievements)); }
    checkChapterCompletion(chapter , scene){ const chapterAchievements = {1: '初战告捷',2: '深渊猎手',3: '都市幽灵',4: '极地风暴',5: '终局之光'}; if (chapterAchievements[chapter]&& (chapter !== 5 || scene !== 0)){ this.unlockAchievement(chapterAchievements[chapter]); } }
    checkAchievements() { if (this.achievementStats.unitsDeployed.size >= 4 && !this.achievements['全能指挥官'].unlocked) { this.unlockAchievement('全能指挥官'); } if (this.achievementStats.unitsLost === 0 && this.gameState === 'gameover' && !this.achievements['爱兵如子'].unlocked) { this.unlockAchievement('爱兵如子'); } if (this.achievementStats.enemyTanksDestroyed >= 3 && !this.achievements['反装甲专家'].unlocked) { this.unlockAchievement('反装甲专家'); } if (this.achievementStats.infantryVsVehicles >= 5 && !this.achievements['正义天降'].unlocked) { this.unlockAchievement('正义天降'); } if (this.achievementStats.maxUnitsAlive >= 50 && !this.achievements['人海战术'].unlocked) { this.unlockAchievement('人海战术'); } if (this.achievementStats.navalVsLandKills > 0 && this.achievementStats.landVsNavalKills > 0 && !this.achievements['海陆协同'].unlocked) { this.unlockAchievement('海陆协同'); } const allUnlocked = Object.values(this.achievements) .filter(a => a.name !== '神话守护者').every(a => a.unlocked); if (allUnlocked && !this.achievements['神话守护者'].unlocked) { this.unlockAchievement('神话守护者'); } }
    checkLightningStrikeAchievement() { if (this.levelCompleted && this.skip === false && !this.achievements['闪电突击'].unlocked) { if (Date.now() - this.levelStartTime <= 60000/this.gameSpeedModifier) { this.unlockAchievement('闪电突击'); } } }
    returnToDialogue() { const currentUser = sessionStorage.getItem('currentUser'); if (currentUser) { const urlParams = new URLSearchParams(window.location.search); const fromDialogue = urlParams.get('fromDialogue'); if (fromDialogue === 'true') { const tempProgress = JSON.parse(localStorage.getItem(`ShenDun_temp_progress_${currentUser}`)); this.checkChapterCompletion(tempProgress.chapter , tempProgress.scene); setTimeout(() => {window.location.href = `loading.html?target=dialogue.html&returnFromGame=true&user=${JSON.parse(currentUser).username}`;},2000); return true; } } return false; }
    placeBaseOnMap(base) { for (let y = 0; y < base.height; y++) { for (let x = 0; x < base.width; x++) { this.map.setTileType(base.gridX + x, base.gridY + y, 'base'); } } }
    getSaveData() { return { gameState: this.gameState, gameMode: this.gameMode, player: { manpower: this.player.manpower, units: this.player.units.map(unit => ({ type: unit.type, x: unit.x, y: unit.y, hp: unit.hp })) }, ai: { manpower: this.ai.manpower, units: this.ai.units.map(unit => ({ type: unit.type, x: unit.x, y: unit.y, hp: unit.hp })) }, playerBase: this.playerBase ? { hp: this.playerBase.hp } : null, aiBase: this.aiBase ? { hp: this.aiBase.hp } : null, timestamp: new Date().getTime() }; }
    loadSaveData(saveData) { console.log('加载存档:', saveData); }
    skipCurrentScenario() { if (this.gameMode === 'tutorial' || this.gameMode === 'annihilation' || this.gameMode === 'attack') { this.aiBase.hp = 0; } else if (this.gameMode === 'defend') { this.playerBase.hp = 0; } this.gameState = 'playing'; this.skip = true; this.updateObjectives(); this.checkWinConditions(); }
    returnToMainMenu() { this.cleanup(); window.location.href = '../index.html'; }
    cleanup() { cancelAnimationFrame(this.animationFrameId); this.audioManager.stopBGM(); }
    onUnitDeployed(unitType) { this.achievementStats.unitsDeployed.add(unitType); this.checkAchievements(); }
    onUnitLost() { this.achievementStats.unitsLost++; this.checkAchievements(); }
    onUnitDestroyed(attacker, target) { const Attackertype = attacker.stats.unitClass; const Targettype = target.stats.unitClass; if (target.stats.name === '主战坦克') { this.achievementStats.enemyTanksDestroyed++; } if (Targettype === '海军') { this.achievementStats.enemyShipsDestroyed++; } if ((Targettype === '装甲' || Targettype === '炮兵')&& Attackertype === '步兵') { this.achievementStats.infantryVsVehicles++; } if ((Targettype === '装甲' || Targettype === '步兵' || Targettype === '炮兵') && Attackertype === '海军') { this.achievementStats.navalVsLandKills++; } if ((Attackertype === '装甲' || Attackertype === '步兵' || Attackertype === '炮兵') && Targettype === '海军') { this.achievementStats.landVsNavalKills++; } this.checkAchievements(); }
    updateUnitCount() { const aliveUnits = this.player.units.length; if (aliveUnits > this.achievementStats.maxUnitsAlive) { this.achievementStats.maxUnitsAlive = aliveUnits; this.checkAchievements(); } }
}