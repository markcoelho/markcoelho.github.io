// interaction-handler.js - Updated section for mute buttons

AFRAME.registerComponent('interaction-handler', {
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
            this.el.classList.contains('marker-zoom-button'))
            this.buttonType = 'zoom';
        
        // Check for model zoom buttons (including marker model zoom)
        else if (this.el.classList.contains('model-zoom-button') || 
                 this.el.classList.contains('left-model-zoom-button') || 
                 this.el.classList.contains('right-model-zoom-button') || 
                 this.el.classList.contains('marker-model-zoom-button'))
            this.buttonType = 'model-zoom';
        
        // Check for reset buttons (image reset)
        else if (this.el.classList.contains('reset') || 
                 this.el.classList.contains('left-reset') || 
                 this.el.classList.contains('right-reset') ||
                 this.el.classList.contains('marker-reset'))
            this.buttonType = 'reset';
        
        // Check for 3D model reset buttons
        else if (this.el.classList.contains('3dreset') || 
                 this.el.classList.contains('left-3dreset') || 
                 this.el.classList.contains('right-3dreset') || 
                 this.el.classList.contains('marker-3dreset'))
            this.buttonType = 'model-reset';
        
        else if (this.el.classList.contains('restart') || 
                 this.el.classList.contains('left-restart') || 
                 this.el.classList.contains('right-restart') || 
                 this.el.classList.contains('marker-restart'))
            this.buttonType = 'restart';
        
        // MUTE BUTTONS - handle all mute button variants
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
            this.el.classList.contains('centerpiece-grid-item') ||
            this.el.classList.contains('left-grid-item') ||      // Add this
            this.el.classList.contains('right-grid-item'))       // Add this
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
                const contentManager = this.scene.components['content-manager'];
                if (contentManager) {
                    contentManager.markerImageScales[markerValue] = currentScale.x * zoomFactor;
                }
            }
            return;
        }
        
        // 3D Model Zoom buttons
        if (this.buttonType === 'model-zoom') {
            const target = this.el.getAttribute('data-target') || 'center';
            
            let targetModel;
            if (target === 'left') {
                targetModel = getId('leftModel');
            } else if (target === 'right') {
                targetModel = getId('rightModel');
            } else if (target === 'center') {
                targetModel = getId('centerModel');
            } else if (target.startsWith('marker-')) {
                targetModel = document.querySelector(`#${target}-container #${target}-model`);
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
            
            // Save the zoom level for this model
            if (target.startsWith('marker-')) {
                const markerValue = target.replace('marker-', '');
                const contentManager = this.scene.components['content-manager'];
                if (contentManager) {
                    contentManager.markerModelScales[markerValue] = newScale;
                }
            } else if (target === 'center') {
                const detectionHandler = this.scene.components['marker-detection'];
                if (detectionHandler && detectionHandler.currentMarker) {
                    const modelController = this.scene.components['model-controller'];
                    if (modelController && modelController.modelScales) {
                        modelController.modelScales[detectionHandler.currentMarker] = newScale;
                    }
                }
            }
            
            console.log(`3D model zoom ${this.data.action} on ${target}: ${currentScale.toFixed(2)} -> ${newScale.toFixed(2)}`);
            return;
        }
        
        // Reset button (for images)
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
            const contentManager = scene.components['content-manager'];
            const imageController = scene.components['image-controller'];
            const detectionHandler = scene.components['marker-detection'];
            
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
        
        // 3D Model Reset button - FIXED VERSION
        if (this.buttonType === 'model-reset' && !this.triggered) {
            const scene = this.scene;
            const modelController = scene.components['model-controller'];
            const detectionHandler = scene.components['marker-detection'];
            
            if (!modelController) {
                console.log('Model controller not found');
                return;
            }
            
            // Determine which target to reset based on button class
            let target = 'center'; // default
            let markerValue = null;
            
            if (this.el.classList.contains('left-3dreset')) {
                target = 'left';
            } else if (this.el.classList.contains('right-3dreset')) {
                target = 'right';
            } else if (this.el.classList.contains('marker-3dreset')) {
                // For marker 3D reset, get marker value from data attribute
                markerValue = this.el.getAttribute('data-marker-value') || 
                              this.el.getAttribute('markerValue') || 
                              this.el.getAttribute('data-target');
                if (markerValue && markerValue.startsWith('marker-')) {
                    markerValue = markerValue.replace('marker-', '');
                }
                target = `marker-${markerValue}`;
            }
            
            console.log(`3D Model Reset requested for target: ${target}, markerValue: ${markerValue}`);
            
            // Call resetModel with appropriate target
            if (target === 'center') {
                const currentMarker = detectionHandler?.currentMarker;
                if (currentMarker) {
                    modelController.resetModel('center');
                }
            } else if (target === 'left') {
                modelController.resetModel('left');
            } else if (target === 'right') {
                modelController.resetModel('right');
            } else if (target.startsWith('marker-')) {
                modelController.resetModel(target);
            }
            
            this.triggered = true;
        }
        
        // Restart video - handle center, left, and right
        if (this.buttonType === 'restart' && !this.triggered) {
            const target = this.getVideoTarget();
            const videoElement = this.getVideoElement(target);
            
            if (videoElement) {
                try {
                    const material = videoElement.components?.material?.material;
                    if (material?.map?.image) {
                        material.map.image.currentTime = 0;
                        material.map.image.play().catch(e => {
                            console.warn(`Could not play ${target} video:`, e);
                        });
                    }
                } catch (e) {
                    console.warn(`Could not restart ${target} video:`, e);
                }
            }
            this.triggered = true;
        }
        
        // Mute/unmute video - UPDATED to handle center, left, and right
        if (this.buttonType === 'mute' && !this.triggered) {
            const target = this.getVideoTarget();
            const videoElement = this.getVideoElement(target);
            const muteButton = this.el;
            
            if (videoElement) {
                try {
                    const material = videoElement.components?.material?.material;
                    if (material?.map?.image) {
                        // Toggle mute state
                        material.map.image.muted = !material.map.image.muted;
                        const isMuted = material.map.image.muted;
                        
                        // Update button icon based on mute state and target
                        let iconPath;
                        if (isMuted) {
                            iconPath = target === 'center' ? 'assets/icons/unmute.png' : 
                                      target === 'left' ? 'assets/icons/unmute.png' : 
                                      target === 'right' ? 'assets/icons/unmute.png' : 
                                      'assets/icons/unmute.png';
                        } else {
                            iconPath = target === 'center' ? 'assets/icons/mute.png' : 
                                      target === 'left' ? 'assets/icons/mute.png' : 
                                      target === 'right' ? 'assets/icons/mute.png' : 
                                      'assets/icons/mute.png';
                        }
                        
                        muteButton.setAttribute('src', iconPath);
                        
                        // Update action for future toggles
                        this.data.action = isMuted ? 'unmute' : 'mute';
                        
                        console.log(`${target} video ${isMuted ? 'muted' : 'unmuted'}`);
                    }
                } catch (e) {
                    console.warn(`Could not toggle mute for ${target} video:`, e);
                }
            }
            this.triggered = true;
        }
        
        // Grid image selection
        if (this.buttonType === 'grid-image') {
    // First check if it's a side grid item
    const side = this.el.getAttribute('data-side') || 
                 (this.el.classList.contains('left-grid-item') ? 'left' : 
                  this.el.classList.contains('right-grid-item') ? 'right' : null);
    
    if (side && !this.triggered) {
        const targetEl = this.el;
        const markerValue = targetEl.getAttribute('data-marker-value');
        const contentIndex = parseInt(targetEl.getAttribute('data-content-index'));
        const mediaType = targetEl.getAttribute('data-media-type');
        
        if (!markerValue || !side) {
            console.log('Missing marker value or side on grid item');
            return;
        }
        
        console.log(`Side grid item selected: ${side}, marker=${markerValue}, index=${contentIndex}, type=${mediaType}`);
        
        const scene = this.scene;
        const contentManager = scene.components['content-manager'];
        const detectionHandler = scene.components['marker-detection'];
        
        if (!contentManager || !detectionHandler) {
            console.log('Content manager or detection handler not found');
            return;
        }
        
        // Get the specific item from markerData for this side
        const sideItems = (contentManager.markerData?.[markerValue] || []).filter(item => item.side === side);
        const selectedItem = sideItems[contentIndex];
        
        if (!selectedItem) {
            console.log(`No ${side} item found at index ${contentIndex}`);
            return;
        }
        
        console.log(`Selected ${side} item:`, selectedItem);
        
        // Show the selected content in the appropriate side piece
        if (side === 'left') {
            // Hide all left content first
            const leftImage = getId('leftImage');
            const leftVideo = getId('leftVideo');
            const leftModel = getId('leftModel');
            
            if (leftImage) leftImage.setAttribute('visible', 'false');
            if (leftVideo) leftVideo.setAttribute('visible', 'false');
            if (leftModel) leftModel.setAttribute('visible', 'false');
            
            // Show the selected content
            detectionHandler.showLeftPieceContent(selectedItem, markerValue, scene);
            detectionHandler.updateLeftPieceControls(selectedItem, markerValue);
        } else if (side === 'right') {
            // Hide all right content first
            const rightImage = getId('rightImage');
            const rightVideo = getId('rightVideo');
            const rightModel = getId('rightModel');
            
            if (rightImage) rightImage.setAttribute('visible', 'false');
            if (rightVideo) rightVideo.setAttribute('visible', 'false');
            if (rightModel) rightModel.setAttribute('visible', 'false');
            
            // Show the selected content
            detectionHandler.showRightPieceContent(selectedItem, markerValue, scene);
            detectionHandler.updateRightPieceControls(selectedItem, markerValue);
        }
        
        this.triggered = true;
        return;
    }
    
    // If not a side grid item, handle centerpiece grid selection
    let targetEl = this.el;
    
    const markerValue = targetEl.getAttribute('data-marker-value');
    const contentIndex = parseInt(targetEl.getAttribute('data-content-index'));
    const mediaType = targetEl.getAttribute('data-media-type');
    
    if (!markerValue) {
        console.log('No marker value found on grid item');
        return;
    }
    
    console.log(`Grid item selected: marker=${markerValue}, index=${contentIndex}, type=${mediaType}`);
    
    const scene = this.scene;
    const contentManager = scene.components['content-manager'];
    const imageController = scene.components['image-controller'];
    const detectionHandler = scene.components['marker-detection'];
    
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
        
        // Play audio if present
        if (content.audio && content.audio !== "") {
            detectionHandler.playContentAudio(content.audio);
        }
        
        if (imageController) {
            imageController.setupImage(content.value, markerValue, 'centerControls');
        } 
    } else if (content.type === 'video') {
        detectionHandler.showVideo(content.value, markerValue, scene);
    } else if (content.type === '3d') {
        const modelController = scene.components['model-controller'];
        const originalScale = content.scale || 1;
        
        // Play audio if present
        if (content.audio && content.audio !== "") {
            detectionHandler.playContentAudio(content.audio);
        }
        
        if (modelController && modelController.handleGridSelection) {
            modelController.handleGridSelection(markerValue, originalScale);
        }
        
        detectionHandler.show3DModel(content.value, markerValue, scene);
    }
    
    this.updateNavigationVisibility(markerValue, contentManager);
    
    if (detectionHandler.updateGridVisibility) {
        detectionHandler.updateGridVisibility(markerValue, contentManager);
    }
    
    this.triggered = true;
}


        
        if (this.buttonType === 'grid-image' && this.el.getAttribute('data-side')) {
    const targetEl = this.el;
    const markerValue = targetEl.getAttribute('data-marker-value');
    const contentIndex = parseInt(targetEl.getAttribute('data-content-index'));
    const mediaType = targetEl.getAttribute('data-media-type');
    const side = targetEl.getAttribute('data-side');
    
    if (!markerValue || !side) {
        console.log('Missing marker value or side on grid item');
        return;
    }
    
    console.log(`Side grid item selected: ${side}, marker=${markerValue}, index=${contentIndex}, type=${mediaType}`);
    
    const scene = this.scene;
    const contentManager = scene.components['content-manager'];
    const detectionHandler = scene.components['marker-detection'];
    
    if (!contentManager || !detectionHandler) return;
    
    // Get the specific item from markerData for this side
    const sideItems = (contentManager.markerData?.[markerValue] || []).filter(item => item.side === side);
    const selectedItem = sideItems[contentIndex];
    
    if (!selectedItem) {
        console.log(`No ${side} item found at index ${contentIndex}`);
        return;
    }
    
    // Show the selected content in the appropriate side piece
    if (side === 'left') {
        detectionHandler.showLeftPieceContent(selectedItem, markerValue, scene);
        detectionHandler.updateLeftPieceControls(selectedItem, markerValue);
    } else if (side === 'right') {
        detectionHandler.showRightPieceContent(selectedItem, markerValue, scene);
        detectionHandler.updateRightPieceControls(selectedItem, markerValue);
    }
    
    this.triggered = true;
}


        // Video fast backward - handle center, left, and right
        if (this.buttonType === 'fast-backward' && !this.triggered) {
            const target = this.getVideoTarget();
            const videoElement = this.getVideoElement(target);
            
            if (videoElement) {
                try {
                    const material = videoElement.components?.material?.material;
                    if (material?.map?.image) {
                        const video = material.map.image;
                        video.currentTime = Math.max(0, video.currentTime - 10);
                        console.log(`${target} video fast backward to ${video.currentTime.toFixed(1)}s`);
                    }
                } catch (e) {
                    console.warn(`Could not skip ${target} video backward:`, e);
                }
            }
            this.triggered = true;
        }
        
        // Video fast forward - handle center, left, and right
        if (this.buttonType === 'fast-forward' && !this.triggered) {
            const target = this.getVideoTarget();
            const videoElement = this.getVideoElement(target);
            
            if (videoElement) {
                try {
                    const material = videoElement.components?.material?.material;
                    if (material?.map?.image) {
                        const video = material.map.image;
                        video.currentTime = Math.min(video.duration, video.currentTime + 10);
                        console.log(`${target} video fast forward to ${video.currentTime.toFixed(1)}s`);
                    }
                } catch (e) {
                    console.warn(`Could not skip ${target} video forward:`, e);
                }
            }
            this.triggered = true;
        }
    },

    // Helper method to determine which video target this button is for
    getVideoTarget: function() {
        if (this.el.classList.contains('left-mute') || 
            this.el.classList.contains('left-restart') || 
            this.el.classList.contains('left-fast-backward') || 
            this.el.classList.contains('left-fast-forward')) {
            return 'left';
        } else if (this.el.classList.contains('right-mute') || 
                   this.el.classList.contains('right-restart') || 
                   this.el.classList.contains('right-fast-backward') || 
                   this.el.classList.contains('right-fast-forward')) {
            return 'right';
        } else if (this.el.classList.contains('marker-mute') || 
                   this.el.classList.contains('marker-restart') || 
                   this.el.classList.contains('marker-fast-backward') || 
                   this.el.classList.contains('marker-fast-forward')) {
            return 'marker';
        } else {
            return 'center'; // default
        }
    },

    // Helper method to get the appropriate video element
    getVideoElement: function(target) {
        if (target === 'center') {
            return getId('centerVideo');
        } else if (target === 'left') {
            return getId('leftVideo');
        } else if (target === 'right') {
            return getId('rightVideo');
        } else if (target === 'marker') {
            // For marker videos, we need to get the current marker value
            const detectionHandler = this.scene.components['marker-detection'];
            if (detectionHandler && detectionHandler.currentMarker) {
                return document.querySelector(`#marker-${detectionHandler.currentMarker}-container #marker-${detectionHandler.currentMarker}-video`);
            }
        }
        return null;
    },

    // Reset side image (left or right)
    resetSideImage: function(side, content, markerValue, scene) {
        const sideImage = getId(`${side}Image`);
        if (!sideImage) return;
        
        const contentScale = content.scale || 1;
        const baseSize = 3 * contentScale;
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            const aspectRatio = img.naturalWidth / img.naturalHeight;
            
            let width, height;
            if (aspectRatio >= 1) {
                width = baseSize;
                height = baseSize / aspectRatio;
            } else {
                width = baseSize * aspectRatio;
                height = baseSize;
            }
            
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
    resetMarkerImage: function(markerValue, scene) {
        const markerImage = document.querySelector(`#marker-${markerValue}-container #marker-${markerValue}-image`);
        if (!markerImage) {
            console.log(`Marker image not found for ${markerValue}`);
            return;
        }
        
        const contentManager = scene.components['content-manager'];
        const currentIndex = contentManager?.currentContentIndex[markerValue] || 0;
        const markerItems = contentManager?.markerData?.[markerValue] || [];
        const currentItem = markerItems[currentIndex];
        
        if (!currentItem || currentItem.type !== 'image') {
            console.log(`Current item for marker ${markerValue} is not an image`);
            return;
        }
        
        const baseScale = currentItem.scale || 1;
        
        markerImage.setAttribute('position', { x: 0, y: 0, z: 0 });
        
        if (contentManager) {
            contentManager.markerImageScales[markerValue] = 1;
        }
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            const aspectRatio = img.naturalWidth / img.naturalHeight;
            const width = baseScale * aspectRatio;
            const height = baseScale;
            
            markerImage.setAttribute('scale', `${width} ${height} 1`);
            
            console.log(`Reset marker image for ${markerValue} to position (0,0,0) and scale: ${width.toFixed(2)}x${height}`);
        };
        
        img.onerror = () => {
            console.error(`Failed to load image for reset: ${currentItem.src}`);
            markerImage.setAttribute('scale', `${baseScale} ${baseScale} 1`);
        };
        
        img.src = currentItem.src;
    },
    
    // Update navigation visibility
    updateNavigationVisibility: function(markerValue, contentManager) {
        const marker = document.querySelector(`a-marker[value="${markerValue}"]`);
        if (!marker) return;
        
        const detectionHandler = this.scene.components['marker-detection'];
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