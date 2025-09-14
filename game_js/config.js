// js/config.js
const TILE_SIZE = 32;
const DRAW_SCALE_FACTOR = 0.5;
const AMMOSPEED = 3;
const GAME_SPEEDS = {'0.5': 2,'1': 1,'1.5': 0.66};
const CRUSH_DAMAGE = 350; // 定义碾压伤害值

const TERRAIN_TYPES = {
    grass: { name: '草地', color: '#7CFC00', traversableBy: ['ground', 'amphibious'], priority: 2 },
    forest: { name: '森林', color: '#228B22', defenseBonus: 0.2, traversableBy: ['ground', 'amphibious'], priority: 3 },
    road: { name: '马路', color: '#696969', traversableBy: ['ground', 'amphibious'], priority: 0 },
    water: { name: '海洋', color: '#1E90FF', traversableBy: ['air', 'sea', 'amphibious'], priority: 1 },
    building: { name: '建筑', color: '#A9A9A9', defenseBonus: 0.3, traversableBy: [], priority: 0 },
    base: { name: '基地', color: '#FFD700', defenseBonus: 0.1, traversableBy: ['ground', 'amphibious', 'air'], priority: 0 },
    desert: { name: '沙漠', color: '#EDC9AF', traversableBy: ['ground', 'amphibious'], movementCost: 1.2, priority: 2 },
    ice: { name: '冰原', color: '#F0F8FF', traversableBy: ['ground', 'amphibious'], movementCost: 1.5, defensePenalty: 0.1, priority: 2 },
    snow: { name: '雪地', color: '#FFFFFF', traversableBy: ['ground', 'amphibious'], movementCost: 1.3, priority: 2 },
    mountain: { name: '山地', color: '#8B4513', defenseBonus: 0.4, traversableBy: ['ground', 'amphibious'], movementCost: 2.0, priority: 4 },
    deep_water: { name: '深水', color: '#000080', traversableBy: ['sea', 'amphibious'], movementCost: 1.5, priority: 1 }
};
const COLLISION_CATEGORIES = {
    terrain: 0x0001,
    ground_unit: 0x0002,
    air_unit: 0x0004,
};

