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
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.dragEnd = { x: 0, y: 0 };
        this.mousePos = { x: 0, y: 0 };
        this.globalMousePos = { x: 0, y: 0 };
        this.camera = { x: 0, y: 0, zoom: 1.2, minZoom: 1, maxZoom: 4.0 };
        this.isDraggingMap = false;
        this.lastDragPos = { x: 0, y: 0 };

        this.activeTouches = new Map();
        this.lastTouchDistance = 0;
        this.lastTouchCenter = null;
        
        this.dialogueSettings = null;
        this.enableFogOfWar = null;
        this.availableUnits = null;

        this.savegame = null;
        this.achievements = null;
        // 新增 跳过游戏标记
        this.skip = false;
        // 新增：游戏目标相关属性
        this.gameObjectives = null;
        this.escortUnit = null;
        this.targetUnit = null;
        this.objectiveMarkers = [];
        this.destination = null;
        // 新增：北极基地建筑物管理器
        this.arcticBuildingsManager = null;
    }

    init(settings) {
        window.game = this;
        // 存储 mapId 以便在设置镜头时使用
        this.mapId = settings.mapId;
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

        // --- 核心修复 (问题 #2): 增加迭代次数以提高物理稳定性 ---
        this.engine = Matter.Engine.create({
            // 默认值是 6 和 4。增加迭代次数可以提高精度和稳定性，防止物体弹飞。
            positionIterations: 8,
            velocityIterations: 6
        });
        this.engine.world.gravity.y = 0;

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
        
        this.createTerrainBodies();

        // 新增：如果是北极地图，初始化建筑物管理器
        if (settings.mapId === 'map_chapter4') {
            this.arcticBuildingsManager = new ArcticBuildingsManager(this);
            this.arcticBuildingsManager.initialize();
        }

        const initialManpower = 50;
        this.player = new Player('player', '玩家', initialManpower);
        const aiManpower = settings.aiDifficulty === 'hell' ? Math.round(initialManpower * 1.5) : initialManpower;
        this.ai = new Player('ai', '电脑', aiManpower, true, {}, settings.aiDifficulty);
        
        this.ui = new UI(this);
        this.ai.aiController.playerBase = this.playerBase;
        this.ai.aiController.deployUnits(this.map.width, this.map.height, TILE_SIZE, this.map);

        // 新增：初始化游戏目标
        this.gameObjectives = settings.objectives || [];
        this.escortUnit = settings.escortUnit || null;
        this.targetUnit = settings.targetUnit || null;
        if(settings.destination){
            this.destination = {x: settings.destination.x * TILE_SIZE, y: settings.destination.y * TILE_SIZE} ;
        }
        
        // 新增：根据游戏模式设置初始目标标记
        this.setupObjectiveMarkers();
        
        this.gameSpeedModifier = GAME_SPEEDS[settings.gameSpeed];
        this.gameState = 'deployment';
        this.savegame = new saveGame(this);

        // 修改 初始化成就系统
        this.achievements = this.loadAchievements();
        this.achievementStats = {
            unitsDeployed: new Set(), // 已部署的单位类型
            unitsLost: 0, // 损失的单位数量
            enemyTanksDestroyed: 0, // 摧毁的敌方坦克数量
            enemyShipsDestroyed: 0, // 摧毁的敌方舰船数量
            infantryVsVehicles: 0, // 步兵对载具的击杀数
            maxUnitsAlive: 0, // 同时存活的单位最大数量
            navalVsLandKills: 0, // 海军对陆地单位的击杀
            landVsNavalKills: 0, // 陆军对海军单位的击杀
            difficulty: settings.aiDifficulty // 当前游戏难度
        };
        this.levelStartTime = Date.now();
        this.levelCompleted = false;

        this.addEventListeners();
        this.setupInitialCamera();

        window.game = this;
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    createTerrainBodies() {
        const staticBodies = [];
        for (let y = 0; y < this.map.height; y++) {
            for (let x = 0; x < this.map.width; x++) {
                const tile = this.map.getTile(x, y);
                if (tile && TERRAIN_TYPES[tile.type].traversableBy.length === 0) {
                    const body = Matter.Bodies.rectangle(
                        x * TILE_SIZE + TILE_SIZE / 2,
                        y * TILE_SIZE + TILE_SIZE / 2,
                        TILE_SIZE,
                        TILE_SIZE,
                        {
                            isStatic: true,
                            label: 'terrain',
                            collisionFilter: {
                                category: COLLISION_CATEGORIES.terrain,
                                mask: COLLISION_CATEGORIES.ground_unit
                            }
                        }
                    );
                    staticBodies.push(body);
                }
            }
        }
        Matter.World.add(this.engine.world, staticBodies);
    }
    
    // 在 Game 类的 setupInitialCamera 方法中添加地图特定的镜头设置
    setupInitialCamera() {
        // 默认设置
        let focusPoint = this.playerBase 
            ? { x: this.playerBase.pixelX, y: this.playerBase.pixelY }
            : { x: (this.map.width * TILE_SIZE) / 2, y: (this.map.height * TILE_SIZE) / 2 };
        
        let zoomLevel = 1.5;
        
        // 根据地图ID设置特定的镜头位置和缩放
        switch (this.mapId) {
            case 'map_chapter1': // 撒哈拉沙漠哨站
                focusPoint = { x: TILE_SIZE * 15, y: TILE_SIZE * 30 };
                zoomLevel = 1.5;
                break;
                
            case 'map_chapter2': // 安第斯秘密基地
                focusPoint = { x: TILE_SIZE * 40, y: TILE_SIZE * 30 };
                zoomLevel = 1.5;
                break;
                
            case 'map_chapter3': // 新京都市战场
                focusPoint = { x: TILE_SIZE * 15, y: TILE_SIZE * 35 };
                zoomLevel = 1.5;
                break;
                
            case 'map_chapter4': // 北极天锤控制基地
                focusPoint = { x: TILE_SIZE * 15, y: TILE_SIZE * 40 };
                zoomLevel = 1.5;
                break;
                
            case 'map_chapter5_1': // 离子炮阵地
                focusPoint = { x: TILE_SIZE, y: TILE_SIZE };
                zoomLevel = 3.0;
                break;
                
            case 'map_chapter5_2': // 刻耳柏洛斯海上平台
                focusPoint = { x: TILE_SIZE * 35, y: TILE_SIZE * 35 };
                zoomLevel = 1.5;
                break;
                
            case 'map_new_01': // 十字路口冲突
                // focusPoint = { x: TILE_SIZE * 40, y: TILE_SIZE * 30 };
                zoomLevel = 1.3;
                break;
                
            case 'map01': // 双子桥
                // focusPoint = { x: TILE_SIZE * 50, y: TILE_SIZE * 30 };
                zoomLevel = 1.1;
                break;
                
            case 'map_new': // 新手地图
                // focusPoint = { x: TILE_SIZE * 5, y: TILE_SIZE * 5 };
                zoomLevel = 1.8;
                break;
                
            default:
                // 使用默认设置
                break;
        }
        
        this.camera.zoom = Math.max(zoomLevel, this.camera.minZoom);
        this.camera.x = focusPoint.x - (this.canvas.width / 2) / this.camera.zoom;
        this.camera.y = focusPoint.y - (this.canvas.height / 2) / this.camera.zoom;
        
        this.globalMousePos = { x: this.camera.x, y: this.camera.y };
        this.constrainCamera();
    }
    // 新增：设置目标标记
    setupObjectiveMarkers() {
        this.objectiveMarkers = [];
        
        switch (this.gameMode) {
            case 'objective':
                // 为目标模式设置建筑标记
                if (this.gameObjectives && this.gameObjectives.length > 0) {
                    this.gameObjectives.forEach(obj => {
                        const parts = obj.split(':');
                        if (parts[0] === 'destroy_building') {
                            const buildingType = parts[1];
                            // 根据建筑类型在地图上找到对应位置
                            const position = this.findBuildingPosition(buildingType);
                            if (position) {
                                this.objectiveMarkers.push({
                                    type: 'destroy',
                                    x: position.x,
                                    y: position.y,
                                    buildingType: buildingType
                                });
                            }
                        } else if (parts[0] === 'guide_debris') {
                            const targetType = parts[1];
                            // 找到海沟位置
                            const position = this.findTrenchPosition(targetType);
                            if (position) {
                                this.objectiveMarkers.push({
                                    type: 'guide',
                                    x: position.x,
                                    y: position.y,
                                    targetType: targetType
                                });
                            }
                        }
                    });
                }
                break;
                
            case 'assassination':
                // 为刺杀模式设置目标单位标记
                if (this.targetUnit) {
                    // 创建目标单位（这里需要根据targetUnit类型创建对应的AI单位）
                    this.createTargetUnit(this.targetUnit);
                    this.objectiveMarkers.push({
                        type: 'assassinate',
                        unit: this.targetUnit
                    });
                }
                break;
                
            case 'escort':
                // 为护送模式设置护送单位和目的地标记
                if (this.escortUnit && this.destination) {
                    // 创建护送单位
                    this.createEscortUnit(this.escortUnit, this.destination);
                    this.objectiveMarkers.push({
                        type: 'escortdestination',
                        destination: this.destination
                    });
                    this.objectiveMarkers.push({
                        type: 'escort',
                        unit: this.escortUnit,
                    });
                }
                break;
        }
    }

    // 新增：根据建筑类型找到位置
    findBuildingPosition(buildingType) {
        // 这里需要根据地图设计来定位特定建筑
        // 简单实现：根据建筑类型返回预设位置
        const positions = {
            'barracks': { x: this.map.width * TILE_SIZE * 0.7, y: this.map.height * TILE_SIZE * 0.3 },
            'armory': { x: this.map.width * TILE_SIZE * 0.6, y: this.map.height * TILE_SIZE * 0.5 },
            'command_center': { x: this.map.width * TILE_SIZE * 0.8, y: this.map.height * TILE_SIZE * 0.4 },
            'power_station_1': { x: this.map.width * TILE_SIZE * 0.2, y: this.map.height * TILE_SIZE * 0.2 },
            'power_station_2': { x: this.map.width * TILE_SIZE * 0.8, y: this.map.height * TILE_SIZE * 0.2 },
            'power_station_3': { x: this.map.width * TILE_SIZE * 0.5, y: this.map.height * TILE_SIZE * 0.8 },
            'control_tower': { x: this.map.width * TILE_SIZE * 0.5, y: this.map.height * TILE_SIZE * 0.5 }
        };
        
        return positions[buildingType] || null;
    }

    // 新增：找到海沟位置
    findTrenchPosition(trenchType) {
        // 简单实现：返回地图右下角位置
        return { x: this.map.width * TILE_SIZE * 0.9, y: this.map.height * TILE_SIZE * 0.9 };
    }
    
    // 新增：创建目标单位
    createTargetUnit(targetType) {
        // 根据目标类型创建特定的AI单位
        const position = //this.findBuildingPosition('command_center') || 
                        { x: this.map.width * TILE_SIZE * 0.9, y: this.map.height * TILE_SIZE * 0.5 };
        
        // 创建特殊的目标单位（例如毒蛇的指挥单位）
        const targetUnit = new Unit(targetType, 'ai', position.x, position.y);
        targetUnit.isTargetUnit = true;
        targetUnit.name = "毒蛇指挥单位";
        
        this.ai.units.push(targetUnit);
        this.targetUnit = targetUnit;
    }
    
    // 新增：创建护送单位
    createEscortUnit(unitType, destination) {
        // 创建护送单位（例如充能车）
        const startPosition = { x: TILE_SIZE * 5, y: TILE_SIZE };
        
        const escortUnit = new Unit(unitType, 'player', startPosition.x, startPosition.y);
        escortUnit.isEscortUnit = true;
        escortUnit.destination = destination;
        escortUnit.speed = 0.5; // 较慢的速度
        
        this.player.units.push(escortUnit);
        this.escortUnit = escortUnit;
    }
    
    gameLoop(currentTime) {
        if (!this.lastTime) this.lastTime = currentTime;
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        const adjustedDeltaTime = deltaTime / this.gameSpeedModifier;

        this.update(adjustedDeltaTime);
        this.draw();
        this.ui.update();

        requestAnimationFrame(this.gameLoop.bind(this));
    }

    update(deltaTime) {
        if (this.gameState === 'gameover' || this.gameState === 'setup') return;

        Matter.Engine.update(this.engine, deltaTime * 1000);

        this.handleEdgeScrolling(deltaTime);
        this.constrainCamera();
        // 新增：更新北极基地建筑物系统
        if (this.arcticBuildingsManager) {
            this.arcticBuildingsManager.update(deltaTime);
        }
        const allPlayerUnits = [...this.player.units];
        const allAiUnits = [...this.ai.units];
        const allUnits = [...allPlayerUnits, ...allAiUnits];

        allUnits.forEach(unit => {
            if (unit.body) {
                unit.x = unit.body.position.x;
                unit.y = unit.body.position.y;
                unit.angle = unit.body.angle;
            }
        });
        
        if (this.gameState === 'playing' ){
            this.updateObjectives();
            allPlayerUnits.forEach(unit => unit.update(deltaTime, allAiUnits, this.map, this.aiBase, this));
            allAiUnits.forEach(unit => unit.update(deltaTime, allPlayerUnits, this.map, this.playerBase, this));
            
            this.ai.update(deltaTime, this.player, this.map);
        }
        
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
        
        this.player.units = this.player.units.filter(u => this.filterDeadUnits(u));
        this.ai.units = this.ai.units.filter(u => this.filterDeadUnits(u));
        this.selectedUnits = this.selectedUnits.filter(u => u.hp > 0);

        if (this.enableFogOfWar) this.fogOfWar.update([...this.player.units, this.playerBase].filter(Boolean));
        // 修改 更新存活单位数量
        this.updateUnitCount();
        if (this.gameState === 'playing') this.checkWinConditions();
    }

    // 新增：更新游戏目标状态
    updateObjectives() {
        switch (this.gameMode) {
            case 'objective':
                this.updateObjectiveMode();
                break;
            case 'objective_arctic':
                this.updateObjective_ArcticMode();
                break;
            case 'assassination':
                this.updateAssassinationMode();
                break;
                
            case 'escort':
                this.updateEscortMode();
                break;
        }
    }

    // 新增：更新目标模式
    updateObjectiveMode() {
        // 检查是否所有目标都已完成
        let allCompleted = true;
        
        for (const objective of this.gameObjectives) {
            const parts = objective.split(':');
            const type = parts[0];
            const target = parts[1];
            
            if (type === 'destroy_building') {
                // 检查建筑是否被摧毁
                const building = this.findBuildingByType(target);
                if (building && building.hp > 0) {
                    allCompleted = false;
                    break;
                }
            } else if (type === 'guide_debris') {
                // 检查残骸是否已引导到目标位置
                // 这里需要实现残骸引导逻辑
                allCompleted = false; // 暂时设为未完成
                break;
            }
        }
        
        if (allCompleted || this.skip) {
            this.levelCompleted = true;
            this.checkLightningStrikeAchievement();
            this.endGame(this.player);
        }
    }
    
    updateObjective_ArcticMode(){
        // 检查北极地图的胜利条件
        if (this.arcticBuildingsManager.checkWinCondition() || this.skip) {
            this.levelCompleted = true;
            this.checkLightningStrikeAchievement();
            this.endGame(this.player);
            return;
        }
            
        // 检查失败条件
        if (this.arcticBuildingsManager.checkLossCondition()) {
            this.endGame(this.ai);
            return;
        }
    }
    // 新增：更新刺杀模式
    updateAssassinationMode() {
        // 检查目标单位是否被消灭
        if ( (this.targetUnit && this.targetUnit.hp <= 0) || this.skip) {
            this.levelCompleted = true;
            this.checkLightningStrikeAchievement();
            this.endGame(this.player);
        }
    }
    
    // 新增：更新护送模式
    updateEscortMode() {
        // 检查护送单位是否到达目的地
        if ((this.escortUnit && this.escortUnit.hp > 0)  || this.skip){
            const distance = getDistance(this.escortUnit, this.escortUnit.destination);
            
            if ((distance < TILE_SIZE * 0.4) || this.skip) {
                // 到达目的地
                this.levelCompleted = true;
                this.checkLightningStrikeAchievement();
                this.endGame(this.player);
            }
        } else if (this.escortUnit && this.escortUnit.hp <= 0) {
            // 护送单位被摧毁，任务失败
            this.endGame(this.ai);
        }
    }
    
    // 新增：根据类型找到建筑
    findBuildingByType(buildingType) {
        // 简单实现：返回对应的基地或特定建筑
        if (buildingType === 'control_tower' && this.aiBase) {
            return this.aiBase;
        }
        
        // 可以扩展以支持更多建筑类型
        return null;
    }

    filterDeadUnits(unit) {
        if (unit.hp > 0) {
            return true;
        }
        if (unit.body) {
            Matter.World.remove(this.engine.world, unit.body);
            unit.body = null;
        }
        return false;
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
        // 新增：绘制北极基地建筑物
        if (this.arcticBuildingsManager) {
            this.arcticBuildingsManager.draw(this.ctx, this.camera.zoom);
        }
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
                unit.draw(this.ctx, this.selectedUnits.includes(unit), this.camera.zoom, this.showDetails);
            }
        });

        if (this.enableFogOfWar) {this.fogOfWar.draw(this.ctx);}

        this.ctx.restore();
        
        if (this.isDragging && !this.isDraggingMap) {
            this.ctx.strokeStyle = 'rgba(100, 255, 100, 0.7)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(this.dragStart.x, this.dragStart.y, this.dragEnd.x - this.dragStart.x, this.dragEnd.y - this.dragStart.y);
        }

        // 新增：绘制目标标记
        this.drawObjectiveMarkers();
    }
    
    // 新增：绘制目标标记
    drawObjectiveMarkers() {
        this.objectiveMarkers.forEach(marker => {
            const screenPos = this.worldToScreen(marker.x, marker.y);
            
            switch (marker.type) {
                case 'destroy':
                    // 绘制摧毁目标标记
                    this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                    this.ctx.beginPath();
                    this.ctx.arc(screenPos.x, screenPos.y, 15, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    this.ctx.strokeStyle = 'red';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.arc(screenPos.x, screenPos.y, 15, 0, Math.PI * 2);
                    this.ctx.stroke();
                    
                    this.ctx.fillStyle = 'white';
                    this.ctx.font = '12px Arial';
                    this.ctx.fillText('摧毁', screenPos.x - 15, screenPos.y - 20);
                    break;
                    
                case 'guide':
                    // 绘制引导目标标记
                    this.ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
                    this.ctx.beginPath();
                    this.ctx.arc(screenPos.x, screenPos.y, 15, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    this.ctx.strokeStyle = 'blue';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.arc(screenPos.x, screenPos.y, 15, 0, Math.PI * 2);
                    this.ctx.stroke();
                    
                    this.ctx.fillStyle = 'white';
                    this.ctx.font = '12px Arial';
                    this.ctx.fillText('引导', screenPos.x - 15, screenPos.y - 20);
                    break;
                    
                case 'assassinate':
                    // 刺杀目标标记（跟随目标单位）
                    if (marker.unit && marker.unit.hp > 0) {
                        const unitScreenPos = this.worldToScreen(marker.unit.x, marker.unit.y);
                        
                        this.ctx.fillStyle = 'rgba(255, 165, 0, 0.3)';
                        this.ctx.beginPath();
                        this.ctx.arc(unitScreenPos.x, unitScreenPos.y, 20, 0, Math.PI * 2);
                        this.ctx.fill();
                        
                        this.ctx.strokeStyle = 'orange';
                        this.ctx.lineWidth = 2;
                        this.ctx.beginPath();
                        this.ctx.arc(unitScreenPos.x, unitScreenPos.y, 20, 0, Math.PI * 2);
                        this.ctx.stroke();
                        
                        this.ctx.fillStyle = 'white';
                        this.ctx.font = '12px Arial';
                        this.ctx.fillText('刺杀目标：毒蛇', unitScreenPos.x - 25, unitScreenPos.y - 25);
                    }
                    break;
                    
                case 'escortdestination':
                    // 护送目标标记（目的地）
                    const destScreenPos = this.worldToScreen(marker.destination.x, marker.destination.y);
                    
                    this.ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
                    this.ctx.beginPath();
                    this.ctx.arc(destScreenPos.x, destScreenPos.y, 15, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    this.ctx.strokeStyle = 'green';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.arc(destScreenPos.x, destScreenPos.y, 15, 0, Math.PI * 2);
                    this.ctx.stroke();
                    
                    this.ctx.fillStyle = 'white';
                    this.ctx.font = '12px Arial';
                    this.ctx.fillText('目的地', destScreenPos.x - 20, destScreenPos.y - 20);
                    break;
                
                case 'escort':
                    // 护送目标标记
                    if (marker.unit && marker.unit.hp > 0) {
                        const unitScreenPos = this.worldToScreen(marker.unit.x, marker.unit.y);
                        
                        this.ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
                        this.ctx.beginPath();
                        this.ctx.arc(unitScreenPos.x, unitScreenPos.y, 20, 0, Math.PI * 2);
                        this.ctx.fill();
                        
                        this.ctx.strokeStyle = 'green';
                        this.ctx.lineWidth = 2;
                        this.ctx.beginPath();
                        this.ctx.arc(unitScreenPos.x, unitScreenPos.y, 20, 0, Math.PI * 2);
                        this.ctx.stroke();
                        
                        this.ctx.fillStyle = 'white';
                        this.ctx.font = '12px Arial';
                        this.ctx.fillText('保护目标：充能车', unitScreenPos.x - 25, unitScreenPos.y - 25);
                    }
                    break;
            }
        });
    }

    addEventListeners() {
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
             window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.selectedUnits = [];
                this.ui.clearDeploymentSelection();
            } 
            else if (e.key === 'r' || e.key === 'R') {
                if (this.gameState === 'deployment') {
                    this.undoLastDeployment();
                }
            }
            else if (e.key === 'q' || e.key === 'Q') {
                if (this.gameState === 'playing' && this.selectedUnits.length > 0) {
                    this.selectedUnits.forEach(unit => {
                        unit.stop();
                    });
                    this.ui.showGameMessage("单位已停下");
                }
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
             this.selectedUnits = [];
        } else {
            this.selectedUnits = clickedUnit ? [clickedUnit] : [];
        }
    }
    
    // 在 game.js 的 handleRightClick 方法中添加对北极建筑物的处理
    handleRightClick(x, y) {
        if (this.selectedUnits.length > 0) {
            const worldPos = this.screenToWorld(x, y);
            
            // 1. 首先检查是否点击了北极建筑物
            if (this.arcticBuildingsManager) {
                const building = this.arcticBuildingsManager.findBuildingAt(
                    Math.floor(worldPos.x / TILE_SIZE),
                    Math.floor(worldPos.y / TILE_SIZE)
                );
                
                if (building && !building.isDestroyed) {
                    // 命令选中的单位攻击建筑物
                    this.selectedUnits.forEach(unit => {
                        // 设置建筑物为目标
                        unit.setTarget(building);
                        // 下达移动指令，开启"强制移动"标志
                        unit.issueMoveCommand(
                            { x: building.pixelX, y: building.pixelY },
                            this.map,
                            true,
                            true
                        );
                    });
                    return; // 已处理建筑物点击，直接返回
                }
            }
            // 2. 如果没有点击建筑物，则按原来的逻辑处理
            let targetEnemy = null;
            const allEnemies = [...this.ai.units, this.aiBase].filter(Boolean);
            for (const enemy of allEnemies) {
                const enemyPos = { x: enemy.pixelX || enemy.x, y: enemy.pixelY || enemy.y };
                const clickRadius = (enemy instanceof Base) ? (enemy.width * TILE_SIZE / 2) : (enemy.stats.drawScale * TILE_SIZE / 2);
                if (getDistance(worldPos, enemyPos) < clickRadius) {
                    targetEnemy = enemy;break;
                }
            }
            
            if (targetEnemy) {
                // 这是强制攻击指令
                const targetPosition = { x: targetEnemy.pixelX || targetEnemy.x, y: targetEnemy.pixelY || targetEnemy.y };

                this.selectedUnits.forEach(unit => {
                    // 1. 设置明确的目标
                    unit.setTarget(targetEnemy);
                    // 2. 下达移动指令，并开启"强制移动"标志
                    unit.issueMoveCommand(targetPosition, this.map, true, true);
                });
            } else {
                // 这是普通的移动指令
                this.selectedUnits.forEach(unit => unit.setTarget(null)); // 确保没有目标
                this.issueGroupMoveCommand(worldPos, this.map);
            }
        }
    }

    issueCommandForSelectedUnits(worldPos) {
        let targetEnemy = null;
        const allEnemies = [...this.ai.units, this.aiBase].filter(Boolean);
        for (const enemy of allEnemies) {
            const enemyPos = { x: enemy.pixelX || enemy.x, y: enemy.pixelY || enemy.y };
            const clickRadius = (enemy instanceof Base) ? (enemy.width * TILE_SIZE / 2) : (enemy.stats.drawScale * TILE_SIZE / 2);
            if (getDistance(worldPos, enemyPos) < clickRadius) {
                targetEnemy = enemy;break;
            }
        }
        
        if (targetEnemy) {
            // 这是强制攻击指令
            const targetPosition = { x: targetEnemy.pixelX || targetEnemy.x, y: targetEnemy.pixelY || targetEnemy.y };

            this.selectedUnits.forEach(unit => {
                // 1. 设置明确的目标
                unit.setTarget(targetEnemy);
                // 2. 下达移动指令，并开启“强制移动”标志！
                // issueMoveCommand(目标位置, 地图, 是否在交战状态, 是否强制移动)
                if (unit.target) {
                    // 3. 只有合法的单位才下达移动攻击指令！
                    unit.issueMoveCommand(targetPosition, this.map, true, true);
                }
            });

        } else {
            // 这是普通的移动指令
            // --- 核心修复: 使用 setTarget 方法 ---
            this.selectedUnits.forEach(unit => unit.setTarget(null)); // 确保没有目标
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
                const newUnit = new Unit(unitType, 'player', worldPos.x + Math.random()*2 - 1, worldPos.y + Math.random()*2 - 1);
                this.player.units.push(newUnit);
                this.player.deductManpower(cost);
                //修改 新增成就监听
                if (this.onUnitDeployed) {
                    this.onUnitDeployed(unitType);
                }
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
        const rect = { x: Math.min(this.dragStart.x, this.dragEnd.x),
             y: Math.min(this.dragStart.y, this.dragEnd.y), 
             w: Math.abs(this.dragStart.x - this.dragEnd.x), 
             h: Math.abs(this.dragStart.y - this.dragEnd.y) 
        };
        this.player.units.forEach(unit => {
            const screenPos = this.worldToScreen(unit.x, unit.y);
            if (screenPos.x > rect.x && screenPos.x < rect.x + rect.w && screenPos.y > rect.y && screenPos.y < rect.y + rect.h) {
                this.selectedUnits.push(unit);
            }
        });
    }
    
    /**
     * --- 核心修复 (问题 #1): 分散寻路计算以避免卡顿 ---
     */
    issueGroupMoveCommand(targetPos, map) {
        if (this.selectedUnits.length === 0) return;
        
        const formation = this.calculateFormation(this.selectedUnits, targetPos, TILE_SIZE * 2);
        const sortedUnits = [...this.selectedUnits].sort((a, b) => getDistance(a, targetPos) - getDistance(b, targetPos));

        let delay = 0;
        const delayIncrement = 5;

        sortedUnits.forEach((unit, index) => {
            const unitTargetPos = formation[index] || targetPos;
            
            setTimeout(() => {
                if (unit && unit.hp > 0) {
                     // *** 核心修复 ***
                     // 明确告诉单位：这不是攻击移动(isEngaging: false)，但这是强制移动(isforcemoving: true)
                     unit.issueMoveCommand(unitTargetPos, map, false, true);
                }
            }, delay);

            delay += delayIncrement;
        });
    }

    calculateFormation(units, targetPos, spacing) {
        // 如果没有单位，直接返回空数组
        if (units.length === 0) return [];
        
        // 获取单位的原始边界框
        let minX = Math.min(...units.map(u => u.x));
        let maxX = Math.max(...units.map(u => u.x));
        let minY = Math.min(...units.map(u => u.y));
        let maxY = Math.max(...units.map(u => u.y));
        
        // 计算原始布局的中心点
        const originalCenter = {
            x: (minX + maxX) / 2,
            y: (minY + maxY) / 2
        };
        
        // 计算相对于原始中心点的偏移量
        const offsets = units.map(unit => ({
            x: unit.x - originalCenter.x,
            y: unit.y - originalCenter.y
        }));
        
        // 计算原始布局的边界半径
        const originalRadius = Math.max(
            ...units.map(unit => 
                Math.sqrt(
                    Math.pow(unit.x - originalCenter.x, 2) + 
                    Math.pow(unit.y - originalCenter.y, 2)
                )
            )
        );
        
        // 避免除以零的情况
        if (originalRadius === 0) {
            return units.map(() => ({ ...targetPos }));
        }
        
        // 计算缩放因子，使外围单位更靠近中心
        // 使用平方根函数使缩放更加平滑
        const scaleFactor = 0.8; // 可以调整这个值来控制紧凑程度
        
        // 根据偏移量和缩放因子计算新的位置
        return offsets.map(offset => ({
            x: targetPos.x + offset.x * scaleFactor,
            y: targetPos.y + offset.y * scaleFactor
        }));
    }

    getMousePos(e) { const rect = this.canvas.getBoundingClientRect(); const scaleX = this.canvas.width / rect.width; const scaleY = this.canvas.height / rect.height; return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }; }
    worldToScreen(worldX, worldY) { return { x: (worldX - this.camera.x) * this.camera.zoom, y: (worldY - this.camera.y) * this.camera.zoom }; }
    screenToWorld(screenX, screenY) { return { x: screenX / this.camera.zoom + this.camera.x, y: screenY / this.camera.zoom + this.camera.y }; }
    constrainCamera() { if (!this.map) return; const mapWidthPixels = this.map.width * TILE_SIZE; const mapHeightPixels = this.map.height * TILE_SIZE; const viewWidth = this.canvas.width / this.camera.zoom; const viewHeight = this.canvas.height / this.camera.zoom; this.camera.x = Math.max(0, Math.min(this.camera.x, mapWidthPixels - viewWidth)); this.camera.y = Math.max(0, Math.min(this.camera.y, mapHeightPixels - viewHeight)); }
    handleWheel(e) {
        e.preventDefault();
        if (e.ctrlKey) {
            const zoomFactor = e.deltaY > 0 ? 1.01: 0.99; 
            this.zoomAtPoint(zoomFactor, this.getMousePos(e));
        } else {
            // 这是平移操作 (触控板双指滑动 或 鼠标滚轮上下/左右滚动)
            // 使用 deltaX 和 deltaY 来移动镜头
            this.camera.x += e.deltaX / this.camera.zoom;
            this.camera.y += e.deltaY / this.camera.zoom;
        }
    }
    zoomAtPoint(factor, point) { const oldZoom = this.camera.zoom; const newZoom = Math.max(this.camera.minZoom, Math.min(this.camera.maxZoom, oldZoom / factor)); if (newZoom === oldZoom) return; const worldMouseX = point.x / oldZoom + this.camera.x; const worldMouseY = point.y / oldZoom + this.camera.y; this.camera.zoom = newZoom; this.camera.x = worldMouseX - point.x / newZoom; this.camera.y = worldMouseY - point.y / newZoom; }
    handleTouchStart(e) { e.preventDefault(); for (const touch of e.changedTouches) { this.activeTouches.set(touch.identifier, this.getTouchPos(touch)); } this.updateTouchState(); }
    getTouchPos(touch) { const rect = this.canvas.getBoundingClientRect(); const scaleX = this.canvas.width / rect.width; const scaleY = this.canvas.height / rect.height; return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY }; }
    handleTouchMove(e) { e.preventDefault(); for (const touch of e.changedTouches) { this.activeTouches.set(touch.identifier, this.getTouchPos(touch)); } const touches = Array.from(this.activeTouches.values()); if (touches.length === 2) { const currentCenter = { x: (touches[0].x + touches[1].x) / 2, y: (touches[0].y + touches[1].y) / 2 }; const currentDistance = getDistance(touches[0], touches[1]); if (this.lastTouchCenter) { const dx = currentCenter.x - this.lastTouchCenter.x; const dy = currentCenter.y - this.lastTouchCenter.y; this.camera.x -= dx / this.camera.zoom; this.camera.y -= dy / this.camera.zoom; } if (this.lastTouchDistance > 0) { const zoomFactor = this.lastTouchDistance / currentDistance; this.zoomAtPoint(zoomFactor, currentCenter); } this.lastTouchCenter = currentCenter; this.lastTouchDistance = currentDistance; } }
    handleTouchEnd(e) { for (const touch of e.changedTouches) { this.activeTouches.delete(touch.identifier); } this.updateTouchState(); }
    updateTouchState() { if (this.activeTouches.size < 2) { this.lastTouchDistance = 0; this.lastTouchCenter = null; } }
    undoLastDeployment() {
        // 1. 检查玩家是否部署过单位
        if (this.player.units.length === 0) {
            this.ui.showGameMessage("没有可撤销的部署");
            return;
        }

        // 2. 从玩家单位数组中移除最后一个单位
        const lastUnit = this.player.units.pop();

        if (lastUnit) {
            // 3. 从物理引擎中移除该单位的碰撞体，非常重要！
            if (lastUnit.body) {
                Matter.World.remove(this.engine.world, lastUnit.body);
            }

            // 4. 获取该单位的成本，并返还给玩家
            const cost = UNIT_TYPES[lastUnit.type].cost;
            this.player.addManpower(cost);

            // 5. 更新UI以显示返还后的资源
            this.ui.update();
            this.ui.showGameMessage(`已撤销部署: ${UNIT_TYPES[lastUnit.type].name}`);这一行也修改了一下
        }
    }

    handleEdgeScrolling(deltaTime) {
        if (this.isDraggingMap || this.isDragging || this.activeTouches.size > 0) return;
        
        const edgeMargin = 20;
        const scrollSpeed = 600 / this.camera.zoom;
        
        if (this.globalMousePos.x < edgeMargin) this.camera.x -= scrollSpeed * deltaTime;
        if (this.globalMousePos.x > window.innerWidth - edgeMargin) this.camera.x += scrollSpeed * deltaTime;
        if (this.globalMousePos.y < edgeMargin) this.camera.y -= scrollSpeed * deltaTime;
        if (this.globalMousePos.y > window.innerHeight - edgeMargin) this.camera.y += scrollSpeed * deltaTime;
    }

    handleProjectileHit(p) { 
        // 新增：检查是否击中北极基地建筑物
        this.explosions.push(new Explosion(p.x, p.y, p.stats.splashRadius || 2)); 
        if (this.arcticBuildingsManager) {
            const targetGridX = Math.floor(p.target.x / TILE_SIZE);
            const targetGridY = Math.floor(p.target.y / TILE_SIZE);
            
            if (this.arcticBuildingsManager.damageBuilding(targetGridX, targetGridY, p.stats.damage)) {
                // 如果击中了建筑物，不再处理其他伤害
                return;
            }
        }
        if (p.target.hp > 0) p.target.takeDamage(p.stats.damage); 
        if (p.stats.splashRadius > 0) { 
            const allTargets = [...this.player.units, ...this.ai.units, this.playerBase, this.aiBase].filter(Boolean); 
            allTargets.forEach(entity => { 
                if (entity.owner !== p.owner && entity.id !== p.target.id && entity.hp > 0) { 
                    const entityPos = { x: entity.pixelX || entity.x, y: entity.pixelY || entity.y }; 
                    const distance = getDistance(entityPos, p); if (distance < p.stats.splashRadius) { 
                        const splashDamage = p.stats.damage * (1 - distance / p.stats.splashRadius); entity.takeDamage(splashDamage); 
                    } 
                } 
            }); 
        } 
    }
    startGame() { if (this.gameState === 'deployment') this.gameState = 'playing'; }
    checkWinConditions() { 
        if (this.gameState !== 'playing') return; 
        const pCanDeploy = this.player.manpower >= Math.min(...Object.values(UNIT_TYPES).map(u => u.cost)); 
        const pOutOfForces = this.player.units.length === 0 && !pCanDeploy;
        switch (this.gameMode) { // 修改 新增成就检查
            case 'annihilation': 
                if (this.playerBase?.hp <= 0) this.endGame(this.ai); 
                else if (this.aiBase?.hp <= 0){
                    this.levelCompleted = true;
                    this.checkLightningStrikeAchievement();
                    this.endGame(this.player);
                }
                break; 
            case 'attack': 
                if (this.aiBase?.hp <= 0){
                    this.levelCompleted = true;
                    this.checkLightningStrikeAchievement();
                    this.endGame(this.player);
                }
                else if (pOutOfForces) this.endGame(this.ai); 
                break; 
            case 'defend': 
                if (this.playerBase?.hp <= 0) this.endGame(this.ai); 
                else if (this.ai.units.length === 0 && this.ai.manpower < 2){
                    this.levelCompleted = true;
                    this.checkLightningStrikeAchievement();
                    this.endGame(this.player);
                }
                break; 
            case 'objective':
            case 'objective_arctic':
            case 'assassination':
            case 'escort':
                // 这些模式的胜利条件在updateObjectives中处理
                break;
            default :
                this.levelCompleted = true;
                this.checkLightningStrikeAchievement();
                this.endGame(this.player);
                break; 
        } 
    }

    endGame(winner) {
        if (this.gameState === 'gameover') return; 
        this.gameState = 'gameover';
        this.checkAchievements();
        console.log(`${winner.name} 获胜!`);
        this.ui.showWinner(winner.name);
        localStorage.removeItem('ShenDun_dialogue_settings');
        this.savegame.clearAutoSave();

        if (this.returnToDialogue())return;
    }
    
    unlockAchievement(achievementId) {
        if (!this.achievements) this.achievements = this.loadAchievements();
        if (!this.achievements[achievementId].unlocked) {
            this.achievements[achievementId].unlocked = true;
            this.achievements[achievementId].unlockTime = new Date().getTime();
            this.saveAchievements();
            this.ui.showAchievementUnlocked(achievementId);
            
            if (window.updateAchievementPoints) {
                window.updateAchievementPoints(this.achievements);
            }
        }
    }

    loadAchievements() {
        const defaultAchievements = {...ACHIEVEMENTS};
        const saved = localStorage.getItem(`ShenDun_achievements_${this.user}`);
        
        if (saved) {
            const savedAchievements = JSON.parse(saved);
            Object.keys(defaultAchievements).forEach(id => {
                if (savedAchievements[id]) {
                    defaultAchievements[id].unlocked = savedAchievements[id].unlocked;
                    defaultAchievements[id].unlockTime = savedAchievements[id].unlockTime;
                }
            });
        }
        
        return defaultAchievements;
    }

    saveAchievements() {
        localStorage.setItem(`ShenDun_achievements_${this.user}`, JSON.stringify(this.achievements));
    }

    checkChapterCompletion(chapter , scene){
        const chapterAchievements = {0: '初战告捷',1: '深渊猎手',2: '都市幽灵',3: '极地风暴',4: '终局之光'};
        if (chapterAchievements[chapter]&& (chapter !== 4 || scene !== 0)){
            this.unlockAchievement(chapterAchievements[chapter]);
        }
    }
    
    checkAchievements() {//修改 增加成就监听
        // 检查全能指挥官成就
        if (this.achievementStats.unitsDeployed.size >= 4 && 
            !this.achievements['全能指挥官'].unlocked) {
            this.unlockAchievement('全能指挥官');
        }
        // 检查爱兵如子成就
        if (this.achievementStats.unitsLost === 0 && 
            this.gameState === 'gameover' && 
            !this.achievements['爱兵如子'].unlocked) {
            this.unlockAchievement('爱兵如子');
        }
        // 检查反装甲专家成就
        if (this.achievementStats.enemyTanksDestroyed >= 10 && 
            !this.achievements['反装甲专家'].unlocked) {
            this.unlockAchievement('反装甲专家');
        }
        // 检查正义天降成就
        if (this.achievementStats.infantryVsVehicles >= 10 && 
            !this.achievements['正义天降'].unlocked) {
            this.unlockAchievement('正义天降');
        }
        // 检查人海战术成就
        if (this.achievementStats.maxUnitsAlive >= 50 &&
           !this.achievements['人海战术'].unlocked) {
            this.unlockAchievement('人海战术');
        }
        // 检查海陆协同成就
        if (this.achievementStats.navalVsLandKills > 0 && 
            this.achievementStats.landVsNavalKills > 0 && 
            !this.achievements['海陆协同'].unlocked) {
            this.unlockAchievement('海陆协同');
        }
        // 检查全球防御者成就
        if (this.achievementStats.difficulty === 'hard' && 
            this.gameState === 'gameover' && this.player.winner && 
            !this.achievements['全球防御者'].unlocked) {
            this.unlockAchievement('全球防御者');
        }
        // 检查神话守护者成就
        const allUnlocked = Object.values(this.achievements)
            .filter(a => a.name !== '神话守护者').every(a => a.unlocked);
        if (allUnlocked && !this.achievements['神话守护者'].unlocked) {
            this.unlockAchievement('神话守护者');
        }
    }

    // 修改 添加 闪电突击 成就检查
    checkLightningStrikeAchievement() {
        if (this.levelCompleted && this.skip === false && !this.achievements['闪电突击'].unlocked) {
            if (Date.now() - this.levelStartTime <= 60000/this.gameSpeedModifier) {
                this.unlockAchievement('闪电突击');
            }
        }
    }

    returnToDialogue() {
        const currentUser = sessionStorage.getItem('currentUser');
        if (currentUser) {
            const urlParams = new URLSearchParams(window.location.search);
            const fromDialogue = urlParams.get('fromDialogue');
            if (fromDialogue === 'true') {
                const tempProgress = JSON.parse(localStorage.getItem(`ShenDun_temp_progress_${currentUser}`));
                this.checkChapterCompletion(tempProgress.chapter , tempProgress.scene);
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
        this.skip = true;
        this.updateObjectives();
        this.checkWinConditions();
    }
    
    returnToMainMenu() {
        this.cleanup();
        window.location.href = '../index.html';
    }
    
    cleanup() {
        cancelAnimationFrame(this.animationFrameId);
    }

    // 修改 添加如下成就监听
    // 添加单位部署监听
    onUnitDeployed(unitType) {
        this.achievementStats.unitsDeployed.add(unitType);
        this.checkAchievements();
    }
    // 添加单位损失监听
    onUnitLost() {
        this.achievementStats.unitsLost++;
        this.checkAchievements();
    }
    // 添加单位摧毁监听
    onUnitDestroyed(attacker, target) {
        // 记录敌方坦克摧毁
        if (target.type.includes('tank') || target.type.includes('armor')) {
            this.achievementStats.enemyTanksDestroyed++;
        }
        // 记录敌方舰船摧毁
        if (target.type.includes('ship') || target.type.includes('naval')) {
            this.achievementStats.enemyShipsDestroyed++;
        }
        // 记录步兵对载具的击杀
        if ((attacker.type.includes('infantry') || attacker.type.includes('soldier')) && 
            (target.type.includes('vehicle') || target.type.includes('tank') || target.type.includes('armor'))) {
            this.achievementStats.infantryVsVehicles++;
        }
        // 记录海军对陆地单位的击杀
        if ((attacker.type.includes('ship') || attacker.type.includes('naval')) && 
            (target.type.includes('infantry') || target.type.includes('tank') || target.type.includes('vehicle'))) {
            this.achievementStats.navalVsLandKills++;
        }
        // 记录陆军对海军单位的击杀
        if ((attacker.type.includes('infantry') || attacker.type.includes('tank')) && 
            (target.type.includes('ship') || target.type.includes('naval'))) {
            this.achievementStats.landVsNavalKills++;
        }
        this.checkAchievements();
    }

    // 更新存活单位数量
    updateUnitCount() {
        const aliveUnits = this.player.units.length;
        if (aliveUnits > this.achievementStats.maxUnitsAlive) {
            this.achievementStats.maxUnitsAlive = aliveUnits;
            this.checkAchievements();
        }
    }
    
}