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