const UNIT_TYPES = {
    // --- 步兵 ---
    assault_infantry: {
        unitClass: '步兵', icon: '👨‍✈️', name: '突击步兵',
        cost: 1, hp: 150, attack: 6, defense: 5, range: 4 * TILE_SIZE, speed: 1.5, attackSpeed: 1.2, visionRange: 4 * TILE_SIZE * 1.5,
        moveType: 'ground', canTarget: ['ground','amphibious','sea'], imageSrc: '../assets/pics/assault_infantry.png', drawScale: 1.5 * DRAW_SCALE_FACTOR,
        ammoType: 'bullet', ammoSpeed: 20 * TILE_SIZE * AMMOSPEED, ammoSplashRadius: 0,
        description: '基础作战单位，廉价且灵活。',
        isCrushable: true,
        counters: { '步兵': 1.0, '装甲': 0.3, '飞行': 0.1, '海军': 0.2 }
    },
    sniper: {
        unitClass: '步兵', icon: '🎯', name: '狙击手',
        cost: 3, hp: 80, attack: 10, defense: 0, range: 9 * TILE_SIZE, speed: 1.2, attackSpeed: 4.0, visionRange: 9 * TILE_SIZE * 1.5,
        moveType: 'ground', canTarget: ['ground','amphibious','sea'], imageSrc: '../assets/pics/sniper.png', drawScale: 1.5 * DRAW_SCALE_FACTOR,
        ammoType: 'bullet', ammoSpeed: 30 * TILE_SIZE * AMMOSPEED, ammoSplashRadius: 0, special: 'SETUP_TO_FIRE', 
        description: '超远射程，对步兵单位造成巨大威胁，但自身脆弱。',
        isCrushable: true,
        counters: { '步兵': 2.5, '装甲': 0.1, '飞行': 0, '海军': 0.1 } // 对步兵是天敌，对其他几乎无伤害
    },
    anti_tank_trooper: {
        unitClass: '步兵', icon: '🚀', name: '反坦克兵',
        cost: 2, hp: 110, attack: 15, defense: 5, range: 5 * TILE_SIZE, speed: 1.3, attackSpeed: 2.5, visionRange: 5 * TILE_SIZE * 1.5,
        moveType: 'ground', canTarget: ['ground','amphibious','sea'], imageSrc: '../assets/pics/anti_tank_trooper.png', drawScale: 1.5 * DRAW_SCALE_FACTOR,
        ammoType: 'shell', ammoSpeed: 12 * TILE_SIZE * AMMOSPEED, ammoSplashRadius: 0.5 * TILE_SIZE,
        description: '携带火箭筒，能有效对抗敌方装甲单位。',
        isCrushable: true,
        counters: { '步兵': 0.8, '装甲': 1.8, '飞行': 0, '海军': 1.2 } // 坦克杀手
    },
    main_battle_tank: {
        unitClass: '装甲', icon: 'T', name: '主战坦克',
        cost: 5, hp: 400, attack: 30, defense: 35, range: 6 * TILE_SIZE, speed: 1.1, attackSpeed: 2.2, visionRange: 6 * TILE_SIZE * 1.5,
        moveType: 'ground', canTarget: ['ground','amphibious','sea'], imageSrc: '../assets/pics/main_battle_tank.png', drawScale: 3 * DRAW_SCALE_FACTOR,
        ammoType: 'shell', ammoSpeed: 8 * TILE_SIZE * AMMOSPEED, ammoSplashRadius: 1.0 * TILE_SIZE,
        description: '战场中坚，攻防兼备，是地面推进的核心力量。',
        canCrush: true,
        counters: { '步兵': 1.5, '装甲': 1.0, '飞行': 0.1, '海军': 0.5 }
    },
    light_tank: {
        unitClass: '装甲', icon: 't', name: '轻型坦克',
        cost: 3, hp: 250, attack: 18, defense: 20, range: 5 * TILE_SIZE, speed: 1.8, attackSpeed: 1.8, visionRange: 5 * TILE_SIZE * 1.5,
        moveType: 'ground', canTarget: ['ground','amphibious','sea'], imageSrc: '../assets/pics/light_tank.png', drawScale: 3 * DRAW_SCALE_FACTOR,
        ammoType: 'missile', ammoSpeed: 15 * TILE_SIZE * AMMOSPEED, ammoSplashRadius: 0.5 * TILE_SIZE,
        description: '机动性更强，适合侦察和快速穿插。',
        canCrush: true,
        counters: { '步兵': 1.2, '装甲': 0.8, '飞行': 0.1, '海军': 0.4 }
    },
    amphibious_tank: {
        unitClass: '装甲', icon: 'A', name: '两栖坦克',
        cost: 4, hp: 300, attack: 32, defense: 25, range: 5 * TILE_SIZE, speed: 1.2, attackSpeed: 2.0, visionRange: 5 * TILE_SIZE * 1.5,
        moveType: 'amphibious', canTarget: ['ground','sea','amphibious'], imageSrc: '../assets/pics/amphibious_tank.png', drawScale: 3 * DRAW_SCALE_FACTOR,
        ammoType: 'missile', ammoSpeed: 15 * TILE_SIZE * AMMOSPEED, ammoSplashRadius: 0.5 * TILE_SIZE,
        description: '可以穿越水域和陆地，用于登陆作战。',
        canCrush: true,
        counters: { '步兵': 1.3, '装甲': 0.9, '飞行': 0.1, '海军': 1.1 }
    },
    fighter_jet: {
       unitClass: '飞行', icon: '✈️', name: '战斗机',
        cost: 6, hp: 200, attack: 30, defense: 10, range: 8 * TILE_SIZE, speed: 5.0, attackSpeed: 2.0, visionRange: 8 * TILE_SIZE * 1.5,
        moveType: 'air', canTarget: ['air'], imageSrc: '../assets/pics/fighter_jet.jpg', drawScale: 4 * DRAW_SCALE_FACTOR,
        ammoType: 'missile', ammoSpeed: 15 * TILE_SIZE * AMMOSPEED, ammoSplashRadius: 0,
        description: '夺取制空权的王者，专门猎杀敌方飞行单位。',
        counters: { '步兵': 0, '装甲': 0, '飞行': 2.0, '海军': 0 } // 纯空优，对地毫无还手之力
    },
    attack_helicopter: {
        unitClass: '飞行', icon: '🚁', name: '攻击直升机',
        cost: 5, hp: 250, attack: 40, defense: 15, range: 7 * TILE_SIZE, speed: 3.0, attackSpeed: 1.8, visionRange: 7 * TILE_SIZE * 1.5,
        moveType: 'air', canTarget: ['ground','sea','amphibious'], imageSrc: '../assets/pics/attack_helicopter.jpg', drawScale: 3 * DRAW_SCALE_FACTOR,
        ammoType: 'missile', ammoSpeed: 15 * TILE_SIZE * AMMOSPEED, ammoSplashRadius: 0,
        description: '低空盘旋的坦克杀手，为地面部队提供火力支援。',
        counters: { '步兵': 1.0, '装甲': 1.6, '飞行': 0.2, '海军': 1.0 } // 另一个坦克杀手
    },
    recon_drone: {
        unitClass: '飞行', icon: '🛰️', name: '无人侦察机',
        cost: 2, hp: 50, attack: 0, defense: 0, range: 0, speed: 4.0, attackSpeed: 99, visionRange: 8 * TILE_SIZE * 1.5,
        moveType: 'air', canTarget: [], imageSrc: '../assets/pics/recon_drone.png', drawScale: 1.5 * DRAW_SCALE_FACTOR,
        ammoType: null, ammoSpeed: 0, ammoSplashRadius: 0,
        description: '廉价的空中侦察单位，移动速度快，视野范围广。',
        counters: {}
    },
    howitzer: {
        unitClass: '炮兵', icon: '💣', name: '榴弹炮',
        cost: 6, hp: 120, attack: 100, defense: 5, range: 12 * TILE_SIZE, speed: 0.8, attackSpeed: 5.0, visionRange: 12 * TILE_SIZE * 1.5,
        moveType: 'ground', special: 'SETUP_TO_FIRE', canTarget: ['ground','amphibious','sea'], imageSrc: '../assets/pics/howitzer.png', drawScale: 4 * DRAW_SCALE_FACTOR,
        ammoType: 'shell', ammoSpeed: 15 * TILE_SIZE * AMMOSPEED, ammoSplashRadius: 1.5 * TILE_SIZE,
        description: '超远程地面压制火力，但需要部署才能开火。',
        counters: { '步兵': 1.8, '装甲': 1.2, '飞行': 0, '海军': 1.2 } // 对固定目标和慢速单位是毁灭性的
    },
    sam_launcher: {
        unitClass: '炮兵', icon: '🗼', name: '防空炮',
        cost: 5, hp: 150, attack: 80, defense: 10, range: 10 * TILE_SIZE, speed: 1.0, attackSpeed: 0.2, visionRange: 10 * TILE_SIZE * 1.5,
        moveType: 'ground', special: 'SETUP_TO_FIRE', canTarget: ['air'], imageSrc: '../assets/pics/sam_launcher.png', drawScale: 5 * DRAW_SCALE_FACTOR,
        ammoType: 'missile', ammoSpeed: 20 * TILE_SIZE * AMMOSPEED, ammoSplashRadius: 0.5 * TILE_SIZE,
        description: '远程防空武器，对战斗机和轰炸机是致命威胁。',
        counters: { '步兵': 0, '装甲': 0, '飞行': 3.0, '海军': 0 } // 飞机的天敌，对地毫无还手之力
    },
    destroyer: {
        unitClass: '海军', icon: '🚢', name: '驱逐舰',
        cost: 8, hp: 600, attack: 70, defense: 30, range: 9 * TILE_SIZE, speed: 1.5, attackSpeed: 2.8, visionRange: 9 * TILE_SIZE * 1.5,
        moveType: 'sea', canTarget: ['ground','sea','air','amphibious'], imageSrc: '../assets/pics/destroyer.png', drawScale: 10 * DRAW_SCALE_FACTOR,
        ammoType: 'missile', ammoSpeed: 30 * TILE_SIZE * AMMOSPEED, ammoSplashRadius: 1.5 * TILE_SIZE,
        description: '功能全面的主力战舰，可以攻击来自海陆空的任何敌人。',
        counters: { '步兵': 1.2, '装甲': 1.0, '飞行': 0.8, '海军': 1.2 } // 全能选手
    },
    submarine: {
        unitClass: '海军', icon: '🌊', name: '潜艇',
        cost: 7, hp: 400, attack: 90, defense: 15, range: 8 * TILE_SIZE, speed: 1.8, attackSpeed: 3.5, visionRange: 8 * TILE_SIZE * 1.5,
        moveType: 'sea', canTarget: ['sea','amphibious'], imageSrc: '../assets/pics/submarine.png', drawScale: 7 * DRAW_SCALE_FACTOR,
        ammoType: 'missile', ammoSpeed: 20 * TILE_SIZE * AMMOSPEED, ammoSplashRadius: 0,
        description: '水下杀手，擅长对敌方潜艇和潜水船进行攻击。',
        counters: { '步兵': 0, '装甲': 0, '飞行': 0, '海军': 2.0 } // 海战专家，对陆空毫无还手之力
    },
    energy_vehicle: {
        unitClass: '特殊', icon: '', name: '充能车',
        cost: 999, hp: 1000, attack: 0, defense: 20, range: 0, speed: 1.0, attackSpeed: 0, visionRange: 4 * TILE_SIZE * 1.5,
        moveType: 'ground', canTarget: [], imageSrc: '../assets/pics/sam_launcher.png', drawScale: 3 * DRAW_SCALE_FACTOR,
        ammoType: 'missile', ammoSpeed: 20 * TILE_SIZE * AMMOSPEED, ammoSplashRadius: 0.5 * TILE_SIZE,
        description: '充能车，无作战能力，可为离子炮充能'
    },
};
const BUILDING_TYPES = {
    // 观察塔 - 轻型防御建筑
    observation_tower: {
        name: '观察塔',
        hp: 200,
        width: 3,
        height: 3,
        canAttack: true,
        attack: 50,
        range: 6 * TILE_SIZE,
        attackSpeed: 1.5,
        canTarget: ['ground', 'amphibious'],
        ammoType: 'bullet',
        ammoSpeed: 20 * TILE_SIZE * AMMOSPEED,
        ammoSplashRadius: 0,
        description: '轻型防御塔，提供视野和小型火力支援。',
        isDestructible: true,
        buildTime: 30,
        cost: 200,
        imageSrc: '../assets/pics/observation_tower.png'
    },
    // 桥梁控制站 - 功能性建筑
    bridge_control: {
        name: '桥梁控制站',
        hp: 300,
        width: 4,
        height: 4,
        canAttack: false,
        description: '控制桥梁升降的关键设施，无攻击能力。',
        isDestructible: true,
        buildTime: 45,
        cost: 300,
        imageSrc: '../assets/pics/bridge_control.png'
    },
    // 地堡 - 防御性建筑
    bunker: {
        name: '地堡',
        hp: 250,
        width: 3,
        height: 3,
        canAttack: true,
        attack: 70,  
        range: 5 * TILE_SIZE,
        attackSpeed: 2.0,
        canTarget: ['ground', 'amphibious'],
        ammoType: 'bullet',
        ammoSpeed: 18 * TILE_SIZE * AMMOSPEED,
        ammoSplashRadius: 0.5 * TILE_SIZE,
        description: '坚固的防御工事，提供稳定的火力输出。',
        isDestructible: true,
        buildTime: 60,
        cost: 400,
        imageSrc: '../assets/pics/bunker.png'
    },
    // 训练目标 - 训练用建筑
    training_target: {
        name: '训练目标',
        hp: 150,
        width: 2,
        height: 2,
        canAttack: false,
        description: '训练用的靶子，无攻击能力。',
        isDestructible: true,
        buildTime: 15,
        cost: 50,
        imageSrc: '../assets/pics/training_target.png'
    },
    // 训练障碍 - 训练用建筑
    training_barrier: {
        name: '训练障碍',
        hp: 100,
        width: 2,
        height: 2,
        canAttack: false,
        description: '训练用的障碍物，无攻击能力。',
        isDestructible: true,
        buildTime: 10,
        cost: 30,
        imageSrc: '../assets/pics/training_barrier.png'
    },
    // 雷达站 - 侦查性建筑
    radar_station: {
        name: '雷达站',
        hp: 400,
        width: 5,
        height: 5,
        canAttack: false,
        visionRange: 15 * TILE_SIZE,
        description: '提供广阔视野的侦查设施，无攻击能力。',
        isDestructible: true,
        buildTime: 90,
        cost: 600,
        imageSrc: '../assets/pics/radar_station.png'
    },
    // 通信塔 - 功能性建筑
    communication_tower: {
        name: '通信塔',
        hp: 300,
        width: 3,
        height: 5,
        canAttack: false,
        description: '维持通信联络的关键设施，无攻击能力。',
        isDestructible: true,
        buildTime: 75,
        cost: 500,
        imageSrc: '../assets/pics/communication_tower.png'
    },
    // 仓库 - 资源性建筑
    storage_depot: {
        name: '仓库',
        hp: 300,
        width: 5,
        height: 5,
        canAttack: false,
        description: '储存资源的设施，无攻击能力。',
        isDestructible: true,
        buildTime: 80,
        cost: 450,
        imageSrc: '../assets/pics/storage_depot.png'
    },
    // 兵营 - 生产性建筑
    barracks: {
        name: '兵营',
        hp: 400,
        width: 5,
        height: 5,
        canAttack: false,
        description: '训练步兵的设施，无攻击能力。',
        isDestructible: true,
        buildTime: 120,
        cost: 800,
        imageSrc: '../assets/pics/barracks.png'
    },
    // 瞭望塔 - 防御性建筑
    watchtower: {
        name: '瞭望塔',
        hp: 300,
        width: 3,
        height: 3,
        canAttack: true,
        attack: 100,
        range: 7 * TILE_SIZE,
        attackSpeed: 1.8,
        canTarget: ['ground', 'amphibious'],
        ammoType: 'bullet',
        ammoSpeed: 22 * TILE_SIZE * AMMOSPEED,
        ammoSplashRadius: 0,
        description: '提供视野和中距离火力支援的防御塔。',
        isDestructible: true,
        buildTime: 50,
        cost: 350,
        imageSrc: '../assets/pics/watchtower.png'
    },
    // 军火库 - 资源性建筑
    armory: {
        name: '军火库',
        hp: 500,
        width: 5,
        height: 5,
        canAttack: false,
        description: '储存武器弹药的设施，无攻击能力。',
        isDestructible: true,
        buildTime: 100,
        cost: 700,
        imageSrc: '../assets/pics/armory.png'
    },
    // 指挥中心 - 核心建筑
    command_center: {
        name: '指挥中心',
        hp: 800,
        width: 7,
        height: 7,
        canAttack: false,
        description: '基地的核心指挥设施，无攻击能力。',
        isDestructible: true,
        buildTime: 180,
        cost: 1500,
        imageSrc: '../assets/pics/command_center.png'
    },
    // 研究实验室 - 科技性建筑
    research_lab: {
        name: '研究实验室',
        hp: 400,
        width: 5,
        height: 5,
        canAttack: false,
        description: '，进行科技研究的设施，无攻击能力。',
        isDestructible: true,
        buildTime: 150,
        cost: 1000,
        imageSrc: '../assets/pics/research_lab.png'
    },
    // 发电机 - 资源性建筑
    power_generator: {
        name: '发电机',
        hp: 300,
        width: 3,
        height: 3,
        canAttack: false,
        description: '提供电力的设施，无攻击能力。',
        isDestructible: true,
        buildTime: 70,
        cost: 550,
        imageSrc: '../assets/pics/power_generator.png'
    },
    // 守卫塔 - 防御性建筑
    guard_tower: {
        name: '守卫塔',
        hp: 300,
        width: 3,
        height: 3,
        canAttack: true,
        attack: 120,
        range: 6 * TILE_SIZE,
        attackSpeed: 1.2,
        canTarget: ['ground', 'amphibious'],
        ammoType: 'shell',
        ammoSpeed: 15 * TILE_SIZE * AMMOSPEED,
        ammoSplashRadius: 0.8 * TILE_SIZE,
        description: '重型防御塔，对地面单位造成较大伤害。',
        isDestructible: true,
        buildTime: 65,
        cost: 600,
        imageSrc: '../assets/pics/guard_tower.png'
    },
    // 总部 - 核心建筑
    headquarters: {
        name: '总部',
        hp: 1000,
        width: 7,
        height: 7,
        canAttack: false,
        description: '组织的神经中枢，无攻击能力。',
        isDestructible: true,
        buildTime: 240,
        cost: 2000,
        imageSrc: '../assets/pics/headquarters.png'
    },
    // 通信中心 - 功能性建筑
    communication_center: {
        name: '通信中心',
        hp: 500,
        width: 5,
        height: 5,
        canAttack: false,
        description: '主要的通信枢纽，无攻击能力。',
        isDestructible: true,
        buildTime: 120,
        cost: 900,
        imageSrc: '../assets/pics/communication_center.png'
    },
    // 摩天大楼 - 民用建筑
    skyscraper: {
        name: '摩天大楼',
        hp: 500,
        width: 8,
        height: 10,
        canAttack: false,
        description: '高大的民用建筑，无攻击能力。',
        isDestructible: true,
        buildTime: 160,
        cost: 0 ,
        imageSrc: '../assets/pics/skyscraper.png'
    },
    // 购物中心 - 民用建筑
    shopping_mall: {
        name: '购物中心',
        hp: 500,
        width: 7,
        height: 7,
        canAttack: false,
        description: '大型商业设施，无攻击能力。',
        isDestructible: true,
        buildTime: 140,
        cost: 0 ,
        imageSrc: '../assets/pics/shopping_mall.png'
    },
    // 公寓楼 - 民用建筑
    apartment_complex: {
        name: '公寓楼',
        hp: 500,
        width: 5,
        height: 5,
        canAttack: false,
        description: '居民住宅楼，无攻击能力。',
        isDestructible: true,
        buildTime: 140,
        cost: 0 ,
        imageSrc: '../assets/pics/apartment_complex.png'
    },
    // 停车场 - 民用建筑
    parking_garage: {
        name: '停车场',
        hp: 400,
        width: 5,
        height: 5,
        canAttack: false,
        description: '车辆停放设施，无攻击能力。',
        isDestructible: true,
        buildTime: 100,
        cost: 0 ,
        imageSrc: '../assets/pics/parking_garage.png'
    },
    // 检查点 - 防御性建筑
    checkpoint: {
        name: '检查点',
        hp: 300,
        width: 3,
        height: 3,
        canAttack: true,
        attack: 50,
        range: 5 * TILE_SIZE,
        attackSpeed: 1.5,
        canTarget: ['ground', 'amphibious'],
        ammoType: 'bullet',
        ammoSpeed: 19 * TILE_SIZE * AMMOSPEED,
        ammoSplashRadius: 0,
        description: '道路检查点，提供有限的防御能力。',
        isDestructible: true,
        buildTime: 45,
        cost: 300,
        imageSrc: '../assets/pics/checkpoint.png'
    },
    // 控制塔 - 核心建筑
    control_tower: {
        name: '控制塔',
        hp: 1500,
        width: 7,
        height: 7,
        canAttack: true,
        attack: 200,
        range: 10 * TILE_SIZE,
        attackSpeed: 0.8,
        canTarget: ['ground', 'air', 'amphibious'],
        ammoType: 'energy',
        ammoSpeed: 25 * TILE_SIZE * AMMOSPEED,
        ammoSplashRadius: 1.5 * TILE_SIZE,
        description: '强大的核心防御设施，能攻击地面和空中目标。',
        isDestructible: true,
        buildTime: 300,
        cost: 2500,
        imageSrc: '../assets/pics/control_tower.png'
    },
    // 能源站 - 资源性建筑
    power_station: {
        name: '能源站',
        hp: 500,
        width: 5,
        height: 5,
        canAttack: false,
        description: '产生能源的设施，无攻击能力。',
        isDestructible: true,
        buildTime: 150,
        cost: 1200,
        imageSrc: '../assets/pics/power_station.png'
    },
    // 雷达穹顶 - 侦查性建筑
    radar_dome: {
        name: '雷达穹顶',
        hp: 400,
        width: 5,
        height: 5,
        canAttack: false,
        visionRange: 18 * TILE_SIZE,
        description: '高级雷达设施，提供极远的视野，无攻击能力。',
        isDestructible: true,
        buildTime: 180,
        cost: 1500,
        imageSrc: '../assets/pics/radar_dome.png'
    },
    // 机库 - 生产性建筑
    hangar: {
        name: '机库',
        hp: 400,
        width: 5,
        height: 5,
        canAttack: false,
        description: '生产和维护飞行器的设施，无攻击能力。',
        isDestructible: true,
        buildTime: 160,
        cost: 1300,
        imageSrc: '../assets/pics/hangar.png'
    },
    // 离子炮 - 超级武器
    ion_cannon: {
        name: '离子炮',
        hp: 10000,
        width: 7,
        height: 7,
        canAttack: false,
        description: '超级武器，造成巨大范围伤害，但需要长时间充能。',
        isDestructible: true,
        buildTime: 420,
        cost: 5000,
        imageSrc: '../assets/pics/ion_cannon.png'
    },
    // 能源导管 - 功能性建筑
    power_conduit: {
        name: '能源导管',
        hp: 300,
        width: 3,
        height: 3,
        canAttack: false,
        description: '输送能源的管道，无攻击能力。',
        isDestructible: true,
        buildTime: 60,
        cost: 400,
        imageSrc: '../assets/pics/power_conduit.png'
    },
    // 防御炮塔 - 防御性建筑
    defense_turret: {
        name: '防御炮塔',
        hp: 400,
        width: 3,
        height: 3,
        canAttack: true,
        attack: 150,
        range: 8 * TILE_SIZE,
        attackSpeed: 1.0,
        canTarget: ['ground', 'amphibious'],
        ammoType: 'shell',
        ammoSpeed: 16 * TILE_SIZE * AMMOSPEED,
        ammoSplashRadius: 1.0 * TILE_SIZE,
        description: '重型防御炮塔，对地面单位造成高额伤害。',
        isDestructible: true,
        buildTime: 90,
        cost: 800,
        imageSrc: '../assets/pics/defense_turret.png'
    },
    // 主控制中心 - 核心建筑
    main_control: {
        name: '主控制中心',
        hp: 1000,
        width: 6,
        height: 6,
        canAttack: false,
        description: '海上平台的核心控制设施，无攻击能力。',
        isDestructible: true,
        buildTime: 240,
        cost: 2200,
        imageSrc: '../assets/pics/main_control.png'
    },
    // 研究中心 - 科技性建筑
    research_center: {
        name: '研究中心',
        hp: 400,
        width: 4,
        height: 4,
        canAttack: false,
        description: '进行高级研究的设施，无攻击能力。',
        isDestructible: true,
        buildTime: 180,
        cost: 1600,
        imageSrc: '../assets/pics/research_center.png'
    },
    // 导弹发射井 - 防御性建筑
    missile_silo: {
        name: '导弹发射井',
        hp: 500,
        width: 3,
        height: 4,
        canAttack: true,
        attack: 150,
        range: 12 * TILE_SIZE,
        attackSpeed: 0.5,
        canTarget: ['ground', 'air', 'amphibious'],
        ammoType: 'missile',
        ammoSpeed: 20 * TILE_SIZE * AMMOSPEED,
        ammoSplashRadius: 2.0 * TILE_SIZE,
        special: 'SETUP_TO_FIRE',
        description: '发射远程导弹，能攻击地面和空中目标。',
        isDestructible: true,
        buildTime: 200,
        cost: 1800,
        imageSrc: '../assets/pics/missile_silo.png'
    },
    // 防空炮 - 防御性建筑
    aa_gun: {
        name: '防空炮',
        hp: 300,
        width: 3,
        height: 3,
        canAttack: true,
        attack: 100,
        range: 10 * TILE_SIZE,
        attackSpeed: 1.2,
        canTarget: ['air'],
        ammoType: 'shell',
        ammoSpeed: 22 * TILE_SIZE * AMMOSPEED,
        ammoSplashRadius: 1.0 * TILE_SIZE,
        description: '专门针对空中单位的防御设施。',
        isDestructible: true,
        buildTime: 120,
        cost: 1000,
        imageSrc: '../assets/pics/aa_gun.png'
    }
};