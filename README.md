### Our RTS Game

```mermaid

classDiagram
class Game {
+gameState: string
+player: Player
+ai: Player
+map: GameMap
+fogOfWar: FogOfWar
+projectiles: Projectile[]
+selectedUnits: Unit[]
+init(settings)
+startGame()
+gameLoop(timestamp)
}

class UI {
+game: Game
+update()
+showWinner(name)
+populateUnitList()
}

class Player {
+manpower: number
+isAI: boolean
+units: Unit[]
+aiController: AIController
+update(deltaTime, enemyPlayer, map)
}

class AIController {
+difficulty: string
+update(aiUnits, playerUnits, map, deltaTime)
+deployUnits()
}

class Unit {
+type: string
+hp: number
+target: Unit | Base
+path: object[]
+isForceMoving: boolean
+update(deltaTime, enemies, map, game)
+issueMoveCommand(target, map, isEngaging)
+attack(game)
}

class Base {
+owner: string
+hp: number
+takeDamage(amount)
+draw(ctx)
}

class GameMap {
+width: number
+height: number
+grid: object[][]
+load(mapData)
+draw(ctx)
}

class FogOfWar {
+update(visibleEntities)
+draw(mainCtx)
}

class Projectile {
+target: Unit | Base
+update(deltaTime)
+draw(ctx)
}

Game "1" -- "1" UI : manages
Game "1" -- "2" Player : has
Game "1" -- "1" GameMap : has
Game "1" -- "1" FogOfWar : has
Game "1" ..> Base : manages
Game "1" o-- "many" Projectile : manages

Player "1" o-- "many" Unit : owns
Player "1" -- "0..1" AIController : has

AIController ..> GameMap : uses
AIController ..> Unit : controls

Unit ..> GameMap : uses for pathfinding
Unit ..> Game : creates Projectiles via
Unit ..> Base : targets
Unit ..> Unit : targets

FogOfWar ..> Unit : uses for vision
FogOfWar ..> Base : uses for vision

```


RTS/
├── .git/ (版本控制文件夹，包含大量Git相关文件)
├── assets/
│   ├── backgrounds/ (背景图片)
│   │   ├── BG1.jpg
│   │   ├── BG2.jpg
│   │   ├── BG3.jpg
│   │   ├── BG4.jpg
│   │   ├── BG5.jpg
│   │   ├── bg.png
│   │   ├── bg2.png
│   │   ├── 北极能源站
│   │   ├── 北极能源站2
│   │   ├── 北部山区
│   │   ├── 峡谷
│   │   ├── 指挥中心.jpg
│   │   ├── 新京都
│   │   ├── 沙漠哨站.png
│   │   └── 空间站爆炸
│   ├── bgm/ (背景音乐)
│   ├── characters/ (角色图片)
│   │   ├── eva.jpg
│   │   ├── tanaka.jpg
│   │   ├── viper.jpg
│   │   ├── 技术.png
│   │   └── 指挥官.png
│   ├── logo.png
│   ├── member_image/ (成员图片)
│   │   ├── bg_zjh.jpg
│   │   ├── member_dxy.jpg
│   │   ├── member_gtx.jpg
│   │   ├── member_hyf.jpg
│   │   ├── member_twx.jpg
│   │   ├── member_wkj.jpg
│   │   └── member_zjh.jpg
│   ├── pics/ (单位图片)
│   │   ├── amphibious_tank.png
│   │   ├── anti_tank_trooper.png
│   │   ├── assault_infantry.png
│   │   ├── attack_helicopter.jpg
│   │   ├── destroyer.png
│   │   ├── fighter_jet.jpg
│   │   ├── howitzer.png
│   │   ├── light_tank.png
│   │   ├── main_battle_tank.png
│   │   ├── recon_drone.png
│   │   ├── sam_launcher.png
│   │   ├── sniper.png
│   │   ├── submarine.png
│   │   └── 航空母舰.jpg
│   ├── sounds/ (音效)
│   │   ├── button_click.wav
│   │   └── button_click2.wav
│   └── voices/ (语音)
├── css/
│   ├── achievements.css
│   ├── alert.css
│   ├── dialogue.css
│   ├── game_style.css
│   ├── index_style.css
│   ├── load_game.css
│   ├── loading.css
│   ├── login_style.css
│   ├── login_style2.css
│   ├── member_style.css
│   ├── settings.css
│   └── team_style.css
├── data/
│   └── script.js
├── game_js/
│   ├── ai.js
│   ├── arctic-buildings.js
│   ├── base.js
│   ├── config.js
│   ├── fog-of-war.js
│   ├── game.js
│   ├── main.js
│   ├── map.js
│   ├── maps-data.js
│   ├── pathfinding.js
│   ├── player.js
│   ├── projectile.js
│   ├── ui.js
│   ├── unit.js
│   └── utils.js
├── html/
│   ├── achievements.html
│   ├── dialogue.html
│   ├── game.html
│   ├── load_game.html
│   ├── loading.html
│   ├── login.html
│   ├── member_html/
│   │   ├── member_dxy.html
│   │   ├── member_gtx.html
│   │   ├── member_hyf.html
│   │   ├── member_twx.html
│   │   ├── member_wkj.html
│   │   └── member_zjh.html
│   ├── settings.html
│   └── team.html
├── js/
│   ├── achievements.js
│   ├── alert.js
│   ├── dialogue.js
│   ├── load_game.js
│   ├── loading.js
│   ├── login.js
│   ├── saveGame.js
│   ├── saveManager.js
│   └── settings.js
├── lib/
│   └── matter.min.js
├── 1.md
├── README.md
└── index.html

#### 核心部分
RTS/
├── .git/
├── assets/
├── css/
├── data/
├── game_js/
│   ├── ai.js
│   ├── arctic-buildings.js
│   ├── base.js
│   ├── config.js
│   ├── fog-of-war.js
│   ├── game.js
│   ├── main.js
│   ├── map.js
│   ├── maps-data.js
│   ├── pathfinding.js
│   ├── player.js
│   ├── projectile.js
│   ├── ui.js
│   ├── unit.js
│   └── utils.js
├── html/
│   ├── achievements.html
│   ├── dialogue.html
│   ├── game.html
│   ├── load_game.html
│   ├── loading.html
│   ├── login.html
│   ├── member_html/
│   ├── settings.html
│   └── team.html
├── js/
│   ├── achievements.js
│   ├── alert.js
│   ├── dialogue.js
│   ├── load_game.js
│   ├── loading.js
│   ├── login.js
│   ├── saveGame.js
│   ├── saveManager.js
│   └── settings.js
├── lib/
├── 1.md
├── README.md
└── index.html