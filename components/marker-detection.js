// marker-detection.js - Facade component that maintains the same public API
// All external references to scene.components['marker-detection'] will continue to work

AFRAME.registerComponent('marker-detection', {
    init: function() {
        // Initialize internal modules
        this.core = new MarkerCore(this);
        this.display = new MarkerDisplay(this);
        
        // Set currentMarker property on the instance
        Object.defineProperty(this, 'currentMarker', {
            get: () => this.core ? this.core.currentMarker : null,
            set: (val) => { if (this.core) this.core.currentMarker = val; }
        });
        
        // Set up event listeners
        this.el.sceneEl.addEventListener('markers-created', () => {
            document.querySelectorAll('a-marker').forEach(marker => {
                marker.addEventListener('markerFound', () => this.core.onMarkerFound(marker));
                marker.addEventListener('markerLost', () => this.core.onMarkerLost(marker));
            });
        });
    },

    // Public methods - these maintain the exact same API as before
    playContentAudio: function(audioSrc) {
        return this.core ? this.core.playContentAudio(audioSrc) : null;
    },

    playAudio: function(markerValue, url) {
        return this.core ? this.core.playAudio(markerValue, url) : null;
    },

    // Display methods
    showLeftPieceContent: function(content, markerValue, scene) {
        return this.display ? this.display.showLeftPieceContent(content, markerValue, scene) : null;
    },

    showRightPieceContent: function(content, markerValue, scene) {
        return this.display ? this.display.showRightPieceContent(content, markerValue, scene) : null;
    },

    updateLeftPieceControls: function(content, markerValue) {
        return this.display ? this.display.updateLeftPieceControls(content, markerValue) : null;
    },

    updateRightPieceControls: function(content, markerValue) {
        return this.display ? this.display.updateRightPieceControls(content, markerValue) : null;
    },

    hideLeftPieceControls: function() {
        return this.display ? this.display.hideLeftPieceControls() : null;
    },

    hideRightPieceControls: function() {
        return this.display ? this.display.hideRightPieceControls() : null;
    },

    showImage: function(src, markerValue, scene) {
        return this.display ? this.display.showImage(src, markerValue, scene) : null;
    },

    showVideo: function(src, markerValue, scene) {
        return this.display ? this.display.showVideo(src, markerValue, scene) : null;
    },

    show3DModel: function(src, markerValue, scene) {
        return this.display ? this.display.show3DModel(src, markerValue, scene) : null;
    },

    updateGridVisibility: function(markerValue, contentManager) {
        return this.display ? this.display.updateGridVisibility(markerValue, contentManager) : null;
    },

    updateNavigationVisibility: function(marker, markerValue, contentManager) {
        return this.display ? this.display.updateNavigationVisibility(marker, markerValue, contentManager) : null;
    },

    // Keep original methods that were directly on the component
    setupVideoControls: function() {
        return this.core ? this.core.setupVideoControls() : null;
    },

    controlVideo: function(action, video) {
        return this.core ? this.core.controlVideo(action, video) : null;
    },

    // For backward compatibility - if any code calls these directly
    onMarkerFound: function(marker) {
        return this.core ? this.core.onMarkerFound(marker) : null;
    },

    onMarkerLost: function(marker) {
        return this.core ? this.core.onMarkerLost(marker) : null;
    },

    loadMarkerContent: function(value, scene, contentManager) {
        return this.display ? this.display.loadMarkerContent(value, scene, contentManager) : null;
    },

    showMarkerImage: function(markerValue, markerElement, scene) {
        return this.display ? this.display.showMarkerImage(markerValue, markerElement, scene) : null;
    },

    showSideContent: function(side, content, markerValue, scene) {
        return this.display ? this.display.showSideContent(side, content, markerValue, scene) : null;
    },

    updateSurroundContent: function(markerValue, surroundSrc) {
        return this.display ? this.display.updateSurroundContent(markerValue, surroundSrc) : null;
    },

    loadImage: function(content, imgEl, baseSize) {
        return this.display ? this.display.loadImage(content, imgEl, baseSize) : null;
    },

    loadVideo: function(content, videoEl, baseSize) {
        return this.display ? this.display.loadVideo(content, videoEl, baseSize) : null;
    },

    loadModel: function(content, modelEl) {
        return this.display ? this.display.loadModel(content, modelEl) : null;
    },

    loadMarkerImage: function(item, imgEl, markerValue) {
        return this.display ? this.display.loadMarkerImage(item, imgEl, markerValue) : null;
    },

    loadMarkerVideo: function(item, videoEl, markerValue) {
        return this.display ? this.display.loadMarkerVideo(item, videoEl, markerValue) : null;
    },

    loadMarkerModel: function(item, modelEl, markerValue) {
        return this.display ? this.display.loadMarkerModel(item, modelEl, markerValue) : null;
    },

    remove: function() {
        // Clean up if needed
    }
});