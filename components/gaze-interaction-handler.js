// gaze-interaction-handler.js
AFRAME.registerComponent('gaze-interaction-handler', {
    schema: {
        fuseTimeout: { default: 500 },
        action: { type: 'string' },
        markerValue: { type: 'string' },
        zoomFactor: { default: 0.25 }
    },
    
    init: function() {
        this.timer = null;
        this.isFusing = false;
        this.intersected = false;
        this.triggered = false;
        this.loading = getId('loading_animation');
        this.scene = this.el.sceneEl;
        
        this.determineButtonType();
        
        // Cursor enter
        this.el.addEventListener('raycaster-intersected', () => {
            if (this.el.classList.contains('not-interactive')) return;
            
            this.intersected = true;
            this.triggered = false;
            this.showLoading();
            this.startFuse();
        });
        
        // Cursor exit
        this.el.addEventListener('raycaster-intersected-cleared', () => {
            this.intersected = false;
            this.reset();
            this.triggered = false;
            this.loading?.setInvisible();
        });
    },
    
    // Identify button type
    determineButtonType: function() {
    // Check for image zoom buttons first (including marker image zoom)
    if (this.el.classList.contains('zoom-button') || 
        this.el.classList.contains('left-zoom-button') || 
        this.el.classList.contains('right-zoom-button') ||
        this.el.classList.contains('marker-zoom-button'))  // Add this line
        this.buttonType = 'zoom';
    
    // Check for model zoom buttons (including marker model zoom)
    else if (this.el.classList.contains('model-zoom-button') || 
             this.el.classList.contains('left-model-zoom-button') || 
             this.el.classList.contains('right-model-zoom-button') || 
             this.el.classList.contains('marker-model-zoom-button'))
        this.buttonType = 'model-zoom';
    
    else if (this.el.classList.contains('reset') || 
             this.el.classList.contains('left-reset') || 
             this.el.classList.contains('right-reset'))
        this.buttonType = 'reset';
    
    else if (this.el.classList.contains('restart') || 
             this.el.classList.contains('left-restart') || 
             this.el.classList.contains('right-restart') || 
             this.el.classList.contains('marker-restart'))
        this.buttonType = 'restart';
    
    else if (this.el.classList.contains('mute') || 
             this.el.classList.contains('left-mute') || 
             this.el.classList.contains('right-mute') || 
             this.el.classList.contains('marker-mute'))
        this.buttonType = 'mute';
    
    else if (this.el.classList.contains('fast-backward') || 
             this.el.classList.contains('left-fast-backward') || 
             this.el.classList.contains('right-fast-backward') || 
             this.el.classList.contains('marker-fast-backward'))
        this.buttonType = 'fast-backward';
    
    else if (this.el.classList.contains('fast-forward') || 
             this.el.classList.contains('left-fast-forward') || 
             this.el.classList.contains('right-fast-forward') || 
             this.el.classList.contains('marker-fast-forward'))
        this.buttonType = 'fast-forward';
    
    else if (this.el.classList.contains('3dreset') || 
             this.el.classList.contains('left-3dreset') || 
             this.el.classList.contains('right-3dreset') || 
             this.el.classList.contains('marker-3dreset'))
        this.buttonType = 'model-reset';
    
    else if (this.el.classList.contains('roller') || 
             this.el.classList.contains('left-roller') || 
             this.el.classList.contains('right-roller') || 
             this.el.classList.contains('marker-roller'))
        this.buttonType = 'model-roll';
    
    else if (this.el.classList.contains('scroller') || 
             this.el.classList.contains('left-scroller') || 
             this.el.classList.contains('right-scroller') || 
             this.el.classList.contains('marker-scroller'))
        this.buttonType = 'scroller';
    
    else if (this.el.classList.contains('image-grid-item') || 
             this.el.classList.contains('centerpiece-grid-item'))
        this.buttonType = 'grid-image';
    
    else
        this.buttonType = 'other';
},
    
    // Show loading for certain buttons
    showLoading: function() {
    if (!this.loading) return;
    const show = ['zoom', 'model-zoom', 'restart', 'mute', 'fast-backward', 'fast-forward', 'model-reset', 'scroller', 'model-roll'].includes(this.buttonType) ||
                ((this.buttonType === 'grid-image' || this.buttonType === 'reset') && !this.triggered);
    if (show) this.loading.setVisible();
},
    
    // Start gaze timer
    startFuse: function() {
        if (this.isFusing || !this.intersected || 
            (['grid-image', 'reset', 'restart', 'mute', 'fast-backward', 'fast-forward', 'model-reset'].includes(this.buttonType) && this.triggered)) 
            return;
        
        this.isFusing = true;
        this.timer = setTimeout(() => {
            this.triggerAction();
            this.isFusing = false;
            
            if (this.intersected) {
                // Auto-repeat for zoom buttons (both image and 3D model)
                if (this.buttonType === 'zoom' || this.buttonType === 'model-zoom') {
                    this.startFuse(); // Auto-repeat for zoom
                } else if (['grid-image', 'reset', 'restart', 'mute', 'fast-backward', 'fast-forward', 'model-reset'].includes(this.buttonType)) {
                    this.triggered = true;
                    this.loading?.setInvisible();
                }
            } else {
                this.loading?.setInvisible();
            }
        }, this.data.fuseTimeout);
    },
    
    reset: function() {
        clearTimeout(this.timer);
        this.timer = null;
        this.isFusing = false;
        this.loading?.setInvisible();
    },
    
    // Execute button action
    triggerAction: function() {
        // Image Zoom buttons
         // In gaze-interaction-handler.js, update the image zoom section:

// In gaze-interaction-handler.js - update the image zoom section:

// In gaze-interaction-handler.js - update the image zoom section for marker images

if (this.buttonType === 'zoom') {
    const target = this.el.getAttribute('data-target') || 'center';
    
    let targetImage;
    if (target === 'left') {
        targetImage = getId('leftImage');
    } else if (target === 'right') {
        targetImage = getId('rightImage');
    } else if (target === 'center') {
        targetImage = getId('centerImage');
    } else if (target.startsWith('marker-')) {
        // Target the image inside the marker container
        targetImage = document.querySelector(`#${target}-container #${target}-image`);
    }
    
    if (!targetImage || !targetImage.getAttribute('visible')) return;
    
    const currentScale = targetImage.getAttribute('scale');
    const zoomMultiplier = this.data.zoomFactor;
    const action = this.el.getAttribute('data-action') || this.data.action;
    
    let zoomFactor;
    if (action === 'increase') {
        zoomFactor = (1 + zoomMultiplier);
    } else {
        zoomFactor = Math.max(0.1 / currentScale.x, (1 - zoomMultiplier));
    }
    
    targetImage.setAttribute('scale', { 
        x: currentScale.x * zoomFactor, 
        y: currentScale.y * zoomFactor, 
        z: 1 
    });
    
    if (target.startsWith('marker-')) {
        const markerValue = target.replace('marker-', '');
        const contentManager = this.scene.components['marker-content-manager'];
        if (contentManager) {
            contentManager.markerImageScales[markerValue] = currentScale.x * zoomFactor;
        }
    }
    return;
}
        
        // 3D Model Zoom buttons - WORK EXACTLY LIKE IMAGE ZOOM
        if (this.buttonType === 'model-zoom') {
        // Determine which target to zoom based on the button's data-target attribute
        const target = this.el.getAttribute('data-target') || 'center';
        
        // Get the appropriate model element
        let targetModel;
        if (target === 'left') {
            targetModel = getId('leftModel');
        } else if (target === 'right') {
            targetModel = getId('rightModel');
        } else if (target === 'center') {
            targetModel = getId('centerModel');
        } else if (target.startsWith('marker-')) {
            // For marker models
            targetModel = document.querySelector(`#${target}-model`);
        }
        
        if (!targetModel || !targetModel.getAttribute('visible')) {
            console.log(`Target model ${target} not visible or not found`);
            return;
        }
        
        const currentScale = targetModel.getAttribute('scale').x;
        const zoomMultiplier = this.data.zoomFactor;
        
        let newScale;
        if (this.data.action === '3dincrease') {
            newScale = currentScale * (1 + zoomMultiplier);
        } else {
            newScale = currentScale * (1 - zoomMultiplier);
        }
        
        targetModel.setAttribute('scale', { 
            x: newScale, 
            y: newScale, 
            z: newScale 
        });
        
        console.log(`3D model zoom ${this.data.action} on ${target}: ${currentScale.toFixed(2)} -> ${newScale.toFixed(2)}`);
        return;
    }
        
        // Reset button (for images)
       // Reset button (for images) - add marker-reset case
if (this.buttonType === 'reset' && !this.triggered) {
    // Check if this is a marker reset first
    if (this.el.classList.contains('marker-reset')) {
        const markerValue = this.el.getAttribute('data-marker-value') || 
                           this.el.getAttribute('markerValue');
        if (markerValue) {
            this.resetMarkerImage(markerValue, this.scene);
            this.triggered = true;
            return;
        }
    }
    
    // Rest of your existing reset logic for center/left/right...
    const scene = this.scene;
    const contentManager = scene.components['marker-content-manager'];
    const imageController = scene.components['image-position-controller'];
    const detectionHandler = scene.components['marker-detection-handler'];
    
    if (!imageController || !contentManager || !detectionHandler) return;
    
    // Determine which target to reset based on button's data-target or class
    let target = 'center'; // default
    if (this.el.classList.contains('left-reset')) {
        target = 'left';
    } else if (this.el.classList.contains('right-reset')) {
        target = 'right';
    }
    
    // Use the currently detected marker
    const currentMarker = detectionHandler.currentMarker;
    
    if (!currentMarker) {
        console.log('No marker is currently active');
        return;
    }
    
    // Reset based on target
    if (target === 'center') {
        const content = contentManager.getMarkerContent(currentMarker);
        if (content?.type === 'image') {
            imageController.setupImage(content.value, currentMarker, 'reset');
        }
    } else if (target === 'left') {
        const leftContent = contentManager.getLeftSideContent(currentMarker);
        if (leftContent?.type === 'image') {
            this.resetSideImage('left', leftContent, currentMarker, scene);
        }
    } else if (target === 'right') {
        const rightContent = contentManager.getRightSideContent(currentMarker);
        if (rightContent?.type === 'image') {
            this.resetSideImage('right', rightContent, currentMarker, scene);
        }
    }
    
    this.triggered = true;
}

// Also add a specific case for marker-reset if you want to handle it separately
if (this.data.action === 'marker-reset' && !this.triggered) {
    const markerValue = this.data.markerValue || this.el.getAttribute('markerValue');
    if (markerValue) {
        this.resetMarkerImage(markerValue, this.scene);
        this.triggered = true;
    }
    return;
}
        
        // 3D Model Reset button
        if (this.buttonType === 'model-reset' && !this.triggered) {
            const scene = this.scene;
            const modelController = scene.components['model-controller'];
            
            if (modelController) {
                modelController.resetModel();
            }
            
            this.triggered = true;
        }
        
        // Restart video
        if (this.buttonType === 'restart' && !this.triggered) {
            const centerVideo = getId('centerVideo');
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
            this.triggered = true;
        }
        
        // Mute/unmute video
        if (this.buttonType === 'mute' && !this.triggered) {
            const centerVideo = getId('centerVideo');
            const muteButton = this.el;
            
            if (centerVideo) {
                try {
                    const material = centerVideo.components?.material?.material;
                    if (material?.map?.image) {
                        material.map.image.muted = !material.map.image.muted;
                        const isMuted = material.map.image.muted;
                        muteButton.setAttribute('src', 
                            isMuted ? 'assets/icons/unmute.png' : 'assets/icons/mute.png'
                        );
                        this.data.action = isMuted ? 'unmute' : 'mute';
                    }
                } catch (e) {
                    console.warn('Could not toggle mute:', e);
                }
            }
            this.triggered = true;
        }
        
        // Grid image selection (handles both marker grid and centerpiece grid)
        if (this.buttonType === 'grid-image' && !this.triggered) {
            // Get the data from the element (could be the container or the image itself)
            let targetEl = this.el;
            
            // If this is a container with children, we need to get the data from the container
            const markerValue = targetEl.getAttribute('data-marker-value');
            const contentIndex = parseInt(targetEl.getAttribute('data-content-index'));
            const mediaType = targetEl.getAttribute('data-media-type');
            
            if (!markerValue) {
                console.log('No marker value found on grid item');
                return;
            }
            
            console.log(`Grid item selected: marker=${markerValue}, index=${contentIndex}, type=${mediaType}`);
            
            const scene = this.scene;
            const contentManager = scene.components['marker-content-manager'];
            const imageController = scene.components['image-position-controller'];
            const detectionHandler = scene.components['marker-detection-handler'];
            
            if (!contentManager || !detectionHandler) return;
            
            contentManager.currentContentIndex[markerValue] = contentIndex;
            const content = contentManager.getMarkerContent(markerValue);
            
            if (!content) return;
            
            // Handle different media types
            if (content.type === 'image') {
                const centerImage = getId('centerImage');
                const centerVideo = getId('centerVideo');
                const centerModel = getId('centerModel');
                const centerVideoControls = getId('centerVideoControls');
                const center3dControls = getId('center3dControls');
                
                centerImage.setVisible();
                centerVideo.setInvisible();
                centerModel.setInvisible();
                pauseVideo(centerVideo);
                
                if (centerVideoControls) centerVideoControls.setInvisible();
                if (center3dControls) center3dControls.setInvisible();
                
                if (imageController) {
                    imageController.setupImage(content.value, markerValue, 'centerControls');
                } 
            } else if (content.type === 'video') {
                detectionHandler.showVideo(content.value, markerValue, scene);
            } else if (content.type === '3d') {
                // For 3D models selected from grid, use original scale from content.json
                const modelController = scene.components['model-controller'];
                const originalScale = content.scale || 1;
                
                if (modelController && modelController.handleGridSelection) {
                    modelController.handleGridSelection(markerValue, originalScale);
                }
                
                // Show the 3D model - this will now use the scale we just set
                detectionHandler.show3DModel(content.value, markerValue, scene);
            }
            
            this.updateNavigationVisibility(markerValue, contentManager);
            
            if (detectionHandler.updateGridVisibility) {
                detectionHandler.updateGridVisibility(markerValue, contentManager);
            }
            
            this.triggered = true;
        }
        
        // Video fast backward
        if (this.buttonType === 'fast-backward' && !this.triggered) {
            const centerVideo = getId('centerVideo');
            if (centerVideo) {
                try {
                    const material = centerVideo.components?.material?.material;
                    if (material?.map?.image) {
                        const video = material.map.image;
                        video.currentTime = Math.max(0, video.currentTime - 10);
                    }
                } catch (e) {
                    console.warn('Could not skip video backward:', e);
                }
            }
            this.triggered = true;
        }
        
        // Video fast forward
        if (this.buttonType === 'fast-forward' && !this.triggered) {
            const centerVideo = getId('centerVideo');
            if (centerVideo) {
                try {
                    const material = centerVideo.components?.material?.material;
                    if (material?.map?.image) {
                        const video = material.map.image;
                        video.currentTime = Math.min(video.duration, video.currentTime + 10);
                    }
                } catch (e) {
                    console.warn('Could not skip video forward:', e);
                }
            }
            this.triggered = true;
        }
    },

    // Reset side image (left or right)
resetSideImage: function(side, content, markerValue, scene) {
    const sideImage = getId(`${side}Image`);
    if (!sideImage) return;
    
    const contentScale = content.scale || 1;
    const baseSize = 3 * contentScale;
    
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
        
        // Reset position and scale in a single operation
        sideImage.setAttribute('position', { x: 0, y: 0, z: 0 });
        sideImage.setAttribute('src', content.value);
        sideImage.setAttribute('width', width);
        sideImage.setAttribute('height', height);
        sideImage.setAttribute('scale', { x: 1, y: 1, z: 1 });
        
        console.log(`Reset ${side} image for marker ${markerValue} to scale: ${width.toFixed(2)}x${height.toFixed(2)}`);
    };
    
    img.onerror = () => {
        console.error(`Failed to load image for reset: ${content.value}`);
    };
    
    img.src = content.value;
},

// Reset marker image
// Update the resetMarkerImage function in gaze-interaction-handler.js
resetMarkerImage: function(markerValue, scene) {
    const markerImage = document.querySelector(`#marker-${markerValue}-container #marker-${markerValue}-image`);
    if (!markerImage) {
        console.log(`Marker image not found for ${markerValue}`);
        return;
    }
    
    const contentManager = scene.components['marker-content-manager'];
    const currentIndex = contentManager?.currentContentIndex[markerValue] || 0;
    const markerItems = contentManager?.markerData?.[markerValue] || [];
    const currentItem = markerItems[currentIndex];
    
    if (!currentItem || currentItem.type !== 'image') {
        console.log(`Current item for marker ${markerValue} is not an image`);
        return;
    }
    
    const baseScale = currentItem.scale || 1;
    
    // Reset position to 0,0,0
    markerImage.setAttribute('position', { x: 0, y: 0, z: 0 });
    
    // Reset scale in content manager
    if (contentManager) {
        contentManager.markerImageScales[markerValue] = 1;
    }
    
    // Create a temporary image to get natural dimensions and set proper scale
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        
        // Set scale based on aspect ratio (maintain proportions)
        // For marker images, we want them to lie flat (rotation -90) so scale accordingly
        // width = baseScale * aspectRatio, height = baseScale
        const width = baseScale * aspectRatio;
        const height = baseScale;
        
        markerImage.setAttribute('scale', `${width} ${height} 1`);
        
        console.log(`Reset marker image for ${markerValue} to position (0,0,0) and scale: ${width.toFixed(2)}x${height}`);
    };
    
    img.onerror = () => {
        console.error(`Failed to load image for reset: ${currentItem.src}`);
        // Fallback: just set a default square scale
        markerImage.setAttribute('scale', `${baseScale} ${baseScale} 1`);
    };
    
    img.src = currentItem.src;
},
    
    // Update navigation visibility
    updateNavigationVisibility: function(markerValue, contentManager) {
        const marker = document.querySelector(`a-marker[value="${markerValue}"]`);
        if (!marker) return;
        
        const detectionHandler = this.scene.components['marker-detection-handler'];
        if (detectionHandler?.updateNavigationVisibility) {
            detectionHandler.updateNavigationVisibility(marker, markerValue, contentManager);
        }
    },
    
    remove: function() {
        this.reset();
        this.el.removeEventListener('raycaster-intersected', () => {});
        this.el.removeEventListener('raycaster-intersected-cleared', () => {});
    }
});