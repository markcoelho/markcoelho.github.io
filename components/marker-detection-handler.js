// marker-detection-handler.js (updated sections)
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
    // marker-detection-handler.js - Updated onMarkerFound function

onMarkerFound: function(marker) {
    const value = marker.getAttribute('value');
    const previousMarker = this.currentMarker;
    const isNewMarker = (previousMarker !== value);
    
    this.currentMarker = value;
    
    console.log(`=== MARKER ${value} FOUND === (previous: ${previousMarker}, new: ${isNewMarker})`);
    
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
    
    // ALWAYS reposition the parent containers (centerpiece, leftpiece, rightpiece)
    if (this.centerpiece && this.camera) {
        positionBetweenCameraAndMarker(this.camera, marker, this.centerpiece);
    }
    
    // ONLY load/reload content if it's a NEW marker
    if (isNewMarker) {
        console.log(`NEW MARKER DETECTED - Loading content for ${value}`);
        
        // First, show the marker image if it exists
        this.showMarkerImage(value, marker, scene);
        
        // Handle surround content
        if (contentManager) {
            this.updateSurroundContent(value, contentManager.getSurroundContent(value));
        }
        
        // Handle left-side content
        if (contentManager) {
            const leftContent = contentManager.getLeftSideContent(value);
            if (leftContent) {
                this.showLeftPieceContent(leftContent, value, scene);
                this.updateLeftPieceControls(leftContent, value);
            } else {
                this.hideLeftPieceControls();
            }
        }
        
        // Handle right-side content
        if (contentManager) {
            const rightContent = contentManager.getRightSideContent(value);
            if (rightContent) {
                this.showRightPieceContent(rightContent, value, scene);
                this.updateRightPieceControls(rightContent, value);
            } else {
                this.hideRightPieceControls();
            }
        }
        
        if (contentManager) {
            const content = contentManager.getMarkerContent(value);
            console.log(`Retrieved content for ${value}:`, content);
            
            if (content) {
                if (content.type === 'image') {
                    console.log('Showing center image');
                    this.showImage(content.value, value, scene);
                } else if (content.type === 'video') {
                    console.log('Showing center video');
                    this.showVideo(content.value, value, scene);
                } else if (content.type === '3d') {
                    console.log('Showing center 3D model');
                    this.show3DModel(content.value, value, scene);
                }
            } else {
                console.error(`No content found for marker ${value}`);
            }
        }

        // Handle marker content based on current index
        if (contentManager) {
            const currentIndex = contentManager.currentContentIndex[value] || 0;
            const markerItems = contentManager.markerData?.[value] || [];
            const currentMarkerItem = markerItems[currentIndex];
            
            if (currentMarkerItem) {
                this.showMarkerImage(value, marker, scene);
            }
        }
        
        // Update navigation and grid visibility only for new markers
        this.updateNavigationVisibility(marker, value, contentManager);
        this.updateGridVisibility(value, contentManager);
        
        // Handle centerpiece grid visibility
        const useMarkerNavigation = contentManager?.getMarkerNavigationFlag?.(value);
        const navUI = scene.components['marker-navigation-ui'];

        if (navUI) {
            // Hide ALL marker grids initially
            document.querySelectorAll('a-marker').forEach(m => {
                if (m._imageGrid) {
                    m._imageGrid.setAttribute('visible', 'false');
                }
            });
            
            if (useMarkerNavigation) {
                // Show marker grid if multiple media
                const hasMultipleMedia = navUI.hasMultipleImages(value);
                const currentMarker = document.querySelector(`a-marker[value="${value}"]`);
                if (currentMarker && currentMarker._imageGrid) {
                    currentMarker._imageGrid.setAttribute('visible', hasMultipleMedia);
                    console.log(`Showing marker grid for ${value}: ${hasMultipleMedia}`);
                }
                // Hide centerpiece grid
                navUI.setCenterpieceGridVisibility(false);
                
            } else {
                // Update centerpiece grid with this marker's content
                navUI.updateCenterpieceGrid(value);
                
                // Show centerpiece grid if multiple media
                const hasMultipleMedia = navUI.hasMultipleImages(value);
                navUI.setCenterpieceGridVisibility(hasMultipleMedia);
            }
        }
    } else {
        console.log(`SAME MARKER DETECTED - Preserving content state for ${value}`);
        // NO CONTENT LOADING - just the containers have been repositioned above
        
        // Update grid visibility but don't reload content
        if (contentManager) {
            this.updateGridVisibility(value, contentManager);
            
            // Update navigation UI visibility without reloading
            const navUI = scene.components['marker-navigation-ui'];
            if (navUI) {
                const useMarkerNavigation = contentManager?.getMarkerNavigationFlag?.(value);
                
                if (useMarkerNavigation) {
                    // Show marker grid if multiple media
                    const hasMultipleMedia = navUI.hasMultipleImages(value);
                    const currentMarker = document.querySelector(`a-marker[value="${value}"]`);
                    if (currentMarker && currentMarker._imageGrid) {
                        currentMarker._imageGrid.setAttribute('visible', hasMultipleMedia);
                    }
                    navUI.setCenterpieceGridVisibility(false);
                } else {
                    // Update centerpiece grid visibility without reloading content
                    const hasMultipleMedia = navUI.hasMultipleImages(value);
                    navUI.setCenterpieceGridVisibility(hasMultipleMedia);
                }
            }
        }
    }
},

    // NEW FUNCTION: Update left piece controls visibility based on content
    updateLeftPieceControls: function(content, markerValue) {
        const controlsEnabled = content.controls === "true" || content.controls === true;
        console.log(`Left piece controls for marker ${markerValue}: ${controlsEnabled ? 'visible' : 'invisible'}`);
        
        // Get all left piece control planes
        const leftControls = getId('leftControls');
        const leftVideoControls = getId('leftVideoControls');
        const left3dControls = getId('left3dControls');
        
        // Hide all control planes first
        if (leftControls) leftControls.setInvisible();
        if (leftVideoControls) leftVideoControls.setInvisible();
        if (left3dControls) left3dControls.setInvisible();
        
        // Show the appropriate control plane based on content type and controls setting
        if (controlsEnabled) {
            if (content.type === 'image' && leftControls) {
                leftControls.setVisible();
            } else if (content.type === 'video' && leftVideoControls) {
                leftVideoControls.setVisible();
            } else if (content.type === '3d' && left3dControls) {
                left3dControls.setVisible();
            }
        }
    },

    // NEW FUNCTION: Hide all left piece controls
    hideLeftPieceControls: function() {
        const leftControls = getId('leftControls');
        const leftVideoControls = getId('leftVideoControls');
        const left3dControls = getId('left3dControls');
        
        if (leftControls) leftControls.setInvisible();
        if (leftVideoControls) leftVideoControls.setInvisible();
        if (left3dControls) left3dControls.setInvisible();
    },

    // NEW FUNCTION: Update right piece controls visibility based on content
    updateRightPieceControls: function(content, markerValue) {
        const controlsEnabled = content.controls === "true" || content.controls === true;
        console.log(`Right piece controls for marker ${markerValue}: ${controlsEnabled ? 'visible' : 'invisible'}`);
        
        // Get all right piece control planes
        const rightControls = getId('rightControls');
        const rightVideoControls = getId('rightVideoControls');
        const right3dControls = getId('right3dControls');
        
        // Hide all control planes first
        if (rightControls) rightControls.setInvisible();
        if (rightVideoControls) rightVideoControls.setInvisible();
        if (right3dControls) right3dControls.setInvisible();
        
        // Show the appropriate control plane based on content type and controls setting
        if (controlsEnabled) {
            if (content.type === 'image' && rightControls) {
                rightControls.setVisible();
            } else if (content.type === 'video' && rightVideoControls) {
                rightVideoControls.setVisible();
            } else if (content.type === '3d' && right3dControls) {
                right3dControls.setVisible();
            }
        }
    },

    // NEW FUNCTION: Hide all right piece controls
    hideRightPieceControls: function() {
        const rightControls = getId('rightControls');
        const rightVideoControls = getId('rightVideoControls');
        const right3dControls = getId('right3dControls');
        
        if (rightControls) rightControls.setInvisible();
        if (rightVideoControls) rightVideoControls.setInvisible();
        if (right3dControls) right3dControls.setInvisible();
    },

    showRightPieceContent: function(content, markerValue, scene) {
        console.log(`Showing right piece content for marker ${markerValue}:`, content);
        
        const rightImage = getId('rightImage');
        const rightVideo = getId('rightVideo');
        const rightModel = getId('rightModel');
        
        // Hide all right piece content initially
        if (rightImage) rightImage.setAttribute('visible', 'false');
        if (rightVideo) rightVideo.setAttribute('visible', 'false');
        if (rightModel) rightModel.setAttribute('visible', 'false');
        
        const contentScale = content.scale || 1;
        const baseSize = 3 * contentScale;
        
        switch(content.type) {
            case 'image':
                if (rightImage) {
                    // Create a temporary image to get natural dimensions
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    
                    img.onload = () => {
                        // Calculate aspect ratio
                        const aspectRatio = img.naturalWidth / img.naturalHeight;
                        
                        // Determine dimensions based on aspect ratio
                        let width, height;
                        if (aspectRatio >= 1) {
                            // Landscape or square
                            width = baseSize;
                            height = baseSize / aspectRatio;
                        } else {
                            // Portrait
                            width = baseSize * aspectRatio;
                            height = baseSize;
                        }
                        
                        // Set attributes
                        rightImage.setAttribute('src', content.value);
                        rightImage.setAttribute('width', width);
                        rightImage.setAttribute('height', height);
                        rightImage.setAttribute('scale', { x: 1, y: 1, z: 1 });
                        rightImage.setAttribute('visible', 'true');
                        
                        console.log(`Right image loaded: ${img.naturalWidth}x${img.naturalHeight}, aspect: ${aspectRatio.toFixed(2)}, display: ${width.toFixed(2)}x${height.toFixed(2)}`);
                    };
                    
                    img.onerror = () => {
                        console.error(`Failed to load right image: ${content.value}`);
                    };
                    
                    img.src = content.value;
                }
                break;
                
            case 'video':
                if (rightVideo) {
                    // Create a temporary video element to get dimensions
                    const videoElement = document.createElement('video');
                    videoElement.preload = 'metadata';
                    
                    videoElement.onloadedmetadata = () => {
                        // Calculate aspect ratio
                        const aspectRatio = videoElement.videoWidth / videoElement.videoHeight;
                        
                        // Determine dimensions based on aspect ratio (16:9 is standard for video)
                        let width, height;
                        if (aspectRatio >= 1) {
                            // Landscape or square
                            width = baseSize;
                            height = baseSize / aspectRatio;
                        } else {
                            // Portrait video (uncommon but possible)
                            width = baseSize * aspectRatio;
                            height = baseSize;
                        }
                        
                        // Set attributes
                        rightVideo.setAttribute('src', content.value);
                        rightVideo.setAttribute('width', width);
                        rightVideo.setAttribute('height', height);
                        rightVideo.setAttribute('scale', { x: 1, y: 1, z: 1 });
                        rightVideo.setAttribute('visible', 'true');
                        
                        // Try to play the video
                        try {
                            const material = rightVideo.components?.material?.material;
                            if (material?.map?.image) {
                                material.map.image.play().catch(e => {
                                    console.warn("Could not auto-play right video:", e);
                                });
                            }
                        } catch (e) {
                            console.warn("Could not play right video:", e);
                        }
                        
                        console.log(`Right video loaded: ${videoElement.videoWidth}x${videoElement.videoHeight}, aspect: ${aspectRatio.toFixed(2)}, display: ${width.toFixed(2)}x${height.toFixed(2)}`);
                    };
                    
                    videoElement.onerror = () => {
                        console.error(`Failed to load right video: ${content.value}`);
                        // Fallback to default 16:9 ratio
                        rightVideo.setAttribute('src', content.value);
                        rightVideo.setAttribute('width', baseSize * 16/9);
                        rightVideo.setAttribute('height', baseSize);
                        rightVideo.setAttribute('scale', { x: 1, y: 1, z: 1 });
                        rightVideo.setAttribute('visible', 'true');
                    };
                    
                    videoElement.src = content.value;
                }
                break;
                
            case '3d':
                if (rightModel) {
                    rightModel.setAttribute('gltf-model', content.value);
                    rightModel.setAttribute('scale', { 
                        x: contentScale, 
                        y: contentScale, 
                        z: contentScale 
                    });
                    rightModel.setAttribute('visible', 'true');
                    
                    console.log(`Right 3D model loaded: ${content.value}, scale: ${contentScale}`);
                }
                break;
        }
    },

    showLeftPieceContent: function(content, markerValue, scene) {
        console.log(`Showing left piece content for marker ${markerValue}:`, content);
        
        const leftImage = getId('leftImage');
        const leftVideo = getId('leftVideo');
        const leftModel = getId('leftModel');
        
        // Hide all left piece content initially
        if (leftImage) leftImage.setAttribute('visible', 'false');
        if (leftVideo) leftVideo.setAttribute('visible', 'false');
        if (leftModel) leftModel.setAttribute('visible', 'false');
        
        const contentScale = content.scale || 1;
        const baseSize = 3 * contentScale;
        
        switch(content.type) {
            case 'image':
                if (leftImage) {
                    // Create a temporary image to get natural dimensions
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    
                    img.onload = () => {
                        // Calculate aspect ratio
                        const aspectRatio = img.naturalWidth / img.naturalHeight;
                        
                        // Determine dimensions based on aspect ratio
                        let width, height;
                        if (aspectRatio >= 1) {
                            // Landscape or square
                            width = baseSize;
                            height = baseSize / aspectRatio;
                        } else {
                            // Portrait
                            width = baseSize * aspectRatio;
                            height = baseSize;
                        }
                        
                        // Set attributes
                        leftImage.setAttribute('src', content.value);
                        leftImage.setAttribute('width', width);
                        leftImage.setAttribute('height', height);
                        leftImage.setAttribute('scale', { x: 1, y: 1, z: 1 });
                        leftImage.setAttribute('visible', 'true');
                        
                        console.log(`Left image loaded: ${img.naturalWidth}x${img.naturalHeight}, aspect: ${aspectRatio.toFixed(2)}, display: ${width.toFixed(2)}x${height.toFixed(2)}`);
                    };
                    
                    img.onerror = () => {
                        console.error(`Failed to load left image: ${content.value}`);
                    };
                    
                    img.src = content.value;
                }
                break;
                
            case 'video':
                if (leftVideo) {
                    // Create a temporary video element to get dimensions
                    const videoElement = document.createElement('video');
                    videoElement.preload = 'metadata';
                    
                    videoElement.onloadedmetadata = () => {
                        // Calculate aspect ratio
                        const aspectRatio = videoElement.videoWidth / videoElement.videoHeight;
                        
                        // Determine dimensions based on aspect ratio (16:9 is standard for video)
                        let width, height;
                        if (aspectRatio >= 1) {
                            // Landscape or square
                            width = baseSize;
                            height = baseSize / aspectRatio;
                        } else {
                            // Portrait video (uncommon but possible)
                            width = baseSize * aspectRatio;
                            height = baseSize;
                        }
                        
                        // Set attributes
                        leftVideo.setAttribute('src', content.value);
                        leftVideo.setAttribute('width', width);
                        leftVideo.setAttribute('height', height);
                        leftVideo.setAttribute('scale', { x: 1, y: 1, z: 1 });
                        leftVideo.setAttribute('visible', 'true');
                        
                        // Try to play the video
                        try {
                            const material = leftVideo.components?.material?.material;
                            if (material?.map?.image) {
                                material.map.image.play().catch(e => {
                                    console.warn("Could not auto-play left video:", e);
                                });
                            }
                        } catch (e) {
                            console.warn("Could not play left video:", e);
                        }
                        
                        console.log(`Left video loaded: ${videoElement.videoWidth}x${videoElement.videoHeight}, aspect: ${aspectRatio.toFixed(2)}, display: ${width.toFixed(2)}x${height.toFixed(2)}`);
                    };
                    
                    videoElement.onerror = () => {
                        console.error(`Failed to load left video: ${content.value}`);
                        // Fallback to default 16:9 ratio
                        leftVideo.setAttribute('src', content.value);
                        leftVideo.setAttribute('width', baseSize * 16/9);
                        leftVideo.setAttribute('height', baseSize);
                        leftVideo.setAttribute('scale', { x: 1, y: 1, z: 1 });
                        leftVideo.setAttribute('visible', 'true');
                    };
                    
                    videoElement.src = content.value;
                }
                break;
                
            case '3d':
                if (leftModel) {
                    leftModel.setAttribute('gltf-model', content.value);
                    leftModel.setAttribute('scale', { 
                        x: contentScale, 
                        y: contentScale, 
                        z: contentScale 
                    });
                    leftModel.setAttribute('visible', 'true');
                    
                    console.log(`Left 3D model loaded: ${content.value}, scale: ${contentScale}`);
                }
                break;
        }
    },

    // In marker-detection-handler.js - update showMarkerImage function

