import Character from './Character.js';

// Define non-mutable constants as defaults
const SCALE_FACTOR = 25; // 1/nth of the height of the canvas
const STEP_FACTOR = 100; // 1/nth, or N steps up and across the canvas
const ANIMATION_RATE = 1; // 1/nth of the frame rate
const INIT_POSITION = { x: 0, y: 0 };

// Movement Sound Effects System
class MovementSoundManager {
    constructor() {
        // Initialize audio context for procedural sounds
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.lastFootstepTime = 0;
        this.footstepInterval = 300; // ms between footsteps
        this.isLeftFoot = true;
        
        // Initialize Minecraft beginning music
        this.minecraftMusic = null;
        this.initMinecraftMusic();
        this.isMusicPlaying = false;
        
        // Surface type mapping for potential future use (keeping for compatibility)
        this.surfaces = {
            'default': { pitch: 1, volume: 0.15, character: 'soft' },
            'grass': { pitch: 0.8, volume: 0.12, character: 'soft' },
            'stone': { pitch: 1.3, volume: 0.2, character: 'hard' },
            'wood': { pitch: 1.1, volume: 0.18, character: 'hollow' },
            'metal': { pitch: 1.5, volume: 0.25, character: 'metallic' },
            'carpet': { pitch: 0.6, volume: 0.08, character: 'muffled' },
            'sand': { pitch: 0.7, volume: 0.1, character: 'soft' }
        };
    }
    
    // Initialize Minecraft beginning music
    initMinecraftMusic() {
        try {
            // You can replace this path with the actual Minecraft beginning music file
            // Download "C418 - Beginning" and place it in the assets/audio directory
            this.minecraftMusic = new Audio('/assets/audio/minecraft-beginning.mp3');
            this.minecraftMusic.loop = true; // Loop the music
            this.minecraftMusic.volume = 0.3; // Set a comfortable volume
            this.minecraftMusic.preload = 'auto';
        } catch (error) {
            console.log('Minecraft music file not found. Add minecraft-beginning.mp3 to assets/audio directory.');
            // Fallback: create a simple melody reminiscent of Minecraft
            this.createMinecraftLikeMelody();
        }
    }
    
    // Create a simple melody reminiscent of Minecraft's beginning theme
    createMinecraftLikeMelody() {
        // This creates a simple melody using Web Audio API if the actual file isn't available
        this.minecraftMelodyInterval = null;
    }
    
    // Play Minecraft-like melody using Web Audio API as fallback
    playMinecraftLikeMelody() {
        if (!window.gameAudioEnabled || this.isMusicPlaying) return;
        
        this.isMusicPlaying = true;
        
        // Simple Minecraft-inspired melody notes (frequencies in Hz)
        const melody = [
            { freq: 523.25, duration: 0.5 }, // C5
            { freq: 659.25, duration: 0.5 }, // E5
            { freq: 783.99, duration: 0.5 }, // G5
            { freq: 659.25, duration: 0.5 }, // E5
            { freq: 523.25, duration: 1.0 }, // C5
            { freq: 440.00, duration: 0.5 }, // A4
            { freq: 523.25, duration: 0.5 }, // C5
            { freq: 587.33, duration: 1.0 }, // D5
        ];
        
        let noteIndex = 0;
        const playNote = () => {
            if (!window.gameAudioEnabled || !this.isMusicPlaying) return;
            
            const note = melody[noteIndex % melody.length];
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            
            osc.frequency.setValueAtTime(note.freq, this.audioContext.currentTime);
            osc.type = 'sine';
            
            gain.gain.setValueAtTime(0, this.audioContext.currentTime);
            gain.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + note.duration);
            
            osc.start(this.audioContext.currentTime);
            osc.stop(this.audioContext.currentTime + note.duration);
            
            noteIndex++;
            
            setTimeout(playNote, note.duration * 1000);
        };
        
