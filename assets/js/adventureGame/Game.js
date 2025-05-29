import GameControl from './GameEngine/GameControl.js';
import Quiz from './Quiz.js';
import Inventory from "./Inventory.js";
import { defaultItems } from "./items.js";
import GameLevelEnd from './GameLevelEnd.js';

class StatsManager {
    constructor(game) {
        this.game = game;
        this.initStatsUI();
    }
    async getNpcProgress(personId) {
        try {
            const response = await fetch(`${this.game.javaURI}/bank/${personId}/npcProgress`, this.fetchOptions);
            if (!response.ok) {
                throw new Error("Failed to fetch questions");
            }
            const npcProgressDictionary = await response.json();
            console.log(npcProgressDictionary);
            return npcProgressDictionary
        } catch (error) {
            console.error("Error fetching Npc Progress:", error);
            return null;
        }
    }
    async fetchStats(personId) {
        const endpoints = {
            balance: this.game.javaURI + '/rpg_answer/getBalance/' + personId,
            questionAccuracy: this.game.javaURI + '/rpg_answer/getQuestionAccuracy/' + personId
        };
    
        for (let [key, url] of Object.entries(endpoints)) {
            try {
                const response = await fetch(url, this.game.fetchOptions);
                const data = await response.json();
                
                if (key === "questionAccuracy") {
                    const accuracyPercent = Math.round((data ?? 0) * 100);
                    document.getElementById(key).innerHTML = `${accuracyPercent}%`;
                    localStorage.setItem(key, `${accuracyPercent}%`);
                } else {
                    document.getElementById(key).innerHTML = data ?? 0;
                    localStorage.setItem(key, data ?? 0);
                }
            } catch (err) {
                console.error(`Error fetching ${key}:`, err);
            }
        }
    }

