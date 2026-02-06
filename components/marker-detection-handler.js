// marker-detection-handler.js
// Handles what happens when markers are detected/lost by the camera
AFRAME.registerComponent('marker-detection-handler', {
    init: function() {
        this.audioElements = {};        // Audio objects cache per marker
        this.currentPlayingAudio = null; // Currently playing audio
        this.centerImage = getId('centerImage'); // Main image
        this.centerpiece = getId('centerpiece');     // Content container
        this.camera = document.querySelector('a-camera');             // User's camera
        this.navigationPlane = getId('navigation'); // Control panel
        
        // Wait for markers to be created dynamically
        this.el.sceneEl.addEventListener('markers-created', () => {
            this.setupMarkerEventListeners();
        });
    },
    
    // Setup event listeners AFTER markers are created
    setupMarkerEventListeners: function() {
        document.querySelectorAll('a-marker').forEach(marker => {
            marker.addEventListener('markerFound', () => this.onMarkerFound(marker));
            marker.addEventListener('markerLost', () => this.onMarkerLost(marker));
        });
    },
    
    // Called when a marker appears in camera view
    onMarkerFound: function(marker) {
        const value = marker.getAttribute('value'); // Marker ID (0-9)
        
        console.log(`Marker ${value} found, positioning centerpiece...`);
        
        // AUDIO: Stop any currently playing audio
        if (this.currentPlayingAudio) {
            this.currentPlayingAudio.pause();
            this.currentPlayingAudio.currentTime = 0; // Rewind to start
        }
        
        const scene = this.el.sceneEl;
        const contentManager = scene.components['marker-content-manager'];
        
        // Play narration audio if this marker has one
        if (contentManager?.narrations?.[value]) {
            this.playAudio(value, contentManager.narrations[value]);
        }
        
        // Show/hide controls based on this marker's content settings
        this.updateNavigationVisibility(marker, value, contentManager);
        
        //Show/hide image grid based on number of images
        this.updateGridVisibility(value, contentManager);
        
        // UPDATE IMAGE: Change to this marker's image (if needed)
        if (this.centerImage && contentManager) {
            const content = contentManager.getMarkerContent(value);
            if (content?.type === 'image') {
                const imageController = scene.components['image-position-controller'];
                if (imageController) {
                    // Check if we're already showing this marker's image
                    const currentSrc = this.centerImage.getAttribute('src');
                    if (currentSrc !== content.value) {
                        // Only change image if it's different
                        // Use 'marker' mode: preserves user's zoom/position settings
                        imageController.setupImage(content.value, value, 'marker');
                    }
                    // If same image: keep current zoom/position (don't reset)
                }
            }
        }
        
        // Position content between camera and marker
        if (this.centerpiece && this.camera) {
            console.log('Calling positionBetweenCameraAndMarker...');
            positionBetweenCameraAndMarker(this.camera, marker, this.centerpiece);
        }
    },
    
    //Update image grid visibility based on number of images
    updateGridVisibility: function(markerValue, contentManager) {
        const navUI = this.el.sceneEl.components['marker-navigation-ui'];
        if (!navUI) return;
        
        // Check if marker has more than one image
        const hasMultipleImages = navUI.hasMultipleImages(markerValue);
        
        // Set grid visibility based on image count
        navUI.setGridVisibility(markerValue, hasMultipleImages);
    },
    
    // Called when marker disappears from camera view
    onMarkerLost: function(marker) {
        // Nothing to hide - controls stay visible
    },
    
    // Show/hide controls based on current content settings
    updateNavigationVisibility: function(markerValue, contentManager) {
        const marker = document.querySelector(`a-marker[value="${markerValue}"]`);
        if (!marker) return;
        
        const detectionHandler = this.scene.components['marker-detection-handler'];
        // Try to use detection handler's method first
        if (detectionHandler && detectionHandler.updateNavigationVisibility) {
            detectionHandler.updateNavigationVisibility(marker, markerValue, contentManager);
        }
    },
    
    // Play narration audio for a marker
    playAudio: function(markerValue, url) {
        // Create audio object if first time for this marker
        if (!this.audioElements[markerValue]) {
            this.audioElements[markerValue] = new Audio(url);
            this.audioElements[markerValue].preload = 'auto'; // Preload audio
        }
        
        // Play the audio
        this.currentPlayingAudio = this.audioElements[markerValue];
        this.currentPlayingAudio.currentTime = 0; // Start from beginning
        // Note: audio.play() would normally go here
    }
});