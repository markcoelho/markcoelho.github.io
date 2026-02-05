// marker-detection-handler.js
// Handles what happens when markers are detected/lost by the camera
AFRAME.registerComponent('marker-detection-handler', {
    init: function() {
        this.audioElements = {};        // Audio objects cache per marker
        this.currentPlayingAudio = null; // Currently playing audio
        this.outsideCamera = document.getElementById('outsidecamera'); // Main image
        this.centerpiece = document.getElementById('centerpiece');     // Content container
        this.camera = document.querySelector('a-camera');             // User's camera
        this.navigationPlane = document.getElementById('navigation'); // Control panel
        
        // Add event listeners to ALL markers
        document.querySelectorAll('a-marker').forEach(marker => {
            marker.addEventListener('markerFound', () => this.onMarkerFound(marker));
            marker.addEventListener('markerLost', () => this.onMarkerLost(marker));
        });
    },
    
    // Called when a marker appears in camera view
    onMarkerFound: function(marker) {
        const value = marker.getAttribute('value'); // Marker ID (0-9)
        
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
        
        // UPDATE IMAGE: Change to this marker's image (if needed)
        if (this.outsideCamera && contentManager) {
            const content = contentManager.getCurrentContentForMarker(value);
            if (content?.type === 'image') {
                const imageController = scene.components['image-position-controller'];
                if (imageController) {
                    // Check if we're already showing this marker's image
                    const currentSrc = this.outsideCamera.getAttribute('src');
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
            this.positionBetweenCameraAndMarker(marker);
        }
    },
    
    // Called when marker disappears from camera view
    onMarkerLost: function(marker) {
        // Nothing to hide - controls stay visible
    },
    
    // Show/hide controls based on current content settings
    updateNavigationVisibility: function(marker, markerValue, contentManager) {
        // Check JSON settings for current content
        const scrollingEnabled = contentManager?.isScrollingEnabledForCurrentContent(markerValue);
        const zoomEnabled = contentManager?.isZoomingEnabledForCurrentContent(markerValue);
        
        // Navigation panel visible if ANY controls are enabled
        const navigationVisible = scrollingEnabled || zoomEnabled;
        
        // Show/hide navigation panel
        if (this.navigationPlane) {
            this.navigationPlane.setAttribute('visible', navigationVisible.toString());
        }
        
        // IMAGE GRID: Show 3x3 image selector only if marker has multiple images
        const hasMultiple = contentManager?.contentSequences?.[markerValue]?.length > 1;
        if (marker._imageGrid) {
            marker._imageGrid.setAttribute('visible', hasMultiple.toString());
            
            // Also hide/show individual grid images
            const gridImages = marker._imageGrid.querySelectorAll('.image-grid-item');
            gridImages.forEach(img => {
                img.setAttribute('visible', hasMultiple.toString());
            });
        }
        
        // Show/hide ZOOM buttons
        const zoomButtons = document.querySelectorAll('.zoom-button');
        zoomButtons.forEach(btn => {
            btn.setAttribute('visible', zoomEnabled?.toString() || 'false');
        });
        
        // Show/hide SCROLL arrows
        const scrollButtons = document.querySelectorAll('.scroller');
        scrollButtons.forEach(btn => {
            btn.setAttribute('visible', scrollingEnabled?.toString() || 'false');
        });
        
        // Reset button visible when ANY controls are visible
        const resetButton = document.getElementById('reset');
        if (resetButton) {
            resetButton.setAttribute('visible', navigationVisible.toString());
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
    },
    
    // Position content panel between camera and marker
    positionBetweenCameraAndMarker: function(marker) {
        // Helper: get 3D position of any entity
        const getPos = (entity) => {
            const pos = new THREE.Vector3();
            entity.object3D.getWorldPosition(pos);
            return pos;
        };
        
        const markerPos = getPos(marker);   // Marker position
        const cameraPos = getPos(this.camera); // Camera position
        
        // Use only X and Z coordinates (ignore height/Y)
        const markerXZ = new THREE.Vector3(markerPos.x, 0, markerPos.z);
        const cameraXZ = new THREE.Vector3(cameraPos.x, 0, cameraPos.z);
        
        // Calculate direction from camera to marker
        const direction = new THREE.Vector3().subVectors(markerXZ, cameraXZ).normalize();
        // Position panel 5 units from marker toward camera
        const centerPos = new THREE.Vector3().copy(markerXZ).add(direction.multiplyScalar(5));
        
        // Calculate rotation to face camera
        const lookDir = new THREE.Vector3().subVectors(cameraXZ, centerPos).normalize();
        const yRot = THREE.Math.radToDeg(Math.atan2(lookDir.x, lookDir.z));
        
        // Apply position and rotation
        this.centerpiece.setAttribute('position', { x: centerPos.x, y: 0, z: centerPos.z });
        this.centerpiece.setAttribute('rotation', { x: 0, y: yRot, z: 0 });
    }
});