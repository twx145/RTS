class BuildingsManager {
    constructor(game) {
        this.game = game;
        this.buildings = [];
        this.specialBuildings = {}; // 存储特殊建筑物引用
        this.healRate = 200;
        this.healInterval = 10000;
        this.lastHealTime = 0;
        this.showBuildingNames = true; // 默认显示建筑名称
        this.buildingImages = {}; // 存储建筑图片
    }

    initialize() {
        this.findAndRegisterBuildings();
        this.setBuildingHealth();
        this.preloadBuildingImages(); // 预加载建筑图片
        console.log("建筑物系统初始化完成");
    }

    // 预加载建筑图片
    preloadBuildingImages() {
        for (const type in BUILDING_TYPES) {
            if (BUILDING_TYPES[type].imageSrc) {
                const img = new Image();
                img.src = BUILDING_TYPES[type].imageSrc;
                this.buildingImages[type] = img;
            }
        }
    }

    findAndRegisterBuildings() {
        this.buildings = [];
        this.specialBuildings = {};

        // 从地图配置中获取建筑物信息
        const mapData = MAP_DEFINITIONS.find(m => m.id === this.game.mapId);
        
        if (mapData && mapData.buildings) {
            mapData.buildings.forEach(buildingConfig => {
                 // 从 BUILDING_TYPES 获取建筑配置
                const buildingTypeConfig = BUILDING_TYPES[buildingConfig.type];
                if (!buildingTypeConfig) {
                    console.error(`未知建筑类型: ${buildingConfig.type}`);
                    return;
                }
                
                const building = this.createBuilding(
                    buildingConfig.type,
                    { x: buildingConfig.x, y: buildingConfig.y },
                    buildingTypeConfig
                );
                
                // 添加到特殊建筑物列表
                if (!this.specialBuildings[buildingConfig.type]) {
                    this.specialBuildings[buildingConfig.type] = [];
                }
                this.specialBuildings[buildingConfig.type].push(building);
                
                // 添加到建筑物列表
                this.buildings.push(building);
            });
        }
        
        console.log(`找到 ${this.buildings.length} 个建筑物`);
    }

    createBuilding(type, gridPos, buildingTypeConfig) {
        // 计算像素中心点
        const pixelX = (gridPos.x + buildingTypeConfig.width / 2) * TILE_SIZE;
        const pixelY = (gridPos.y + buildingTypeConfig.height / 2) * TILE_SIZE;
        // 获取建筑图片
        const buildingImage = this.buildingImages[type];
        // 创建建筑物对象
        const building = {
            type: type,
            gridX: gridPos.x,
            gridY: gridPos.y,
            gridWidth: buildingTypeConfig.width,
            gridHeight: buildingTypeConfig.height,
            pixelX: pixelX,
            pixelY: pixelY,
            x: pixelX,
            y: pixelY,
            maxHp: buildingTypeConfig.hp,
            hp: buildingTypeConfig.hp,
            isDestroyed: false,
            canAttack: buildingTypeConfig.canAttack,
            buildingType: buildingTypeConfig,
            image: buildingImage, // 添加图片引用
            
            // 攻击相关属性
            attackCooldown: 0,
            target: null,
            findTargetCooldown: Math.random() * 0.5,
            
            // 创建物理碰撞体
            body: this.createBuildingBody(type, pixelX, pixelY, buildingTypeConfig.width, buildingTypeConfig.height),
            
            // 绘制方法
            draw: function(ctx, zoom) {
                const sizeX = this.gridWidth * TILE_SIZE;
                const sizeY = this.gridHeight * TILE_SIZE;
                
                // 绘制建筑物图片
                if (this.image && !this.isDestroyed) {
                    ctx.drawImage(
                        this.image,
                        this.pixelX - sizeX/2, 
                        this.pixelY - sizeY/2, 
                        sizeX, 
                        sizeY
                    );
                } else {
                    // 如果图片不可用，回退到原始颜色方块
                    ctx.fillStyle = this.getBuildingColor(type);
                    ctx.fillRect(
                        this.pixelX - sizeX/2, 
                        this.pixelY - sizeY/2, 
                        sizeX, 
                        sizeY
                    );
                }
                
                // 绘制边框
                ctx.strokeStyle = this.isDestroyed ? '#FF0000' : '#FFFFFF';
                ctx.lineWidth = 2 / zoom;
                ctx.strokeRect(
                    this.pixelX - sizeX/2, 
                    this.pixelY - sizeY/2, 
                    sizeX, 
                    sizeY
                );
                
                // 绘制血条
                const barWidth = sizeX;
                const barHeight = 8 / zoom;
                const barYOffset = sizeY/2 + 10 / zoom;
                
                ctx.fillStyle = '#333';
                ctx.fillRect(
                    this.pixelX - barWidth/2, 
                    this.pixelY - barYOffset, 
                    barWidth, 
                    barHeight
                );
                
                ctx.fillStyle = this.isDestroyed ? '#FF0000' : '#00FF00';
                ctx.fillRect(
                    this.pixelX - barWidth/2, 
                    this.pixelY - barYOffset, 
                    barWidth * (this.hp / this.maxHp), 
                    barHeight
                );
                
                // 特殊效果
                this.drawSpecialEffects(ctx, zoom);
                
                // 如果是攻击建筑且正在攻击，显示攻击效果
                if (this.canAttack && this.target && !this.isDestroyed) {
                    ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
                    ctx.lineWidth = 2 / zoom;
                    ctx.beginPath();
                    ctx.moveTo(this.pixelX, this.pixelY);
                    ctx.lineTo(this.target.x, this.target.y);
                    ctx.stroke();
                }
            },
            
            // 获取建筑物颜色
            getBuildingColor: function(type) {
                const colors = {
                    'observation_tower': '#A9A9A9',
                    'bridge_control': '#4682B4',
                    'bunker': '#8B4513',
                    'training_target': '#FF6347',
                    'training_barrier': '#DAA520',
                    'radar_station': '#1E90FF',
                    'communication_tower': '#20B2AA',
                    'storage_depot': '#808080',
                    'barracks': '#8B4513',
                    'watchtower': '#A9A9A9',
                    'armory': '#A9A9A9',
                    'command_center': '#FF4500',
                    'research_lab': '#9370DB',
                    'power_generator': '#00CED1',
                    'guard_tower': '#A9A9A9',
                    'headquarters': '#483D8B',
                    'communication_center': '#20B2AA',
                    'skyscraper': '#708090',
                    'shopping_mall': '#FFD700',
                    'apartment_complex': '#696969',
                    'parking_garage': '#2F4F4F',
                    'checkpoint': '#A9A9A9',
                    'control_tower': '#FFD700',
                    'power_station': '#00BFFF',
                    'radar_dome': '#1E90FF',
                    'hangar': '#696969',
                    'ion_cannon': '#DC143C',
                    'power_conduit': '#00CED1',
                    'defense_turret': '#A9A9A9',
                    'main_control': '#FF4500',
                    'research_center': '#9370DB',
                    'missile_silo': '#2F4F4F',
                    'aa_gun': '#A9A9A9'
                };
                return colors[type] || '#708090';
            },
            
            // 绘制特殊效果
            drawSpecialEffects: function(ctx, zoom) {
                const size = Math.max(this.gridWidth, this.gridHeight) * TILE_SIZE;
                
                // 能源站效果
                if (type === 'power_station' && !this.isDestroyed) {
                    ctx.fillStyle = 'rgba(0, 191, 255, 0.3)';
                    ctx.beginPath();
                    ctx.arc(this.pixelX, this.pixelY, size/2 + 5, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // 指挥中心效果
                if (type === 'command_center' && !this.isDestroyed) {
                    ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
                    ctx.lineWidth = 3 / zoom;
                    ctx.beginPath();
                    ctx.arc(this.pixelX, this.pixelY, size/2 + 8, 0, Math.PI * 2);
                    ctx.stroke();
                }
                
                // 攻击建筑效果
                if (this.canAttack && !this.isDestroyed) {
                    ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
                    ctx.lineWidth = 1 / zoom;
                    ctx.beginPath();
                    ctx.arc(this.pixelX, this.pixelY, this.buildingType.range, 0, Math.PI * 2);
                    ctx.stroke();
                }
            },
            
            // 更新方法
            update: function(deltaTime, game) {
                if (this.isDestroyed) return;
                if (game.gameState !== 'playing')return ;
                // 更新攻击冷却
                if (this.attackCooldown > 0) {
                    this.attackCooldown -= deltaTime;
                }
                
                // 更新寻找目标冷却
                if (this.findTargetCooldown > 0) {
                    this.findTargetCooldown -= deltaTime;
                }
                if (this.type === "control_tower" && game.buildingsManager.specialBuildings.control_tower.canAttack === false){
                    this.canAttack = false;
                }
                // 如果是攻击建筑，寻找目标并攻击
                if (this.canAttack) {
                    if (this.findTargetCooldown <= 0) {
                        this.findTarget(game);
                        this.findTargetCooldown = 0.5 + Math.random() * 0.2;
                    }
                    
                    if (this.target && this.attackCooldown <= 0) {
                        this.attack(game);
                        this.attackCooldown = this.buildingType.attackSpeed;
                    }
                }
            },
            
            // 寻找目标
            findTarget: function(game) {
                let closestTarget = null;
                let minDistance = this.buildingType.range;
                
                // 检查玩家单位
                for (const unit of game.player.units) {
                    if (unit.hp <= 0) continue;
                    
                    // 检查单位类型是否在可攻击目标中
                    if (!this.buildingType.canTarget.includes(unit.stats.moveType)) continue;
                    
                    const distance = getDistance(this, unit);
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestTarget = unit;
                    }
                }
                
                this.target = closestTarget;
            },
            
            // 攻击方法
            attack: function(game) {
                if (!this.target || !this.buildingType.ammoType) return;
                
                const pStats = {
                    damage: this.buildingType.attack,
                    ammoType: this.buildingType.ammoType,
                    ammoSpeed: this.buildingType.ammoSpeed,
                    splashRadius: this.buildingType.ammoSplashRadius
                };
                
                const proj = new Projectile('ai', this,{ x: this.pixelX, y: this.pixelY }, this.target, pStats);
                game.projectiles.push(proj);
                
                // 播放攻击音效
                if (window.playSound) {
                    window.playSound('building_attack');
                }
            },
            
            // 处理伤害
            takeDamage: function(amount) {
                this.hp -= amount;
                if (this.hp < 0) this.hp = 0;
                
                // 更新摧毁状态
                this.isDestroyed = this.hp <= 0;
                
                // 如果被摧毁，移除碰撞体
                if (this.isDestroyed && this.body) {
                    Matter.World.remove(window.game.engine.world, this.body);
                    this.body = null;
                    
                    // 播放摧毁音效
                    if (window.playSound) {
                        window.playSound('building_destroyed');
                    }
                    
                    // 触发建筑物摧毁事件
                    if (window.game.onBuildingDestroyed) {
                        window.game.onBuildingDestroyed(this);
                    }
                }
            }
        };
        
        // 添加物理体到世界
        if (building.body) {
            building.body.gameObject = building;
            Matter.World.add(window.game.engine.world, building.body);
        }
        
        return building;
    }


    createBuildingBody(type, pixelX, pixelY, gridWidth, gridHeight) {
        const bodyWidth = gridWidth * TILE_SIZE;
        const bodyHeight = gridHeight * TILE_SIZE;
        
        return Matter.Bodies.rectangle(
            pixelX,
            pixelY,
            bodyWidth,
            bodyHeight,
            {
                isStatic: true,
                label: `${type}`,
                collisionFilter: {
                    category: COLLISION_CATEGORIES.terrain,
                    mask: COLLISION_CATEGORIES.ground_unit
                }
            }
        );
    }

    setBuildingHealth() {
        // 设置建筑物初始血量
        for (const building of this.buildings) {
            building.hp = building.maxHp;
        }
    }

    update(deltaTime) {
        const currentTime = Date.now();

        // 更新所有建筑物
        this.buildings.forEach(building => {
            building.update(deltaTime, this.game);
        });
        
        // 特定地图逻辑
        switch(this.game.mapId) {
            case 'map_chapter4': // 北极地图恢复逻辑
                const activeStations = this.specialBuildings.power_station ? 
                    this.specialBuildings.power_station.filter(station => !station.isDestroyed).length : 0;
                if(activeStations)this.specialBuildings.control_tower.canAttack = true;
                if (currentTime - this.lastHealTime > this.healInterval && this.game.gameState === 'playing') {
                    this.healControlTower();
                    this.lastHealTime = currentTime;
                }
                if(!activeStations && this.specialBuildings.control_tower.canAttack){
                    this.specialBuildings.control_tower.canAttack = false;
                    this.game.ui.showGameMessage('控制塔已失去恢复与攻击能力,请全力集火控制塔');
                }
                break;
        }
        
        // 检查建筑物状态
        this.checkBuildingsStatus();
    }

    healControlTower() {
        if (!this.specialBuildings.control_tower || this.specialBuildings.control_tower.isDestroyed) return;
        
        // 计算活跃能源站数量
        const activeStations = this.specialBuildings.power_station ? 
            this.specialBuildings.power_station.filter(station => !station.isDestroyed).length : 0;
        
        if (activeStations > 0) {
            // 根据活跃能源站数量计算恢复量
            const healAmount = this.healRate * activeStations;
            this.specialBuildings.control_tower.hp = Math.min(
                this.specialBuildings.control_tower.maxHp, 
                this.specialBuildings.control_tower.hp + healAmount
            );
            
            // 显示恢复效果
            this.game.ui.showGameMessage(`控制塔恢复 +${healAmount} HP (${activeStations}/3 能源站运作)`);
        }
    }

    checkBuildingsStatus() {
        // 更新所有建筑物状态
        this.buildings.forEach(building => {
            building.isDestroyed = building.hp <= 0;
        });
    }

    // 胜利条件检查
    checkWinCondition() {
        switch(this.game.mapId) {
            case 'map_chapter1': // 回声-7哨站
                // 摧毁雷达站和通信塔
                const radarDestroyed = this.specialBuildings.radar_station && 
                    this.specialBuildings.radar_station.every(b => b.isDestroyed);
                const commDestroyed = this.specialBuildings.communication_tower && 
                    this.specialBuildings.communication_tower.every(b => b.isDestroyed);
                return radarDestroyed && commDestroyed;
                
            case 'map_chapter2': // 安第斯秘密基地
                // 摧毁兵营、军火库和指挥中心
                const barracksDestroyed = this.specialBuildings.barracks && 
                    this.specialBuildings.barracks.every(b => b.isDestroyed);
                const armoryDestroyed = this.specialBuildings.armory && 
                    this.specialBuildings.armory.every(b => b.isDestroyed);
                const commandCenterDestroyed = this.specialBuildings.command_center && 
                    this.specialBuildings.command_center.every(b => b.isDestroyed);
                return barracksDestroyed && armoryDestroyed && commandCenterDestroyed;
                
            case 'map_chapter3': // 新京都市
                // 摧毁总部
                return this.specialBuildings.headquarters && 
                    this.specialBuildings.headquarters.every(b => b.isDestroyed);
                    
            case 'map_chapter4': // 北极天锤基地
                // 摧毁控制塔
                return this.specialBuildings.control_tower && 
                    this.specialBuildings.control_tower.every(b => b.isDestroyed);
                    
            case 'map_chapter5_1': // 离子炮阵地
                // 摧毁离子炮
                return this.specialBuildings.ion_cannon && 
                    this.specialBuildings.ion_cannon.every(b => b.isDestroyed);
                    
            case 'map_chapter5_2': // 海上平台
                // 摧毁主控制中心
                return this.specialBuildings.main_control && 
                    this.specialBuildings.main_control.every(b => b.isDestroyed);
                    
            default:
                // 默认胜利条件：摧毁所有建筑物
                return this.buildings.every(building => building.isDestroyed);
        }
    }

    // 失败条件检查
    checkLossCondition() {
        // 失败条件：玩家基地被摧毁
        return this.game.playerBase && this.game.playerBase.hp <= 0;
    }

    draw(ctx, zoom) {
        this.buildings.forEach(building => {
            building.draw(ctx, zoom);
            // 绘制建筑名称
            if (!building.isDestroyed && this.showBuildingNames) {
                this.drawBuildingName(ctx, building, zoom);
            }
        });
    }

    // 绘制建筑名称
    drawBuildingName(ctx, building, zoom) {
        const name = this.getBuildingDisplayName(building.type);
        const fontSize = Math.max(10, 12 / zoom);
        const padding = 4 / zoom;
        
        // 计算文本宽度
        ctx.font = `${fontSize}px Arial`;
        const textWidth = ctx.measureText(name).width;
        
        // 计算背景框位置和大小
        const bgWidth = textWidth + padding * 2;
        const bgHeight = fontSize + padding * 2;
        const bgX = building.pixelX - bgWidth / 2;
        const bgY = building.pixelY - building.gridHeight * TILE_SIZE / 2 - bgHeight - 5 / zoom;
        
        // 绘制半透明背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
        
        // 绘制边框
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1 / zoom;
        ctx.strokeRect(bgX, bgY, bgWidth, bgHeight);
        
        // 绘制文本
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(name, building.pixelX, bgY + bgHeight / 2);
        
        // 恢复文本设置
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    }

    // 处理建筑物受到的伤害
    damageBuilding(gridX, gridY, damage) {
        const building = this.findBuildingAt(gridX, gridY);
        if (building && !building.isDestroyed) {
            building.takeDamage(damage);
            
            // 显示伤害效果
            const buildingName = this.getBuildingDisplayName(building.type);
            this.game.ui.showGameMessage(`${buildingName}受到 ${damage} 伤害`);
            
            return true;
        }
        return false;
    }

    findBuildingAt(gridX, gridY) {
        return this.buildings.find(building => 
            gridX >= building.gridX && 
            gridX < building.gridX + building.gridWidth &&
            gridY >= building.gridY && 
            gridY < building.gridY + building.gridHeight
        );
    }

    // 添加建筑物显示名称映射
    getBuildingDisplayName(type) {
        const names = {
            'observation_tower': '观察塔',
            'bridge_control': '桥梁控制站',
            'bunker': '地堡',
            'training_target': '训练目标',
            'training_barrier': '训练障碍',
            'radar_station': '雷达站',
            'communication_tower': '通信塔',
            'storage_depot': '仓库',
            'barracks': '兵营',
            'watchtower': '瞭望塔',
            'armory': '军火库',
            'command_center': '指挥中心',
            'research_lab': '研究实验室',
            'power_generator': '发电机',
            'guard_tower': '守卫塔',
            'headquarters': '总部',
            'communication_center': '通信中心',
            'skyscraper': '摩天大楼',
            'shopping_mall': '购物中心',
            'apartment_complex': '公寓楼',
            'parking_garage': '停车场',
            'checkpoint': '检查点',
            'control_tower': '控制塔',
            'power_station': '能源站',
            'radar_dome': '雷达穹顶',
            'hangar': '机库',
            'ion_cannon': '离子炮',
            'power_conduit': '能源导管',
            'defense_turret': '防御炮塔',
            'main_control': '主控制中心',
            'research_center': '研究中心',
            'missile_silo': '导弹发射井',
            'aa_gun': '防空炮'
        };
        return names[type] || type;
    }
}