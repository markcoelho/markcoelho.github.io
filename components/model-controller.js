// model-controller.js 
AFRAME.registerComponent('model-controller', {
    schema: {
        minScale: { default: 0.1 },
        maxScale: { default: 10 },
        rotationStep: { default: 1 }, // Degrees to rotate per action
        rotationInterval: { default: 25 } // ms between rotation actions
    },
    
    init: function() {
        this.centerModel = getId('centerModel');
        this.currentMarker = null;
        this.modelScales = {}; // Store user-adjusted scale per marker
        this.originalScales = {}; // Store original scale from content.json per marker
        this.modelRotations = {}; // Store user-adjusted rotation per marker
        
        // Rotation control variables
        this.activeRollers = new Set();
        this.rotateInterval = null;
        
        // Track which marker has 3D content from ANY source (marker detection OR grid selection)
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
        
        // Listen for model scale changes
        this.centerModel.addEventListener('componentchanged', (evt) => {
            if (evt.detail.name === 'scale' && this.currentMarker) {
                // Store the current scale for this marker
                const currentScale = this.centerModel.getAttribute('scale').x;
                this.modelScales[this.currentMarker] = currentScale;
                
                // Debug log to track scale changes
                console.log(`Stored scale for marker ${this.currentMarker}: ${currentScale} (original: ${this.originalScales[this.currentMarker]})`);
            }
        });
        
        // Listen for model rotation changes
        this.centerModel.addEventListener('componentchanged', (evt) => {
            if (evt.detail.name === 'rotation' && this.currentMarker) {
                // Store the current rotation for this marker
                const currentRotation = this.centerModel.getAttribute('rotation');
                this.modelRotations[this.currentMarker] = {
                    x: currentRotation.x,
                    y: currentRotation.y,
                    z: currentRotation.z
                };
                
                console.log(`Stored rotation for marker ${this.currentMarker}:`, currentRotation);
            }
        });
        
        // Set up roller event listeners
        this.setupRollerListeners();
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
        
        // Apply saved scale and rotation
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
    
    setupRollerListeners: function() {
        // Get all roller buttons
        const rollers = document.querySelectorAll('.roller');
        
        rollers.forEach(roller => {
            roller.addEventListener('raycaster-intersected', (evt) => {
                if (roller.classList.contains('not-interactive')) return;
                
                this.activeRollers.add(roller.id);
                this.startRotation();
            });
            
            roller.addEventListener('raycaster-intersected-cleared', (evt) => {
                this.activeRollers.delete(roller.id);
                if (this.activeRollers.size === 0) this.stopRotation();
            });
        });
    },
    
    startRotation: function() {
        if (this.rotateInterval) return; // Already rotating
        
        this.rotateInterval = setInterval(() => this.continuousRotate(), this.data.rotationInterval);
        console.log('Started model rotation');
    },
    
    stopRotation: function() {
        if (this.rotateInterval) {
            clearInterval(this.rotateInterval);
            this.rotateInterval = null;
        }
        console.log('Stopped model rotation');
    },
    
    // Rotate model based on active rollers
    continuousRotate: function() {
        if (!this.centerModel || !this.centerModel.getAttribute('visible') || this.activeRollers.size === 0) {
            this.stopRotation();
            return;
        }
        
        const currentRotation = this.centerModel.getAttribute('rotation');
        let rotateY = 0, rotateZ = 0;
        
        // Define rotation directions
        const rotations = {
            'roller-up': () => rotateZ -= this.data.rotationStep,    // Rotate up = negative Y
            'roller-down': () => rotateZ += this.data.rotationStep,  // Rotate down = positive Y
            'roller-left': () => rotateY += this.data.rotationStep,  // Rotate left = positive Z
            'roller-right': () => rotateY -= this.data.rotationStep  // Rotate right = negative Z
        };
        
        // Apply rotations from all active rollers
        this.activeRollers.forEach(id => rotations[id]?.());
        
        // Apply the rotation
        this.centerModel.setAttribute('rotation', {
            x: currentRotation.x,
            y: currentRotation.y + rotateY,
            z: currentRotation.z + rotateZ
        });
    },
    
    // Reset model to original scale and rotation from content.json
    // model-controller.js - updated resetModel function
resetModel: function() {
    if (!this.centerModel || !this.centerModel.getAttribute('visible') || !this.currentMarker) {
        console.log('Cannot reset: 3D model not visible or no current marker');
        return;
    }

    // Get original scale for current marker
    const originalScale = this.originalScales[this.currentMarker] || 1;
    
    // Reset both scale and rotation to original
    this.centerModel.setAttribute('scale', { 
        x: originalScale, 
        y: originalScale, 
        z: originalScale 
    });
    
    // Reset rotation to zero
    this.centerModel.setAttribute('rotation', { x: 0, y: 0, z: 0 });
    
    // Update stored scale and rotation to original
    this.modelScales[this.currentMarker] = originalScale;
    this.modelRotations[this.currentMarker] = { x: 0, y: 0, z: 0 };
    
    console.log(`3D model reset to original scale: ${originalScale} and rotation: 0,0,0`);
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
        this.stopRotation();
    }
});