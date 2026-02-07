// marker-detection-handler.js
AFRAME.registerComponent('marker-detection-handler', {
    init: function() {
        this.audioElements = {};
        this.currentPlayingAudio = null;
        this.centerImage = getId('centerImage');
        this.centerpiece = getId('centerpiece');
        this.camera = document.querySelector('a-camera');
        this.navigationPlane = getId('centerControls');
        this.currentMarker = null;
        
        this.setupVideoControls();
        
        this.el.sceneEl.addEventListener('markers-created', () => {
            this.setupMarkerEventListeners();
        });
    },

    setupVideoControls: function() {
        const restartBtn = getId('restart');
        const muteBtn = getId('mute');
        const centerVideo = getId('centerVideo');
        
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                if (centerVideo) {
                    try {
                        const material = centerVideo.components?.material?.material;
                        if (material?.map?.image) {
                            material.map.image.currentTime = 0;
                            material.map.image.play();
                        }
                    } catch (e) {
                        console.warn('Could not restart video:', e);
                    }
                }
            });
        }
        
        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                if (centerVideo) {
                    try {
                        const material = centerVideo.components?.material?.material;
                        if (material?.map?.image) {
                            material.map.image.muted = !material.map.image.muted;
                            muteBtn.setAttribute('src', 
                                material.map.image.muted ? 
                                'assets/icons/unmute.png' : 
                                'assets/icons/mute.png'
                            );
                        }
                    } catch (e) {
                        console.warn('Could not toggle mute:', e);
                    }
                }
            });
        }
    },
    
    // Setup marker event listeners
    setupMarkerEventListeners: function() {
        document.querySelectorAll('a-marker').forEach(marker => {
            marker.addEventListener('markerFound', () => this.onMarkerFound(marker));
            marker.addEventListener('markerLost', () => this.onMarkerLost(marker));
        });
    },
    
    // Marker detected
    // Marker detected
