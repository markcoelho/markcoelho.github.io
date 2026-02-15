// model-controller.js - Fixed version
AFRAME.registerComponent('model-controller', {
    schema: {
        minScale: { default: 0.1 },
        maxScale: { default: 10 },
        rotationStep: { default: 1 }, // Degrees to rotate per action
        rotationInterval: { default: 25 } // ms between rotation actions
    },
    
    init: function() {
        this.centerModel = getId('centerModel');
        this.leftModel = getId('leftModel');
        this.rightModel = getId('rightModel');
        
        this.currentMarker = null;
        this.modelScales = {}; // Store user-adjusted scale per marker
        this.originalScales = {}; // Store original scale from content.json per marker
        this.modelRotations = {}; // Store user-adjusted rotation per marker
        
        // Store active rotation sessions by target
        this.activeRotationSessions = {}; // { targetId: { activeRollers: Set, rotateTimer: null, targetModel: entity } }
        
        // Track which marker has 3D content from ANY source
        this.el.sceneEl.addEventListener('markerFound', (evt) => {
            const marker = evt.target;
            const markerValue = marker.getAttribute('value');
            const scene = this.el.sceneEl;
            const contentManager = scene.components['marker-content-manager'];
            
            if (contentManager) {
                const content = contentManager.getMarkerContent(markerValue);
                if (content?.type === '3d') {
                    this.setCurrentMarker(markerValue, content.scale || 1);
                }
            }
        });
        
        // Set up roller listeners for all targets
        this.setupRollerListeners();
        
        // Observe for dynamically added marker rollers
        this.observeMarkerRollers();
    },
    
    setupRollerListeners: function() {
        // Setup for centerpiece rollers (IDs: roller-up, roller-right, etc.)
        this.setupCenterRollers();
        
        // Setup for leftpiece rollers
        this.setupRollerListenersForTarget('left');
        
        // Setup for rightpiece rollers
        this.setupRollerListenersForTarget('right');
    },
    
    setupCenterRollers: function() {
        const rollers = document.querySelectorAll('.roller');
        
        rollers.forEach(roller => {
            // Remove any existing listeners
            roller.removeEventListener('raycaster-intersected', this.onCenterRollerIntersect);
            roller.removeEventListener('raycaster-intersected-cleared', this.onCenterRollerIntersectCleared);
            
            // Add new listeners
            roller.addEventListener('raycaster-intersected', (evt) => {
                this.onCenterRollerIntersect(evt);
            });
            
            roller.addEventListener('raycaster-intersected-cleared', (evt) => {
                this.onCenterRollerIntersectCleared(evt);
            });
        });
    },
    
    onCenterRollerIntersect: function(evt) {
        const roller = evt.target;
        if (roller.classList.contains('not-interactive')) return;
        
        // Get the target model element
        const targetModel = this.centerModel;
        if (!targetModel || !targetModel.getAttribute('visible')) return;
        
        const sessionId = 'rotate-center';
        
        // Initialize session if needed
        if (!this.activeRotationSessions[sessionId]) {
            this.activeRotationSessions[sessionId] = {
                activeRollers: new Set(),
                rotateTimer: null,
                targetModel: targetModel,
                target: 'center'
            };
        }
        
        this.activeRotationSessions[sessionId].activeRollers.add(roller.id);
        this.startRotation(sessionId);
    },
    
    onCenterRollerIntersectCleared: function(evt) {
        const roller = evt.target;
        const sessionId = 'rotate-center';
        
        if (this.activeRotationSessions[sessionId]) {
            this.activeRotationSessions[sessionId].activeRollers.delete(roller.id);
            
            if (this.activeRotationSessions[sessionId].activeRollers.size === 0) {
                this.stopRotation(sessionId);
            }
        }
    },
    
    setupRollerListenersForTarget: function(target) {
        const rollers = document.querySelectorAll(`.${target}-roller`);
        
        rollers.forEach(roller => {
            // Remove any existing listeners
            roller.removeEventListener('raycaster-intersected', this.onRollerIntersect);
            roller.removeEventListener('raycaster-intersected-cleared', this.onRollerIntersectCleared);
            
            // Add new listeners with bound target
            roller.addEventListener('raycaster-intersected', (evt) => {
                this.onRollerIntersect(evt, target);
            });
            
            roller.addEventListener('raycaster-intersected-cleared', (evt) => {
                this.onRollerIntersectCleared(evt, target);
            });
        });
    },
    
    onRollerIntersect: function(evt, target) {
        const roller = evt.target;
        if (roller.classList.contains('not-interactive')) return;
        
        // Get the target model element
        const targetModel = this.getTargetModel(target);
        if (!targetModel || !targetModel.getAttribute('visible')) return;
        
        const sessionId = `rotate-${target}`;
        
        // Initialize session if needed
        if (!this.activeRotationSessions[sessionId]) {
            this.activeRotationSessions[sessionId] = {
                activeRollers: new Set(),
                rotateTimer: null,
                targetModel: targetModel,
                target: target
            };
        }
        
        this.activeRotationSessions[sessionId].activeRollers.add(roller.id);
        this.startRotation(sessionId);
    },
    
    onRollerIntersectCleared: function(evt, target) {
        const roller = evt.target;
        const sessionId = `rotate-${target}`;
        
        if (this.activeRotationSessions[sessionId]) {
            this.activeRotationSessions[sessionId].activeRollers.delete(roller.id);
            
            if (this.activeRotationSessions[sessionId].activeRollers.size === 0) {
                this.stopRotation(sessionId);
            }
        }
    },
    
    getTargetModel: function(target) {
        switch(target) {
            case 'center': return this.centerModel;
            case 'left': return this.leftModel;
            case 'right': return this.rightModel;
            default: return null;
        }
    },
    
    startRotation: function(sessionId) {
        const session = this.activeRotationSessions[sessionId];
        if (!session || session.rotateTimer) return;
        
        session.rotateTimer = setInterval(() => {
            this.continuousRotate(sessionId);
        }, this.data.rotationInterval);
    },
    
    stopRotation: function(sessionId) {
        const session = this.activeRotationSessions[sessionId];
        if (session && session.rotateTimer) {
            clearInterval(session.rotateTimer);
            session.rotateTimer = null;
        }
    },
    
    continuousRotate: function(sessionId) {
    const session = this.activeRotationSessions[sessionId];
    if (!session || !session.targetModel || session.activeRollers.size === 0) {
        this.stopRotation(sessionId);
        return;
    }
    
    const currentRotation = session.targetModel.getAttribute('rotation');
    const target = session.target;
    let rotateY = 0, rotateZ = 0;
    
    // Define rotation directions based on target
    const rotations = {};
    
    if (target === 'center') {
        rotations['roller-up'] = () => rotateZ -= this.data.rotationStep;
        rotations['roller-down'] = () => rotateZ += this.data.rotationStep;
        rotations['roller-left'] = () => rotateY += this.data.rotationStep;
        rotations['roller-right'] = () => rotateY -= this.data.rotationStep;
    } else if (target && target.startsWith('marker-')) {
        // Marker rollers have IDs like 'marker-roller-up', 'marker-roller-down', etc.
        rotations['marker-roller-up'] = () => rotateZ -= this.data.rotationStep;
        rotations['marker-roller-down'] = () => rotateZ += this.data.rotationStep;
        rotations['marker-roller-left'] = () => rotateY += this.data.rotationStep;
        rotations['marker-roller-right'] = () => rotateY -= this.data.rotationStep;
    } else {
        rotations[`${target}-roller-up`] = () => rotateZ -= this.data.rotationStep;
        rotations[`${target}-roller-down`] = () => rotateZ += this.data.rotationStep;
        rotations[`${target}-roller-left`] = () => rotateY += this.data.rotationStep;
        rotations[`${target}-roller-right`] = () => rotateY -= this.data.rotationStep;
    }
    
    // Apply rotations from all active rollers
    session.activeRollers.forEach(id => {
        if (rotations[id]) rotations[id]();
    });
    
    // Apply the rotation
    session.targetModel.setAttribute('rotation', {
        x: currentRotation.x,
        y: currentRotation.y + rotateY,
        z: currentRotation.z + rotateZ
    });
    
    // Save rotation state if this is for center model with a current marker
    if (target === 'center' && this.currentMarker) {
        this.saveRotationForMarker(this.currentMarker, session.targetModel);
    } else if (target && target.startsWith('marker-')) {
        // Save rotation for marker models
        const markerValue = target.replace('marker-', '');
        if (markerValue) {
            this.saveRotationForMarker(markerValue, session.targetModel);
        }
    }
},
    
    // Observe for dynamically added marker rollers
    observeMarkerRollers: function() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        // Check if this is a marker roller
                        if (node.classList && node.classList.contains('marker-roller')) {
                            this.setupMarkerRoller(node);
                        }
                        
                        // Also check children
                        if (node.querySelectorAll) {
                            node.querySelectorAll('.marker-roller').forEach(roller => {
                                this.setupMarkerRoller(roller);
                            });
                        }
                    }
                });
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    },
    
    setupMarkerRoller: function(roller) {
        // Get marker value from the roller's data-target
        const markerTarget = roller.getAttribute('data-target');
        if (!markerTarget || !markerTarget.startsWith('marker-')) return;
        
        const markerValue = markerTarget.replace('marker-', '');
        
        roller.addEventListener('raycaster-intersected', (evt) => {
            this.onMarkerRollerIntersect(evt, markerValue, markerTarget);
        });
        
        roller.addEventListener('raycaster-intersected-cleared', (evt) => {
            this.onMarkerRollerIntersectCleared(evt, markerValue, markerTarget);
        });
    },
    
    onMarkerRollerIntersect: function(evt, markerValue, markerTarget) {
    const roller = evt.target;
    if (roller.classList.contains('not-interactive')) return;
    
    // Fix: markerTarget already includes "marker-"
    // Target the model inside the marker container
    const markerModel = document.querySelector(`#${markerTarget}-container #${markerTarget}-model`);
    
    if (!markerModel || !markerModel.getAttribute('visible')) {
        console.log(`Marker model not found for ${markerTarget}`);
        return;
    }
    
    const sessionId = `rotate-marker-${markerValue}`;
    
    if (!this.activeRotationSessions[sessionId]) {
        this.activeRotationSessions[sessionId] = {
            activeRollers: new Set(),
            rotateTimer: null,
            targetModel: markerModel,
            target: `marker-${markerValue}`,
            markerValue: markerValue
        };
    }
    
    this.activeRotationSessions[sessionId].activeRollers.add(roller.id);
    this.startRotation(sessionId);
},
    
    onMarkerRollerIntersectCleared: function(evt, markerValue, markerTarget) {
        const roller = evt.target;
        const sessionId = `rotate-marker-${markerValue}`;
        
        if (this.activeRotationSessions[sessionId]) {
            this.activeRotationSessions[sessionId].activeRollers.delete(roller.id);
            
            if (this.activeRotationSessions[sessionId].activeRollers.size === 0) {
                this.stopRotation(sessionId);
            }
        }
    },
    
    saveRotationForMarker: function(markerValue, modelElement) {
        if (!this.modelRotations[markerValue]) {
            this.modelRotations[markerValue] = { x: 0, y: 0, z: 0 };
        }
        
        const currentRotation = modelElement.getAttribute('rotation');
        this.modelRotations[markerValue] = {
            x: currentRotation.x,
            y: currentRotation.y,
            z: currentRotation.z
        };
    },
    
    // Helper method to set current marker (used by both marker detection and grid selection)
    setCurrentMarker: function(markerValue, originalScale) {
        this.currentMarker = markerValue;
        
        // Store original scale from content.json
        this.originalScales[markerValue] = originalScale;
        
        // Initialize scale for this marker if not exists
        if (!this.modelScales[markerValue]) {
            this.modelScales[markerValue] = originalScale;
        }
        
        // Initialize rotation for this marker if not exists
        if (!this.modelRotations[markerValue]) {
            this.modelRotations[markerValue] = { x: 0, y: 0, z: 0 };
        }
        
        // Apply saved scale and rotation if center model is visible
        if (this.centerModel.getAttribute('visible')) {
            this.centerModel.setAttribute('scale', { 
                x: this.modelScales[markerValue], 
                y: this.modelScales[markerValue], 
                z: this.modelScales[markerValue] 
            });
            
            this.centerModel.setAttribute('rotation', this.modelRotations[markerValue]);
            
            console.log(`Set current marker ${markerValue}: scale ${this.modelScales[markerValue]}, rotation`, this.modelRotations[markerValue]);
        }
    },
    
    // Reset model to original scale and rotation
    // In model-controller.js - update the resetModel function