        playNote();
    }
    
    createFootstepSound(surface = 'default', isLeftFoot = true) {
        // This method is now repurposed to play Minecraft music instead of footsteps
        this.playMinecraftMusic();
    }
    
    // New method to play Minecraft beginning music
    playMinecraftMusic() {
        if (!window.gameAudioEnabled) return;
        
        if (this.minecraftMusic && this.minecraftMusic.readyState >= 2) {
            // If the actual music file is available, play it
            if (this.minecraftMusic.paused) {
                this.minecraftMusic.currentTime = 0; // Start from beginning
                this.minecraftMusic.play().catch(e => {
                    console.log('Could not play Minecraft music:', e);
                    this.playMinecraftLikeMelody();
                });
                this.isMusicPlaying = true;
            }
        } else {
            // Fallback to generated melody
            if (!this.isMusicPlaying) {
                this.playMinecraftLikeMelody();
            }
        }
    }
    
    // Stop Minecraft music when player stops moving
    stopMinecraftMusic() {
        this.isMusicPlaying = false;
        if (this.minecraftMusic && !this.minecraftMusic.paused) {
            this.minecraftMusic.pause();
        }
    }
}


class Player extends Character {
    /**
     * The constructor method is called when a new Player object is created.
     * 
     * @param {Object|null} data - The sprite data for the object. If null, a default red square is used.
     */
    constructor(data = null, gameEnv = null) {
        super(data, gameEnv);
        this.keypress = data?.keypress || {up: 87, left: 65, down: 83, right: 68};
        this.pressedKeys = {}; // active keys array
        this.bindMovementKeyListners();
        this.gravity = data.GRAVITY || false;
        this.acceleration = 0.001;
        this.time = 0;
        this.moved = false;
        this.wasMoving = false; // Track previous movement state
        
        // Initialize movement sound manager
        this.soundManager = new MovementSoundManager();
        this.currentSurface = this.detectSurface(); // Detect initial surface
    }

