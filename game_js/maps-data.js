// 'g': 草地, 'f': 森林, 'r': 马路, 'w': 海洋, 'b': 建筑,...
// 'g': 'grass', 'f': 'forest', 'r': 'road', 'w': 'water', 'b': 'building',
// 'd': 'desert','i': 'ice','s': 'snow','m': 'mountain','x': 'deep_water'
const MAP_DEFINITIONS = [
    {
        id: 'map_new_01',
        name: '十字路口冲突 (Crossroads Clash)',
        description: '中心道路是兵家必争之地，两侧的森林为伏击提供了可能。',
        width: 80, height: 60,
        buildings: [
            { type: 'observation_tower', x: 10, y: 10, width: 3, height: 3, hp: 800 },
            { type: 'observation_tower', x: 70, y: 10, width: 3, height: 3, hp: 800 },
            { type: 'observation_tower', x: 10, y: 50, width: 3, height: 3, hp: 800 },
            { type: 'observation_tower', x: 70, y: 50, width: 3, height: 3, hp: 800 }
        ],
        grid: (() => {
            const w = 80, h = 60;
            let grid = Array(h).fill(null).map(() => Array(w).fill('g'));
            // 主干道
            for (let y = 0; y < h; y++) {
                grid[y][Math.floor(w/2) -1] = 'r';
                grid[y][Math.floor(w/2)] = 'r';
            }
             for (let x = 0; x < w; x++) {
                grid[Math.floor(h/2) -1][x] = 'r';
                grid[Math.floor(h/2)][x] = 'r';
            }
            // 森林区域
            for (let y = 10; y < 22; y++) {
                for(let x = 10; x < 25; x++) if(Math.random() > 0.3) grid[y][x] = 'f';
                for(let x = w-25; x < w-10; x++) if(Math.random() > 0.3) grid[y][x] = 'f';
            }
             for (let y = h-22; y < h-10; y++) {
                for(let x = 10; x < 25; x++) if(Math.random() > 0.3) grid[y][x] = 'f';
                for(let x = w-25; x < w-10; x++) if(Math.random() > 0.3) grid[y][x] = 'f';
            }
            // 中央河流
            for (let x = 28; x < 52; x++) {
                 if (x > 38 && x < 42) continue; // 桥
                 grid[5][x] = 'w';
                 grid[h-6][x] = 'w';
            }
            return grid.map(row => row.join(''));
        })()
    },
    {
        id: 'map01',
        name: '双子桥 (Twin Bridges) - 大地图版',
        description: '一条河流将地图一分为二，只有两座桥梁可供地面部队通过。',
        width: 100, height: 60, // 直接定义为大尺寸
        buildings: [
            { type: 'bridge_control', x: 20, y: 28, width: 4, height: 4, hp: 1200 },
            { type: 'bridge_control', x: 72, y: 28, width: 4, height: 4, hp: 1200 },
            { type: 'bunker', x: 15, y: 15, width: 3, height: 3, hp: 1000 },
            { type: 'bunker', x: 85, y: 15, width: 3, height: 3, hp: 1000 },
            { type: 'bunker', x: 15, y: 45, width: 3, height: 3, hp: 1000 },
            { type: 'bunker', x: 85, y: 45, width: 3, height: 3, hp: 1000 }
        ],
        grid: (() => {
            const w = 100, h = 60;
            let grid = Array(h).fill(null).map(() => Array(w).fill('g'));
            // 河流
            for (let y = 28; y < 32; y++) {
                for (let x = 0; x < w; x++) grid[y][x] = 'w';
            }
            // 桥梁 (马路)
            for (let y = 28; y < 32; y++) {
                for(let x=20; x < 28; x++) grid[y][x] = 'r';
                for(let x=72; x < 80; x++) grid[y][x] = 'r';
            }
            // 添加一些随机森林
            for (let i = 0; i < 200; i++) {
                const randX = Math.floor(Math.random() * w);
                const randY = Math.floor(Math.random() * h);
                if (grid[randY][randX] === 'g') grid[randY][randX] = 'f';
            }
            return grid.map(row => row.join(''));
        })()
    },
    // 添加教程地图
    {
        id: 'map_tutorial',
        name: '训练基地',
        description: '新手训练场地，学习基本操作和战术。',
        width: 30, height: 30,
        buildings: [
            { type: 'training_target', x: 15, y: 12, width: 2, height: 2, hp: 500 },
            { type: 'training_target', x: 15, y: 17, width: 2, height: 2, hp: 500 },
            { type: 'training_barrier', x: 12, y: 12, width: 3, height: 3, hp: 300 },
            { type: 'training_barrier', x: 12, y: 17, width: 3, height: 3, hp: 300 },
            { type: 'training_barrier', x: 18, y: 12, width: 3, height: 3, hp: 300 },
            { type: 'training_barrier', x: 18, y: 17, width: 3, height: 3, hp: 300 }
        ],
        grid: (() => {
            const w = 30, h = 30;
            let grid = Array(h).fill(null).map(() => Array(w).fill('g'));            
            // 左侧部署区域 - 标记为玩家区域
            for (let y = 0; y < 30; y++) {
                for (let x = 0; x < 10; x++) {
                    grid[y][x] = 'f'; // 使用森林标记玩家部署区
                }
            }
            
            // 右侧目标区域 - 标记为AI区域
            for (let y = 0; y < 30; y++) {
                for (let x = 20; x < 30; x++) {
                    grid[y][x] = 'd'; // 使用建筑标记AI区域
                }
            }
                        
            // 简单道路连接左右区域
            for (let y = 14; y < 17; y++) {
                for (let x = 10; x < 20; x++) {
                    grid[y][x] = 'r';
                }
            }
                      
            return grid.map(row => row.join(''));
        })()
    },
    // 第一章：沙暴中的回响 - 撒哈拉沙漠哨站
    {
        id: 'map_chapter1',
        name: '回声-7哨站',
        description: '撒哈拉沙漠边缘的孤立哨站，沙丘提供了有限的掩护，但视野开阔易被发现。',
        width: 60, height: 60,
        buildings: [
            { type: 'radar_station', x: 25, y: 25, width: 5, height: 5, hp: 1500 },
            { type: 'communication_tower', x: 35, y: 25, width: 3, height: 5, hp: 1000 },
            { type: 'storage_depot', x: 25, y: 35, width: 5, height: 5, hp: 1200 },
            { type: 'barracks', x: 35, y: 35, width: 5, height: 5, hp: 1500 },
            { type: 'watchtower', x: 46, y: 25, width: 3, height: 3, hp: 800 },
            { type: 'watchtower', x: 54, y: 25, width: 3, height: 3, hp: 800 },
            { type: 'watchtower', x: 46, y: 33, width: 3, height: 3, hp: 800 },
            { type: 'watchtower', x: 54, y: 33, width: 3, height: 3, hp: 800 }
        ],
        grid: (() => {
            const w = 60, h = 60;
            let grid = Array(h).fill(null).map(() => Array(w).fill('d'));
                        
            // 沙漠中的随机岩石(用山地表示)
            for (let i = 0; i < 80; i++) {
                const randX = Math.floor(Math.random() * (w-10)) + 5;
                const randY = Math.floor(Math.random() * (h-10)) + 5;
                if (grid[randY][randX] === 'd') {
                    // 创建小片岩石区域
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (randY+dy >= 0 && randY+dy < h && randX+dx >= 0 && randX+dx < w && 
                                Math.random() > 0.5) {
                                grid[randY+dy][randX+dx] = 'm';
                            }
                        }
                    }
                }
            }
            
            // 道路连接
            for (let x = 0; x < w; x++) {
                grid[30][x] = 'r';
            }
            
            return grid.map(row => row.join(''));
        })()
    },
    // 第二章：峡谷中的秘密 - 安第斯山脉基地
    {
        id: 'map_chapter2',
        name: '安第斯秘密基地',
        description: '隐藏在安第斯山脉深处的刻耳柏洛斯基地，峡谷地形限制了机动但提供了天然防御。',
        width: 80, height: 60,
        buildings: [
            { type: 'barracks', x: 33, y: 28, width: 5, height: 5, hp: 1500 },
            { type: 'armory', x: 45, y: 28, width: 5, height: 5, hp: 2000 },
            { type: 'command_center', x:38, y: 21, width: 7, height: 7, hp: 3000 },
            { type: 'research_lab', x: 28, y: 23, width: 5, height: 5, hp: 1800 },
            { type: 'power_generator', x: 50, y: 20, width: 3, height: 3, hp: 1200 },
            { type: 'guard_tower', x: 34, y: 15, width: 3, height: 3, hp: 800 },
            { type: 'guard_tower', x: 46, y: 15, width: 3, height: 3, hp: 800 },
            { type: 'guard_tower', x: 34, y: 35, width: 3, height: 3, hp: 800 },
            { type: 'guard_tower', x: 46, y: 35, width: 3, height: 3, hp: 800 },
            { type: 'guard_tower', x: 34, y: 25, width: 3, height: 3, hp: 800 },
            { type: 'guard_tower', x: 46, y: 25, width: 3, height: 3, hp: 800 }
        ],
        grid: (() => {
            const w = 80, h = 60;
            let grid = Array(h).fill(null).map(() => Array(w).fill('g'));
            
            // 中央峡谷
            for (let y = 0; y < h; y++) {
                for (let x = 15; x < 65; x++) {
                    if (x < 20 || x > 60) {
                        grid[y][x] = 'm'; // 山脉
                    }
                }
            }
            //围墙
            for (let y = 15; y < 38; y++) {
                for (let x = 20; x < 24; x++) {
                    grid[y][x] = 'w';
                }
            }
            for (let y = 15; y < 38; y++) {
                for (let x = 57; x < 61; x++) {
                    grid[y][x] = 'w';
                }
            }
            // 河流穿过峡谷
            for (let y = 38; y < 43; y++) {
                for (let x = 20; x < 61; x++) {
                    grid[y][x] = 'w';
                }
            }
            for (let y = 10; y < 15; y++) {
                for (let x = 20; x < 61; x++) {
                    grid[y][x] = 'w';
                }
            }
            // 桥梁
            for (let y = 38; y < 43; y++) {
                for (let x = 36; x < 47; x++) {
                    grid[y][x] = 'r';
                }
            }
            for (let y = 10; y < 15; y++) {
                for (let x = 36; x < 47; x++) {
                    grid[y][x] = 'r';
                }
            }
            return grid.map(row => row.join(''));
        })()
    },
    // 第三章：霓虹下的战争 - 新京都市区
    {
        id: 'map_chapter3',
        name: '新京都市战场',
        description: '霓虹闪烁的现代都市，高楼大厦提供掩护但也限制了视野，街道成为天然战线。',
        width: 100, height: 80,
        buildings: [
            { type: 'headquarters', x: 45, y: 40, width: 7, height: 7, hp: 4000 },
            { type: 'communication_center', x: 40, y: 35, width: 5, height: 5, hp: 2000 },
            { type: 'skyscraper', x: 30, y: 30, width: 5, height: 6, hp: 2500 },
            { type: 'skyscraper', x: 50, y: 30, width: 5, height: 6, hp: 2500 },
            { type: 'shopping_mall', x: 35, y: 45, width: 7, height: 5, hp: 2200 },
            { type: 'apartment_complex', x: 45, y: 45, width: 7, height: 5, hp: 2200 },
            { type: 'parking_garage', x: 40, y: 50, width: 5, height: 4, hp: 1500 },
            { type: 'checkpoint', x: 35, y: 25, width: 3, height: 3, hp: 1000 },
            { type: 'checkpoint', x: 45, y: 25, width: 3, height: 3, hp: 1000 }
        ],
        grid: (() => {
            const w = 100, h = 80;
            let grid = Array(h).fill(null).map(() => Array(w).fill('d'));
            
            // 创建城市网格道路
            for (let x = 0; x < w; x += 10) {
                for (let y = 0; y < h; y++) {
                    if (y % 10 < 2) {
                        grid[y][x] = 'r';
                        grid[y][x+1] = 'r';
                    }
                }
            }
            
            for (let y = 0; y < h; y += 10) {
                for (let x = 0; x < w; x++) {
                    if (x % 10 < 2) {
                        grid[y][x] = 'r';
                        grid[y+1][x] = 'r';
                    }
                }
            }
            
            // 随机放置建筑
            for (let i = 0; i < 50; i++) {
                const blockX = Math.floor(Math.random() * 10) * 10 + 3;
                const blockY = Math.floor(Math.random() * 8) * 10 + 3;
                const size = Math.floor(Math.random() * 4) + 2;
                
                for (let y = blockY; y < blockY + size && y < h-1; y++) {
                    for (let x = blockX; x < blockX + size && x < w-1; x++) {
                        grid[y][x] = 'b';
                    }
                }
            }
            
            // 中央大型建筑 - 毒蛇的指挥总部
            for (let y = 35; y < 45; y++) {
                for (let x = 45; x < 55; x++) {
                    grid[y][x] = 'b';
                }
            }
            
            return grid.map(row => row.join(''));
        })()
    },
    // 第四章：冰封地狱 - 北极天锤基地
    {
        id: 'map_chapter4',
        name: '北极天锤控制基地',
        description: '冰天雪地的北极基地，三个能源站为主控塔提供护盾，极地环境影响移动。',
        width: 80, height: 80,
        buildings: [
            { type: 'control_tower', x: 37, y: 35, width: 7, height: 7, hp: 5000 },
            { type: 'power_station', x: 38, y: 15, width: 5, height: 5, hp: 2000 },
            { type: 'power_station', x: 60, y: 38, width: 5, height: 5, hp: 2000 },
            { type: 'power_station', x: 38, y: 60, width: 5, height: 5, hp: 2000 },
            { type: 'radar_dome', x: 25, y: 25, width: 5, height: 5, hp: 1500 },
            { type: 'radar_dome', x: 50, y: 25, width: 5, height: 5, hp: 1500 },
            { type: 'radar_dome', x: 25, y: 50, width: 5, height: 5, hp: 1500 },
            { type: 'radar_dome', x: 50, y: 50, width: 5, height: 5, hp: 1500 },
            { type: 'hangar', x: 20, y: 35, width: 5, height: 4, hp: 1800 },
            { type: 'hangar', x: 55, y: 35, width: 5, height: 4, hp: 1800 }
        ],
        grid: (() => {
            const w = 80, h = 80;
            let grid = Array(h).fill(null).map(() => Array(w).fill('i'));
            
            // 冰原上的裂缝(水域)
            for (let i = 0; i < 5; i++) {
                const startX = Math.floor(Math.random() * (w-20)) + 10;
                const startY = Math.floor(Math.random() * (h-20)) + 10;
                const length = Math.floor(Math.random() * 15) + 10;
                const direction = Math.random() > 0.5 ? 1 : -1;
                
                for (let j = 0; j < length; j++) {
                    const x = startX + j;
                    const y = startY + j * direction;
                    if (x >= 0 && x < w && y >= 0 && y < h) {
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                if (x+dx >= 0 && x+dx < w && y+dy >= 0 && y+dy < h && 
                                    Math.random() > 0.7) {
                                    grid[y+dy][x+dx] = 'w';
                                }
                            }
                        }
                    }
                }
            }
            // 雪地区域
            for (let i = 0; i < 10; i++) {
                const centerX = Math.floor(Math.random() * (w-20)) + 10;
                const centerY = Math.floor(Math.random() * (h-20)) + 10;
                const radius = Math.floor(Math.random() * 8) + 5;
                
                for (let y = centerY - radius; y <= centerY + radius; y++) {
                    for (let x = centerX - radius; x <= centerX + radius; x++) {
                        if (x >= 0 && x < w && y >= 0 && y < h) {
                            const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
                            if (distance <= radius && Math.random() > distance/radius) {
                                grid[y][x] = 's';
                            }
                        }
                    }
                }
            }
            // 连接道路
            for (let x = 17; x < 62; x++) {
                grid[40][x] = 'r';
            }
            for (let y = 18; y < 63; y++) {
                grid[y][40] = 'r';
            }            
            return grid.map(row => row.join(''));
        })()
    },
    // 第五章：零时决战 - 离子炮阵地
    {
        id: 'map_chapter5_1',
        name: '离子炮阵地',
        description: '崎岖山地中的离子炮阵地，护送充能车到达指定位置是获胜关键。',
        width: 80, height: 60,
        buildings: [
            { type: 'ion_cannon', x: 65, y: 45, width: 7, height: 7, hp: 6000 },
            { type: 'power_conduit', x: 60, y: 40, width: 3, height: 3, hp: 1200 },
            { type: 'power_conduit', x: 70, y: 40, width: 3, height: 3, hp: 1200 },
            { type: 'power_conduit', x: 60, y: 50, width: 3, height: 3, hp: 1200 },
            { type: 'power_conduit', x: 70, y: 50, width: 3, height: 3, hp: 1200 },
            { type: 'defense_turret', x: 62, y: 35, width: 3, height: 3, hp: 1500 },
            { type: 'defense_turret', x: 68, y: 35, width: 3, height: 3, hp: 1500 },
            { type: 'defense_turret', x: 62, y: 55, width: 3, height: 3, hp: 1500 },
            { type: 'defense_turret', x: 68, y: 55, width: 3, height: 3, hp: 1500 },
            { type: 'bunker', x: 58, y: 45, width: 3, height: 3, hp: 1000 },
            { type: 'bunker', x: 72, y: 45, width: 3, height: 3, hp: 1000 }
        ],
        grid: (() => {
            const w = 80, h = 60;
            let grid = Array(h).fill(null).map(() => Array(w).fill('g'));
            
            // 山地地形
            for (let i = 0; i < 200; i++) {
                const randX = Math.floor(Math.random() * w);
                const randY = Math.floor(Math.random() * h);
                if (grid[randY][randX] === 'g') {
                    // 创建小片山地
                    for (let dy = -2; dy <= 2; dy++) {
                        for (let dx = -2; dx <= 2; dx++) {
                            if (randY+dy >= 0 && randY+dy < h && randX+dx >= 0 && randX+dx < w && 
                                Math.random() > 0.6) {
                                grid[randY+dy][randX+dx] = 'm';
                            }
                        }
                    }
                }
            }
                        
            // 蜿蜒道路从左上到右下
            let roadX = 0, roadY = 0;
            while (roadX < 69 || roadY < 52) {
                grid[roadY][roadX] = 'r';
                grid[roadY][roadX+1] = 'r';
                
                if (Math.random() > 0.4 && roadX < 69) {
                    roadX += 1;
                } else if (roadY < 52) {
                    roadY += 1;
                }
            }
            
            return grid.map(row => row.join(''));
        })()
    },
    // 终局：海上平台
    {
        id: 'map_chapter5_2',
        name: '刻耳柏洛斯海上平台',
        description: '巨大的海上平台，中央是控制塔，四周是深海，只有少量通道连接。',
        width: 70, height: 70,
        buildings: [
            { type: 'main_control', x: 32, y: 32, width: 6, height: 6, hp: 3500 },
            { type: 'power_generator', x: 28, y: 30, width: 3, height: 3, hp: 1500 },
            { type: 'power_generator', x: 39, y: 30, width: 3, height: 3, hp: 1500 },
            { type: 'hangar', x: 27, y: 38, width: 5, height: 4, hp: 2000 },
            { type: 'hangar', x: 38, y: 38, width: 5, height: 4, hp: 2000 },
            { type: 'research_center', x: 19, y: 35, width: 4, height: 4, hp: 1800 },
            { type: 'research_center', x: 47, y: 35, width: 4, height: 4, hp: 1800 },
            { type: 'missile_silo', x: 26, y: 25, width: 3, height: 4, hp: 2200 },
            { type: 'missile_silo', x: 41, y: 25, width: 3, height: 4, hp: 2200 },
            { type: 'aa_gun', x: 23, y: 27, width: 3, height: 3, hp: 1200 },
            { type: 'aa_gun', x: 44, y: 27, width: 3, height: 3, hp: 1200 },
            { type: 'aa_gun', x: 23, y: 40, width: 3, height: 3, hp: 1200 },
            { type: 'aa_gun', x: 44, y: 40, width: 3, height: 3, hp: 1200 }
        ],
        grid: (() => {
            const w = 70, h = 70;
            let grid = Array(h).fill(null).map(() => Array(w).fill('w'));
            
            // 中央平台
            for (let y = 26; y < 44; y++) {
                for (let x = 26; x < 44; x++) {
                    grid[y][x] = 'i';
                }
            }
            for (let y = 31; y < 39; y++) {
                for (let x = 31; x < 39; x++) {
                    grid[y][x] = 'w';
                }
            }
                        
            // 连接桥梁
            for (let x = 30; x < 40; x++) {
                grid[25][x] = 'r';
                grid[44][x] = 'r';
                grid[x][25] = 'r';
                grid[x][44] = 'r';
            }
            
            // 深海区域（地图边缘）
            for (let y = 0; y < 10; y++) {
                for (let x = 0; x < w; x++) {
                    grid[y][x] = 'x';
                }
            }
            for (let y = h-10; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    grid[y][x] = 'x';
                }
            }
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < 10; x++) {
                    grid[y][x] = 'x';
                }
                for (let x = w-10; x < w; x++) {
                    grid[y][x] = 'x';
                }
            }
            
            // 东南角的海沟（用深色表示，但游戏中需要特殊处理）
            for (let y = h-15; y < h-5; y++) {
                for (let x = w-15; x < w-5; x++) {
                    grid[y][x] = 'x';
                }
            }
            
            return grid.map(row => row.join(''));
        })()
    }
];