    async createStats(stats, gname, uid) {
        try {
            const response = await fetch(`${this.game.javaURI}/createStats`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uid, gname, stats })
            });

            if (!response.ok) throw new Error("Network response was not ok");
            return await response.json();
        } catch (error) {
            console.error("Error creating stats:", error);
            return "Error creating stats";
        }
    }

    async getStats(uid) {
        try {
            const response = await fetch(`${this.game.javaURI}/getStats/${uid}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });

            if (!response.ok) throw new Error("Network response was not ok");
            return await response.json();
        } catch (error) {
            console.error("Error fetching stats:", error);
            return "Error fetching stats";
        }
    }

    async updateStats(stats, gname, uid) {
        try {
            const response = await fetch(`${this.game.javaURI}/updateStats`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uid, gname, stats })
            });

            if (!response.ok) throw new Error("Network response was not ok");
            return await response.json();
        } catch (error) {
            console.error("Error updating stats:", error);
            return "Error updating stats";
        }
    }

    async updateStatsMCQ(questionId, choiceId, personId) {
        try {
            const response = await fetch(this.game.javaURI + '/rpg_answer/submitMCQAnswer', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ questionId, personId, choiceId })
            });

            if (!response.ok) throw new Error("Network response was not ok");
            if (!response.ok) throw new Error("Network response was not ok");
            return response;
        } catch (error) {
            console.error("Error submitting MCQ answer:", error);
            throw error;
        }
    }

    async transitionToWallstreet(personId) {
        try {
            const response = await fetch(`${this.game.javaURI}/question/transitionToWallstreet/${personId}`, this.game.fetchOptions);
            if (!response.ok) throw new Error("Failed to fetch questions");
            const questionsAnswered = await response.json();
            return questionsAnswered >= 12;
        } catch (error) {
            console.error("Error transitioning to Wallstreet:", error);
            return null;
        }
    }

    initStatsUI() {
        const statsWrapper = document.createElement('div');
        statsWrapper.id = 'stats-wrapper';
        Object.assign(statsWrapper.style, {
            position: 'fixed',
            top: '80px',
            right: '0',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'flex-start',
        });

        // Add pixel font if not present
        if (!document.getElementById('pixel-font-link')) {
            const fontLink = document.createElement('link');
            fontLink.id = 'pixel-font-link';
            fontLink.rel = 'stylesheet';
            fontLink.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
            document.head.appendChild(fontLink);
        }

        // Initialize audio toggle button
        this.initAudioToggle();
        
        // Initialize ambient sound system
        this.initAmbientSounds();

        // Add retro stats styles
        const style = document.createElement('style');
        style.textContent = `
            #stats-button {
                background: #000;
                border: 2px solid #fff;
                padding: 8px;
                cursor: pointer;
                transition: all 0.3s;
                position: relative;
                overflow: hidden;
                box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
                animation: glowBorder 2s infinite alternate;
            }

            #stats-button::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 2px;
                background: rgba(255, 255, 255, 0.5);
                animation: scanline 2s linear infinite;
            }

            #stats-container {
                background: #000;
                border: 3px solid #fff;
                padding: 15px;
                margin-left: 10px;
                min-width: 250px;
                display: none;
                font-family: 'Press Start 2P', cursive;
                color: #fff;
                position: relative;
                box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
                animation: glowBorder 2s infinite alternate;
                opacity: 0;
                transform: translateX(-20px);
                transition: opacity 0.3s, transform 0.3s;
            }

            #stats-wrapper:hover #stats-container,
            #stats-container:focus-within {
                display: block;
                opacity: 1;
                transform: translateX(0);
            }

            #stats-wrapper.pinned #stats-container {
                display: block !important;
                opacity: 1 !important;
                transform: none !important;
            }

            #stats-button {
                background: #000;
                border: 2px solid #fff;
                padding: 8px;
                cursor: pointer;
                transition: all 0.3s;
                position: relative;
                overflow: hidden;
                box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
                animation: glowBorder 2s infinite alternate;
                z-index: 10001;
            }

            #stats-wrapper.pinned #stats-button {
                display: none;
            }

            #stats-container::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(
                    transparent 50%,
                    rgba(0, 0, 0, 0.5) 50%
                );
                background-size: 100% 4px;
                pointer-events: none;
                z-index: 1;
            }

            .pixel-title {
                font-size: 14px;
                margin-bottom: 15px;
                text-align: center;
                color: #ffeb3b;
                text-shadow: 2px 2px #000;
                position: relative;
            }

            .pixel-stat-box {
                background: rgba(255, 255, 255, 0.1);
                border: 2px solid #ffb300;
                margin: 8px 0;
                padding: 8px;
                display: flex;
                align-items: center;
                font-size: 11px;
                position: relative;
                overflow: hidden;
                transition: all 0.3s;
            }

            .pixel-stat-box:hover {
                transform: translateX(5px);
                background: rgba(255, 255, 255, 0.15);
                border-color: #ffd700;
            }

            .pixel-stat-box::after {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(
                    90deg,
                    transparent,
                    rgba(255, 255, 255, 0.2),
                    transparent
                );
                animation: shine 2s infinite;
            }

            #npcs-progress-bar-container {
                position: relative;
                height: 20px;
                background: #000;
                border: 2px solid #ffb300;
                margin-top: 12px;
                overflow: hidden;
            }

            #npcs-progress-bar {
                height: 100%;
                background: repeating-linear-gradient(
                    45deg,
                    #ffd700,
                    #ffd700 10px,
                    #ffb300 10px,
                    #ffb300 20px
                );
                transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                animation: progressPulse 2s infinite;
            }

            #npcs-progress-label {
                position: absolute;
                left: 0;
                right: 0;
                top: 0;
                bottom: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                color: #fff;
                text-shadow: 1px 1px #000;
                z-index: 2;
            }

            @keyframes glowBorder {
                0% { box-shadow: 0 0 5px #fff, inset 0 0 5px #fff; }
                100% { box-shadow: 0 0 15px #fff, inset 0 0 8px #fff; }
            }

            @keyframes scanline {
                0% { transform: translateY(-100%); }
                100% { transform: translateY(100%); }
            }

            @keyframes shine {
                0% { left: -100%; }
                100% { left: 100%; }
            }

            @keyframes progressPulse {
                0% { opacity: 0.8; }
                50% { opacity: 1; }
                100% { opacity: 0.8; }
            }

            .pixel-icon {
                width: 18px !important;
                height: 18px !important;
                margin-right: 8px;
                animation: iconFloat 2s infinite alternate;
            }

            @keyframes iconFloat {
                0% { transform: translateY(0); }
                100% { transform: translateY(-3px); }
            }
        `;
        document.head.appendChild(style);

        // Get actual NPC cookies earned for dynamic progress
        const npcCookies = this.getAllNpcCookies();
        const npcCookiesCount = Object.keys(npcCookies).length;
        const dynamicTotal = Math.max(npcCookiesCount, 1); // At least 1 to avoid division by zero

        // List of available NPCs that can give cookies
        const availableNpcs = [
            'Stock-NPC', 'Crypto-NPC', 'Casino-NPC', 'Bank-NPC',
            'Fidelity', 'Schwab', 'Market Computer'
        ];
        const totalAvailable = availableNpcs.length;
        const progressPercentage = totalAvailable > 0 ? (npcCookiesCount / totalAvailable) * 100 : 0;

        // Pixel-art icons (using retro-style emojis)
        const coinIcon = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1fa99.png';
        const accuracyIcon = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f3af.png';
        const npcIcon = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f9d1-200d-1f3a4.png';
        const statsIcon = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f3ae.png';

        // Create the button with retro styling
        const statsButton = document.createElement('div');
        statsButton.id = 'stats-button';
        statsButton.innerHTML = `<img src="${statsIcon}" alt="Stats" title="Show Player Stats" style="width:38px;height:38px;image-rendering:pixelated;" />`;

        // Create the panel with retro styling
        const statsContainer = document.createElement('div');
        statsContainer.id = 'stats-container';
        statsContainer.tabIndex = 0;

        // Add a pin button with retro styling
        const pinButton = document.createElement('button');
        pinButton.id = 'stats-pin-btn';
        pinButton.innerHTML = '📌';
        pinButton.title = 'Pin/unpin';
        Object.assign(pinButton.style, {
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'none',
            border: 'none',
            fontSize: '22px',
            cursor: 'pointer',
            zIndex: '10002',
            color: '#fff',
            textShadow: '2px 2px #000',
            transition: 'transform 0.2s, color 0.2s'
        });

        pinButton.addEventListener('mouseenter', () => {
            pinButton.style.transform = 'scale(1.2)';
            pinButton.style.color = '#ffd700';
        });
        pinButton.addEventListener('mouseleave', () => {
            pinButton.style.transform = '';
            pinButton.style.color = '#fff';
        });
        pinButton.addEventListener('click', (e) => {
            e.stopPropagation();
            setPinnedState(!pinned);
            // Play retro click sound
            const click = new Audio('data:audio/wav;base64,UklGRXEAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YUQAAAB/f39/gICAgICAgH9/f39/f39/f39/f4CAgICAgIB/f39/f39/f39/f3+AgICAgICAgICAgH9/f39/f39/f39/f39/f39/f39/fw==');
            click.volume = 0.3;
            click.play();
        });

        statsContainer.innerHTML = `
            <div class="pixel-title">
                <img class="pixel-icon" src="${statsIcon}" alt="Game" style="width:22px;height:22px;margin-right:8px;vertical-align:middle;" />
                <span>PLAYER STATS</span>
                <img class="pixel-icon" src="${statsIcon}" alt="Game" style="width:22px;height:22px;margin-left:8px;vertical-align:middle;" />
            </div>
            <div class="pixel-stat-box">
                <img class="pixel-icon" src="${coinIcon}" alt="Coin" style="width:22px;height:22px;vertical-align:middle;" />
                <span style="color: #ffb300;">Balance:</span> <span id="balance" style="margin-left: 6px;">0</span>
            </div>
            <div class="pixel-stat-box">
                <img class="pixel-icon" src="${accuracyIcon}" alt="Accuracy" style="width:22px;height:22px;vertical-align:middle;" />
                <span style="color: #ffb300;">Question Accuracy:</span> <span id="questionAccuracy" style="margin-left: 6px;">0%</span>
            </div>
            <div class="pixel-stat-box">
                <img class="pixel-icon" src="${npcIcon}" alt="NPC" style="width:22px;height:22px;vertical-align:middle;" />
                <span style="color: #ffb300;">NPC Cookies:</span> <span id="npcsTalkedTo" style="margin-left: 6px;">${npcCookiesCount}</span>
            </div>
            <div id="npcs-progress-bar-container">
                <div id="npcs-progress-bar" style="width: ${progressPercentage}%;"></div>
                <span id="npcs-progress-label">${npcCookiesCount} / ${totalAvailable}</span>
            </div>
        `;

        statsContainer.appendChild(pinButton);
        statsWrapper.appendChild(statsButton);
        statsWrapper.appendChild(statsContainer);
        document.body.appendChild(statsWrapper);

        // Add hover sound effect
        const hoverSound = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU');
        hoverSound.volume = 0.2;

        // Add hover effects with sound
        const statBoxes = statsContainer.querySelectorAll('.pixel-stat-box');
        statBoxes.forEach(box => {
            box.addEventListener('mouseenter', () => {
                hoverSound.currentTime = 0;
                hoverSound.play();
            });
        });

        // --- PINNED STATE LOGIC ---
        let pinned = false;
        function setPinnedState(isPinned) {
            pinned = isPinned;
            if (pinned) {
                statsWrapper.classList.add('pinned');
                pinButton.classList.add('pinned');
                statsContainer.style.position = 'fixed';
                statsContainer.style.right = '0';
                statsContainer.style.left = '';
                statsContainer.style.display = 'block';
                statsContainer.style.opacity = '1';
                statsContainer.style.transform = 'none';
                statsContainer.style.pointerEvents = 'auto';
                statsContainer.style.padding = '18px 28px';
                statsContainer.style.overflow = 'visible';
                statsContainer.style.zIndex = '10002';
            } else {
                statsWrapper.classList.remove('pinned');
                pinButton.classList.remove('pinned');
                statsContainer.style.position = '';
                statsContainer.style.right = '';
                statsContainer.style.left = '';
                statsContainer.style.display = '';
                statsContainer.style.opacity = '';
                statsContainer.style.transform = '';
                statsContainer.style.pointerEvents = '';
                statsContainer.style.padding = '';
                statsContainer.style.overflow = '';
                statsContainer.style.zIndex = '';
            }
            // Pin color/rotation
            pinButton.style.color = pinned ? '#ffb300' : '#fff';
            pinButton.style.transform = pinned ? 'rotate(-30deg)' : '';
        }

        // If pinned, prevent hover from closing
        statsWrapper.addEventListener('mouseleave', () => {
            if (!pinned) {
                statsContainer.style.display = 'none';
                statsContainer.style.opacity = '0';
                statsContainer.style.transform = 'translateX(-20px)';
            }
        });

        statsWrapper.addEventListener('mouseenter', () => {
            statsContainer.style.display = 'block';
            // Small delay to ensure display: block is applied before transition
            requestAnimationFrame(() => {
                statsContainer.style.opacity = '1';
                statsContainer.style.transform = 'translateX(0)';
            });
        });

        // Optional: clicking anywhere else unpins
        document.addEventListener('click', (e) => {
            if (pinned && !statsWrapper.contains(e.target)) {
                setPinnedState(false);
            }
        });
        // --- END PINNED STATE LOGIC ---
    }

    updateNpcsTalkedToUI(count) {
        const npcsSpan = document.getElementById('npcsTalkedTo');
        if (npcsSpan) {
            // Get actual NPC cookies count for waypoint NPCs only
            const waypointNpcs = [
                'Stock-NPC', 'Casino-NPC', 'Fidelity', 'Schwab', 
                'Crypto-NPC', 'Bank-NPC', 'Market Computer'
            ];
            const npcCookies = this.getAllNpcCookies();
            const npcCookiesCount = waypointNpcs.filter(npcId => npcCookies[npcId]).length;
            npcsSpan.textContent = npcCookiesCount;
        }
        // Update progress bar
        const bar = document.getElementById('npcs-progress-bar');
        const label = document.getElementById('npcs-progress-label');
        if (bar && label) {
            const waypointNpcs = [
                'Stock-NPC', 'Casino-NPC', 'Fidelity', 'Schwab', 
                'Crypto-NPC', 'Bank-NPC', 'Market Computer'
            ];
            const npcCookies = this.getAllNpcCookies();
            const npcCookiesCount = waypointNpcs.filter(npcId => npcCookies[npcId]).length;
            const totalAvailable = waypointNpcs.length;
            
            // Calculate percentage based on waypoint NPCs
            const percentage = totalAvailable > 0 ? (npcCookiesCount / totalAvailable) * 100 : 0;
            bar.style.width = `${Math.min(percentage, 100)}%`;
            label.textContent = `${npcCookiesCount} / ${totalAvailable}`;
        }
    }

    incrementNpcsTalkedTo() {
        // Get current count from cookies
        let npcsTalkedTo = 0;
        const cookies = document.cookie.split(';');
        const npcsCookie = cookies.find(cookie => cookie.trim().startsWith('npcsTalkedTo='));
        if (npcsCookie) {
            npcsTalkedTo = parseInt(npcsCookie.split('=')[1]) || 0;
        }
        npcsTalkedTo += 1;
        // Update cookie (expires in 30 days)
        document.cookie = `npcsTalkedTo=${npcsTalkedTo}; path=/; max-age=${60*60*24*30}`;
        this.updateNpcsTalkedToUI(npcsTalkedTo);
    }

    /**
     * Give a specific cookie for an NPC interaction
     * @param {string} npcId - The ID of the NPC
     * @param {string} reward - The reward/cookie value (optional, defaults to "completed")
     * @param {string} objective - The new objective to show (optional)
     */
    giveNpcCookie(npcId, reward = "completed", objective = null) {
        const cookieName = `npc_${npcId}`;
        const cookieValue = "completed"; // Always use "completed" for consistency
        const expiryDays = 30;
        
        // Check if this is the first time getting a cookie from this NPC
        const existingCookie = this.getNpcCookie(npcId);
        const isFirstTime = !existingCookie;
        
        // Set cookie (expires in 30 days)
        document.cookie = `${cookieName}=${cookieValue}; path=/; max-age=${60*60*24*expiryDays}`;
        
        // Only increment the general counter if this is the first interaction
        if (isFirstTime) {
            this.incrementNpcsTalkedTo();
        }
        
        // Show a notification that they received a cookie with objective
        // Use the original reward parameter for display purposes only
        this.showNpcCookieNotification(npcId, reward, objective);
        
        // Update the UI to reflect the new cookie count
        this.updateNpcsTalkedToUI(0); // Parameter doesn't matter anymore since we get count from cookies
        
        // Notify the waypoint arrow system if it exists
        if (window.waypointArrow && isFirstTime) {
            window.waypointArrow.onCookieEarned(npcId);
        }
        
        // Update progress bar
        if (isFirstTime) {
            setTimeout(() => {
                this.game.updateProgressBar();
            }, 500); // Slight delay for better visual timing
        }
        
        console.log(`NPC Cookie awarded: ${cookieName}=${cookieValue} (displayed as: ${reward})`);
    }

    /**
     * Check if user has a specific NPC cookie
     * @param {string} npcId - The ID of the NPC
     * @returns {string|null} - The cookie value if exists, null otherwise
     */
    getNpcCookie(npcId) {
        const cookies = document.cookie.split(';');
        const cookieName = `npc_${npcId}`;
        const npcCookie = cookies.find(cookie => cookie.trim().startsWith(`${cookieName}=`));
        if (npcCookie) {
            return npcCookie.split('=')[1];
        }
        return null;
    }

    /**
     * Get all NPC cookies
     * @returns {Object} - Object with npcId as key and cookie value as value
     */
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

    /**
     * Show a notification when user receives an NPC cookie
     * @param {string} npcId - The ID of the NPC
     * @param {string} reward - The reward received
     * @param {string} objective - The new objective received
     */
    showNpcCookieNotification(npcId, reward, objective) {
        // Create particle effects first
        this.createCookieParticles();
        
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(100%);
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
            color: white;
            padding: 20px;
            border-radius: 15px;
            border: 3px solid #ffd700;
            box-shadow: 
                0 8px 32px rgba(0,0,0,0.4),
                0 0 20px rgba(255, 215, 0, 0.3),
                inset 0 1px 0 rgba(255,255,255,0.1);
            z-index: 10000;
            font-family: 'Press Start 2P', cursive;
            font-size: 12px;
            max-width: 450px;
            min-width: 350px;
            transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            backdrop-filter: blur(10px);
            animation: pulseGlow 2s infinite alternate;
        `;
        
        // Add glowing animation keyframes if not already present
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes pulseGlow {
                    0% { 
                        box-shadow: 
                            0 8px 32px rgba(0,0,0,0.4),
                            0 0 20px rgba(255, 215, 0, 0.3),
                            inset 0 1px 0 rgba(255,255,255,0.1);
                    }
                    100% { 
                        box-shadow: 
                            0 8px 32px rgba(0,0,0,0.4),
                            0 0 30px rgba(255, 215, 0, 0.6),
                            inset 0 1px 0 rgba(255,255,255,0.2);
                    }
                }
                @keyframes slideUpFadeIn {
                    0% { 
                        transform: translateX(-50%) translateY(100%);
                        opacity: 0;
                    }
                    100% { 
                        transform: translateX(-50%) translateY(0);
                        opacity: 1;
                    }
                }
                @keyframes slideDownFadeOut {
                    0% { 
                        transform: translateX(-50%) translateY(0);
                        opacity: 1;
                    }
                    100% { 
                        transform: translateX(-50%) translateY(100%);
                        opacity: 0;
                    }
                }
                .notification-icon {
                    animation: bounce 1s infinite alternate;
                }
                @keyframes bounce {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(-5px); }
                }
                .objective-text {
                    animation: typewriter 0.8s steps(40) 0.5s both;
                    border-right: 2px solid #4CAF50;
                    animation: typewriter 0.8s steps(40) 0.5s both, blink 1s infinite 1.3s;
                }
                @keyframes typewriter {
                    0% { width: 0; }
                    100% { width: 100%; }
                }
                @keyframes blink {
                    0%, 50% { border-color: #4CAF50; }
                    51%, 100% { border-color: transparent; }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Build notification content
        const cookieEmoji = reward.includes('quiz') || reward.includes('question') ? '🧠' : 
                           reward.includes('dialogue') || reward.includes('talk') ? '💬' : 
                           reward.includes('casino') || reward.includes('game') ? '🎰' :
                           reward.includes('computer') || reward.includes('tech') ? '💻' :
                           reward.includes('bank') || reward.includes('finance') ? '🏦' : '🍪';
        const npcDisplayName = npcId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        notification.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <!-- Header with cookie earned -->
                <div style="display: flex; align-items: center; gap: 12px; border-bottom: 2px solid #333; padding-bottom: 15px;">
                    <span class="notification-icon" style="font-size: 28px;">${cookieEmoji}</span>
                    <div style="flex: 1;">
                        <div style="color: #ffd700; font-size: 14px; margin-bottom: 5px;">
                            🎉 COOKIE EARNED!
                        </div>
                        <div style="color: #fff; font-size: 10px; line-height: 1.4;">
                            <strong>${npcDisplayName}</strong><br>
                            <span style="color: #4CAF50;">${reward.replace(/_/g, ' ')}</span>
                        </div>
                    </div>
                    <div style="background: #4CAF50; color: #000; padding: 5px 10px; border-radius: 10px; font-size: 8px; font-weight: bold;">
                        +1 XP
                    </div>
                </div>
                
                ${objective ? `
                    <!-- Objective section -->
                    <div style="background: rgba(76, 175, 80, 0.1); border: 2px solid #4CAF50; border-radius: 10px; padding: 15px;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                            <span style="font-size: 16px;">🎯</span>
                            <span style="color: #4CAF50; font-size: 11px;">NEW OBJECTIVE</span>
                        </div>
                        <div class="objective-text" style="color: #fff; font-size: 9px; line-height: 1.5; overflow: hidden; white-space: nowrap;">
                            ${objective}
                        </div>
                    </div>
                ` : ''}
                
                <!-- Progress indicator -->
                <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 10px; border-top: 1px solid #333;">
                    <div style="display: flex; gap: 5px;">
                        ${this.generateProgressDots()}
                    </div>
                    <div style="color: #888; font-size: 8px;">
                        Press Enter to continue
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.animation = 'slideUpFadeIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards';
        }, 100);
        
        // Play success sound
        this.playNotificationSound();
        
        // Add keyboard listener to dismiss
        const dismissHandler = (e) => {
            // Only respond to Enter key
            if (e.key === 'Enter' || e.keyCode === 13) {
                this.dismissNotification(notification);
                document.removeEventListener('keydown', dismissHandler);
            }
        };
        document.addEventListener('keydown', dismissHandler);
        
        // Auto-dismiss after 8 seconds if not manually dismissed
        setTimeout(() => {
            if (notification.parentNode) {
                this.dismissNotification(notification);
                document.removeEventListener('keydown', dismissHandler);
            }
        }, 8000);
    }

    dismissNotification(notification) {
        notification.style.animation = 'slideDownFadeOut 0.4s ease-in forwards';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 400);
    }

    generateProgressDots() {
        const allNpcCookies = this.getAllNpcCookies();
        const totalNpcs = 7; // Total available NPCs
        const earnedCount = Object.keys(allNpcCookies).length;
        
        let dots = '';
        for (let i = 0; i < totalNpcs; i++) {
            const isEarned = i < earnedCount;
            dots += `<div style="
                width: 8px; 
                height: 8px; 
                border-radius: 50%; 
                background: ${isEarned ? '#4CAF50' : '#333'};
                border: 1px solid ${isEarned ? '#4CAF50' : '#666'};
                ${isEarned ? 'box-shadow: 0 0 5px #4CAF50;' : ''}
            "></div>`;
        }
        return dots;
    }

    playNotificationSound() {
        // Create a more pleasant notification sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Play a nice ascending chord
        const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
        
        frequencies.forEach((freq, index) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(audioContext.destination);
            
            osc.frequency.setValueAtTime(freq, audioContext.currentTime);
            osc.type = 'sine';
            
            gain.gain.setValueAtTime(0, audioContext.currentTime);
            gain.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1 + index * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5 + index * 0.1);
            
            osc.start(audioContext.currentTime + index * 0.1);
            osc.stop(audioContext.currentTime + 0.5 + index * 0.1);
        });
    }

    createCookieParticles() {
        // Create multiple sparkle particles
        const particles = [];
        const particleCount = 15;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: fixed;
                bottom: 200px;
                left: 50%;
                width: 8px;
                height: 8px;
                background: ${this.getRandomSparkleColor()};
                border-radius: 50%;
                pointer-events: none;
                z-index: 9999;
                box-shadow: 0 0 6px ${this.getRandomSparkleColor()};
            `;
            
            document.body.appendChild(particle);
            particles.push(particle);
            
            // Animate each particle
            this.animateParticle(particle, i);
        }
        
        // Clean up particles after animation
        setTimeout(() => {
            particles.forEach(particle => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            });
        }, 2000);
    }

    getRandomSparkleColor() {
        const colors = ['#ffd700', '#ffeb3b', '#4CAF50', '#03a9f4', '#e91e63', '#ff9800'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    animateParticle(particle, index) {
        // Random direction and distance
        const angle = (Math.PI * 2 * index) / 15 + (Math.random() - 0.5) * 0.5;
        const distance = 100 + Math.random() * 150;
        const duration = 1500 + Math.random() * 500;
        
        const deltaX = Math.cos(angle) * distance;
        const deltaY = Math.sin(angle) * distance - 50; // Slight upward bias
        
        // Create keyframes for the animation
        const keyframes = [
            {
                transform: 'translate(-50%, 0) scale(0)',
                opacity: 0
            },
            {
                transform: 'translate(-50%, 0) scale(1)',
                opacity: 1,
                offset: 0.1
            },
            {
                transform: `translate(calc(-50% + ${deltaX}px), ${deltaY}px) scale(0.5)`,
                opacity: 0.7,
                offset: 0.7
            },
            {
                transform: `translate(calc(-50% + ${deltaX}px), ${deltaY - 30}px) scale(0)`,
                opacity: 0
            }
        ];
        
        particle.animate(keyframes, {
            duration: duration,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        });
    }

    initAudioToggle() {
        // Check for existing audio preference
        const isAudioEnabled = localStorage.getItem('gameAudioEnabled') !== 'false';
        
        // Create audio toggle button container
        const audioToggleContainer = document.createElement('div');
        audioToggleContainer.id = 'audio-toggle-container';
        audioToggleContainer.style.cssText = `
            position: fixed;
            top: 120px;
            left: 20px;
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        
        // Create the toggle button
        const audioButton = document.createElement('button');
        audioButton.id = 'audio-toggle-button';
        audioButton.innerHTML = isAudioEnabled ? '🔊' : '🔇';
        audioButton.title = isAudioEnabled ? 'Click to mute audio' : 'Click to enable audio';
        audioButton.style.cssText = `
            background: #000;
            border: 2px solid #fff;
            color: #fff;
            padding: 12px 15px;
            cursor: pointer;
            font-family: 'Press Start 2P', cursive;
            font-size: 18px;
            border-radius: 4px;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
            animation: glowBorder 2s infinite alternate;
        `;
        
        // Add label
        const audioLabel = document.createElement('span');
        audioLabel.style.cssText = `
            color: #fff;
            font-family: 'Press Start 2P', cursive;
            font-size: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            opacity: 0.8;
        `;
        audioLabel.textContent = isAudioEnabled ? 'AUDIO ON' : 'AUDIO OFF';
        
        // Add click functionality
        audioButton.addEventListener('click', () => {
            const currentState = localStorage.getItem('gameAudioEnabled') !== 'false';
            const newState = !currentState;
            
            // Update localStorage
            localStorage.setItem('gameAudioEnabled', newState.toString());
            
            // Update button appearance
            audioButton.innerHTML = newState ? '🔊' : '🔇';
            audioButton.title = newState ? 'Click to mute audio' : 'Click to enable audio';
            audioLabel.textContent = newState ? 'AUDIO ON' : 'AUDIO OFF';
            
            // Update global audio state
            window.gameAudioEnabled = newState;
            
            // Play a confirmation sound if audio is being enabled
            if (newState) {
                this.playConfirmationSound();
            }
            
            // Show brief feedback
            this.showAudioToggleFeedback(newState);
        });
        
        // Add hover effects
        audioButton.addEventListener('mouseenter', () => {
            audioButton.style.transform = 'scale(1.05)';
            audioButton.style.borderColor = '#ffd700';
            audioButton.style.boxShadow = '0 0 15px rgba(255, 215, 0, 0.5)';
        });
        
        audioButton.addEventListener('mouseleave', () => {
            audioButton.style.transform = 'scale(1)';
            audioButton.style.borderColor = '#fff';
            audioButton.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.3)';
        });
        
        // Assemble and add to page
        audioToggleContainer.appendChild(audioButton);
        audioToggleContainer.appendChild(audioLabel);
        document.body.appendChild(audioToggleContainer);
        
        // Set global audio state
        window.gameAudioEnabled = isAudioEnabled;
        
        // Add CSS for animations if not present
        if (!document.getElementById('audio-toggle-styles')) {
            const style = document.createElement('style');
            style.id = 'audio-toggle-styles';
            style.textContent = `
                @keyframes audioFeedback {
                    0% { transform: scale(1) rotate(0deg); }
                    25% { transform: scale(1.1) rotate(-5deg); }
                    50% { transform: scale(1.2) rotate(5deg); }
                    75% { transform: scale(1.1) rotate(-2deg); }
                    100% { transform: scale(1) rotate(0deg); }
                }
                
                .audio-feedback {
                    animation: audioFeedback 0.5s ease-out;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    playConfirmationSound() {
        // Play a brief confirmation beep when audio is enabled
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.1);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (e) {
            console.log("Confirmation sound error:", e);
        }
    }
    
    showAudioToggleFeedback(isEnabled) {
        // Show visual feedback when audio is toggled
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: ${isEnabled ? '#4CAF50' : '#f44336'};
            padding: 20px 30px;
            border: 2px solid ${isEnabled ? '#4CAF50' : '#f44336'};
            border-radius: 8px;
            font-family: 'Press Start 2P', cursive;
            font-size: 12px;
            z-index: 10001;
            pointer-events: none;
            animation: audioFeedback 0.5s ease-out;
            box-shadow: 0 0 20px rgba(${isEnabled ? '76, 175, 80' : '244, 67, 54'}, 0.5);
        `;
        feedback.textContent = isEnabled ? '🔊 AUDIO ENABLED' : '🔇 AUDIO DISABLED';
        
        document.body.appendChild(feedback);
        
        // Remove feedback after animation
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 1000);
    }

    initAmbientSounds() {
        // Create ambient sound manager
        this.ambientSoundManager = new AmbientSoundManager();
        
        // Start subtle ambient effects
        this.ambientSoundManager.startAmbientLoop();
        
        // Add UI interaction sounds
        this.addUIInteractionSounds();
        
        // Set up environment detection
        this.setupEnvironmentDetection();
    }
    
    setupEnvironmentDetection() {
        // Check current level periodically and update ambient environment
        setInterval(() => {
            if (this.gameControl && this.gameControl.currentLevel) {
                const levelName = this.gameControl.currentLevel.constructor.name.toLowerCase();
                let environment = 'default';
                
                // Map level names to environments
                if (levelName.includes('office')) {
                    environment = 'office';
                } else if (levelName.includes('casino')) {
                    environment = 'casino';
                } else if (levelName.includes('bank')) {
                    environment = 'bank';
                } else if (levelName.includes('airport')) {
                    environment = 'airport';
                } else if (levelName.includes('desert')) {
                    environment = 'desert';
                } else if (levelName.includes('underground') || levelName.includes('cave')) {
                    environment = 'underground';
                }
                
                // Update ambient environment if it changed
                if (this.ambientSoundManager.currentEnvironment !== environment) {
                    this.ambientSoundManager.setEnvironment(environment);
                }
            }
        }, 2000); // Check every 2 seconds
    }
    
    // Method to manually set environment (can be called from level files)
    setAmbientEnvironment(environment) {
        if (this.ambientSoundManager) {
            this.ambientSoundManager.setEnvironment(environment);
        }
    }
    
    addUIInteractionSounds() {
        // Add subtle hover sounds to all interactive elements
    }
    
    addUIInteractionSounds() {
        // Add subtle hover sounds to all interactive elements
        const addHoverSound = (element) => {
            element.addEventListener('mouseenter', () => {
                if (window.gameAudioEnabled !== false) {
                    this.ambientSoundManager.playUIHoverSound();
                }
            });
        };
        
        const addClickSound = (element) => {
            element.addEventListener('click', () => {
                if (window.gameAudioEnabled !== false) {
                    this.ambientSoundManager.playUIClickSound();
                }
            });
        };
        
        // Apply to existing and future UI elements
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        // Add sounds to buttons
                        const buttons = node.querySelectorAll ? node.querySelectorAll('button') : [];
                        buttons.forEach(button => {
                            addHoverSound(button);
                            addClickSound(button);
                        });
                        
                        // Add sounds to the element itself if it's interactive
                        if (node.tagName === 'BUTTON' || node.style.cursor === 'pointer') {
                            addHoverSound(node);
                            addClickSound(node);
                        }
                    }
                });
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }
}

