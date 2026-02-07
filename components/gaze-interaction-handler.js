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
        if (this.el.classList.contains('zoom-button')) this.buttonType = 'zoom';
        else if (this.el.classList.contains('reset')) this.buttonType = 'reset';
        else if (this.el.classList.contains('restart')) this.buttonType = 'restart';
        else if (this.el.classList.contains('mute')) this.buttonType = 'mute';
        else if (this.el.classList.contains('fast-backward')) this.buttonType = 'fast-backward';
        else if (this.el.classList.contains('fast-forward')) this.buttonType = 'fast-forward';
        else if (this.el.classList.contains('model-zoom-button')) this.buttonType = 'model-zoom';
        else if (this.el.classList.contains('3dreset')) this.buttonType = 'model-reset';
        else if (this.el.classList.contains('roller')) this.buttonType = 'model-roll';
        else if (this.el.classList.contains('image-grid-item') && this.el.tagName.toLowerCase() === 'a-image') 
            this.buttonType = 'grid-image';
        else this.buttonType = 'other';
    },
    
    // Show loading for certain buttons
    showLoading: function() {
        if (!this.loading) return;
        const show = ['zoom', 'model-zoom', 'restart', 'mute', 'fast-backward', 'fast-forward', 'model-reset'].includes(this.buttonType) ||
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
        if (this.buttonType === 'zoom') {
            const centerImage = getId('centerImage');
            if (!centerImage) return;
            
            const currentScale = centerImage.getAttribute('scale').x;
            const zoomMultiplier = this.data.zoomFactor;
            let newScale = this.data.action === 'increase' 
                ? currentScale * (1 + zoomMultiplier)
                : Math.max(0.1, currentScale * (1 - zoomMultiplier));
            
            centerImage.setAttribute('scale', { x: newScale, y: newScale, z: newScale });
            return;
        } 
        
        // 3D Model Zoom buttons - WORK EXACTLY LIKE IMAGE ZOOM
        if (this.buttonType === 'model-zoom') {
            const centerModel = getId('centerModel');
            if (!centerModel || !centerModel.getAttribute('visible')) return;
            
            const currentScale = centerModel.getAttribute('scale').x;
            const zoomMultiplier = this.data.zoomFactor;
            
            let newScale;
            if (this.data.action === '3dincrease') {
                newScale = currentScale * (1 + zoomMultiplier);
            } else {
                newScale = currentScale * (1 - zoomMultiplier);
            }
            
            centerModel.setAttribute('scale', { 
                x: newScale, 
                y: newScale, 
                z: newScale 
            });
            
            console.log(`3D model zoom ${this.data.action}: ${currentScale.toFixed(2)} -> ${newScale.toFixed(2)}`);
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
        
        // Grid image selection
        // In gaze-interaction-handler.js, update the grid image selection section:
        if (this.buttonType === 'grid-image' && !this.triggered) {
            const imageSrc = this.el.getAttribute('src');
            const markerValue = this.el.getAttribute('data-marker-value');
            const contentIndex = parseInt(this.el.getAttribute('data-content-index'));
            const mediaType = this.el.getAttribute('data-media-type');
            
            if (!markerValue) return;
            
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