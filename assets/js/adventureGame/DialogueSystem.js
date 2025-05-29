// DialogueSystem.js - Enhanced version with typewriter sound effects
// 1. Unique instances for each NPC to prevent button conflicts
// 2. Works with Eye of Ender collection
// 3. Added typewriter sound effects for immersive dialogue

class DialogueSystem {
  constructor(options = {}) {
    // Default dialogue arrays
    this.dialogues = options.dialogues || [
      "You've come far, traveler. The skies whisper your name.",
      "The End holds secrets only the brave dare uncover.",
      "Retrieve the elytra and embrace your destiny!"
    ];
    
    this.id = options.id || "dialogue_" + Math.random().toString(36).substr(2, 9);
    
    this.lastShownIndex = -1;
    
    this.dialogueBox = null;
    this.dialogueText = null;
    this.closeBtn = null;
    
    // Sound effect option - enhanced with typewriter sounds
    this.enableSound = options.enableSound !== undefined ? options.enableSound : true; // Default to true
    this.soundUrl = options.soundUrl || "./sounds/dialogue.mp3";
    this.sound = this.enableSound ? new Audio(this.soundUrl) : null;
    
    // Create typewriter sound effect
    this.typewriterSound = this.createTypewriterSound();
    
    // Create the dialogue box
    this.createDialogueBox();
    
    // Keep track of whether the dialogue is currently open
    this.isOpen = false;
    
    // Typewriter effect state
    this.isTyping = false;
    this.typewriterTimeout = null;
  }