onMarkerFound: function(marker) {
    const value = marker.getAttribute('value');
    this.currentMarker = value;
    
    console.log(`=== MARKER ${value} FOUND ===`);
    
    if (this.currentPlayingAudio) {
        this.currentPlayingAudio.pause();
        this.currentPlayingAudio.currentTime = 0;
    }
    
    const scene = this.el.sceneEl;
    const contentManager = scene.components['marker-content-manager'];
    
    console.log(`Content manager exists: ${!!contentManager}`);
    
    if (contentManager?.narrations?.[value]) {
        this.playAudio(value, contentManager.narrations[value]);
    }
    
    this.updateNavigationVisibility(marker, value, contentManager);
    this.updateGridVisibility(value, contentManager);
    
    if (contentManager) {
        const content = contentManager.getMarkerContent(value);
        console.log(`Retrieved content for ${value}:`, content);
        
        if (content) {
            if (content.type === 'image') {
                console.log('Showing image');
                this.showImage(content.value, value, scene);
            } else if (content.type === 'video') {
                console.log('Showing video');
                this.showVideo(content.value, value, scene);
            } else if (content.type === '3d') {
                console.log('Showing 3D model');
                this.show3DModel(content.value, value, scene);
            }
        } else {
            console.error(`No content found for marker ${value}`);
        }
    }
    
    if (this.centerpiece && this.camera) {
        positionBetweenCameraAndMarker(this.camera, marker, this.centerpiece);
    }
},

    showImage: function(src, markerValue, scene) {
        const centerImage = getId('centerImage');
        const centerVideo = getId('centerVideo');
        const centerModel = getId('centerModel');
        const centerVideoControls = getId('centerVideoControls');
        const center3dControls = getId('center3dControls'); // Get 3D controls
        
        centerImage.setVisible();
        centerModel.setInvisible();
        
        centerVideo.setInvisible();
        pauseVideo(centerVideo);
        
        if (centerVideoControls) {
            centerVideoControls.setInvisible();
        }
        
        // Hide 3D controls
        if (center3dControls) {
            center3dControls.setInvisible();
        }
        
        const currentSrc = centerImage.getAttribute('src');
        if (currentSrc !== src) {
            const imageController = scene.components['image-position-controller'];
            if (imageController) {
                imageController.setupImage(src, markerValue, 'marker');
            }
        }
    },

    showVideo: function(src, markerValue, scene) {
        const centerImage = getId('centerImage');
        const centerVideo = getId('centerVideo');
        const centerModel = getId('centerModel');
        const centerVideoControls = getId('centerVideoControls');
        const center3dControls = getId('center3dControls'); // Get 3D controls
        
        centerImage.setInvisible();
        centerModel.setInvisible();
        centerVideo.setVisible();
        playVideo(centerVideo);
        
        centerVideo.setAttribute('src', src);
        
        const contentManager = scene.components['marker-content-manager'];
        const content = contentManager?.getMarkerContent(markerValue);
        const contentScale = content?.scale || 1;
        const hasControls = content?.controls === true || content?.controls === "true";
        
        const baseSize = 3 * contentScale;
        centerVideo.setAttribute('width', baseSize * 16/9);
        centerVideo.setAttribute('height', baseSize);
        centerVideo.setAttribute('scale', { x: 1, y: 1, z: 1 });
        centerVideo.setAttribute('position', { x: 0, y: 0, z: 0 });
        
        if (centerVideoControls) {
            if (hasControls) {
                centerVideoControls.setVisible();
            } else {
                centerVideoControls.setInvisible();
            }
        }
        
        // Hide 3D controls
        if (center3dControls) {
            center3dControls.setInvisible();
        }
        
        const centerControls = getId('centerControls');
        if (centerControls) {
            centerControls.setInvisible();
        }
        
        console.log(`Video ${src} loaded, scale: ${contentScale}, controls: ${hasControls}`);
    },

    // In marker-detection-handler.js
    // In marker-detection-handler.js show3DModel function:
    show3DModel: function(src, markerValue, scene) {
    console.log(`Attempting to show 3D model for marker ${markerValue}, src: ${src}`);
    
    const centerImage = getId('centerImage');
    const centerVideo = getId('centerVideo');
    const centerModel = getId('centerModel');
    const centerVideoControls = getId('centerVideoControls');
    const center3dControls = getId('center3dControls');
    
    // First, make sure the model element is properly set up
    if (!centerModel) {
        console.error('centerModel element not found!');
        return;
    }
    
    // Hide other media
    centerImage.setInvisible();
    centerVideo.setInvisible();
    centerModel.setVisible();
    pauseVideo(centerVideo);
    
    // Hide video controls
    if (centerVideoControls) {
        centerVideoControls.setInvisible();
    }
    
    // Set the model source FIRST - this is critical
    console.log(`Setting gltf-model to: ${src}`);
    centerModel.setAttribute('gltf-model', src);
    
    // Get content information
    const contentManager = scene.components['marker-content-manager'];
    let content = null;
    let controlsEnabled = false;
    let originalScale = 1;
    
    if (contentManager) {
        content = contentManager.getMarkerContent(markerValue);
        console.log(`Content for marker ${markerValue}:`, content);
        
        if (content) {
            // Check controls setting (supports both string "true"/"false" and boolean)
            controlsEnabled = content.controls === "true" || content.controls === true;
            originalScale = content.scale || 1;
            console.log(`Controls enabled: ${controlsEnabled}, Original scale: ${originalScale}`);
        }
    }
    
    // Get model controller
    const modelController = scene.components['model-controller'];
    
    // Get the scale to apply
    let targetScale = originalScale;
    
    if (modelController && modelController.getUserScale) {
        // Get user-adjusted scale if available
        const userScale = modelController.getUserScale(markerValue);
        console.log(`User scale for marker ${markerValue}: ${userScale}`);
        
        targetScale = userScale || originalScale;
        
        // Set current marker in controller
        if (modelController.setCurrentMarker) {
            modelController.setCurrentMarker(markerValue, originalScale);
        }
    }
    
    // Apply scale after a small delay to ensure model is loaded
    setTimeout(() => {
        console.log(`Applying scale: ${targetScale} to 3D model`);
        centerModel.setAttribute('scale', { 
            x: targetScale, 
            y: targetScale, 
            z: targetScale 
        });
        
        // Position the model
        centerModel.setAttribute('position', { x: 0, y: 0, z: 0 });
        centerModel.setAttribute('rotation', { x: 0, y: 0, z: 0 });
    }, 100);
    
    // Handle 3D controls visibility
    setTimeout(() => {
        if (center3dControls) {
            console.log(`Setting 3D controls visibility: ${controlsEnabled ? 'visible' : 'invisible'}`);
            if (controlsEnabled) {
                center3dControls.setVisible();
                // Make individual control buttons visible
                document.querySelectorAll('.model-zoom-button, .roller, .3dreset').forEach(btn => {
                    btn.setVisible();
                });
            } else {
                center3dControls.setInvisible();
                // Make individual control buttons invisible
                document.querySelectorAll('.model-zoom-button, .roller, .3dreset').forEach(btn => {
                    btn.setInvisible();
                });
            }
        }
    }, 150);
    
    // Hide image controls
    const centerControls = getId('centerControls');
    if (centerControls) {
        centerControls.setInvisible();
    }
    
    console.log(`3D Model loading initiated for ${src}`);
},
    
    // Update grid visibility
    updateGridVisibility: function(markerValue, contentManager) {
        const navUI = this.el.sceneEl.components['marker-navigation-ui'];
        if (!navUI) return;
        
        const hasMultipleMedia = navUI.hasMultipleImages(markerValue);
        navUI.setGridVisibility(markerValue, hasMultipleMedia);
    },
    
    // Marker lost
    onMarkerLost: function(marker) {
        // Controls stay visible
    },
    
    // Show/hide controls based on content
    // Show/hide controls based on content
// Show/hide controls based on content
updateNavigationVisibility: function(marker, markerValue, contentManager) {
    const content = contentManager?.getMarkerContent(markerValue);
    console.log(`updateNavigationVisibility for ${markerValue}:`, content);
    
    if (!content) return;
    
    const navigationPlane = getId('centerControls');
    const threeDControls = getId('center3dControls');
    const videoControls = getId('centerVideoControls');
    
    // Always hide all control planes initially
    if (navigationPlane) navigationPlane.setInvisible();
    if (threeDControls) threeDControls.setInvisible();
    if (videoControls) videoControls.setInvisible();
    
    // Show appropriate controls based on content type
    if (content.type === 'image') {
        const controlsEnabled = content.controls === "true" || content.controls === true;
        if (controlsEnabled && navigationPlane) {
            navigationPlane.setVisible();
        }
    } 
    else if (content.type === 'video') {
        const controlsEnabled = content.controls === "true" || content.controls === true;
        if (controlsEnabled && videoControls) {
            videoControls.setVisible();
        }
    }
    else if (content.type === '3d') {
        const controlsEnabled = content.controls === "true" || content.controls === true;
        if (controlsEnabled && threeDControls) {
            threeDControls.setVisible();
        }
    }
},
    
    // Play narration audio
    playAudio: function(markerValue, url) {
        if (!this.audioElements[markerValue]) {
            this.audioElements[markerValue] = new Audio(url);
            this.audioElements[markerValue].preload = 'auto';
        }
        
        this.currentPlayingAudio = this.audioElements[markerValue];
        this.currentPlayingAudio.currentTime = 0;
        this.currentPlayingAudio.play();
    }
});