// Minecraft-Style Ambient Sound Manager Class
class AmbientSoundManager {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.isLooping = false;
        this.ambientGain = null;
        this.currentEnvironment = 'default';
        this.lastAmbientTime = 0;
        this.ambientInterval = 15000; // 15 seconds minimum between ambient sounds
        
        // Minecraft-style ambient sound sets
        this.ambientSounds = {
            'default': {
                sounds: ['wind', 'distant_echo', 'subtle_drone'],
                baseFreq: 60,
                volume: 0.02
            },
            'office': {
                sounds: ['air_conditioning', 'distant_typing', 'elevator_hum', 'fluorescent_buzz'],
                baseFreq: 120,
                volume: 0.015
            },
            'casino': {
                sounds: ['distant_slots', 'muffled_chatter', 'air_circulation', 'carpet_ambience'],
                baseFreq: 80,
                volume: 0.018
            },
            'bank': {
                sounds: ['vault_echo', 'marble_ambience', 'security_hum', 'distant_footsteps'],
                baseFreq: 100,
                volume: 0.02
            },
            'airport': {
                sounds: ['terminal_ambience', 'distant_announcements', 'air_circulation', 'crowd_murmur'],
                baseFreq: 90,
                volume: 0.025
            },
            'desert': {
                sounds: ['wind_sand', 'distant_howl', 'desert_drone', 'heat_shimmer'],
                baseFreq: 50,
                volume: 0.02
            },
            'underground': {
                sounds: ['cave_echo', 'water_drip', 'stone_settle', 'deep_rumble'],
                baseFreq: 40,
                volume: 0.03
            }
        };
    }
    
    startAmbientLoop() {
        if (this.isLooping || !window.gameAudioEnabled) return;
        
        this.isLooping = true;
        this.scheduleNextAmbient();
    }
    
    stopAmbientLoop() {
        this.isLooping = false;
        if (this.ambientGain) {
            this.ambientGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1);
        }
    }
    
    setEnvironment(environment) {
        this.currentEnvironment = environment || 'default';
        console.log(`Ambient environment set to: ${this.currentEnvironment}`);
    }
    
    scheduleNextAmbient() {
        if (!this.isLooping || !window.gameAudioEnabled) return;
        
        // Random interval between 8-25 seconds (like Minecraft)
        const nextInterval = 8000 + Math.random() * 17000;
        
        setTimeout(() => {
            if (this.isLooping) {
                this.playRandomAmbientSound();
                this.scheduleNextAmbient();
            }
        }, nextInterval);
    }
    
    playRandomAmbientSound() {
        const envData = this.ambientSounds[this.currentEnvironment] || this.ambientSounds['default'];
        const soundType = envData.sounds[Math.floor(Math.random() * envData.sounds.length)];
        
        this.playAmbientSound(soundType, envData);
    }
    
    playAmbientSound(soundType, envData) {
        if (!window.gameAudioEnabled) return;
        
        try {
            switch (soundType) {
                case 'wind':
                    this.createWindSound(envData);
                    break;
                case 'cave_echo':
                    this.createCaveEcho();
                    break;
                case 'water_drip':
                    this.createWaterDrip();
                    break;
                case 'distant_echo':
                    this.createDistantEcho();
                    break;
                case 'air_conditioning':
                    this.createAirConditioning();
                    break;
                case 'distant_typing':
                    this.createDistantTyping();
                    break;
                case 'fluorescent_buzz':
                    this.createFluorescentBuzz();
                    break;
                case 'distant_slots':
                    this.createDistantSlots();
                    break;
                case 'vault_echo':
                    this.createVaultEcho();
                    break;
                case 'terminal_ambience':
                    this.createTerminalAmbience();
                    break;
                case 'wind_sand':
                    this.createSandWind();
                    break;
                case 'deep_rumble':
                    this.createDeepRumble();
                    break;
                default:
                    this.createGenericAmbient(envData);
            }
        } catch (e) {
            console.log("Ambient sound error:", e);
        }
    }
    
    // Minecraft-style wind sound
    createWindSound(envData) {
        const duration = 3 + Math.random() * 4; // 3-7 seconds
        
        // Create wind with filtered noise
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * (0.5 + 0.5 * Math.sin(i / bufferSize * Math.PI));
        }
        
        const source = this.audioContext.createBufferSource();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        source.buffer = buffer;
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioContext.destination);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200 + Math.random() * 100, this.audioContext.currentTime);
        filter.Q.setValueAtTime(0.5, this.audioContext.currentTime);
        
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(envData.volume, this.audioContext.currentTime + 0.5);
        gain.gain.linearRampToValueAtTime(envData.volume * 0.7, this.audioContext.currentTime + duration - 1);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        source.start(this.audioContext.currentTime);
    }
    
    // Classic Minecraft cave echo
    createCaveEcho() {
        const frequencies = [180, 220, 260]; // Eerie chord
        const duration = 2 + Math.random() * 3;
        
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                const filter = this.audioContext.createBiquadFilter();
                const delay = this.audioContext.createDelay(2);
                const delayGain = this.audioContext.createGain();
                
                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.audioContext.destination);
                
                // Echo effect
                gain.connect(delay);
                delay.connect(delayGain);
                delayGain.connect(gain);
                
                osc.frequency.setValueAtTime(freq + Math.random() * 20, this.audioContext.currentTime);
                osc.type = 'sine';
                
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(400, this.audioContext.currentTime);
                
                delay.delayTime.setValueAtTime(0.3 + Math.random() * 0.4, this.audioContext.currentTime);
                delayGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                
                gain.gain.setValueAtTime(0, this.audioContext.currentTime);
                gain.gain.linearRampToValueAtTime(0.025, this.audioContext.currentTime + 0.3);
                gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
                
                osc.start(this.audioContext.currentTime);
                osc.stop(this.audioContext.currentTime + duration);
            }, index * 200);
        });
    }
    
    // Water drip sound (classic Minecraft cave sound)
    createWaterDrip() {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.frequency.setValueAtTime(800, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.1);
        osc.type = 'sine';
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, this.audioContext.currentTime);
        
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.04, this.audioContext.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.8);
        
        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 0.8);
    }
    
    // Distant echo effect
    createDistantEcho() {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        const delay = this.audioContext.createDelay(1);
        const delayGain = this.audioContext.createGain();
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioContext.destination);
        gain.connect(delay);
        delay.connect(delayGain);
        delayGain.connect(gain);
        
        osc.frequency.setValueAtTime(150 + Math.random() * 100, this.audioContext.currentTime);
        osc.type = 'triangle';
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, this.audioContext.currentTime);
        
        delay.delayTime.setValueAtTime(0.5, this.audioContext.currentTime);
        delayGain.gain.setValueAtTime(0.4, this.audioContext.currentTime);
        
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.02, this.audioContext.currentTime + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 3);
        
        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 3);
    }
    
    // Office air conditioning hum
    createAirConditioning() {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.frequency.setValueAtTime(120 + Math.random() * 20, this.audioContext.currentTime);
        osc.type = 'sawtooth';
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(250, this.audioContext.currentTime);
        
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.audioContext.currentTime + 1);
        gain.gain.linearRampToValueAtTime(0.008, this.audioContext.currentTime + 4);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 6);
        
        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 6);
    }
    
    // Distant typing sounds
    createDistantTyping() {
        const typeCount = 3 + Math.random() * 7; // 3-10 keystrokes
        
        for (let i = 0; i < typeCount; i++) {
            setTimeout(() => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                const filter = this.audioContext.createBiquadFilter();
                
                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.audioContext.destination);
                
                osc.frequency.setValueAtTime(800 + Math.random() * 400, this.audioContext.currentTime);
                osc.type = 'square';
                
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(600, this.audioContext.currentTime);
                
                gain.gain.setValueAtTime(0, this.audioContext.currentTime);
                gain.gain.linearRampToValueAtTime(0.005, this.audioContext.currentTime + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
                
                osc.start(this.audioContext.currentTime);
                osc.stop(this.audioContext.currentTime + 0.1);
            }, i * (100 + Math.random() * 200));
        }
    }
    
    // Casino slot machine sounds in distance
    createDistantSlots() {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.frequency.setValueAtTime(400, this.audioContext.currentTime);
        osc.frequency.linearRampToValueAtTime(350, this.audioContext.currentTime + 0.5);
        osc.type = 'square';
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, this.audioContext.currentTime);
        
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.008, this.audioContext.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1.5);
        
        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 1.5);
    }
    
    // Deep underground rumble
    createDeepRumble() {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.frequency.setValueAtTime(30 + Math.random() * 20, this.audioContext.currentTime);
        osc.type = 'sawtooth';
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(80, this.audioContext.currentTime);
        
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.04, this.audioContext.currentTime + 1);
        gain.gain.linearRampToValueAtTime(0.03, this.audioContext.currentTime + 4);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 8);
        
        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 8);
    }
    
    // Generic ambient for other environments
    createGenericAmbient(envData) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.frequency.setValueAtTime(envData.baseFreq + Math.random() * 40, this.audioContext.currentTime);
        osc.type = 'sine';
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, this.audioContext.currentTime);
        
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(envData.volume, this.audioContext.currentTime + 1);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 5);
        
        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 5);
    }
    
    // Keep existing UI interaction sounds
    playUIHoverSound() {
        if (!window.gameAudioEnabled) return;
        
        try {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            
            osc.frequency.setValueAtTime(800 + Math.random() * 200, this.audioContext.currentTime);
            osc.type = 'sine';
            
            gain.gain.setValueAtTime(0, this.audioContext.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, this.audioContext.currentTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
            
            osc.start(this.audioContext.currentTime);
            osc.stop(this.audioContext.currentTime + 0.1);
        } catch (e) {
            console.log("UI hover sound error:", e);
        }
    }
    
    playUIClickSound() {
        if (!window.gameAudioEnabled) return;
        
        try {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            
            osc.frequency.setValueAtTime(1200, this.audioContext.currentTime);
            osc.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.05);
            osc.type = 'square';
            
            gain.gain.setValueAtTime(0, this.audioContext.currentTime);
            gain.gain.linearRampToValueAtTime(0.02, this.audioContext.currentTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.08);
            
            osc.start(this.audioContext.currentTime);
            osc.stop(this.audioContext.currentTime + 0.08);
        } catch (e) {
            console.log("UI click sound error:", e);
        }
    }
}

