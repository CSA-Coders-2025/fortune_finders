export default class WaypointArrow {
  constructor(gameCanvas, gamePath) {
    this.gameCanvas = gameCanvas;
    this.gamePath = gamePath;
    // Start at J.P. Morgan and follow the correct order as seen in GameLevelAirport.js
    this.waypointIds = [
      'Stock-NPC',        // J.P. Morgan (fixed the space issue)
      'Casino-NPC',        // Frank Sinatra
      'Fidelity',          // Fidelity
      'Schwab',            // Schwab
      'Crypto-NPC',        // Satoshi Nakamoto
      'Bank-NPC',          // Janet Yellen
      'Market Computer'    // Computer
    ];
    // Start at the first step (J.P. Morgan)
    this.currentStep = this.loadStep();
    if (this.currentStep < 0 || this.currentStep >= this.waypointIds.length) {
      this.currentStep = 0;
    }
    this.arrowImg = this.createArrowElement();
    this.setupEventListeners();
    this.updateArrowBasedOnCookies(); // Check cookies on initialization
    
    // Make this instance globally accessible so the game can call methods on it
    window.waypointArrow = this;
  }

  loadStep() {
    const savedStep = this.getCookie('waypointStep');
    return savedStep !== null ? parseInt(savedStep) : 0;
  }

  setCookie(name, value, days) {
    let expires = '';
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + (value || '') + expires + '; path=/';
  }

  getCookie(name) {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  createArrowElement() {
    let arrowImg = document.createElement('img');
    arrowImg.src = this.gamePath + "/images/gamify/redarrow1.png";
    arrowImg.id = 'waypointArrow';
    arrowImg.style.position = 'absolute';
    arrowImg.style.zIndex = 2000;
    arrowImg.style.width = '48px';
    arrowImg.style.height = '48px';
    arrowImg.style.pointerEvents = 'none';
    arrowImg.style.transition = 'top 0.3s, left 0.3s';
    document.body.appendChild(arrowImg);
    return arrowImg;
  }

  getWaypointPosition(npcId) {
    // Use the same positions as INIT_POSITION in GameLevelAirport.js, with a slight upward offset for accuracy
    const width = this.gameCanvas ? this.gameCanvas.width : window.innerWidth;
    const height = this.gameCanvas ? this.gameCanvas.height : window.innerHeight;

    // These offsets (dx, dy) move the arrow just above the NPC's head
    const offsets = {
      'Stock-NPC':        { dx: 0, dy: -60 },   // J.P. Morgan
      'Casino-NPC':        { dx: 0, dy: -60 },   // Frank Sinatra
      'Fidelity':          { dx: 0, dy: 20},   // Lowered from -70 to -40
      'Schwab':            { dx: 0, dy: 20 },   // Lowered from -70 to -40
      'Crypto-NPC':        { dx: 0, dy: -60 },   // Satoshi Nakamoto
      'Bank-NPC':          { dx: 0, dy: -60 },   // Janet Yellen
      'Market Computer':   { dx: 0, dy: -60 }
    };

    const positions = {
      'Stock-NPC':        { x: width * 0.17, y: height * 0.8 },
      'Casino-NPC':        { x: width * 0.15, y: height * 0.25 },
      'Fidelity':          { x: width * 0.34, y: height * 0.05 },
      'Schwab':            { x: width * 0.48, y: height * 0.05 },
      'Crypto-NPC':        { x: width * 0.69, y: height * 0.24 },
      'Bank-NPC':          { x: width * 0.7, y: height * 0.75 },
      'Market Computer':   { x: width * 0.9, y: height * 0.65 }
    };

    const pos = positions[npcId] || { x: width / 2, y: height / 2 };
    const offset = offsets[npcId] || { dx: 0, dy: -60 };
    return { x: pos.x + offset.dx, y: pos.y + offset.dy };
  }

  moveArrowToCurrentWaypoint() {
    const npcId = this.waypointIds[this.currentStep] || this.waypointIds[0];
    const pos = this.getWaypointPosition(npcId);
    this.arrowImg.style.left = (pos.x - 24) + 'px';
    this.arrowImg.style.top = (pos.y - 24) + 'px';
  }

  // Check if player has earned a cookie from a specific NPC
  hasNpcCookie(npcId) {
    const cookies = document.cookie.split(';');
    const cookieName = `npc_${npcId}`;
    const npcCookie = cookies.find(cookie => cookie.trim().startsWith(`${cookieName}=`));
    return npcCookie !== undefined;
  }

  // Get all NPC cookies (similar to the one in Game.js)
  getAllNpcCookies() {
    const cookies = document.cookie.split(';');
    const npcCookies = {};
    
    cookies.forEach(cookie => {
      const trimmedCookie = cookie.trim();
      if (trimmedCookie.startsWith('npc_')) {
        const [name, value] = trimmedCookie.split('=');
        const npcId = name.replace('npc_', '');
        npcCookies[npcId] = value;
      }
    });
    
    return npcCookies;
  }

  // Update arrow position based on earned cookies
  updateArrowBasedOnCookies() {
    let targetStep = 0;
    
    // Find the furthest NPC that the player has earned a cookie from
    for (let i = 0; i < this.waypointIds.length; i++) {
      const npcId = this.waypointIds[i];
      if (this.hasNpcCookie(npcId)) {
        targetStep = Math.min(i + 1, this.waypointIds.length - 1); // Move to next NPC or stay at last
      } else {
        break; // Stop at first NPC without cookie
      }
    }
    
    // Only update if we need to move forward or if we're initializing
    if (targetStep !== this.currentStep) {
      console.log(`Waypoint arrow moving from step ${this.currentStep} to step ${targetStep}`);
      this.currentStep = targetStep;
      this.setCookie('waypointStep', this.currentStep, 30);
      this.moveArrowToCurrentWaypoint();
    } else {
      // Still move arrow to current position (for initialization)
      this.moveArrowToCurrentWaypoint();
    }
  }

  // Called when a cookie is earned to check if arrow should advance
  onCookieEarned(npcId) {
    console.log(`Cookie earned from ${npcId}, checking waypoint advancement`);
    
    // Find the index of this NPC in our waypoint list
    const npcIndex = this.waypointIds.indexOf(npcId);
    
    if (npcIndex !== -1 && npcIndex === this.currentStep) {
      // This is the current target NPC, advance the arrow
      console.log(`Advancing waypoint arrow from ${npcId} (step ${npcIndex})`);
      this.advanceStep();
    } else if (npcIndex !== -1) {
      console.log(`Cookie from ${npcId} but not current target. Current step: ${this.currentStep}, NPC step: ${npcIndex}`);
      // Update arrow position based on all cookies (in case we missed something)
      this.updateArrowBasedOnCookies();
    }
  }

  advanceStep() {
    if (this.currentStep < this.waypointIds.length - 1) {
      this.currentStep++;
      this.setCookie('waypointStep', this.currentStep, 30);
      this.moveArrowToCurrentWaypoint();
      
      // Visual feedback - make arrow pulse briefly
      this.arrowImg.style.transform = 'scale(1.2)';
      setTimeout(() => {
        this.arrowImg.style.transform = 'scale(1)';
      }, 200);
    }
  }

  resetStep() {
    this.currentStep = 0;
    this.setCookie('waypointStep', 0, 30);
    this.moveArrowToCurrentWaypoint();
  }

  setupEventListeners() {
    // Right-click to reset (for debugging)
    this.arrowImg.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.resetStep();
    });

    // Resize handler
    window.addEventListener('resize', () => this.moveArrowToCurrentWaypoint());

    // Remove the automatic 'E' key advancement - now only cookies can advance the arrow
    // The 'E' key interaction should be handled by the NPC itself when giving cookies
  }

  // Public method to refresh arrow position (can be called from outside)
  refresh() {
    this.updateArrowBasedOnCookies();
  }
}