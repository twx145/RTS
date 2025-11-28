# ⚔️ WebRTS: Tactical Warfare

<div align="center">

<!-- MAIN HEADER IMAGE: Replace with your best gameplay screenshot -->
<img src="https://github.com/user-attachments/assets/586d84e9-5dd0-4ff1-9337-b5da3514f296" alt="RTS Battle Scene" width="20%" style="border-radius: 10px; box-shadow: 0px 4px 10px rgba(0,0,0,0.5);" />

<br/><br/>

<!-- BADGES -->
[![Netlify Status](https://api.netlify.com/api/v1/badges/b5c4e9-your-id-here/deploy-status)](https://app.netlify.com/sites/rts-game1/deploys)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Language: TypeScript/JS](https://img.shields.io/badge/Language-JavaScript%20ES6+-f7df1e?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Art Style: Pixel](https://img.shields.io/badge/Art-Pixel%202D-purple)](https://developer.mozilla.org/en-US/docs/Games)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

<h3>
  <a href="https://rts-game1.netlify.app/">🎮 PLAY LIVE DEMO</a>
  <span> · </span>
  <a href="https://github.com/twx145/RTS/issues">🐛 Report Bug</a>
</h3>

**Command your army. Manage resources. Dominate the battlefield.**<br/>
A browser-based Real-Time Strategy game built with pure JavaScript and HTML5 Canvas.

</div>

---

## 📸 Visual Showcase

### ⚔️ Intense Combat
Engage in massive tank battles. Units automatically target enemies, pathfind around obstacles, and defend your base.

<div align="center">
  <!-- Use the screenshot with the tanks and red circles -->
  <img src="https://github.com/user-attachments/assets/2aa22860-6b3d-4151-b86e-46553615ed12" alt="Combat Mechanics" width="800px" />
 
</div>

<br/>

### 🌫️ Advanced Fog of War System
Implementation of a dynamic visibility system. Areas outside your units' vision range remain shrouded in darkness, hiding enemy movements.

<div align="center">
  <!-- Use the green circle/black background screenshot here -->
  <img src="https://github.com/user-attachments/assets/6096ff8e-936d-454e-b8ba-49b7822f0ed1" alt="Fog of War Debug View" width="800px" />

</div>

---

## 🎖️ Commanders & Assets

The game features high-quality pixel art structures and distinct character portraits for narrative immersion.

### 👥 The Commanders
Choose your operator. Each character represents a faction with unique visual styles.

| Commander | Eva (Intel) | Viper (Spec Ops) | Tanaka (Defense) |
|:---:|:---:|:---:|:---:|
|<img src="https://github.com/user-attachments/assets/85a9be84-09d7-4b83-9adb-b270c400f133" width="100"/> | <img src="https://github.com/user-attachments/assets/0c8a7050-852a-441f-92af-50629ceb2bba" width="100"/> | <img src="https://github.com/user-attachments/assets/506e0571-1b26-4808-8548-801dc564e1cf" width="100"/> | <img src="https://github.com/user-attachments/assets/e8ce06f9-37cd-4410-934f-ccaf881075cf" width="100"/> |


### 🏗️ Structures & Tech
From `Main Battle Tanks` to `Radar Stations`, build a thriving military base.

<div align="center">
  <!-- You can combine the building sprites into one image or use a few key ones -->
  <img alt="屏幕截图 2025-11-28 110841" src="https://github.com/user-attachments/assets/9bd85bdb-4f7c-4c5d-9237-4d00ea3f68da" alt="Game Assets Sprite Sheet" width="100%" />

</div>

---

## ✨ Key Features

*   **🧠 Smart AI Controller**: The enemy builds bases, harvests resources, and launches coordinated attacks based on difficulty settings.
*   **🗺️ Dynamic Pathfinding**: Units use A* (or similar algorithms) to navigate complex terrain and avoid collisions.
*   **📡 Radar & Recon**: Utilize Radar Stations to clear the Fog of War and reveal distant enemy movements.
*   **💾 Auto-Save System**: Game state is automatically saved to local storage (as seen in the "Game Saved" notification).
*   **🏭 Economy**: Manage Power Plants (`power_generator`) and Storage Depots (`storage_depot`) to sustain your war machine.

---

## 🏗️ Technical Architecture

The game uses a component-based architecture to handle game loops, rendering, and logic updates efficiently.

```mermaid
classDiagram
    direction TB
    
    %% Core Game Loop
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

    %% Player & AI Logic
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

    %% Entities
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

    class Projectile {
        +target: Unit | Base
        +update(deltaTime)
        +draw(ctx)
    }

    %% Environment
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

    %% Relationships
    Game "1" *-- "1" UI : Manages
    Game "1" *-- "2" Player : Contains
    Game "1" *-- "1" GameMap : Loads
    Game "1" *-- "1" FogOfWar : Renders
    Game "1" o-- "many" Projectile : Updates
    Game "1" ..> Base : Tracks State

    Player "1" o-- "many" Unit : Commands
    Player "1" *-- "0..1" AIController : Utilizes

    AIController ..> GameMap : Analyzes
    AIController ..> Unit : Directs

    Unit ..> GameMap : Pathfinding
    Unit ..> Projectile : Spawns
    Unit ..> Base : Targets
    Unit ..> Unit : Engages

    FogOfWar ..> Unit : Vision Source
    FogOfWar ..> Base : Vision Source
```

---

## 🚀 Getting Started

### Prerequisites
*   [Git](https://git-scm.com/)
*   A modern browser (Chrome/Edge/Firefox)

### Installation

1.  **Clone the repo**
    ```bash
    git clone https://github.com/twx145/RTS.git
    cd RTS
    ```

2.  **Run the game**
    Simply open `index.html` in your browser.
    *   *Recommended:* Use a local server (like VS Code "Live Server") to ensure assets load correctly without CORS issues.

---

## 🎮 Controls

| Key/Action | Function |
| :--- | :--- |
| **Left Click** | Select Unit / Structure |
| **Left Drag** | Box Select multiple units |
| **Right Click** | Move / Attack Target |
| **Double Click** | Select all units of same type |
| **Mini-map** | Click to move camera instantly |

---

## 🗺️ Roadmap

- [x] **Core Engine**: Game loop, Rendering, Canvas input.
- [x] **Combat System**: HP, Damage, Projectiles.
- [x] **Visuals**: Pixel art assets & Character portraits.
- [x] **Fog of War**: Visibility system.
- [ ] **Audio**: Sound effects and background music.
- [ ] **Multiplayer**: PvP via WebSockets.
- [ ] **Campaign**: Scripted missions and story mode.

---

<div align="center">
    <strong>Built with ❤️ by twx145</strong>
    <br/>
    <i>Assets used for educational/demonstration purposes.</i>
</div>