class InventoryManager {
    constructor(game) {
        this.game = game;
        this.inventory = Inventory.getInstance();
    }

    giveItem(itemId, quantity = 1) {
        const item = defaultItems[itemId];
        if (!item) {
            console.error(`Item ${itemId} not found in defaultItems`);
            return false;
        }

        const itemToAdd = {
            ...item,
            quantity: quantity
        };

        return this.inventory.addItem(itemToAdd);
    }

    removeItem(itemId, quantity = 1) {
        return this.inventory.removeItem(itemId, quantity);
    }

    hasItem(itemId) {
        return this.inventory.items.some(item => item.id === itemId);
    }

    getItemQuantity(itemId) {
        const item = this.inventory.items.find(item => item.id === itemId);
        return item ? item.quantity : 0;
    }

    giveStartingItems() {
        this.giveItem('stock_certificate', 5);
        this.giveItem('bond', 3);
        this.giveItem('trading_boost', 2);
        this.giveItem('speed_boost', 2);
        this.giveItem('calculator', 1);
        this.giveItem('market_scanner', 1);
        this.giveItem('rare_coin', 1);
        this.giveItem('trading_manual', 1);
        this.giveItem('roi_calculator', 1);
    }
}

class QuizManager {
    constructor(game) {
        this.game = game;
    }

