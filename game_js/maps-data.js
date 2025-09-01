// 'g': 草地, 'f': 森林, 'r': 马路, 'w': 海洋, 'b': 建筑
const MAP_DEFINITIONS = [
    {
        id: 'map_new_01',
        name: '十字路口冲突 (Crossroads Clash)',
        description: '中心道路是兵家必争之地，两侧的森林为伏击提供了可能。',
        width: 80, height: 60,
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
    {//修改 增加新手map
        id: 'map_new',
        name: '新手地图',
        description: '新手教学通用',
        width: 10, height: 10,
        grid: (() => {
            const w = 10, h = 10;
            let grid = Array(h).fill(null).map(() => Array(w).fill('g'));
            // 添加一些随机森林
            for (let i = 0; i < 20; i++) {
                const randX = Math.floor(Math.random() * w);
                const randY = Math.floor(Math.random() * h);
                if (grid[randY][randX] === 'g') grid[randY][randX] = 'f';
            }
            return grid.map(row => row.join(''));
        })()
    },
];