    /**
     * Binds key event listeners to handle object movement.
     * 
     * This method binds keydown and keyup event listeners to handle object movement.
     * The .bind(this) method ensures that 'this' refers to the object object.
     */
    bindMovementKeyListners() {
        addEventListener('keydown', this.handleKeyDown.bind(this));
        addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    handleKeyDown({ keyCode }) {
        // capture the pressed key in the active keys array
        this.pressedKeys[keyCode] = true;
        // set the velocity and direction based on the newly pressed key
        this.updateVelocityAndDirection();
    }

    /**
     * Handles key up events to stop the player's velocity.
     * 
     * This method stops the player's velocity based on the key released.
     * 
     * @param {Object} event - The keyup event object.
     */
    handleKeyUp({ keyCode }) {
        // remove the lifted key from the active keys array
        if (keyCode in this.pressedKeys) {
            delete this.pressedKeys[keyCode];
        }
        // adjust the velocity and direction based on the remaining keys
        this.updateVelocityAndDirection();
    }

    /**
     * Detect the surface type based on game environment or level
     * This can be expanded to detect different surfaces based on level/location
     */
    detectSurface() {
        // Basic surface detection - can be enhanced based on game level
        const currentLevel = this.gameEnv?.currentLevel || 'unknown';
        
        // Map levels to surface types
        const levelSurfaceMap = {
            'desert': 'sand',
            'casino': 'carpet',
            'office': 'carpet',
            'bank': 'stone',
            'airport': 'stone',
            'wallstreet': 'stone',
            'default': 'default'
        };
        
        return levelSurfaceMap[currentLevel] || 'default';
    }

    /**
     * Update the player's velocity and direction based on the pressed keys.
     */
    updateVelocityAndDirection() {
        this.velocity.x = 0;
        this.velocity.y = 0;
        
        // Store previous movement state
        const wasMovingBefore = this.moved;

        // Multi-key movements (diagonals: upLeft, upRight, downLeft, downRight)
        if (this.pressedKeys[this.keypress.up] && this.pressedKeys[this.keypress.left]) {
            this.velocity.y -= this.yVelocity;
            this.velocity.x -= this.xVelocity;
            this.direction = 'upLeft';
            this.moved = true;
        } else if (this.pressedKeys[this.keypress.up] && this.pressedKeys[this.keypress.right]) {
            this.velocity.y -= this.yVelocity;
            this.velocity.x += this.xVelocity;
            this.direction = 'upRight';
            this.moved = true;
        } else if (this.pressedKeys[this.keypress.down] && this.pressedKeys[this.keypress.left]) {
            this.velocity.y += this.yVelocity;
            this.velocity.x -= this.xVelocity;
            this.direction = 'downLeft';
            this.moved = true;
        } else if (this.pressedKeys[this.keypress.down] && this.pressedKeys[this.keypress.right]) {
            this.velocity.y += this.yVelocity;
            this.velocity.x += this.xVelocity;
            this.direction = 'downRight';
            this.moved = true;
        // Single key movements (left, right, up, down) 
        } else if (this.pressedKeys[this.keypress.up]) {
            this.velocity.y -= this.yVelocity;
            this.direction = 'up';
            this.moved = true;
        } else if (this.pressedKeys[this.keypress.left]) {
            this.velocity.x -= this.xVelocity;
            this.direction = 'left';
            this.moved = true;
        } else if (this.pressedKeys[this.keypress.down]) {
            this.velocity.y += this.yVelocity;
            this.direction = 'down';
            this.moved = true;
        } else if (this.pressedKeys[this.keypress.right]) {
            this.velocity.x += this.xVelocity;
            this.direction = 'right';
            this.moved = true;
        } else{
            this.moved = false;
        }
        
        // Handle movement sound effects
        this.handleMovementSounds(wasMovingBefore);
    }
    
    /**
     * Handle movement sound effects based on movement state changes
     */
    handleMovementSounds(wasMovingBefore) {
        // Update current surface based on environment
        this.currentSurface = this.detectSurface();
        
        // Starting to move
        if (this.moved && !wasMovingBefore) {
            this.soundManager.playStartMovementSound();
            this.wasMoving = true;
        }
        // Continuing to move
        else if (this.moved && wasMovingBefore) {
            this.soundManager.playMovementSound(this.direction, this.currentSurface);
        }
        // Stopping movement
        else if (!this.moved && wasMovingBefore) {
            this.soundManager.playStopMovementSound();
            this.wasMoving = false;
        }
    }

    update() {
        super.update();
        if(!this.moved){
            if (this.gravity) {
                    this.time += 1;
                    this.velocity.y += 0.5 + this.acceleration * this.time;
                }
            }
        else{
            this.time = 0;
        }
        }
        
    /**
     * Overrides the reaction to the collision to handle
     *  - clearing the pressed keys array
     *  - stopping the player's velocity
     *  - updating the player's direction   
     * @param {*} other - The object that the player is colliding with
     */
    handleCollisionReaction(other) {    
        // Play collision sound effect
        this.playCollisionSound(other);
        
        this.pressedKeys = {};
        this.updateVelocityAndDirection();
        super.handleCollisionReaction(other);
    }
    
    /**
     * Play collision sound effect based on the object collided with
     */
    playCollisionSound(other) {
        if (!window.gameAudioEnabled) return;
        
        try {
            const now = this.soundManager.audioContext.currentTime;
            
            // Create collision sound
            const osc = this.soundManager.audioContext.createOscillator();
            const gain = this.soundManager.audioContext.createGain();
            const filter = this.soundManager.audioContext.createBiquadFilter();
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.soundManager.audioContext.destination);
            
            // Different sounds based on collision type
            let frequency = 150;
            let volume = 0.1;
            
            if (other && other.constructor.name) {
                const objectType = other.constructor.name.toLowerCase();
                if (objectType.includes('wall') || objectType.includes('barrier')) {
                    frequency = 200; // Higher pitch for walls
                    volume = 0.15;
                } else if (objectType.includes('npc') || objectType.includes('character')) {
                    frequency = 300; // Even higher for characters
                    volume = 0.08; // Softer for characters
                } else if (objectType.includes('platform')) {
                    frequency = 120; // Lower for platforms
                    volume = 0.12;
                }
            }
            
            osc.frequency.setValueAtTime(frequency, now);
            osc.type = 'triangle';
            
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(600, now);
            
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(volume, now + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            
            osc.start(now);
            osc.stop(now + 0.1);
        } catch (e) {
            console.log("Collision sound error:", e);
        }
    }
}

export default Player;