  // Create typewriter sound effect
  createTypewriterSound() {
    if (!this.enableSound) return null;
    
    // Create a retro typewriter sound using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Function to play a single typewriter click
    const playTypewriterClick = () => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const filterNode = audioContext.createBiquadFilter();
      
      oscillator.connect(filterNode);
      filterNode.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Create a sharp click sound
      oscillator.frequency.setValueAtTime(800 + Math.random() * 400, audioContext.currentTime);
      oscillator.type = 'square';
      
      // Add some filtering for a more mechanical sound
      filterNode.type = 'lowpass';
      filterNode.frequency.setValueAtTime(2000, audioContext.currentTime);
      
      // Quick attack and decay for click effect
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.05);
    };
    
    return {
      play: playTypewriterClick,
      audioContext: audioContext
    };
  }

  createDialogueBox() {
    // Create the main dialogue container with unique ID
    this.dialogueBox = document.createElement("div");
    this.dialogueBox.id = "custom-dialogue-box-" + this.id;
    
    // Set styles for the dialogue box
    Object.assign(this.dialogueBox.style, {
      position: "fixed",
      bottom: "100px",
      left: "50%",
      transform: "translateX(-50%)",
      padding: "20px",
      maxWidth: "80%",
      background: "rgba(0, 0, 0, 0.85)",
      color: "#00FFFF",
      fontFamily: "'Press Start 2P', cursive, monospace",
      fontSize: "14px",
      textAlign: "center",
      border: "2px solid #4a86e8",
      borderRadius: "12px",
      zIndex: "9999",
      boxShadow: "0 0 20px rgba(0, 255, 255, 0.7)",
      display: "none"
    });

    // Create the avatar container for character portraits
    const avatarContainer = document.createElement("div");
    avatarContainer.id = "dialogue-avatar-" + this.id;
    Object.assign(avatarContainer.style, {
      width: "50px",
      height: "50px",
      marginRight: "15px",
      backgroundSize: "contain",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      display: "none" // Hidden by default
    });

    // Create the header with character name
    const speakerName = document.createElement("div");
    speakerName.id = "dialogue-speaker-" + this.id;
    Object.assign(speakerName.style, {
      fontWeight: "bold",
      color: "#4a86e8",
      marginBottom: "10px",
      fontSize: "16px"
    });

    // Create the text content area
    this.dialogueText = document.createElement("div");
    this.dialogueText.id = "dialogue-text-" + this.id;
    Object.assign(this.dialogueText.style, {
      marginBottom: "15px",
      lineHeight: "1.5"
    });

    // Create close button
    this.closeBtn = document.createElement("button");
    this.closeBtn.innerText = "Close";
    Object.assign(this.closeBtn.style, {
      marginTop: "15px",
      padding: "10px 20px",
      background: "#4a86e8",
      color: "#fff",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
      fontFamily: "'Press Start 2P', cursive, monospace",
      fontSize: "12px"
    });
    
    // Add click handler
    this.closeBtn.onclick = () => {
      this.closeDialogue();
    };

    // Create content container to hold text and avatar side by side
    const contentContainer = document.createElement("div");
    contentContainer.style.display = "flex";
    contentContainer.style.alignItems = "flex-start";
    contentContainer.style.marginBottom = "10px";
    contentContainer.appendChild(avatarContainer);
    
    // Create text container for speaker + dialogue
    const textContainer = document.createElement("div");
    textContainer.style.flexGrow = "1";
    textContainer.appendChild(speakerName);
    textContainer.appendChild(this.dialogueText);
    contentContainer.appendChild(textContainer);

    // Assemble the dialogue box
    this.dialogueBox.appendChild(contentContainer);
    this.dialogueBox.appendChild(this.closeBtn);
    
    // Add to the document
    document.body.appendChild(this.dialogueBox);
    
    // Also listen for Escape key to close dialogue
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen) {
        this.closeDialogue();
      }
    });
  }

  // Show a specific dialogue message with typewriter effect
  showDialogue(message, speaker = "", avatarSrc = null) {
    // Clear any existing typewriter effect
    if (this.typewriterTimeout) {
      clearTimeout(this.typewriterTimeout);
      this.typewriterTimeout = null;
    }
    
    // Set the content (with unique element IDs)
    const speakerElement = document.getElementById("dialogue-speaker-" + this.id);
    if (speakerElement) {
      speakerElement.textContent = speaker;
      speakerElement.style.display = speaker ? "block" : "none";
    }
    
    // Set avatar if provided
    const avatarElement = document.getElementById("dialogue-avatar-" + this.id);
    if (avatarElement) {
      if (avatarSrc) {
        avatarElement.style.backgroundImage = `url('${avatarSrc}')`;
        avatarElement.style.display = "block";
      } else {
        avatarElement.style.display = "none";
      }
    }
    
    // Show the dialogue box first
    this.dialogueBox.style.display = "block";
    this.isOpen = true;
    
    // Start typewriter effect
    this.startTypewriterEffect(message);
    
    // Play opening sound effect if enabled
    if (this.sound) {
      this.sound.currentTime = 0;
      this.sound.play().catch(e => console.log("Sound play error:", e));
    }
    
    // Return the dialogue box element for custom button addition
    return this.dialogueBox;
  }

  // Typewriter effect with sound
  startTypewriterEffect(message) {
    this.isTyping = true;
    this.dialogueText.textContent = ""; // Clear existing text
    
    // Add typing cursor
    this.dialogueText.style.borderRight = "2px solid #4a86e8";
    this.dialogueText.style.animation = "dialogueBlink 1s infinite";
    
    // Add CSS for blinking cursor if not already present
    if (!document.getElementById('dialogue-typewriter-styles')) {
      const style = document.createElement('style');
      style.id = 'dialogue-typewriter-styles';
      style.textContent = `
        @keyframes dialogueBlink {
          0%, 50% { border-color: #4a86e8; }
          51%, 100% { border-color: transparent; }
        }
      `;
      document.head.appendChild(style);
    }
    
    let charIndex = 0;
    const typeChar = () => {
      if (charIndex < message.length && this.isTyping) {
        // Add the next character
        this.dialogueText.textContent = message.substring(0, charIndex + 1);
        charIndex++;
        
        // Play typewriter sound for non-space characters and every other character
        if (this.typewriterSound && message[charIndex - 1] !== ' ' && charIndex % 2 === 0) {
          try {
            this.typewriterSound.play();
          } catch (e) {
            console.log("Typewriter sound error:", e);
          }
        }
        
        // Schedule next character
        this.typewriterTimeout = setTimeout(typeChar, 30 + Math.random() * 20); // 30-50ms per character
      } else {
        // Typing complete
        this.isTyping = false;
        this.dialogueText.style.borderRight = "none";
        this.dialogueText.style.animation = "none";
        
        // Play completion sound (softer bell sound)
        if (this.typewriterSound) {
          this.playCompletionSound();
        }
      }
    };
    
    // Start typing after a short delay
    this.typewriterTimeout = setTimeout(typeChar, 300);
  }

  // Play a soft completion sound when typing finishes
  playCompletionSound() {
    if (!this.enableSound || !this.typewriterSound.audioContext) return;
    
    try {
      const audioContext = this.typewriterSound.audioContext;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Soft bell-like sound
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.05, audioContext.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      console.log("Completion sound error:", e);
    }
  }

  // Show a random dialogue from the dialogues array
  showRandomDialogue(speaker = "", avatarSrc = null) {
    if (this.dialogues.length === 0) return;
    
    // Pick a random index that's different from the last one
    let randomIndex;
    if (this.dialogues.length > 1) {
      do {
        randomIndex = Math.floor(Math.random() * this.dialogues.length);
      } while (randomIndex === this.lastShownIndex);
    } else {
      randomIndex = 0; // Only one dialogue available
    }
    
    // Store the current index to avoid repetition next time
    this.lastShownIndex = randomIndex;
    
    // Show the dialogue
    const randomDialogue = this.dialogues[randomIndex];
    return this.showDialogue(randomDialogue, speaker, avatarSrc);
  }

  // Close the dialogue box
  closeDialogue() {
    if (!this.isOpen) return;
    
    // Stop any ongoing typewriter effect
    this.isTyping = false;
    if (this.typewriterTimeout) {
      clearTimeout(this.typewriterTimeout);
      this.typewriterTimeout = null;
    }
    
    // Remove typing cursor styling
    if (this.dialogueText) {
      this.dialogueText.style.borderRight = "none";
      this.dialogueText.style.animation = "none";
    }
    
    // Hide the dialogue box
    this.dialogueBox.style.display = "none";
    this.isOpen = false;
    
    // Remove any custom buttons
    const buttonContainers = this.dialogueBox.querySelectorAll('div[style*="display: flex"]');
    buttonContainers.forEach(container => {
      // Skip the main content container
      if (container.contains(document.getElementById("dialogue-avatar-" + this.id))) {
        return;
      }
      container.remove();
    });
  }

  // Check if dialogue is currently open
  isDialogueOpen() {
    return this.isOpen;
  }
  
  // Add buttons to the dialogue
  addButtons(buttons) {
      if (!this.isOpen || !buttons || !Array.isArray(buttons) || buttons.length === 0) return;
      
      const buttonContainer = document.createElement('div');
      buttonContainer.style.display = 'flex';
      buttonContainer.style.justifyContent = 'space-between';
      buttonContainer.style.marginTop = '10px';
      
      // Add each button
      buttons.forEach(button => {
          if (!button || !button.text) return;
          
          const btn = document.createElement('button');
          btn.textContent = button.text;
          btn.style.padding = '8px 15px';
          btn.style.background = button.primary ? '#4a86e8' : '#666';
          btn.style.color = 'white';
          btn.style.border = 'none';
          btn.style.borderRadius = '5px';
          btn.style.cursor = 'pointer';
          btn.style.marginRight = '10px';
          
          // Add click handler
          btn.onclick = () => {
              if (button.action && typeof button.action === 'function') {
                  button.action();
              }
          };
          
          buttonContainer.appendChild(btn);
      });
      
      // Insert before the close button
      if (buttonContainer.children.length > 0) {
          this.dialogueBox.insertBefore(buttonContainer, this.closeBtn);
      }
  }
}

export default DialogueSystem;