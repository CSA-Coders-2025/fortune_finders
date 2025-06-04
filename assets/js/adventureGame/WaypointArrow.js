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
      'Bank-NPC'           // Janet Yellen
    ];
    // Start at the first step (J.P. Morgan)
    this.currentStep = this.loadStep();
    if (this.currentStep < 0 || this.currentStep >= this.waypointIds.length) {
      this.currentStep = 0;
    }
    this.arrowImg = this.createArrowElement();
    this.setupEventListeners();
    this.updateArrowBasedOnCookies(); // Check cookies on initialization
    
    // Track visibility state
    this.isHiddenByModal = false;
    this.isPermanentlyHidden = false;
    
    // Set up modal monitoring
    this.setupModalMonitoring();
    
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
    arrowImg.src = this.gamePath + "/images/gamify/redarrow2.png";
    arrowImg.id = 'waypointArrow';
    arrowImg.style.position = 'absolute';
    arrowImg.style.zIndex = 500;
    arrowImg.style.width = '48px';
    arrowImg.style.height = '48px';
    arrowImg.style.pointerEvents = 'none';
    arrowImg.style.transition = 'top 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55), left 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    arrowImg.style.filter = 'drop-shadow(0 0 10px #ff4444) drop-shadow(0 0 20px #ff0000)';
    arrowImg.style.animation = 'arrowFloat 2s ease-in-out infinite, arrowGlow 1.5s ease-in-out infinite alternate';
    
    // Add enhanced CSS animations if not already present
    if (!document.getElementById('waypoint-arrow-styles')) {
      const style = document.createElement('style');
      style.id = 'waypoint-arrow-styles';
      style.textContent = `
        @keyframes arrowFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }
        
        @keyframes arrowGlow {
          0% { 
            filter: drop-shadow(0 0 10px #ff4444) drop-shadow(0 0 20px #ff0000);
          }
          100% { 
            filter: drop-shadow(0 0 15px #ff6666) drop-shadow(0 0 30px #ff2222) drop-shadow(0 0 40px #ff0000);
          }
        }
        
        @keyframes arrowAdvance {
          0% { 
            transform: translateY(0px) scale(1) rotate(0deg);
            filter: drop-shadow(0 0 10px #ff4444) drop-shadow(0 0 20px #ff0000);
          }
          50% { 
            transform: translateY(-15px) scale(1.3) rotate(5deg);
            filter: drop-shadow(0 0 25px #00ff00) drop-shadow(0 0 40px #00aa00);
          }
          100% { 
            transform: translateY(0px) scale(1) rotate(0deg);
            filter: drop-shadow(0 0 10px #ff4444) drop-shadow(0 0 20px #ff0000);
          }
        }
        
        .arrow-trail {
          position: absolute;
          width: 6px;
          height: 6px;
          background: radial-gradient(circle, #ff4444, transparent);
          border-radius: 50%;
          pointer-events: none;
          animation: trailFade 1s linear forwards;
        }
        
        @keyframes trailFade {
          0% { opacity: 0.8; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.3); }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(arrowImg);
    
    // Start trail effect
    this.startTrailEffect();
    
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
      'Fidelity':          { x: width * 0.38, y: height * 0.15 },
      'Schwab':            { x: width * 0.48, y: height * 0.15 },
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
    // Check if all NPCs are completed first
    if (this.areAllNpcsCompleted()) {
      this.hideArrow();
      return;
    }

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

  // Check if all NPCs have been completed
  areAllNpcsCompleted() {
    const allCookies = this.getAllNpcCookies();
    return this.waypointIds.every(npcId => allCookies[npcId]);
  }

  // Hide the arrow with a celebration effect (permanent)
  hideArrow() {
    if (!this.arrowImg || this.isPermanentlyHidden) return;

    console.log('All NPCs completed! Hiding waypoint arrow permanently.');
    
    this.isPermanentlyHidden = true;
    
    // Create final celebration effect
    this.createFinalCelebration();
    
    // Stop trail effect
    if (this.trailInterval) {
      clearInterval(this.trailInterval);
    }
    
    // Animate arrow disappearing
    this.arrowImg.style.animation = 'arrowAdvance 1s ease-out';
    
    setTimeout(() => {
      this.arrowImg.style.transition = 'opacity 1s ease-out, transform 1s ease-out';
      this.arrowImg.style.opacity = '0';
      this.arrowImg.style.transform = 'scale(0) rotate(360deg)';
      
      setTimeout(() => {
        this.arrowImg.style.display = 'none';
      }, 1000);
    }, 500);
  }

  // Create a final celebration when all NPCs are completed
  createFinalCelebration() {
    const particleCount = 30;
    const arrowRect = this.arrowImg.getBoundingClientRect();
    const centerX = arrowRect.left + arrowRect.width / 2;
    const centerY = arrowRect.top + arrowRect.height / 2;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      const colors = ['#ffd700', '#ffeb3b', '#4CAF50', '#03a9f4', '#e91e63', '#ff9800'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      particle.style.cssText = `
        position: fixed;
        left: ${centerX}px;
        top: ${centerY}px;
        width: 8px;
        height: 8px;
        background: ${color};
        border-radius: 50%;
        pointer-events: none;
        z-index: 2001;
        box-shadow: 0 0 10px ${color};
      `;
      
      document.body.appendChild(particle);
      
      // Animate particle outward in waves
      const wave = Math.floor(i / 10);
      const angleInWave = (i % 10) * (Math.PI * 2 / 10);
      const distance = 80 + wave * 40 + Math.random() * 60;
      const deltaX = Math.cos(angleInWave) * distance;
      const deltaY = Math.sin(angleInWave) * distance;
      
      particle.animate([
        {
          transform: 'translate(-50%, -50%) scale(0)',
          opacity: 1
        },
        {
          transform: 'translate(-50%, -50%) scale(1.5)',
          opacity: 1,
          offset: 0.2
        },
        {
          transform: `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px)) scale(0.5)`,
          opacity: 0.5,
          offset: 0.8
        },
        {
          transform: `translate(calc(-50% + ${deltaX * 1.3}px), calc(-50% + ${deltaY * 1.3}px)) scale(0)`,
          opacity: 0
        }
      ], {
        duration: 2000 + Math.random() * 1000,
        delay: wave * 200,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      });
      
      // Clean up
      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, 4000);
    }
  }

  // Called when a cookie is earned to check if arrow should advance
  onCookieEarned(npcId) {
    console.log(`Cookie earned from ${npcId}, checking waypoint advancement`);
    
    // Check if all NPCs are now completed
    if (this.areAllNpcsCompleted()) {
      this.hideArrow();
      return;
    }
    
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
      
      // Enhanced advancement animation
      this.arrowImg.style.animation = 'arrowAdvance 0.8s ease-out';
      
      // Create advancement particles
      this.createAdvancementParticles();
      
      // Move to new position after brief delay
      setTimeout(() => {
        this.moveArrowToCurrentWaypoint();
        // Reset to normal animation
        this.arrowImg.style.animation = 'arrowFloat 2s ease-in-out infinite, arrowGlow 1.5s ease-in-out infinite alternate';
      }, 400);
    } else {
      // If we've reached the last step, check if all NPCs are completed
      if (this.areAllNpcsCompleted()) {
        this.hideArrow();
      }
    }
  }

  startTrailEffect() {
    // Create subtle trail particles periodically
    this.trailInterval = setInterval(() => {
      this.createTrailParticle();
    }, 200);
  }

  createTrailParticle() {
    const trail = document.createElement('div');
    trail.className = 'arrow-trail';
    
    // Position at arrow location
    const arrowRect = this.arrowImg.getBoundingClientRect();
    trail.style.left = (arrowRect.left + arrowRect.width / 2) + 'px';
    trail.style.top = (arrowRect.top + arrowRect.height / 2) + 'px';
    trail.style.zIndex = this.arrowImg.style.zIndex - 1;
    
    document.body.appendChild(trail);
    
    // Remove after animation
    setTimeout(() => {
      if (trail.parentNode) {
        trail.parentNode.removeChild(trail);
      }
    }, 1000);
  }

  createAdvancementParticles() {
    // Create burst of celebration particles
    const particleCount = 12;
    const arrowRect = this.arrowImg.getBoundingClientRect();
    const centerX = arrowRect.left + arrowRect.width / 2;
    const centerY = arrowRect.top + arrowRect.height / 2;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.style.cssText = `
        position: fixed;
        left: ${centerX}px;
        top: ${centerY}px;
        width: 6px;
        height: 6px;
        background: linear-gradient(45deg, #00ff00, #ffff00);
        border-radius: 50%;
        pointer-events: none;
        z-index: 501;
        box-shadow: 0 0 8px #00ff00;
      `;
      
      document.body.appendChild(particle);
      
      // Animate particle outward
      const angle = (Math.PI * 2 * i) / particleCount;
      const distance = 60 + Math.random() * 40;
      const deltaX = Math.cos(angle) * distance;
      const deltaY = Math.sin(angle) * distance;
      
      particle.animate([
        {
          transform: 'translate(-50%, -50%) scale(0)',
          opacity: 1
        },
        {
          transform: 'translate(-50%, -50%) scale(1)',
          opacity: 1,
          offset: 0.3
        },
        {
          transform: `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px)) scale(0)`,
          opacity: 0
        }
      ], {
        duration: 800,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      });
      
      // Clean up
      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, 800);
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

  // Set up monitoring for modal/iframe opens and closes
  setupModalMonitoring() {
    // List of modal IDs to monitor
    const modalIds = ['yellenModal', 'casinoModal', 'cryptoModal', 'leaderboardModal', 'miningModal'];
    
    // More aggressive modal detection with multiple approaches
    const checkModals = () => {
      let anyModalVisible = false;
      
      modalIds.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
          const isVisible = modal.style.display === 'flex' || 
                           modal.style.display === 'block' || 
                           (modal.style.display !== 'none' && window.getComputedStyle(modal).display !== 'none');
          if (isVisible) {
            anyModalVisible = true;
          }
        }
      });
      
      // Update arrow visibility based on modal state
      if (anyModalVisible && !this.isHiddenByModal && !this.isPermanentlyHidden) {
        this.hideArrowForModal();
      } else if (!anyModalVisible && this.isHiddenByModal) {
        this.showArrowAfterModal();
      }
    };
    
    // Check immediately
    checkModals();
    
    // Set up periodic checking as backup
    setInterval(checkModals, 500);
    
    // Use MutationObserver to watch for modal changes
    const observer = new MutationObserver((mutations) => {
      let shouldCheck = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const target = mutation.target;
          if (modalIds.includes(target.id)) {
            shouldCheck = true;
          }
        }
        
        // Watch for new modals being added
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && modalIds.includes(node.id)) {
              shouldCheck = true;
            }
          });
        }
      });
      
      if (shouldCheck) {
        setTimeout(checkModals, 100); // Small delay to ensure DOM is updated
      }
    });
    
    // Observe the document body for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style']
    });
    
    // Also add event listeners for common modal show/hide events
    document.addEventListener('click', () => {
      setTimeout(checkModals, 200);
    });
    
    // Listen for any iframe loading
    document.addEventListener('DOMNodeInserted', (e) => {
      if (e.target.tagName === 'IFRAME') {
        setTimeout(checkModals, 100);
      }
    });
  }
  
  // Hide arrow when modal opens
  hideArrowForModal() {
    if (this.isPermanentlyHidden || !this.arrowImg) return;
    
    console.log('Modal opened - hiding waypoint arrow');
    this.isHiddenByModal = true;
    
    // Smoothly fade out the arrow
    this.arrowImg.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
    this.arrowImg.style.opacity = '0';
    this.arrowImg.style.transform = 'scale(0.8)';
    this.arrowImg.style.pointerEvents = 'none';
    
    // Stop trail effect temporarily
    if (this.trailInterval) {
      clearInterval(this.trailInterval);
      this.trailInterval = null;
    }
  }
  
  // Show arrow when modal closes
  showArrowAfterModal() {
    if (this.isPermanentlyHidden || !this.arrowImg) return;
    
    console.log('Modal closed - showing waypoint arrow');
    this.isHiddenByModal = false;
    
    // Smoothly fade in the arrow
    this.arrowImg.style.transition = 'opacity 0.3s ease-in, transform 0.3s ease-in';
    this.arrowImg.style.opacity = '1';
    this.arrowImg.style.transform = 'scale(1)';
    this.arrowImg.style.pointerEvents = 'none'; // Keep this as none since it's just visual
    
    // Restart trail effect
    if (!this.trailInterval) {
      this.startTrailEffect();
    }
    
    // Reset to normal transition for movement
    setTimeout(() => {
      if (!this.isHiddenByModal && !this.isPermanentlyHidden) {
        this.arrowImg.style.transition = 'top 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55), left 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55), opacity 0.3s ease-in, transform 0.3s ease-in';
      }
    }, 300);
  }
}