    async fetchQuestionByCategory(category) {
        try {
            const personId = this.game.id;
            const response = await fetch(
                `${this.game.javaURI}/rpg_answer/getQuestion?category=${category}&personid=${personId}`, 
                this.game.fetchOptions
            );
    
            if (!response.ok) throw new Error("Failed to fetch questions");
            const questions = await response.json();
            return questions;
        } catch (error) {
            console.error("Error fetching question by category:", error);
            return null;
        }
    }
    
    async attemptQuizForNpc(npcCategory, callback = null) {
        try {
            const response = await this.fetchQuestionByCategory(npcCategory);
            const allQuestions = response?.questions || [];
    
            if (allQuestions.length === 0) {
                alert(`✅ You've already completed all of ${npcCategory}'s questions!`);
                return;
            }
    
            const quiz = new Quiz();
            quiz.initialize();
            quiz.openPanel(npcCategory, callback, allQuestions);
        } catch (error) {
            console.error("Error during NPC quiz attempt:", error);
            alert("⚠️ There was a problem loading the quiz. Please try again.");
        }
    }
}

class Game {
    constructor(environment) {
        this.environment = environment;
        this.path = environment.path;
        this.gameContainer = environment.gameContainer;
        this.gameCanvas = environment.gameCanvas;
        this.pythonURI = environment.pythonURI;
        this.javaURI = environment.javaURI;
        this.fetchOptions = environment.fetchOptions;
        this.uid = null;
        this.id = null;
        this.gname = null;

        this.statsManager = new StatsManager(this);
        this.inventoryManager = new InventoryManager(this);
        this.quizManager = new QuizManager(this);
        
        this.initUser();
        this.inventoryManager.giveStartingItems();
        this.initProgressBar();
        this.showGameInstructions();
        
        // Add keyboard event listener for 'H' key
        document.addEventListener('keydown', (event) => {
            if (event.key.toLowerCase() === 'h') {
                this.showGameInstructions();
            }
        });
        
        const gameLevelClasses = environment.gameLevelClasses;
        this.gameControl = new GameControl(this, gameLevelClasses);
        this.gameControl.start();
    }

