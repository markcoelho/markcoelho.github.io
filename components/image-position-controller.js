// image-position-controller.js - Compressed Version
AFRAME.registerComponent('image-position-controller', {
    schema: {
        moveSpeed: { default: 0.1 },
        moveInterval: { default: 50 }
    },
    
    init: function() {
        this.centerImage = getId('centerImage');
        this.scrollers = document.querySelectorAll('.scroller');
        this.states = {};
        this.currentMarker = null;
        this.scaleMultiplier = 1;
        this.isImageIntersected = false;
        this.movementController = new ContinuousMovementController(this.data.moveInterval);
        
        this.setupListeners();
    },
    
    setupListeners: function() {
    // Image intersection
    this.centerImage.addEventListener('raycaster-intersected', () => {
        this.isImageIntersected = true;
        this.checkMovement();
    });
    
    this.centerImage.addEventListener('raycaster-intersected-cleared', () => {
        this.isImageIntersected = false;
        this.movementController.stop();
    });
    
    // Scroller intersection
    this.scrollers.forEach(scroller => {
        scroller.addEventListener('raycaster-intersected', (evt) => {
        if (evt.target.classList.contains('not-interactive')) return;
        this.movementController.addControl(evt.target.id);
        this.checkMovement();
        });
        
        scroller.addEventListener('raycaster-intersected-cleared', (evt) => {
        this.movementController.removeControl(evt.target.id);
        });
    });
    },
    
    checkMovement: function() {
    if (this.isImageIntersected && this.movementController.hasControls()) {
        this.movementController.start((activeControls) => this.moveImage(activeControls));
    }
    },
    
    moveImage: function(activeControls) {
    if (!this.centerImage) return;
    
    const pos = this.centerImage.getAttribute('position');
    let moveX = 0, moveY = 0;
    
    activeControls.forEach(id => {
        if (IMAGE_MOVEMENTS[id]) {
        moveX += IMAGE_MOVEMENTS[id][0];
        moveY += IMAGE_MOVEMENTS[id][1];
        }
    });
    
    this.centerImage.setAttribute('position', {
        x: pos.x + moveX,
        y: pos.y + moveY,
        z: pos.z
    });
    },

    remove: function() {
    this.movementController.stop();
    },
    
    setupImage: function(imageSrc, markerValue, source = 'default') {
        const content = this.getContent(markerValue);
        if (!content || content.type === 'video' || content.type === '3d') return;
        
        const contentScale = content.scale || 1;
        const baseScale = 3 * contentScale;
        const controlsEnabled = content.controls !== false;
        
        this.toggleControls(controlsEnabled);
        
        if (source === 'reset') {
            this.resetImage(markerValue, content.value);
            return;
        }
        
        if (source === 'marker' || source === 'centerControls') {
            this.currentMarker = markerValue;
        }
        
        const currentSrc = this.centerImage.getAttribute('src');
        if (imageSrc && currentSrc === imageSrc && source !== 'marker') return;
        
        this.loadImage(imageSrc, markerValue, baseScale, source);
    },
    
    getContent: function(markerValue) {
        const manager = this.el.sceneEl.components['marker-content-manager'];
        return manager?.getMarkerContent(markerValue);
    },
    
    toggleControls: function(enabled) {
        const plane = getId('centerControls');
        if (!plane) return;
        
        if (enabled) {
            plane.setVisible();
            document.querySelectorAll('.zoom-button, .scroller').forEach(btn => btn.setVisible());
        } else {
            plane.setInvisible();
            document.querySelectorAll('.zoom-button, .scroller').forEach(btn => btn.setInvisible());
        }
    },
    
    loadImage: function(src, markerValue, baseScale, source) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            const aspect = img.naturalWidth / img.naturalHeight;
            
            // Preserve user zoom when switching between images
            if (this.states[markerValue] && source !== 'marker') {
                this.scaleMultiplier = this.centerImage.getAttribute('scale').x / this.states[markerValue].scale.x;
            } else {
                this.scaleMultiplier = 1;
            }
            
            const finalScale = baseScale * this.scaleMultiplier;
            
            // Apply all attributes at once for smoother transition
            this.applyImageAttributes(src, baseScale, aspect, finalScale);
            
            if (source === 'marker' || source === 'centerControls') {
                this.states[markerValue] = {
                    position: { x: 0, y: 0, z: 0 },
                    scale: { x: baseScale, y: baseScale, z: baseScale },
                    width: baseScale,
                    height: baseScale / aspect
                };
            }
        };
        
        img.src = src;
    },
    
    applyImageAttributes: function(src, width, aspect, scale) {
        this.centerImage.setAttribute('src', src);
        this.centerImage.setAttribute('width', width);
        this.centerImage.setAttribute('height', width / aspect);
        this.centerImage.setAttribute('scale', { x: scale, y: scale, z: scale });
    },
    
    resetImage: function(markerValue, imageSrc) {
        this.scaleMultiplier = 1;
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            const content = this.getContent(markerValue);
            const contentScale = content?.scale || 1;
            const baseScale = 3 * contentScale;
            const aspect = img.naturalWidth / img.naturalHeight;
            
            // Apply reset position and scale in single operation
            this.centerImage.setAttribute('position', { x: 0, y: 0, z: 0 });
            this.applyImageAttributes(imageSrc, baseScale, aspect, baseScale);
            
            // Update stored state
            if (markerValue) {
                this.states[markerValue] = {
                    position: { x: 0, y: 0, z: 0 },
                    scale: { x: baseScale, y: baseScale, z: baseScale },
                    width: baseScale,
                    height: baseScale / aspect
                };
            }
        };
        
        img.src = imageSrc;
    },
    
    remove: function() {
        this.movementController.stop();
    }
});