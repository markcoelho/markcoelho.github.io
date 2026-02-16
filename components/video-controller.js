// video-controller.js - Handles all video playback controls for center, left, right, and marker videos

AFRAME.registerComponent('video-controller', {
    schema: {
        skipSeconds: { default: 10 } // Number of seconds to skip when using fast forward/backward
    },

    init: function() {
        this.videoElements = {
            center: document.getElementById('centerVideo'),
            left: document.getElementById('leftVideo'),
            right: document.getElementById('rightVideo')
        };
        
        this.currentMarker = null;
        this.audioElements = {};
        this.currentPlayingAudio = null;
        
        this.setupVideoControls();
        this.setupMarkerVideoObserver();
    },

    // Setup event listeners for all video controls
    setupVideoControls: function() {
        // Center video controls
        this.setupButtonListeners('restart', 'center');
        this.setupButtonListeners('mute', 'center');
        this.setupButtonListeners('fast-backward', 'center');
        this.setupButtonListeners('fast-forward', 'center');
        
        // Left video controls
        this.setupButtonListeners('left-restart', 'left');
        this.setupButtonListeners('left-mute', 'left');
        this.setupButtonListeners('left-fast-backward', 'left');
        this.setupButtonListeners('left-fast-forward', 'left');
        
        // Right video controls
        this.setupButtonListeners('right-restart', 'right');
        this.setupButtonListeners('right-mute', 'right');
        this.setupButtonListeners('right-fast-backward', 'right');
        this.setupButtonListeners('right-fast-forward', 'right');
        
        // Also listen for click events (gaze interactions)
        this.setupGazeListeners();
    },

    setupButtonListeners: function(className, target) {
        const buttons = document.querySelectorAll(`.${className}`);
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleVideoAction(this.getActionFromClass(className), target);
            });
        });
    },

    setupGazeListeners: function() {
        // For gaze interactions, we'll rely on the gaze-interaction-handler
        // and listen for custom events that component might emit
        document.addEventListener('video-action', (event) => {
            const { action, target } = event.detail;
            this.handleVideoAction(action, target);
        });
    },

    // Get action type from button class
    getActionFromClass: function(className) {
        if (className.includes('restart')) return 'restart';
        if (className.includes('mute')) return 'mute';
        if (className.includes('fast-backward')) return 'backward';
        if (className.includes('fast-forward')) return 'forward';
        return null;
    },

    // Main handler for video actions
    handleVideoAction: function(action, target, markerValue = null) {
        let videoElement;
        
        if (target === 'marker' && markerValue) {
            videoElement = document.querySelector(`#marker-${markerValue}-container #marker-${markerValue}-video`);
        } else {
            videoElement = this.videoElements[target];
        }
        
        if (!videoElement || !videoElement.getAttribute('visible')) {
            console.log(`Video ${target} not visible or not found`);
            return;
        }
        
        try {
            const material = videoElement.components?.material?.material;
            if (!material?.map?.image) {
                console.log(`No video source found for ${target}`);
                return;
            }
            
            const video = material.map.image;
            
            switch(action) {
                case 'restart':
                    this.restartVideo(video, target);
                    break;
                case 'mute':
                case 'unmute':
                    this.toggleMute(video, target);
                    break;
                case 'backward':
                    this.skipVideo(video, -this.data.skipSeconds, target);
                    break;
                case 'forward':
                    this.skipVideo(video, this.data.skipSeconds, target);
                    break;
            }
        } catch (e) {
            console.warn(`Could not ${action} ${target} video:`, e);
        }
    },

    // Restart video
    restartVideo: function(video, target) {
        video.currentTime = 0;
        video.play().catch(e => {
            console.warn(`Could not play ${target} video:`, e);
        });
        console.log(`${target} video restarted`);
    },

    // Toggle mute/unmute
    toggleMute: function(video, target) {
        video.muted = !video.muted;
        const isMuted = video.muted;
        
        // Update button icon if needed
        this.updateMuteButtonIcon(target, isMuted);
        
        console.log(`${target} video ${isMuted ? 'muted' : 'unmuted'}`);
    },

    // Skip forward or backward
    skipVideo: function(video, seconds, target) {
        const newTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
        video.currentTime = newTime;
        console.log(`${target} video ${seconds > 0 ? 'forward' : 'backward'} to ${newTime.toFixed(1)}s`);
    },

    // Update mute button icon based on state
    updateMuteButtonIcon: function(target, isMuted) {
        const iconPath = isMuted ? 'assets/icons/unmute.png' : 'assets/icons/mute.png';
        
        // Update all mute buttons for this target
        let selector;
        if (target === 'center') {
            selector = '.mute';
        } else if (target === 'left') {
            selector = '.left-mute';
        } else if (target === 'right') {
            selector = '.right-mute';
        } else if (target === 'marker') {
            selector = '.marker-mute';
        } else {
            return;
        }
        
        document.querySelectorAll(selector).forEach(btn => {
            btn.setAttribute('src', iconPath);
        });
    },

    // Audio playback for content
    playContentAudio: function(audioSrc) {
        if (this.currentPlayingAudio) {
            this.currentPlayingAudio.pause();
            this.currentPlayingAudio.currentTime = 0;
        }
        
        if (!audioSrc) return;
        
        if (!this.audioElements[audioSrc]) {
            this.audioElements[audioSrc] = new Audio(audioSrc);
            this.audioElements[audioSrc].preload = 'auto';
        }
        
        this.currentPlayingAudio = this.audioElements[audioSrc];
        this.currentPlayingAudio.currentTime = 0;
        this.currentPlayingAudio.play().catch(e => {
            console.warn("Could not play audio:", e);
        });
    },

    // Stop current audio
    stopCurrentAudio: function() {
        if (this.currentPlayingAudio) {
            this.currentPlayingAudio.pause();
            this.currentPlayingAudio.currentTime = 0;
            this.currentPlayingAudio = null;
        }
    },

    // Pause all videos (useful when marker is lost)
    pauseAllVideos: function() {
        Object.values(this.videoElements).forEach(videoEl => {
            if (videoEl && videoEl.getAttribute('visible')) {
                this.pauseVideo(videoEl);
            }
        });
    },

    // Pause a specific video
    pauseVideo: function(videoElement) {
        if (!videoElement) return;
        try {
            const material = videoElement.components?.material?.material;
            if (material?.map?.image) {
                material.map.image.pause();
            }
        } catch (e) {
            console.warn('Could not pause video:', e);
        }
    },

    // Play a specific video
    playVideo: function(videoElement) {
        if (!videoElement) return;
        try {
            const material = videoElement.components?.material?.material;
            if (material?.map?.image) {
                return material.map.image.play();
            }
        } catch (e) {
            console.warn('Could not play video:', e);
        }
    },

    // Setup observer for dynamically added marker videos
    setupMarkerVideoObserver: function() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        // Check for marker video elements
                        if (node.classList && node.classList.contains('marker-video')) {
                            this.setupMarkerVideo(node);
                        }
                        // Check for marker video controls
                        if (node.id && node.id.includes('video-controls')) {
                            this.setupMarkerVideoControls(node);
                        }
                    }
                });
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    },

    // Setup individual marker video
    setupMarkerVideo: function(videoEl) {
        // Extract marker value from ID
        const id = videoEl.id;
        const markerValue = id.replace('marker-', '').replace('-video', '');
        
        // Add any marker-specific video setup here
        console.log(`Marker video setup for ${markerValue}`);
    },

    // Setup marker video controls
    setupMarkerVideoControls: function(controlsEl) {
        // Extract marker value from ID
        const id = controlsEl.id;
        const markerValue = id.replace('marker-', '').replace('-video-controls', '');
        
        // Setup restart button
        const restartBtn = controlsEl.querySelector('.marker-restart');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.handleVideoAction('restart', 'marker', markerValue);
            });
        }
        
        // Setup mute button
        const muteBtn = controlsEl.querySelector('.marker-mute');
        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                this.handleVideoAction('mute', 'marker', markerValue);
            });
        }
        
        // Setup fast backward button
        const backwardBtn = controlsEl.querySelector('.marker-fast-backward');
        if (backwardBtn) {
            backwardBtn.addEventListener('click', () => {
                this.handleVideoAction('backward', 'marker', markerValue);
            });
        }
        
        // Setup fast forward button
        const forwardBtn = controlsEl.querySelector('.marker-fast-forward');
        if (forwardBtn) {
            forwardBtn.addEventListener('click', () => {
                this.handleVideoAction('forward', 'marker', markerValue);
            });
        }
    },

    // Clean up
    remove: function() {
        this.pauseAllVideos();
        this.stopCurrentAudio();
        
        // Clear audio elements
        Object.keys(this.audioElements).forEach(key => {
            this.audioElements[key].pause();
            this.audioElements[key].src = '';
        });
        this.audioElements = {};
    }
});