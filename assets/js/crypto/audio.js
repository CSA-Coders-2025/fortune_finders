// Audio manager for crypto mining interface
class AudioManager {
    constructor() {
        // Get base URL from data attribute or default to root
        const baseUrl = document.documentElement.getAttribute('data-base-url') || '';
        
        // Direct paths to sound files
        this.sounds = {
            miningStart: new Audio(`${baseUrl}/assets/sounds/crypto/mining_start.mp3`),
            miningStop: new Audio(`${baseUrl}/assets/sounds/crypto/mining_stop.mp3`),
            reward: new Audio(`${baseUrl}/assets/sounds/crypto/reward.mp3`),
            click: new Audio(`${baseUrl}/assets/sounds/crypto/click.mp3`),
            bgm: new Audio(`${baseUrl}/assets/sounds/crypto/mining_bgm.mp3`)
        };

        // Configure BGM
        this.sounds.bgm.loop = true;
        this.sounds.bgm.volume = 0.3;

        // Configure other sounds with adjusted volumes
        this.sounds.miningStart.volume = 0.8; // Increased volume for mining start
        this.sounds.miningStop.volume = 0.5;
        this.sounds.reward.volume = 0.6;
        this.sounds.click.volume = 0.4;

        // Initialize audio state
        this.isMuted = localStorage.getItem('cryptoAudioMuted') === 'true';
        this.isBGMPlaying = false;
        this.bgmInitialized = false;

        // Update volume icon based on initial mute state
        this.updateVolumeIcon();

        // Add click event listener to initialize BGM on first user interaction
        document.addEventListener('click', () => {
            if (!this.bgmInitialized && !this.isMuted) {
                this.sounds.bgm.play().then(() => {
                    this.isBGMPlaying = true;
                    this.bgmInitialized = true;
                }).catch(error => {
                    console.warn('Error playing BGM on first interaction:', error);
                });
            }
        }, { once: true });

        // Log audio initialization
        console.log('Audio files initialized:', {
            miningStart: this.sounds.miningStart.src,
            miningStop: this.sounds.miningStop.src,
            reward: this.sounds.reward.src,
            click: this.sounds.click.src,
            bgm: this.sounds.bgm.src
        });
    }

    // Play a sound effect
    play(soundName) {
        if (this.isMuted) return;
        
        const sound = this.sounds[soundName];
        if (sound) {
            // Create a new instance of the audio for each play to prevent interruption
            const soundInstance = new Audio(sound.src);
            soundInstance.volume = sound.volume;
            soundInstance.play().catch(error => {
                console.warn(`Error playing sound ${soundName}:`, error);
            });
        }
    }

    // Toggle BGM
    toggleBGM() {
        if (this.isMuted) return;

        if (this.isBGMPlaying) {
            this.sounds.bgm.pause();
            this.isBGMPlaying = false;
        } else {
            this.sounds.bgm.play().catch(error => {
                console.warn('Error playing BGM:', error);
            });
            this.isBGMPlaying = true;
        }
    }

    // Toggle mute state
    toggleMute() {
        this.isMuted = !this.isMuted;
        localStorage.setItem('cryptoAudioMuted', this.isMuted);

        if (this.isMuted) {
            this.sounds.bgm.pause();
            this.isBGMPlaying = false;
        } else if (this.isBGMPlaying) {
            this.sounds.bgm.play().catch(error => {
                console.warn('Error playing BGM:', error);
            });
        }

        // Update volume icon
        this.updateVolumeIcon();
    }

    // Update volume icon based on mute state
    updateVolumeIcon() {
        const volumeIcon = document.getElementById('volume-icon');
        if (volumeIcon) {
            volumeIcon.textContent = this.isMuted ? '🔇' : '🔊';
        }
    }

    // Stop all sounds
    stopAll() {
        Object.values(this.sounds).forEach(sound => {
            sound.pause();
            sound.currentTime = 0;
        });
        this.isBGMPlaying = false;
    }
}

// Create global audio manager instance
window.audioManager = new AudioManager();

// Export for module usage
export default window.audioManager;