showMarkerImage: function(markerValue, markerElement, scene) {
    const markerImage = document.querySelector(`#marker-${markerValue}-image`);
    const markerModel = document.querySelector(`#marker-${markerValue}-model`);
    const markerVideo = document.querySelector(`#marker-${markerValue}-video`);
    
    // Get control elements
    const markerControls = document.querySelector(`#marker-${markerValue}-controls`);
    const markerVideoControls = document.querySelector(`#marker-${markerValue}-video-controls`);
    const marker3dControls = document.querySelector(`#marker-${markerValue}-3d-controls`);
    
    // Hide all controls initially
    if (markerControls) markerControls.setAttribute('visible', 'false');
    if (markerVideoControls) markerVideoControls.setAttribute('visible', 'false');
    if (marker3dControls) marker3dControls.setAttribute('visible', 'false');
    
    // Hide all content initially
    if (markerImage) markerImage.setAttribute('visible', 'false');
    if (markerModel) markerModel.setAttribute('visible', 'false');
    if (markerVideo) markerVideo.setAttribute('visible', 'false');
    
    const contentManager = scene.components['marker-content-manager'];
    const currentIndex = contentManager?.currentContentIndex[markerValue] || 0;
    const markerItems = contentManager?.markerData?.[markerValue] || [];
    const currentItem = markerItems[currentIndex];
    
    if (!currentItem) {
        console.log(`No marker data for marker ${markerValue} at index ${currentIndex}`);
        return;
    }
    
    console.log(`Showing marker ${markerValue} content:`, currentItem);
    
    if (currentItem.type === 'image') {
        // Handle image marker
        if (!markerImage) {
            console.warn(`Marker image element not found for marker ${markerValue}`);
            return;
        }

        // Store original scale if not already stored
        if (contentManager && !contentManager.markerOriginalScales[markerValue]) {
            contentManager.markerOriginalScales[markerValue] = currentItem.scale || 1;
        }
        
        // Set src first
        markerImage.setAttribute('src', currentItem.src);
        markerImage.setAttribute('rotation', '-90 0 0');
        
        // Create an image to get natural dimensions
        const img = new Image();
        img.onload = () => {
            // Calculate aspect ratio
            const aspectRatio = img.naturalWidth / img.naturalHeight;
            const baseScale = currentItem.scale || 1;

             // Get saved user scale or use base scale
            let userScale = 1;
            if (contentManager && contentManager.markerImageScales[markerValue]) {
                userScale = contentManager.markerImageScales[markerValue];
                console.log(`Using saved scale for marker ${markerValue} image: ${userScale}`);
            } else {
                // Initialize with base scale
                if (contentManager) {
                    contentManager.markerImageScales[markerValue] = 1;
                }
            }
            
            // Set scale: width = height * aspectRatio
            const height = baseScale;
            const width = baseScale * aspectRatio;
            
            markerImage.setAttribute('scale', `${width} ${height} ${1}`);
            markerImage.setAttribute('visible', 'true');
            
            // Show controls if enabled
            if (currentItem.controls && markerControls) {
                markerControls.setAttribute('visible', 'true');
                console.log(`Showing marker image controls for ${markerValue}`);
            }
            
            console.log(`Marker image loaded: ${img.naturalWidth}x${img.naturalHeight}, aspect: ${aspectRatio.toFixed(2)}, scale: ${width.toFixed(2)}x${height}`);
        };
        
        img.onerror = () => {
            console.error(`Failed to load marker image: ${currentItem.src}`);
            markerImage.setAttribute('visible', 'false');
        };
        
        img.src = currentItem.src;
        
    } else if (currentItem.type === '3d') {
        // Handle 3D model marker
        if (!markerModel) {
            console.warn(`Marker model element not found for marker ${markerValue}`);
            return;
        }
        
        // Set the gltf-model and scale
        markerModel.setAttribute('gltf-model', currentItem.src);

                // Get saved user scale or use base scale
        let userScale = 1;
        if (contentManager && contentManager.markerModelScales[markerValue]) {
            userScale = contentManager.markerModelScales[markerValue];
            console.log(`Using saved scale for marker ${markerValue} model: ${userScale}`);
        } else {
            // Initialize with base scale
            if (contentManager) {
                contentManager.markerModelScales[markerValue] = 1;
            }
        }
        
        // Set scale (3D models typically use uniform scale)
        const scale = currentItem.scale || 1;
        markerModel.setAttribute('scale', `${scale} ${scale} ${scale}`);
        
        // Make it visible
        markerModel.setAttribute('visible', 'true');
        
        // Show controls if enabled
        if (currentItem.controls && marker3dControls) {
            marker3dControls.setAttribute('visible', 'true');
            console.log(`Showing marker 3D controls for ${markerValue}`);
        }
        
        console.log(`Marker 3D model loaded: ${currentItem.src}, scale: ${scale}`);
        
    } else if (currentItem.type === 'video') {
        // Handle video marker
        if (!markerVideo) {
            console.warn(`Marker video element not found for marker ${markerValue}`);
            return;
        }
        
        // Set src and scale
        markerVideo.setAttribute('src', currentItem.src);
        markerVideo.setAttribute('rotation', '-90 0 0');
        
        // For video, we need to wait for metadata to get dimensions
        const videoElement = document.createElement('video');
        videoElement.preload = 'metadata';
        
        videoElement.onloadedmetadata = () => {
            // Calculate aspect ratio from video dimensions
            const aspectRatio = videoElement.videoWidth / videoElement.videoHeight;
            const baseScale = currentItem.scale || 1;
            
            // Set scale: width = height * aspectRatio
            const height = baseScale;
            const width = baseScale * aspectRatio;
            
            markerVideo.setAttribute('scale', `${width} ${height} ${1}`);
            markerVideo.setAttribute('visible', 'true');
            
            // Show controls if enabled
            if (currentItem.controls && markerVideoControls) {
                markerVideoControls.setAttribute('visible', 'true');
                console.log(`Showing marker video controls for ${markerValue}`);
            }
            
            // Try to play the video
            try {
                const videoComponent = markerVideo.components.material;
                if (videoComponent && videoComponent.material.map.image) {
                    videoComponent.material.map.image.play().catch(e => {
                        console.warn("Could not auto-play marker video:", e);
                    });
                }
            } catch (e) {
                console.warn("Could not access video component for auto-play:", e);
            }
            
            console.log(`Marker video loaded: ${videoElement.videoWidth}x${videoElement.videoHeight}, aspect: ${aspectRatio.toFixed(2)}, scale: ${width.toFixed(2)}x${height}`);
        };
        
        videoElement.onerror = () => {
            console.error(`Failed to load marker video: ${currentItem.src}`);
            markerVideo.setAttribute('visible', 'false');
        };
        
        videoElement.src = currentItem.src;
        
    } else {
        console.warn(`Unknown marker type for marker ${markerValue}: ${currentItem.type}`);
    }
},

    // Helper function to get marker data from JSON
    getMarkerDataFromJSON: function(markerValue, scene) {
        const contentManager = scene.components['marker-content-manager'];
        
        // We need to access the original JSON data
        // Since we only processed central_side in processJSONData, we need to store marker data too
        if (contentManager && contentManager.markerData && contentManager.markerData[markerValue]) {
            return contentManager.markerData[markerValue];
        }
        
        return null;
    },

    updateSurroundContent: function(markerValue, surroundSrc) {
        const video360 = document.querySelector('a-videosphere');
        const image360 = document.querySelector('a-sphere');
        
        if (!video360 || !image360) {
            console.error("360 video or image elements not found");
            return;
        }
        
        // Hide both initially
        video360.setAttribute('visible', 'false');
        image360.setAttribute('visible', 'false');
        
        // Check if surround content exists
        if (!surroundSrc || surroundSrc.trim() === '') {
            console.log(`No surround content for marker ${markerValue}`);
            return;
        }
        
        console.log(`Setting surround content for marker ${markerValue}: ${surroundSrc}`);
        
        // Check file extension to determine if it's video or image
        const extension = surroundSrc.split('.').pop().toLowerCase();
        const isVideo = ['mp4', 'webm', 'ogg', 'mov'].includes(extension);
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension);
        
        if (isVideo) {
            // It's a video
            video360.setAttribute('src', surroundSrc);
            video360.setAttribute('visible', 'true');
            console.log(`360 video set to: ${surroundSrc}`);
            
            // Try to play the video
            try {
                const videoElement = video360.components.material.material.map.image;
                if (videoElement) {
                    videoElement.play().catch(e => {
                        console.warn("Could not auto-play 360 video:", e);
                    });
                }
            } catch (e) {
                console.warn("Could not access video element:", e);
            }
        } 
        else if (isImage) {
            // It's an image
            image360.setAttribute('src', surroundSrc);
            image360.setAttribute('visible', 'true');
            console.log(`360 image set to: ${surroundSrc}`);
        }
        else {
            console.warn(`Unknown surround file type for ${surroundSrc}`);
        }
    },

    showImage: function(src, markerValue, scene) {
        const centerImage = getId('centerImage');
        const centerVideo = getId('centerVideo');
        const centerModel = getId('centerModel');
        const centerVideoControls = getId('centerVideoControls');
        const center3dControls = getId('center3dControls');
        
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
        const center3dControls = getId('center3dControls');
        
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
        
        // Get saved rotation for this marker
        let savedRotation = { x: 0, y: 0, z: 0 };
        if (modelController && modelController.modelRotations && modelController.modelRotations[markerValue]) {
            savedRotation = modelController.modelRotations[markerValue];
            console.log(`Found saved rotation for marker ${markerValue}:`, savedRotation);
        }
        
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
        
        // Apply scale and saved rotation after a small delay to ensure model is loaded
        setTimeout(() => {
            console.log(`Applying scale: ${targetScale} and rotation:`, savedRotation, `to 3D model`);
            centerModel.setAttribute('scale', { 
                x: targetScale, 
                y: targetScale, 
                z: targetScale 
            });
            
            // Position the model (keep at origin)
            centerModel.setAttribute('position', { x: 0, y: 0, z: 0 });
            
            // Apply saved rotation instead of resetting to 0,0,0
            centerModel.setAttribute('rotation', savedRotation);
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
        
        const value = marker.getAttribute('value');
        
        // Pause any marker video when marker is lost
        const markerVideo = document.querySelector(`#marker-${value}-video`);

            pauseVideo(markerVideo);
    },
    
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