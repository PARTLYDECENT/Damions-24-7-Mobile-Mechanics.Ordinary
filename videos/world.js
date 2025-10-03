class WorldManager {
    constructor(scene, biomeManager) {
        this.scene = scene;
        this.biomeManager = biomeManager;
        this.chunks = new Map();
        this.chunkSize = 50;
        this.viewDistance = 2; // in chunks
    }

    update(playerPosition) {
        const currentChunkX = Math.round(playerPosition.x / this.chunkSize);
        const currentChunkZ = Math.round(playerPosition.z / this.chunkSize);

        // Load/unload chunks based on player position
        for (let x = currentChunkX - this.viewDistance; x <= currentChunkX + this.viewDistance; x++) {
            for (let z = currentChunkZ - this.viewDistance; z <= currentChunkZ + this.viewDistance; z++) {
                const chunkId = `${x},${z}`;
                if (!this.chunks.has(chunkId)) {
                    const biome = this.biomeManager.getBiome(x, z);
                    // NOTE: This is a simplified placeholder. We'll need to pass proper textures/shaders.
                    const chunk = this.biomeManager.generateChunk(x, z, biome, {}, []); 
                    this.scene.add(chunk);
                    this.chunks.set(chunkId, { chunk, biome });
                }
            }
        }

        // Optional: Unload distant chunks (can be added later for performance)
    }
}