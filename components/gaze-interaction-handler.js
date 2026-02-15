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

if (this.buttonType === 'zoom') {
    // Determine which target to zoom based on the button's data-target attribute
    const target = this.el.getAttribute('data-target') || 'center';
    
    // Get the appropriate image element
    let targetImage;
    if (target === 'left') {
        targetImage = getId('leftImage');
    } else if (target === 'right') {
        targetImage = getId('rightImage');
    } else if (target === 'center') {
        targetImage = getId('centerImage');
    } else if (target.startsWith('marker-')) {
        // For marker images
        targetImage = document.querySelector(`#${target}-image`);
    }
    
    if (!targetImage || !targetImage.getAttribute('visible')) {
        console.log(`Target image ${target} not visible or not found`);
        return;
    }
    
    const currentScale = targetImage.getAttribute('scale').x;
    const zoomMultiplier = this.data.zoomFactor;
    
    // Check both the data-action attribute and the component's action
    const action = this.el.getAttribute('data-action') || this.data.action;
    
    let newScale;
    if (action === 'increase') {
        newScale = currentScale * (1 + zoomMultiplier);
    } else {
        newScale = Math.max(0.1, currentScale * (1 - zoomMultiplier));
    }
    
    targetImage.setAttribute('scale', { x: newScale, y: newScale, z: newScale });
    
    // SAVE THE SCALE FOR MARKER IMAGES
    if (target.startsWith('marker-')) {
        const markerValue = target.replace('marker-', '');
        const scene = this.el.sceneEl;
        const contentManager = scene.components['marker-content-manager'];
        
        if (contentManager) {
            // Calculate user scale factor relative to original
            const originalScale = contentManager.markerOriginalScales[markerValue] || 1;
            const userScale = newScale / originalScale;
            contentManager.markerImageScales[markerValue] = userScale;
            console.log(`Saved marker ${markerValue} image user scale: ${userScale}`);
        }
    }
    
    console.log(`Image zoom on ${target}: action=${action}, scale ${currentScale.toFixed(2)} -> ${newScale.toFixed(2)}`);
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
        if (this.buttonType === 'reset' && !this.triggered) {
            const scene = this.scene;
            const contentManager = scene.components['marker-content-manager'];
            const imageController = scene.components['image-position-controller'];
            const detectionHandler = scene.components['marker-detection-handler'];
            
            if (!imageController || !contentManager || !detectionHandler) return;
            
            // Use the currently detected marker
            const currentMarker = detectionHandler.currentMarker;
            
            if (!currentMarker) {
                console.log('No marker is currently active');
                return;
            }
            
            // Only reset the current marker's image
            const content = contentManager.getMarkerContent(currentMarker);
            if (content?.type === 'image') {
                imageController.setupImage(content.value, currentMarker, 'reset');
            } else {
                console.log('Current content is not an image, cannot reset');
            }
            
            this.triggered = true;
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