// Reset model to original scale and rotation
resetModel: function(target) {
    let targetModel, markerValue;
    
    if (target === 'center') {
        targetModel = this.centerModel;
        markerValue = this.currentMarker;
    } else if (target === 'left') {
        targetModel = this.leftModel;
        // For left model, we need to know which marker it belongs to
        // Use the current marker from detection handler
        const detectionHandler = this.el.sceneEl.components['marker-detection-handler'];
        if (detectionHandler) {
            markerValue = detectionHandler.currentMarker;
        }
    } else if (target === 'right') {
        targetModel = this.rightModel;
        const detectionHandler = this.el.sceneEl.components['marker-detection-handler'];
        if (detectionHandler) {
            markerValue = detectionHandler.currentMarker;
        }
    } else if (target && target.startsWith('marker-')) {
        targetModel = document.querySelector(`#${target}-container #${target}-model`);
        markerValue = target.replace('marker-', '');
    }
    
    if (!targetModel || !targetModel.getAttribute('visible')) {
        console.log(`Target model ${target} not visible or not found`);
        return;
    }
    
    if (markerValue) {
        // Get original scale from content manager if available
        let originalScale = 1;
        const contentManager = this.el.sceneEl.components['marker-content-manager'];
        
        if (target === 'center' && contentManager) {
            const content = contentManager.getMarkerContent(markerValue);
            if (content && content.type === '3d') {
                originalScale = content.scale || 1;
            }
        } else if (target === 'left' && contentManager) {
            const leftContent = contentManager.getLeftSideContent(markerValue);
            if (leftContent && leftContent.type === '3d') {
                originalScale = leftContent.scale || 1;
            }
        } else if (target === 'right' && contentManager) {
            const rightContent = contentManager.getRightSideContent(markerValue);
            if (rightContent && rightContent.type === '3d') {
                originalScale = rightContent.scale || 1;
            }
        } else if (target.startsWith('marker-') && contentManager) {
            const currentIndex = contentManager.currentContentIndex[markerValue] || 0;
            const markerItems = contentManager.markerData?.[markerValue] || [];
            const currentItem = markerItems[currentIndex];
            if (currentItem && currentItem.type === '3d') {
                originalScale = currentItem.scale || 1;
                // Reset marker model scale in content manager
                contentManager.markerModelScales[markerValue] = originalScale;
            }
        }
        
        console.log(`Resetting model for ${target} to original scale: ${originalScale}`);
        
        targetModel.setAttribute('scale', { 
            x: originalScale, 
            y: originalScale, 
            z: originalScale 
        });
        
        targetModel.setAttribute('rotation', { x: 0, y: 0, z: 0 });
        
        // Update stored scales
        if (target === 'center' && this.modelScales) {
            this.modelScales[markerValue] = originalScale;
        } else if (target === 'left') {
            // If we need to track left model scales
        } else if (target === 'right') {
            // If we need to track right model scales
        }
        
        // Update rotation tracking
        if (this.modelRotations) {
            this.modelRotations[markerValue] = { x: 0, y: 0, z: 0 };
        }
        
        console.log(`3D model reset for ${target} to scale: ${originalScale}`);
    } else {
        console.log(`No marker value found for target ${target}`);
    }
},
    
    // Get user scale for marker (or original if not modified yet)
    getUserScale: function(markerValue) {
        if (this.modelScales[markerValue] !== undefined) {
            return this.modelScales[markerValue];
        }
        return this.originalScales[markerValue] || 1;
    },
    
    // Get original scale from content.json
    getOriginalScale: function(markerValue) {
        return this.originalScales[markerValue] || 1;
    },
    
    // Handle grid selection 
    handleGridSelection: function(markerValue, originalScale) {
        // Set this as the current marker
        this.setCurrentMarker(markerValue, originalScale);
        
        // Update stored scale to original (but keep rotation)
        this.modelScales[markerValue] = originalScale;

        // Apply immediately if visible
        if (this.centerModel.getAttribute('visible')) {
            this.centerModel.setAttribute('scale', { 
                x: originalScale, 
                y: originalScale, 
                z: originalScale 
            });
            
            console.log(`Grid selection: updated scale to ${originalScale} for marker ${markerValue}`);
        }
    },
    
    remove: function() {
        // Stop all rotation sessions
        Object.keys(this.activeRotationSessions).forEach(sessionId => {
            this.stopRotation(sessionId);
        });
    }
});