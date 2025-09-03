// js/config.js
const TILE_SIZE = 32;
const GAME_SPEEDS = {'0.5': 2,'1': 1,'1.5': 0.66};

const TERRAIN_TYPES = {
    grass: { name: '草地', color: '#7CFC00', traversableBy: ['ground', 'amphibious'], priority: 1 },
    forest: { name: '森林', color: '#228B22', defenseBonus: 0.2, traversableBy: ['ground', 'amphibious'], priority: 2 },
    road: { name: '马路', color: '#696969', traversableBy: ['ground', 'amphibious'], priority: 4 },
    water: { name: '海洋', color: '#1E90FF', traversableBy: ['air', 'sea', 'amphibious'], priority: 3 },
    building: { name: '建筑', color: '#A9A9A9', defenseBonus: 0.3, traversableBy: [], priority: 0 },
    base: { name: '基地', color: '#FFD700', defenseBonus: 0.1, traversableBy: ['ground', 'amphibious', 'air'], priority: 0 }
};
const COLLISION_CATEGORIES = {
    terrain: 0x0001,
    ground_unit: 0x0002,
    air_unit: 0x0004,
};

// --- 单位定义，增加了 visionRange ---
const UNIT_TYPES = {
    // --- 步兵 ---
    assault_infantry: {
        unitClass: '步兵', icon: '👨‍✈️', name: '突击步兵',
        cost: 1, hp: 100, attack: 15, defense: 5, range: 4 * TILE_SIZE, speed: 1.5, attackSpeed: 1.2, visionRange: 4 * TILE_SIZE * 1.5,
        moveType: 'ground', canTarget: ['ground','amphibious','sea'], imageSrc: 'assets/pics/assault_infantry.png', drawScale: 1.5,
        ammoType: 'bullet', ammoSpeed: 20 * TILE_SIZE, ammoSplashRadius: 0,
        description: '基础作战单位，廉价且灵活。'
    },
    sniper: {
        unitClass: '步兵', icon: '🎯', name: '狙击手',
        cost: 3, hp: 70, attack: 50, defense: 0, range: 9 * TILE_SIZE, speed: 1.2, attackSpeed: 4.0, visionRange: 9 * TILE_SIZE * 1.5,
        moveType: 'ground', canTarget: ['ground','amphibious','sea'], imageSrc: 'assets/pics/sniper.png', drawScale: 1.5,
        ammoType: 'bullet', ammoSpeed: 30 * TILE_SIZE, ammoSplashRadius: 0, special: 'SETUP_TO_FIRE', 
        description: '超远射程，对步兵单位造成巨大威胁，但自身脆弱。'
    },
    // ... 为所有单位添加 visionRange 属性 ...
    anti_tank_trooper: {
        unitClass: '步兵', icon: '🚀', name: '反坦克兵',
        cost: 2, hp: 90, attack: 25, defense: 5, range: 5 * TILE_SIZE, speed: 1.3, attackSpeed: 2.5, visionRange: 5 * TILE_SIZE * 1.5,
        moveType: 'ground', canTarget: ['ground','amphibious','sea'], imageSrc: 'assets/pics/anti_tank_trooper.png', drawScale: 1.5,
        ammoType: 'shell', ammoSpeed: 12 * TILE_SIZE, ammoSplashRadius: 0.5 * TILE_SIZE, counters: { armor: 1.8 },
        description: '携带火箭筒，能有效对抗敌方装甲单位。'
    },
    main_battle_tank: {
        unitClass: '装甲', icon: 'T', name: '主战坦克',
        cost: 5, hp: 400, attack: 50, defense: 35, range: 6 * TILE_SIZE, speed: 1.1, attackSpeed: 2.2, visionRange: 6 * TILE_SIZE * 1.5,
        moveType: 'ground', unitType: 'armor', canTarget: ['ground','amphibious','sea'], imageSrc: 'assets/pics/main_battle_tank.png', drawScale: 3,
        ammoType: 'shell', ammoSpeed: 8 * TILE_SIZE, ammoSplashRadius: 1.5 * TILE_SIZE,
        description: '战场中坚，攻防兼备，是地面推进的核心力量。'
    },
    light_tank: {
        unitClass: '装甲', icon: 't', name: '轻型坦克',
        cost: 3, hp: 250, attack: 30, defense: 20, range: 5 * TILE_SIZE, speed: 1.8, attackSpeed: 1.8, visionRange: 5 * TILE_SIZE * 1.5,
        moveType: 'ground', unitType: 'armor', canTarget: ['ground','amphibious','sea'], imageSrc: 'assets/pics/light_tank.png', drawScale: 3,
        ammoType: 'missile', ammoSpeed: 15 * TILE_SIZE, ammoSplashRadius: 0,
        description: '机动性更强，适合侦察和快速穿插。'
    },
    amphibious_tank: {
        unitClass: '装甲', icon: 'A', name: '两栖坦克',
        cost: 4, hp: 300, attack: 35, defense: 25, range: 5 * TILE_SIZE, speed: 1.2, attackSpeed: 2.0, visionRange: 5 * TILE_SIZE * 1.5,
        moveType: 'amphibious', unitType: 'armor', canTarget: ['ground', 'sea','amphibious','sea'], imageSrc: 'assets/pics/amphibious_tank.png', drawScale: 3,
        ammoType: 'missile', ammoSpeed: 15 * TILE_SIZE, ammoSplashRadius: 0,
        description: '可以穿越水域和陆地，用于登陆作战。'
    },
    fighter_jet: {
        unitClass: '飞行', icon: '✈️', name: '战斗机',
        cost: 6, hp: 200, attack: 60, defense: 10, range: 8 * TILE_SIZE, speed: 5.0, attackSpeed: 2.0, visionRange: 8 * TILE_SIZE * 1.5,
        moveType: 'air', canTarget: ['air','sea'], imageSrc: 'assets/pics/fighter_jet.jpg', drawScale: 5,
        ammoType: 'missile', ammoSpeed: 15 * TILE_SIZE, ammoSplashRadius: 0, counters: { air: 1.8 },
        description: '夺取制空权的王者，专门猎杀敌方飞行单位。'
    },
    attack_helicopter: {
        unitClass: '飞行', icon: '🚁', name: '攻击直升机',
        cost: 5, hp: 250, attack: 40, defense: 15, range: 7 * TILE_SIZE, speed: 3.0, attackSpeed: 1.8, visionRange: 7 * TILE_SIZE * 1.5,
        moveType: 'air', unitType: 'air', canTarget: ['ground', 'sea','amphibious'], imageSrc: 'assets/pics/attack_helicopter.jpg', drawScale: 3,
        ammoType: 'missile', ammoSpeed: 15 * TILE_SIZE, ammoSplashRadius: 0, counters: { armor: 1.4 },
        description: '低空盘旋的坦克杀手，为地面部队提供火力支援。'
    },
    recon_drone: {
        unitClass: '飞行', icon: '🛰️', name: '无人侦察机',
        cost: 2, hp: 50, attack: 0, defense: 0, range: 0, speed: 4.0, attackSpeed: 99, visionRange: 8 * TILE_SIZE * 1.5,
        moveType: 'air', unitType: 'air', canTarget: [], imageSrc: 'assets/pics/recon_drone.png', drawScale: 1.5,
        ammoType: null, ammoSpeed: 0, ammoSplashRadius: 0,
        description: '廉价的空中侦察单位，移动速度快，视野范围广。'
    },
    howitzer: {
        unitClass: '炮兵', icon: '💣', name: '榴弹炮',
        cost: 6, hp: 120, attack: 100, defense: 5, range: 12 * TILE_SIZE, speed: 0.8, attackSpeed: 5.0, visionRange: 12 * TILE_SIZE * 1.5,
        moveType: 'ground', special: 'SETUP_TO_FIRE', canTarget: ['ground','amphibious','sea'], imageSrc: 'assets/pics/howitzer.png', drawScale: 4,
        ammoType: 'shell', ammoSpeed: 15 * TILE_SIZE, ammoSplashRadius: 1.5 * TILE_SIZE,
        description: '超远程地面压制火力，但需要部署才能开火。'
    },
    sam_launcher: {
        unitClass: '炮兵', icon: '🗼', name: '防空炮',
        cost: 5, hp: 150, attack: 80, defense: 10, range: 10 * TILE_SIZE, speed: 1.0, attackSpeed: 0.4, visionRange: 10 * TILE_SIZE * 1.5,
        moveType: 'ground', special: 'SETUP_TO_FIRE', canTarget: ['air'], imageSrc: 'assets/pics/sam_launcher.png', drawScale: 5,
        ammoType: 'shell', ammoSpeed: 20 * TILE_SIZE, ammoSplashRadius: 0.5 * TILE_SIZE,
        description: '远程防空武器，对战斗机和轰炸机是致命威胁。'
    },
    destroyer: {
        unitClass: '海军', icon: '🚢', name: '驱逐舰',
        cost: 8, hp: 600, attack: 70, defense: 30, range: 9 * TILE_SIZE, speed: 1.5, attackSpeed: 2.8, visionRange: 9 * TILE_SIZE * 1.5,
        moveType: 'sea', canTarget: ['ground', 'sea', 'air'], imageSrc: 'assets/pics/destroyer.png', drawScale: 10,
        ammoType: 'missile', ammoSpeed: 30 * TILE_SIZE, ammoSplashRadius: 1.5 * TILE_SIZE,
        description: '功能全面的主力战舰，可以攻击来自海陆空的任何敌人。'
    },
    submarine: {
        unitClass: '海军', icon: '🌊', name: '潜艇',
        cost: 7, hp: 400, attack: 90, defense: 15, range: 8 * TILE_SIZE, speed: 1.8, attackSpeed: 3.5, visionRange: 8 * TILE_SIZE * 1.5,
        moveType: 'sea', canTarget: ['sea'], imageSrc: 'assets/pics/submarine.png', drawScale: 7,
        ammoType: 'missile', ammoSpeed: 20 * TILE_SIZE, ammoSplashRadius: 0,
        description: '水下杀手，擅长对敌方潜艇和潜水船进行攻击。'
    },
};