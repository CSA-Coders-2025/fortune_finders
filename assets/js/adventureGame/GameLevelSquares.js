// To build GameLevels, each contains GameObjects from below imports
import GameEnvBackground from './GameEnvBackground.js';
import Background from './Background.js';
import BackgroundParallax from './BackgroundParallax.js';
import Player from './Player.js';

// Minimal Definition
class GameLevelSquares {
  constructor(gameEnv) {
    let path = gameEnv.path;
    let height = gameEnv.innerHeight;

    this.classes = [      
      { class: Background, data: background_data },
      { class: PlayerOne, data: player_one_data },
      { class: PlayerTwo, data: player_two_data }
    ];
    
    // Track instances of created objects for easier cleanup
    this.instances = [];
    
    console.log("GameLevelSquares constructor finished");
  }

  // Implementation of required methods for compatibility
  initialize() {
    console.log("GameLevelSquares initialize called");
    
    // Store references to the instances for later access
    if (this.gameEnv && this.gameEnv.gameObjects) {
      this.instances = [...this.gameEnv.gameObjects];
      console.log(`GameLevelSquares initialized with ${this.instances.length} game objects`);
    } else {
      console.warn("gameEnv or gameObjects is undefined in initialize");
    }
  }
  
  update() {
    // Level-specific update logic
    // Check for collisions between PlayerOne and PlayerTwo
    if (this.instances.length >= 3) { // Background, PlayerOne, PlayerTwo
      const playerOne = this.instances[1];
      const playerTwo = this.instances[2];
      
      // Simple collision detection
      if (this.checkCollision(playerOne, playerTwo)) {
        console.log("Players collided!");
      }
    }
  }

  checkCollision(obj1, obj2) {
    return (
      obj1.position.x < obj2.position.x + obj2.width &&
      obj1.position.x + obj1.width > obj2.position.x &&
      obj1.position.y < obj2.position.y + obj2.height &&
      obj1.position.y + obj1.height > obj2.position.y
    );
  }
  
  draw() {
    // Level-specific drawing logic
    // The background and players handle their own drawing
  }
  
  resize() {
    // Level-specific resize logic
    // The background and players handle their own resizing
  }
  
  destroy() {
    console.log("GameLevelSquares destroy called");
    
    // Clear instances array
    this.instances = [];
    
    console.log("GameLevelSquares destroy finished");
      { class: GameEnvBackground, data: {src:  path + "/images/platformer/backgrounds/mountains.jpg"} }, // zIndex default is 0
      { class: Background, data: {src:  path + "/images/platformer/backgrounds/hills.png", zIndex: 1 } },
      { class: BackgroundParallax, data: {src:  path + "/images/platformer/backgrounds/snowfall.png", zIndex: 2 } },
      { class: Player, data: {id: "player1", zIndex: 3} }, // wasd is default
      { class: Player, data: {
        id: "player2", 
        zIndex: 3,
        fillStyle: "blue", 
        INIT_POSITION: { x: 0, y: height/2 }, 
        keypress: {up: 73, left: 74, down: 75, right: 76 }} // Using IJKL
      }
    ];
  }
}

export default GameLevelSquares;