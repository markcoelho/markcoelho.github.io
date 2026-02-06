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
        
        // UPDATE MEDIA: Change to this marker's image or video
        if (contentManager) {
            const content = contentManager.getMarkerContent(value);
            if (content) {
                if (content.type === 'image') {
                    // Handle image
                    this.showImage(content.value, value, scene);
                } else if (content.type === 'video') {
                    // Handle video
                    
                    this.showVideo(content.value, value, scene);
                }
            }
        }
        
        // Position content between camera and marker
        if (this.centerpiece && this.camera) {
            console.log('Calling positionBetweenCameraAndMarker...');
            positionBetweenCameraAndMarker(this.camera, marker, this.centerpiece);
        }
    },

    showImage: function(src, markerValue, scene) {
        const centerImage = getId('centerImage');
        const centerVideo = getId('centerVideo');
        
        // Show image, hide video
        centerImage.setVisible();
        centerVideo.setInvisible();
        
        // Check if we're already showing this image
        const currentSrc = centerImage.getAttribute('src');
        if (currentSrc !== src) {
            const imageController = scene.components['image-position-controller'];
            if (imageController) {
                // Use 'marker' mode: preserves user's zoom/position settings
                imageController.setupImage(src, markerValue, 'marker');
            }
        }
    },

    showVideo: function(src, markerValue, scene) {
        const centerImage = getId('centerImage');
        const centerVideo = getId('centerVideo');
        
        // Show video, hide image
        centerImage.setInvisible();
        centerVideo.setVisible();
        
        // Set video source (won't autoplay)
        centerVideo.setAttribute('src', src);
        
        // Set video to 16:9 aspect ratio (simple scaling)
        centerVideo.setAttribute('width', 3 * 16/9); // width = 3 * (16/9)
        centerVideo.setAttribute('height', 3); // height = 3
        centerVideo.setAttribute('scale', { x: 1, y: 1, z: 1 });
        
        // Position video at center
        centerVideo.setAttribute('position', { x: 0, y: 0, z: 0 });
    },
    
    //Update image grid visibility based on number of images
    // marker-detection-handler.js
    updateGridVisibility: function(markerValue, contentManager) {
        const navUI = this.el.sceneEl.components['marker-navigation-ui'];
        if (!navUI) return;
        
        // Check if marker has more than one image OR video
        const hasMultipleMedia = navUI.hasMultipleImages(markerValue);
        
        // Set grid visibility based on media count
        navUI.setGridVisibility(markerValue, hasMultipleMedia);
    },
    
    // Called when marker disappears from camera view
    onMarkerLost: function(marker) {
        // Nothing to hide - controls stay visible
    },
    
    // Show/hide controls based on current content settings
    updateNavigationVisibility: function(marker, markerValue, contentManager) {
        const content = contentManager?.getMarkerContent(markerValue);
        const navigationPlane = getId('navigation');
        
        if (navigationPlane) {
            // Always hide controls for videos
            if (content?.type === 'video') {
                navigationPlane.setInvisible();
                // Also hide individual controls
                document.querySelectorAll('.zoom-button, .scroller').forEach(btn => {
                    btn.setInvisible();
                });
            } 
            // For images, check controls setting
            else if (content?.type === 'image') {
                if (content.controls === false) {
                    navigationPlane.setInvisible();
                    document.querySelectorAll('.zoom-button, .scroller').forEach(btn => {
                        btn.setInvisible();
                    });
                } else {
                    navigationPlane.setVisible();
                    document.querySelectorAll('.zoom-button, .scroller').forEach(btn => {
                        btn.setVisible();
                    });
                }
            }
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