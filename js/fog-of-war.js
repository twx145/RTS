// js/fog-of-war.js
import { TILE_SIZE } from './config.js';

/**
 * Manages the rendering of Fog of War using an offscreen canvas for performance.
 */
export class FogOfWar {
    constructor(mapWidth, mapHeight) {
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;

        // Create an offscreen canvas for pre-rendering the fog
        this.fogCanvas = document.createElement('canvas');
        this.fogCanvas.width = this.mapWidth;
        this.fogCanvas.height = this.mapHeight;
        this.fogCtx = this.fogCanvas.getContext('2d');
    }

    /**
     * Updates the fog texture based on player's unit and base positions.
     * This is the expensive part that we want to run only when needed.
     * @param {Array<Unit|Base>} visibleEntities - An array of player's units and bases.
     */
    update(visibleEntities) {
        const ctx = this.fogCtx;

        // 1. Start with solid black fog covering the entire map
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, this.mapWidth, this.mapHeight);

        // 2. "Punch holes" in the fog where player units are
        ctx.globalCompositeOperation = 'destination-out';

        visibleEntities.forEach(entity => {
            const vision = entity.stats ? entity.stats.visionRange : 10 * TILE_SIZE;
            const entityX = entity.pixelX || entity.x;
            const entityY = entity.pixelY || entity.y;
            
            // Create a radial gradient to create a soft edge for the revealed area
            const gradient = ctx.createRadialGradient(entityX, entityY, vision * 0.7, entityX, entityY, vision);
            gradient.addColorStop(0, 'rgba(0,0,0,1)'); // Fully transparent in the center
            gradient.addColorStop(1, 'rgba(0,0,0,0)'); // Fades to black at the edge

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(entityX, entityY, vision, 0, Math.PI * 2);
            ctx.fill();
        });

        // Reset composite operation for the next update
        ctx.globalCompositeOperation = 'source-over';
    }

    /**
     * Draws the pre-rendered fog canvas onto the main game canvas.
     * This is a very fast operation.
     * @param {CanvasRenderingContext2D} mainCtx - The main game's rendering context.
     */
    draw(mainCtx) {
        mainCtx.drawImage(this.fogCanvas, 0, 0);
    }
}