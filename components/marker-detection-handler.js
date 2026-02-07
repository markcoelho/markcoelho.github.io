// marker-detection-handler.js
AFRAME.registerComponent('marker-detection-handler', {
    init: function() {
        this.audioElements = {};
        this.currentPlayingAudio = null;
        this.centerImage = getId('centerImage');
        this.centerpiece = getId('centerpiece');
        this.camera = document.querySelector('a-camera');
        this.navigationPlane = getId('centerControls');
        
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
    onMarkerFound: function(marker) {
        const value = marker.getAttribute('value');
        
        console.log(`Marker ${value} found`);
        
        if (this.currentPlayingAudio) {
            this.currentPlayingAudio.pause();
            this.currentPlayingAudio.currentTime = 0;
        }
        
        const scene = this.el.sceneEl;
        const contentManager = scene.components['marker-content-manager'];
        
        if (contentManager?.narrations?.[value]) {
            this.playAudio(value, contentManager.narrations[value]);
        }
        
        this.updateNavigationVisibility(marker, value, contentManager);
        this.updateGridVisibility(value, contentManager);
        
        if (contentManager) {
            const content = contentManager.getMarkerContent(value);
            if (content) {
                if (content.type === 'image') {
                    this.showImage(content.value, value, scene);
                } else if (content.type === 'video') {
                    this.showVideo(content.value, value, scene);
                } else if (content.type === '3d') {
                    this.show3DModel(content.value, value, scene);
                }
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

    show3DModel: function(src, markerValue, scene) {
        const centerImage = getId('centerImage');
        const centerVideo = getId('centerVideo');
        const centerModel = getId('centerModel');
        const centerVideoControls = getId('centerVideoControls');
        const center3dControls = getId('center3dControls'); // Get 3D controls
        
        centerImage.setInvisible();
        centerVideo.setInvisible();
        centerModel.setVisible();
        pauseVideo(centerVideo);
        
        if (centerVideoControls) {
            centerVideoControls.setInvisible();
        }
        
        // Show 3D controls
        if (center3dControls) {
            center3dControls.setVisible();
        }
        
        centerModel.setAttribute('gltf-model', src);
        
        const contentManager = scene.components['marker-content-manager'];
        const content = contentManager?.getMarkerContent(markerValue);
        const contentScale = content?.scale || 1;
        
        centerModel.setAttribute('scale', { 
            x: contentScale, 
            y: contentScale, 
            z: contentScale 
        });
        
        // Position the model
        centerModel.setAttribute('position', { x: 0, y: 0, z: 0 });
        
        const centerControls = getId('centerControls');
        if (centerControls) {
            centerControls.setInvisible();
        }
        
        console.log(`3D Model ${src} loaded, scale: ${contentScale}`);
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
    updateNavigationVisibility: function(marker, markerValue, contentManager) {
        const content = contentManager?.getMarkerContent(markerValue);
        const navigationPlane = getId('centerControls');
        const threeDControls = getId('center3dControls'); // Get 3D controls
        
        if (navigationPlane) {
            if (content?.type === 'video' || content?.type === '3d') {
                navigationPlane.setInvisible();
                document.querySelectorAll('.zoom-button, .scroller').forEach(btn => {
                    btn.setInvisible();
                });
            } else if (content?.type === 'image') {
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
        
        // Handle 3D controls visibility based on content type
        if (threeDControls) {
            if (content?.type === '3d') {
                threeDControls.setVisible();
            } else {
                threeDControls.setInvisible();
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