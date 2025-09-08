class ArcticBuildingsManager {
    constructor(game) {
        this.game = game;
        this.buildings = [];
        this.controlTower = null;
        this.powerStations = [];
        this.healRate = 200; // 每秒恢复的生命值
        this.healInterval = 1000; // 恢复间隔(毫秒)
        this.lastHealTime = 0;
    }

    initialize() {
        // 找到并注册所有特殊建筑物
        this.findAndRegisterBuildings();
        
        // 设置建筑物初始血量
        this.setBuildingHealth();
        
        console.log("北极基地建筑物系统初始化完成");
        console.log(`找到控制塔: ${this.controlTower ? "是" : "否"}`);
        console.log(`找到能源站: ${this.powerStations.length}个`);
    }

    findAndRegisterBuildings() {
        // 清除现有建筑物列表
        this.buildings = [];
        this.powerStations = [];
        this.controlTower = null;

        // 根据地图设计时的坐标找到建筑物
        // 控制塔 (中央)
        const controlTowerPos = { x: 35, y: 35 };
        this.controlTower = this.createBuilding('control_tower', controlTowerPos, 5000);
        this.buildings.push(this.controlTower);

        // 能源站1 (左上)
        const powerStation1Pos = { x: 38, y: 15 };
        const powerStation1 = this.createBuilding('power_station', powerStation1Pos, 2000);
        this.powerStations.push(powerStation1);
        this.buildings.push(powerStation1);

        // 能源站2 (右上)
        const powerStation2Pos = { x: 60, y: 38 };
        const powerStation2 = this.createBuilding('power_station', powerStation2Pos, 2000);
        this.powerStations.push(powerStation2);
        this.buildings.push(powerStation2);

        // 能源站3 (下方)
        const powerStation3Pos = { x: 38, y: 60 };
        const powerStation3 = this.createBuilding('power_station', powerStation3Pos, 2000);
        this.powerStations.push(powerStation3);
        this.buildings.push(powerStation3);
    }

    createBuilding(type, gridPos, maxHp) {
        // 确定建筑物尺寸
        const gridWidth = type === 'control_tower' ? 11 : 5;
        const gridHeight = type === 'control_tower' ? 11 : 5;
        
        // 计算像素中心点
        const pixelX = (gridPos.x + gridWidth / 2) * TILE_SIZE;
        const pixelY = (gridPos.y + gridHeight / 2) * TILE_SIZE;
        
        // 创建建筑物对象
        const building = {
            type: type,
            gridX: gridPos.x,
            gridY: gridPos.y,
            gridWidth: gridWidth,
            gridHeight: gridHeight,
            pixelX: pixelX,
            pixelY: pixelY,
            maxHp: maxHp,
            hp: maxHp,
            isDestroyed: false,
            
            // 创建物理碰撞体
            body: this.createBuildingBody(type, pixelX, pixelY, gridWidth, gridHeight),
            
            // 绘制方法
            draw: function(ctx, zoom) {
                const size = type === 'control_tower' ? TILE_SIZE * 11 : TILE_SIZE * 5;
                
                // 绘制建筑物基底
                ctx.fillStyle = type === 'control_tower' ? '#FFD700' : '#00BFFF';
                ctx.fillRect(
                    this.pixelX - size/2, 
                    this.pixelY - size/2, 
                    size, 
                    size
                );
                
                // 绘制边框
                ctx.strokeStyle = this.isDestroyed ? '#FF0000' : '#FFFFFF';
                ctx.lineWidth = 2 / zoom;
                ctx.strokeRect(
                    this.pixelX - size/2, 
                    this.pixelY - size/2, 
                    size, 
                    size
                );
                
                // 绘制血条
                const barWidth = size;
                const barHeight = 8 / zoom;
                const barYOffset = size/2 + 10 / zoom;
                
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
                
                // 如果是能源站且未被摧毁，绘制能量效果
                if (type === 'power_station' && !this.isDestroyed) {
                    ctx.fillStyle = 'rgba(0, 191, 255, 0.3)';
                    ctx.beginPath();
                    ctx.arc(this.pixelX, this.pixelY, size/2 + 5, 0, Math.PI * 2);
                    ctx.fill();
                }
            },
            
            // 处理伤害
            takeDamage: function(amount) {
                this.hp -= amount;
                if (this.hp < 0) this.hp = 0;
                console.log(`${this.type} took ${amount} damage, remaining HP: ${this.hp}`);
                
                // 更新摧毁状态
                this.isDestroyed = this.hp <= 0;
                
                // 如果被摧毁，移除碰撞体
                if (this.isDestroyed && this.body) {
                    Matter.World.remove(window.game.engine.world, this.body);
                    this.body = null;
                }
            }
        };
        
        // 添加物理体到世界
        if (building.body) {
            building.body.gameObject = building; // 添加反向引用
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
        this.controlTower.hp = 5000;
        this.controlTower.maxHp = 5000;
        
        this.powerStations.forEach(station => {
            station.hp = 2000;
            station.maxHp = 2000;
        });
    }

    update(deltaTime) {
        const currentTime = Date.now();
        
        // 定期为主控塔恢复生命值
        if (currentTime - this.lastHealTime > this.healInterval &&this.game.gameMode === 'playing') {
            this.healControlTower();
            this.lastHealTime = currentTime;
        }
        
        // 检查建筑物状态
        this.checkBuildingsStatus();
    }

    healControlTower() {
        if (!this.controlTower || this.controlTower.isDestroyed) return;
        
        // 计算活跃能源站数量
        const activeStations = this.powerStations.filter(station => !station.isDestroyed).length;
        
        if (activeStations > 0) {
            // 根据活跃能源站数量计算恢复量
            const healAmount = this.healRate * activeStations;
            this.controlTower.hp = Math.min(this.controlTower.maxHp, this.controlTower.hp + healAmount);
            
            // 显示恢复效果
            this.game.ui.showGameMessage(`控制塔恢复 +${healAmount} HP (${activeStations}/3 能源站运作)`);
        }
    }

    checkBuildingsStatus() {
        // 更新建筑物状态
        this.powerStations.forEach(station => {
            station.isDestroyed = station.hp <= 0;
        });
        
        this.controlTower.isDestroyed = this.controlTower.hp <= 0;
    }

    // 胜利条件检查 - 单独列出
    checkWinCondition() {
        // 胜利条件：摧毁控制塔
        return this.controlTower.isDestroyed;
    }

    // 失败条件检查 - 单独列出
    checkLossCondition() {
        // 失败条件：玩家基地被摧毁
        return this.game.playerBase && this.game.playerBase.hp <= 0;
    }

    draw(ctx, zoom) {
        this.buildings.forEach(building => {
            building.draw(ctx, zoom);
        });
    }

    // 处理建筑物受到的伤害
    damageBuilding(gridX, gridY, damage) {
        const building = this.findBuildingAt(gridX, gridY);
        if (building && !building.isDestroyed) {
            building.takeDamage(damage);
            
            // 显示伤害效果
            this.game.ui.showGameMessage(`${building.type === 'control_tower' ? '控制塔' : '能源站'}受到 ${damage} 伤害`);
            
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
}