    static main(environment) {
        return new Game(environment);
    }

    initUser() {
        const pythonURL = this.pythonURI + '/api/id';
        fetch(pythonURL, this.fetchOptions)
            .then(response => {
                if (response.status !== 200) {
                    console.error("HTTP status code: " + response.status);
                    return null;
                }
                return response.json();
            })
            .then(data => {
                if (!data) return;
                this.uid = data.uid;

                const javaURL = this.javaURI + '/rpg_answer/person/' + this.uid;
                return fetch(javaURL, this.fetchOptions);
            })
            .then(response => {
                if (!response || !response.ok) {
                    throw new Error(`Spring server response: ${response?.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (!data) return;
                this.id = data.id;
                this.statsManager.fetchStats(data.id);
            })
            .catch(error => {
                console.error("Error:", error);
            });
    }

    giveItem(itemId, quantity = 1) {
        return this.inventoryManager.giveItem(itemId, quantity);
    }

    removeItem(itemId, quantity = 1) {
        return this.inventoryManager.removeItem(itemId, quantity);
    }

    hasItem(itemId) {
        return this.inventoryManager.hasItem(itemId);
    }

    getItemQuantity(itemId) {
        return this.inventoryManager.getItemQuantity(itemId);
    }

    attemptQuizForNpc(npcCategory, callback = null) {
        return this.quizManager.attemptQuizForNpc(npcCategory, callback);
    }

    // === NPC Cookie Methods ===
    
    /**
     * Give a cookie to the user for completing an NPC interaction
     * @param {string} npcId - The ID of the NPC
     * @param {string} reward - The reward/cookie value (optional)
     * @param {string} objective - The new objective to show (optional)
     */
    giveNpcCookie(npcId, reward = "completed", objective = null) {
        return this.statsManager.giveNpcCookie(npcId, reward, objective);
    }

    /**
     * Check if user has a specific NPC cookie
     * @param {string} npcId - The ID of the NPC
     * @returns {string|null} - The cookie value if exists, null otherwise
     */
    getNpcCookie(npcId) {
        return this.statsManager.getNpcCookie(npcId);
    }

    /**
     * Get all NPC cookies
     * @returns {Object} - Object with npcId as key and cookie value as value
     */
    getAllNpcCookies() {
        return this.statsManager.getAllNpcCookies();
    }

    showGameInstructions() {
        // Create modal container
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #000;
            padding: 25px;
            border: 4px solid #fff;
            color: white;
            z-index: 10000;
            max-width: 600px;
            width: 90%;
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
            font-family: 'Press Start 2P', cursive;
            animation: glowBorder 2s infinite alternate;
            position: relative;
            overflow: hidden;
        `;

        // Add content
        modal.innerHTML = `
            <style>
                @keyframes glowBorder {
                    0% { box-shadow: 0 0 5px #fff, inset 0 0 5px #fff; }
                    100% { box-shadow: 0 0 15px #fff, inset 0 0 8px #fff; }
                }
                @keyframes scanline {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100%); }
                }
                @keyframes shine {
                    0% { left: -100%; }
                    100% { left: 100%; }
                }
                .instruction-box {
                    background: rgba(255, 255, 255, 0.1);
                    border: 2px solid #ffb300;
                    margin: 8px 0;
                    padding: 12px;
                    display: flex;
                    align-items: center;
                    font-size: 0.7em;
                    position: relative;
                    overflow: hidden;
                    transition: all 0.3s;
                }
                .instruction-box:hover {
                    transform: translateX(5px);
                    background: rgba(255, 255, 255, 0.15);
                    border-color: #ffd700;
                }
                .instruction-box::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(
                        90deg,
                        transparent,
                        rgba(255, 255, 255, 0.2),
                        transparent
                    );
                    animation: shine 2s infinite;
                }
                .instruction-icon {
                    font-size: 1.2em;
                    margin-right: 15px;
                    color: #ffb300;
                }
                .instruction-label {
                    color: #ffb300;
                    margin-right: 8px;
                }
                .modal-title {
                    font-size: 1.2em;
                    margin-bottom: 20px;
                    text-align: center;
                    color: #ffeb3b;
                    text-shadow: 2px 2px #000;
                    position: relative;
                }
                .button-container {
                    display: flex;
                    justify-content: center;
                    gap: 15px;
                    margin-top: 20px;
                }
                .game-button {
                    background: #000;
                    color: #fff;
                    border: 2px solid #ffb300;
                    padding: 12px 20px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-family: 'Press Start 2P', cursive;
                    font-size: 0.7em;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }
                .game-button:hover {
                    transform: translateY(-2px);
                    border-color: #ffd700;
                    box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
                }
                .game-button::after {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: linear-gradient(
                        45deg,
                        transparent,
                        rgba(255, 255, 255, 0.1),
                        transparent
                    );
                    transform: rotate(45deg);
                    animation: shine 2s infinite;
                }
                .scanline {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 2px;
                    background: rgba(255, 255, 255, 0.1);
                    animation: scanline 2s linear infinite;
                    pointer-events: none;
                }
            </style>
            <div class="scanline"></div>
            <h2 class="modal-title">
                <span style="color: #4CAF50;">⚡</span> HOW TO PLAY <span style="color: #4CAF50;">⚡</span>
            </h2>
            <div class="instruction-box">
                <span class="instruction-icon">🎮</span>
                <span class="instruction-label">Movement:</span>
                <span>WASD or Arrow Keys to move</span>
            </div>
            <div class="instruction-box">
                <span class="instruction-icon">🗣️</span>
                <span class="instruction-label">Interact:</span>
                <span>Press E near NPCs</span>
            </div>
            <div class="instruction-box">
                <span class="instruction-icon">📊</span>
                <span class="instruction-label">Stats:</span>
                <span>Click stats icon (top-right)</span>
            </div>
            <div class="instruction-box">
                <span class="instruction-icon">🎒</span>
                <span class="instruction-label">Inventory:</span>
                <span>Press I to view items</span>
            </div>
            <div class="instruction-box">
                <span class="instruction-icon">💰</span>
                <span class="instruction-label">Goal:</span>
                <span>Learn finance & earn money!</span>
            </div>
            <div class="instruction-box">
                <span class="instruction-icon">❓</span>
                <span class="instruction-label">Help:</span>
                <span>Press H to show this menu</span>
            </div>
            
            <!-- NPC Cookies Section -->
            <div class="instruction-box" style="flex-direction: column; align-items: flex-start;">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <span class="instruction-icon">🍪</span>
                    <span class="instruction-label">NPC Cookies Earned:</span>
                </div>
                <div id="npcCookiesDisplay" style="font-size: 0.6em; line-height: 1.4; color: #fff;">
                    ${this.getNpcCookiesDisplayHTML()}
                </div>
            </div>
            
            <div class="button-container">
                <button class="game-button" id="closeInstructions">GOT IT!</button>
            </div>
        `;

        // Close modal on button click
        modal.querySelector('#closeInstructions').addEventListener('click', () => {
            modal.style.opacity = '0';
            modal.style.transform = 'translate(-50%, -50%) scale(0.95)';
            setTimeout(() => modal.remove(), 500);
        });

        // Add fade-in animation
        modal.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        modal.style.opacity = '0';
        modal.style.transform = 'translate(-50%, -50%) scale(0.95)';
        document.body.appendChild(modal);
        
        // Trigger animation after a short delay
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 100);

        // Add sound effects
        const hoverSound = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU');
        hoverSound.volume = 0.2;

        // Add hover sound effects to instruction boxes and buttons
        const elements = modal.querySelectorAll('.instruction-box, .game-button');
        elements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                hoverSound.currentTime = 0;
                hoverSound.play();
            });
        });
    }

    getNpcCookiesDisplayHTML() {
        const cookies = this.getAllNpcCookies();
        if (Object.keys(cookies).length === 0) {
            return '<span style="color: #999;">No NPC cookies yet! Talk to NPCs to earn cookies.</span>';
        }
        
        return Object.entries(cookies).map(([npcId, reward]) => {
            const emoji = '✅'; // Consistent emoji since all cookies are now "completed"
            return `<span style="color: #4CAF50;">${emoji} ${npcId.replace(/-/g, ' ')}: completed</span>`;
        }).join('<br>');
    }

    initProgressBar() {
        // Create progress bar container
        const progressContainer = document.createElement('div');
        progressContainer.id = 'game-progress-bar';
        progressContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 8px;
            background: rgba(0, 0, 0, 0.8);
            z-index: 9998;
            border-bottom: 2px solid #333;
            backdrop-filter: blur(5px);
        `;

        // Create progress fill
        const progressFill = document.createElement('div');
        progressFill.id = 'game-progress-fill';
        progressFill.style.cssText = `
            height: 100%;
            width: 0%;
            background: linear-gradient(90deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff);
            background-size: 400% 100%;
            animation: progressGradient 3s ease infinite;
            transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        `;

        // Create sparkle overlay
        const sparkleOverlay = document.createElement('div');
        sparkleOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
            animation: sparkleMove 2s linear infinite;
        `;

        // Add progress text
        const progressText = document.createElement('div');
        progressText.id = 'game-progress-text';
        progressText.style.cssText = `
            position: fixed;
            top: 15px;
            left: 20px;
            color: white;
            font-family: 'Press Start 2P', cursive;
            font-size: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            z-index: 9999;
            background: rgba(0,0,0,0.6);
            padding: 5px 10px;
            border-radius: 15px;
            border: 1px solid #333;
            backdrop-filter: blur(5px);
        `;

        // Add CSS animations if not present
        if (!document.getElementById('progress-bar-styles')) {
            const style = document.createElement('style');
            style.id = 'progress-bar-styles';
            style.textContent = `
                @keyframes progressGradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                
                @keyframes sparkleMove {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                
                @keyframes progressPulse {
                    0% { box-shadow: 0 0 5px rgba(255,255,255,0.5); }
                    50% { box-shadow: 0 0 20px rgba(255,255,255,0.8), 0 0 30px rgba(255,255,255,0.4); }
                    100% { box-shadow: 0 0 5px rgba(255,255,255,0.5); }
                }
            `;
            document.head.appendChild(style);
        }

        progressFill.appendChild(sparkleOverlay);
        progressContainer.appendChild(progressFill);
        document.body.appendChild(progressContainer);
        document.body.appendChild(progressText);

        // Initialize progress
        this.updateProgressBar();
    }

    updateProgressBar() {
        const progressFill = document.getElementById('game-progress-fill');
        const progressText = document.getElementById('game-progress-text');
        
        if (!progressFill || !progressText) return;

        // Define the main waypoint NPCs (should match WaypointArrow.js)
        const waypointNpcs = [
            'Stock-NPC',
            'Casino-NPC', 
            'Fidelity',
            'Schwab',
            'Crypto-NPC',
            'Bank-NPC',
            'Market Computer'
        ];

        // Calculate progress based on waypoint NPC cookies only
        const totalNpcs = waypointNpcs.length; // 7 NPCs
        const npcCookies = this.getAllNpcCookies();
        
        // Count only waypoint NPCs that have at least one cookie
        const completedNpcs = waypointNpcs.filter(npcId => npcCookies[npcId]).length;
        const progressPercentage = (completedNpcs / totalNpcs) * 100;

        // Update progress bar
        progressFill.style.width = `${progressPercentage}%`;
        
        // Update text
        progressText.textContent = `Progress: ${completedNpcs}/${totalNpcs} NPCs (${Math.round(progressPercentage)}%)`;

        // Add pulse effect when progress increases
        if (progressPercentage > 0) {
            progressFill.style.animation = 'progressGradient 3s ease infinite, progressPulse 1s ease-out';
            setTimeout(() => {
                progressFill.style.animation = 'progressGradient 3s ease infinite';
            }, 1000);
        }

        // Special effect when completed
        if (completedNpcs === totalNpcs) {
            progressText.textContent = '🎉 QUEST COMPLETE! 🎉';
            progressText.style.color = '#ffd700';
            progressFill.style.background = 'linear-gradient(90deg, #ffd700, #ffeb3b, #ffd700)';
            this.showCompletionCelebration();
        }
    }

    showCompletionCelebration() {
        // Create massive celebration effect
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                this.createCelebrationFirework();
            }, i * 100);
        }
    }

    createCelebrationFirework() {
        const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd'];
        const particles = [];
        const particleCount = 20;
        
        // Random position on screen
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight * 0.6; // Upper part of screen
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                width: 8px;
                height: 8px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                border-radius: 50%;
                pointer-events: none;
                z-index: 10001;
                box-shadow: 0 0 10px currentColor;
            `;
            
            document.body.appendChild(particle);
            particles.push(particle);
            
            // Animate particle
            const angle = (Math.PI * 2 * i) / particleCount;
            const distance = 100 + Math.random() * 150;
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
                    offset: 0.1
                },
                {
                    transform: `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px)) scale(0.5)`,
                    opacity: 0.5,
                    offset: 0.8
                },
                {
                    transform: `translate(calc(-50% + ${deltaX * 1.2}px), calc(-50% + ${deltaY * 1.2}px)) scale(0)`,
                    opacity: 0
                }
            ], {
                duration: 2000 + Math.random() * 1000,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            });
        }
        
        // Clean up particles
        setTimeout(() => {
            particles.forEach(particle => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            });
        }, 3000);
    }

    initAudioToggle() {
        // Check for existing audio preference
        const isAudioEnabled = localStorage.getItem('gameAudioEnabled') !== 'false';
        
        // Create audio toggle button container
        const audioToggleContainer = document.createElement('div');
        audioToggleContainer.id = 'audio-toggle-container';
        audioToggleContainer.style.cssText = `
            position: fixed;
            top: 120px;
            left: 20px;
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        
        // Create the toggle button
        const audioButton = document.createElement('button');
        audioButton.id = 'audio-toggle-button';
        audioButton.innerHTML = isAudioEnabled ? '🔊' : '🔇';
        audioButton.title = isAudioEnabled ? 'Click to mute audio' : 'Click to enable audio';
        audioButton.style.cssText = `
            background: #000;
            border: 2px solid #fff;
            color: #fff;
            padding: 12px 15px;
            cursor: pointer;
            font-family: 'Press Start 2P', cursive;
            font-size: 18px;
            border-radius: 4px;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
            animation: glowBorder 2s infinite alternate;
        `;
        
        // Add label
        const audioLabel = document.createElement('span');
        audioLabel.style.cssText = `
            color: #fff;
            font-family: 'Press Start 2P', cursive;
            font-size: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            opacity: 0.8;
        `;
        audioLabel.textContent = isAudioEnabled ? 'AUDIO ON' : 'AUDIO OFF';
        
        // Add click functionality
        audioButton.addEventListener('click', () => {
            const currentState = localStorage.getItem('gameAudioEnabled') !== 'false';
            const newState = !currentState;
            
            // Update localStorage
            localStorage.setItem('gameAudioEnabled', newState.toString());
            
            // Update button appearance
            audioButton.innerHTML = newState ? '🔊' : '🔇';
            audioButton.title = newState ? 'Click to mute audio' : 'Click to enable audio';
            audioLabel.textContent = newState ? 'AUDIO ON' : 'AUDIO OFF';
            
            // Update global audio state
            window.gameAudioEnabled = newState;
            
            // Play a confirmation sound if audio is being enabled
            if (newState) {
                this.playConfirmationSound();
            }
            
            // Show brief feedback
            this.showAudioToggleFeedback(newState);
        });
        
        // Add hover effects
        audioButton.addEventListener('mouseenter', () => {
            audioButton.style.transform = 'scale(1.05)';
            audioButton.style.borderColor = '#ffd700';
            audioButton.style.boxShadow = '0 0 15px rgba(255, 215, 0, 0.5)';
        });
        
        audioButton.addEventListener('mouseleave', () => {
            audioButton.style.transform = 'scale(1)';
            audioButton.style.borderColor = '#fff';
            audioButton.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.3)';
        });
        
        // Assemble and add to page
        audioToggleContainer.appendChild(audioButton);
        audioToggleContainer.appendChild(audioLabel);
        document.body.appendChild(audioToggleContainer);
        
        // Set global audio state
        window.gameAudioEnabled = isAudioEnabled;
        
        // Add CSS for animations if not present
        if (!document.getElementById('audio-toggle-styles')) {
            const style = document.createElement('style');
            style.id = 'audio-toggle-styles';
            style.textContent = `
                @keyframes audioFeedback {
                    0% { transform: scale(1) rotate(0deg); }
                    25% { transform: scale(1.1) rotate(-5deg); }
                    50% { transform: scale(1.2) rotate(5deg); }
                    75% { transform: scale(1.1) rotate(-2deg); }
                    100% { transform: scale(1) rotate(0deg); }
                }
                
                .audio-feedback {
                    animation: audioFeedback 0.5s ease-out;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    playConfirmationSound() {
        // Play a brief confirmation beep when audio is enabled
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.1);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (e) {
            console.log("Confirmation sound error:", e);
        }
    }
    
    showAudioToggleFeedback(isEnabled) {
        // Show visual feedback when audio is toggled
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: ${isEnabled ? '#4CAF50' : '#f44336'};
            padding: 20px 30px;
            border: 2px solid ${isEnabled ? '#4CAF50' : '#f44336'};
            border-radius: 8px;
            font-family: 'Press Start 2P', cursive;
            font-size: 12px;
            z-index: 10001;
            pointer-events: none;
            animation: audioFeedback 0.5s ease-out;
            box-shadow: 0 0 20px rgba(${isEnabled ? '76, 175, 80' : '244, 67, 54'}, 0.5);
        `;
        feedback.textContent = isEnabled ? '🔊 AUDIO ENABLED' : '🔇 AUDIO DISABLED';
        
        document.body.appendChild(feedback);
        
        // Remove feedback after animation
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 1000);
    }
}

export default Game;