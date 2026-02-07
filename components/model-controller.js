// model-controller.js
AFRAME.registerComponent('model-controller', {
    schema: {
        minScale: { default: 0.1 },
        maxScale: { default: 10 }
    },
    
    init: function() {
        this.centerModel = getId('centerModel');
        this.currentMarker = null;
        this.initialScale = 1;
        
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
                    this.initialScale = content.scale || 1;
                    console.log(`3D model tracking for marker ${markerValue}, scale: ${this.initialScale}`);
                }
            }
        });
    },
    
    // Reset model to original scale
    resetModel: function() {
        if (!this.centerModel || !this.centerModel.getAttribute('visible') || !this.currentMarker) {
            console.log('Cannot reset: no active 3D model');
            return;
        }
        
        const scene = this.el.sceneEl;
        const contentManager = scene.components['marker-content-manager'];
        
        if (contentManager) {
            const content = contentManager.getMarkerContent(this.currentMarker);
            const contentScale = content?.scale || 1;
            
            this.centerModel.setAttribute('scale', { 
                x: contentScale, 
                y: contentScale, 
                z: contentScale 
            });
            
            this.centerModel.setAttribute('position', { x: 0, y: 0, z: 0 });
            
            console.log(`3D model reset to scale: ${contentScale}`);
        }
    }
});