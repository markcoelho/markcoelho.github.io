// model-controller.js (simplified version)
AFRAME.registerComponent('model-controller', {
    schema: {
        minScale: { default: 0.1 },
        maxScale: { default: 10 }
    },
    
    init: function() {
        this.centerModel = getId('centerModel');
        this.currentMarker = null;
        this.modelScales = {}; // Store user-adjusted scale per marker
        this.originalScales = {}; // Store original scale from content.json per marker
        this.isGridSelection = {}; // Track if last selection was from grid
        
        // Track which marker has 3D content
        this.el.sceneEl.addEventListener('markerFound', (evt) => {
            const marker = evt.target;
            const markerValue = marker.getAttribute('value');
            const scene = this.el.sceneEl;
            const contentManager = scene.components['marker-content-manager'];
            
            if (contentManager) {
                const content = contentManager.getMarkerContent(markerValue);
                if (content?.type === '3d') {
                    this.currentMarker = markerValue;
                    
                    // Store original scale from content.json
                    const originalScale = content.scale || 1;
                    this.originalScales[markerValue] = originalScale;
                    
                    // Check if last selection was from grid for this marker
                    if (this.isGridSelection[markerValue]) {
                        // Last selection was from grid - use original scale
                        this.modelScales[markerValue] = originalScale;
                        this.isGridSelection[markerValue] = false; // Reset flag
                        
                        this.centerModel.setAttribute('scale', { 
                            x: originalScale, 
                            y: originalScale, 
                            z: originalScale 
                        });
                        console.log(`Grid selection detected for marker ${markerValue}, using original scale: ${originalScale}`);
                    }
                    // Check if we have stored user scale for this marker
                    else if (this.modelScales[markerValue] !== undefined) {
                        // Apply user's previous scale (if they've zoomed before)
                        this.centerModel.setAttribute('scale', { 
                            x: this.modelScales[markerValue], 
                            y: this.modelScales[markerValue], 
                            z: this.modelScales[markerValue] 
                        });
                        console.log(`Restored 3D model for marker ${markerValue}: user scale ${this.modelScales[markerValue]} (original: ${originalScale})`);
                    } else {
                        // First time, use original scale from content.json
                        this.modelScales[markerValue] = originalScale;
                        console.log(`Initial 3D model for marker ${markerValue} with original scale: ${originalScale}`);
                    }
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
    },
    
    // Reset model to original scale from content.json
    resetModel: function() {
        if (!this.centerModel || !this.centerModel.getAttribute('visible') || !this.currentMarker) {
            console.log('Cannot reset: no active 3D model');
            return;
        }
        
        // Get original scale for current marker
        const originalScale = this.originalScales[this.currentMarker] || 1;
        
        // Reset to original scale from content.json
        this.centerModel.setAttribute('scale', { 
            x: originalScale, 
            y: originalScale, 
            z: originalScale 
        });
        
        this.centerModel.setAttribute('position', { x: 0, y: 0, z: 0 });
        
        // Update stored scale to original
        this.modelScales[this.currentMarker] = originalScale;
        
        console.log(`3D model reset to original scale from content.json: ${originalScale}`);
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
    
    // Mark selection from grid AND apply scale immediately
    handleGridSelection: function(markerValue, originalScale) {
        // Store original scale
        this.originalScales[markerValue] = originalScale;
        
        // Update stored scale to original
        this.modelScales[markerValue] = originalScale;
        
        // Mark as grid selection
        this.isGridSelection[markerValue] = true;
        
        // If this model is currently visible, update it immediately
        if (this.centerModel.getAttribute('visible')) {
            this.centerModel.setAttribute('scale', { 
                x: originalScale, 
                y: originalScale, 
                z: originalScale 
            });
            console.log(`Immediately applied grid selection scale: ${originalScale} for marker ${markerValue}`);
        }
        
        console.log(`Grid selection for marker ${markerValue}, scale set to: ${originalScale}`);
    }
});