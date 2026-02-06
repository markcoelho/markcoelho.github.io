// gaze-interaction-handler.js
AFRAME.registerComponent('gaze-interaction-handler', {
    // Configurable settings for the component
    schema: {
        fuseTimeout: { default: 500 },      // Time user must stare at button
        action: { type: 'string' },         // What this button does (zoom, reset, etc.)
        markerValue: { type: 'string' },    // Which marker this belongs to
        zoomFactor: { default: 0.25 }       // How much zoom changes per click
    },
    
    init: function() {
        this.timer = null;            // Timer for gaze timeout
        this.isFusing = false;        // Is gaze timer running?
        this.intersected = false;     // Is cursor over this element?
        this.triggered = false;       // Has action already happened?
        this.loading = getId('loading_animation'); // Loading spinner
        this.scene = this.el.sceneEl; // Reference to main scene
        
        // Check what type of button this is
        this.determineButtonType();
        
        // When cursor enters this element
        this.el.addEventListener('raycaster-intersected', () => {
            this.intersected = true;
            this.triggered = false;  // Reset for new interaction
            
            // Show loading spinner if needed
            this.showLoading();
            
            // Start countdown timer
            this.startFuse();
        });
        
        // When cursor leaves this element
        this.el.addEventListener('raycaster-intersected-cleared', () => {
            this.intersected = false;
            this.reset();                     // Cancel timer
            this.triggered = false;           // Reset trigger
            this.loading?.setInvisible(); // Hide loading
        });
    },
    
    // Figure out what kind of button this is
    determineButtonType: function() {
        if (this.el.classList.contains('zoom-button')) return this.buttonType = 'zoom';
        if (this.el.classList.contains('reset')) return this.buttonType = 'reset';
        if (this.el.classList.contains('image-grid-item') && this.el.tagName.toLowerCase() === 'a-image') 
            return this.buttonType = 'grid-image';
        this.buttonType = 'other';
    },
    
    // Show loading animation only for certain buttons
    showLoading: function() {
        if (!this.loading) return;
        const show = this.buttonType === 'zoom' || 
                    ((this.buttonType === 'grid-image' || this.buttonType === 'reset') && !this.triggered);
        if (show) this.loading.setVisible();
    },
    
    // Start countdown timer for gaze interaction
    startFuse: function() {
        // Don't start if already running, or if cursor left, or already triggered
        if (this.isFusing || !this.intersected || 
            (this.buttonType === 'grid-image' && this.triggered) ||
            (this.buttonType === 'reset' && this.triggered)) return;
        
        this.isFusing = true;
        this.timer = setTimeout(() => {
            this.triggerAction();    // Do the button's action
            this.isFusing = false;   // Timer finished
            
            // Different behavior for different buttons
            if (this.intersected) {
                if (this.buttonType === 'zoom') {
                    this.startFuse(); // Zoom buttons repeat automatically
                } else if (this.buttonType === 'grid-image' || 
                         this.buttonType === 'reset') {
                    this.triggered = true;           // Mark as done
                    this.loading?.setInvisible(); // Hide loading
                }
            } else {
                this.loading?.setInvisible(); // Hide loading
            }
        }, this.data.fuseTimeout); // Wait specified time
    },
    
    // Cancel timer and reset state
    reset: function() {
        clearTimeout(this.timer);
        this.timer = null;
        this.isFusing = false;
        this.loading?.setInvisible();
    },
    
    // Execute the button's actual function
    triggerAction: function() {
        // ZOOM BUTTONS - Change image size
        if (this.buttonType === 'zoom') {
            const centerImage = getId('centerImage');
            if (!centerImage) return;
            
            const currentScale = centerImage.getAttribute('scale').x;
            const zoomMultiplier = this.data.zoomFactor;
            let newScale = this.data.action === 'increase' 
                ? currentScale * (1 + zoomMultiplier)    // Zoom in
                : Math.max(0.1, currentScale * (1 - zoomMultiplier)); // Zoom out (minimum 0.1)
            
            centerImage.setAttribute('scale', { x: newScale, y: newScale, z: newScale });
            return;
        } 
        // RESET BUTTON - Return image to original position/size
        else if (this.buttonType === 'reset' && !this.triggered) {
            const scene = this.scene;
            const contentManager = scene.components['marker-content-manager'];
            const imageController = scene.components['image-position-controller'];
            
            if (!imageController || !contentManager) return;
            
            const markers = document.querySelectorAll('a-marker');
            markers.forEach(marker => {
                const currentMarker = marker.getAttribute('value');
                const content = contentManager.getMarkerContent(currentMarker);
                if (content?.type === 'image') {
                    imageController.setupImage(content.value, currentMarker, 'reset');
                }
            });
            
            this.triggered = true; // Mark as triggered to prevent repeats
        }
        // GRID IMAGE BUTTON - Select image from 3x3 grid
        else if (this.buttonType === 'grid-image' && !this.triggered) {
            // Get data from the clicked grid image
            const imageSrc = this.el.getAttribute('src');
            const markerValue = this.el.getAttribute('data-marker-value');
            const contentIndex = parseInt(this.el.getAttribute('data-content-index'));
            
            if (!imageSrc || !markerValue) return;
            
            const scene = this.scene;
            const contentManager = scene.components['marker-content-manager'];
            const imageController = scene.components['image-position-controller'];
            
            if (!contentManager || !imageController) return;
            
            // Update which image is selected for this marker
            contentManager.currentContentIndex[markerValue] = contentIndex;
            
            // Change main displayed image
            imageController.setupImage(imageSrc, markerValue, 'navigation');
            
            // Show/hide controls based on new image settings
            this.updateNavigationVisibility(markerValue, contentManager);
            
            this.triggered = true; // Mark as triggered
        }
    },
    
    // Show or hide navigation controls based on image settings
    updateNavigationVisibility: function(markerValue, contentManager) {
        const marker = document.querySelector(`a-marker[value="${markerValue}"]`);
        if (!marker) return;
        
        const detectionHandler = this.scene.components['marker-detection-handler'];
        // Try to use detection handler's
        if (detectionHandler && detectionHandler.updateNavigationVisibility) {
            detectionHandler.updateNavigationVisibility(marker, markerValue, contentManager);
        } 
    },
    
    // Clean up when component is removed
    remove: function() {
        this.reset(); // Cancel any running timer
        // Remove event listeners (empty functions for reference)
        this.el.removeEventListener('raycaster-intersected', () => {});
        this.el.removeEventListener('raycaster-intersected-cleared', () => {});
    }
});