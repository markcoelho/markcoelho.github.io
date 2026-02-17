// marker-core.js - Internal marker detection and tracking module
// This is NOT an AFRAME component - it's used internally by marker-detection.js

class MarkerCore {
    constructor(component) {
        this.component = component;
        this.audioElements = {};
        this.currentPlayingAudio = null;
        this.centerImage = getId('centerImage');
        this.centerpiece = getId('centerpiece');
        this.camera = document.querySelector('a-camera');
        this.currentMarker = null;
        
        this.setupVideoControls();
    }

    setupVideoControls() {
        const setupButton = (btnId, callback) => {
            const btn = getId(btnId);
            if (btn) btn.addEventListener('click', callback);
        };
        
        setupButton('restart', () => this.controlVideo('restart'));
        setupButton('mute', () => this.controlVideo('mute'));
    }

    controlVideo(action, video = getId('centerVideo')) {
        if (!video) return;
        try {
            const img = video.components?.material?.material?.map?.image;
            if (!img) return;
            
            if (action === 'restart') {
                img.currentTime = 0;
                img.play();
            } else if (action === 'mute') {
                img.muted = !img.muted;
                const muteBtn = getId('mute');
                if (muteBtn) muteBtn.setAttribute('src', `assets/icons/${img.muted ? 'unmute' : 'mute'}.png`);
            }
        } catch (e) { console.warn(`Could not ${action} video:`, e); }
    }

    playContentAudio(audioSrc) {
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
        this.currentPlayingAudio.play().catch(e => console.warn("Could not play audio:", e));
    }

    onMarkerFound(marker) {
        const value = marker.getAttribute('value');
        const isNewMarker = this.currentMarker !== value;
        this.currentMarker = value;
        
        if (this.currentPlayingAudio) this.currentPlayingAudio.pause();
        
        const scene = this.component.el.sceneEl;
        const contentManager = scene.components['content-manager'];
        
        if (contentManager?.narrations?.[value]) {
            this.playAudio(value, contentManager.narrations[value]);
        }
        
        if (this.centerpiece && this.camera) {
            positionBetweenCameraAndMarker(this.camera, marker, this.centerpiece);
        }
        
        if (isNewMarker) {
            this.component.display.loadMarkerContent(value, scene, contentManager);
        } else {
            this.component.display.updateGridVisibility(value, contentManager);
        }
    }

    onMarkerLost(marker) {
        const value = marker.getAttribute('value');
        const markerVideo = document.querySelector(`#marker-${value}-video`);
        if (markerVideo) pauseVideo(markerVideo);
    }

    playAudio(markerValue, url) {
        if (!this.audioElements[markerValue]) {
            this.audioElements[markerValue] = new Audio(url);
            this.audioElements[markerValue].preload = 'auto';
        }
        this.currentPlayingAudio = this.audioElements[markerValue];
        this.currentPlayingAudio.currentTime = 0;
        this.currentPlayingAudio.play();
    }
}