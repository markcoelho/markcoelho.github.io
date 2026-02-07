// image-position-controller.js
// Controls image movement, zoom, and resets for the main displayed image
AFRAME.registerComponent('image-position-controller', {
    init: function() {
        this.centerImage = getId('centerImage'); // Main image element
        this.scrollerElements = document.querySelectorAll('.scroller'); // Arrow buttons
        this.initialStates = {}; // Stores original image states per marker
        this.currentMarker = null; // Which marker we're currently viewing
        this.userScaleMultiplier = 1; // Tracks user's zoom level (default 1x)
        
        // Movement tracking for scroll arrows
        this.activeScrollers = new Set(); // Which arrows are currently pressed
        this.moveInterval = null; // Timer for continuous movement
        this.isImageIntersected = false; // Is cursor over the image?
        
        this.setupEventListeners();
    },
    
    setupEventListeners: function() {
        // Track when cursor is over the main image
        this.centerImage.addEventListener('raycaster-intersected', () => {
            this.isImageIntersected = true;
            this.checkForDoubleIntersection(); // Check if should start moving
        });
        this.centerImage.addEventListener('raycaster-intersected-cleared', () => {
            this.isImageIntersected = false;
            this.stopMovement(); // Stop moving when cursor leaves
        });
        
        // Track scroll arrow interactions
        this.scrollerElements.forEach(scroller => {
            // When cursor enters an arrow
            scroller.addEventListener('raycaster-intersected', (evt) => {
                // Exit if scroller has 'not-interactive' class
                if (evt.target.classList.contains('not-interactive')) {
                    return;
                }

                this.activeScrollers.add(evt.target.id); // Add arrow to active set
                this.checkForDoubleIntersection(); // Check if should start moving
            });
            // When cursor leaves an arrow
            scroller.addEventListener('raycaster-intersected-cleared', (evt) => {
                this.activeScrollers.delete(evt.target.id); // Remove from active set
                if (this.activeScrollers.size === 0) this.stopMovement(); // Stop if no arrows active
            });
        });
    },
    
    // Start movement only if BOTH image AND an arrow are being looked at
    checkForDoubleIntersection: function() {
        if (this.isImageIntersected && this.activeScrollers.size > 0 && !this.moveInterval) {
            this.startMovement();
        }
    },
    
    // Start continuous movement timer (called every 50ms)
    startMovement: function() {
        this.moveInterval = setInterval(() => this.continuousMove(), 50);
    },
    
    // Stop movement timer
    stopMovement: function() {
        if (this.moveInterval) {
            clearInterval(this.moveInterval);
            this.moveInterval = null;
        }
    },
    
    // Move the image based on which arrows are active
    continuousMove: function() {
        // Stop if: no image, no active arrows, or cursor left image
        if (!this.centerImage || this.activeScrollers.size === 0 || !this.isImageIntersected) {
            this.stopMovement();
            return;
        }
        
        const currentPos = this.centerImage.getAttribute('position');
        let moveX = 0, moveY = 0;
        
        // Map arrow IDs to movement directions
        const moves = {
            'scroller-top': () => moveY -= 0.1,    // Up = move image down
            'scroller-right': () => moveX -= 0.1,  // Right = move image left
            'scroller-bottom': () => moveY += 0.1, // Down = move image up
            'scroller-left': () => moveX += 0.1    // Left = move image right
        };
        
        // Apply movement for all active arrows
        this.activeScrollers.forEach(id => moves[id]?.());
        
        // Update image position
        this.centerImage.setAttribute('position', {
            x: currentPos.x + moveX,
            y: currentPos.y + moveY,
            z: currentPos.z
        });
    },
    
    // Main function to change/setup the displayed image
    setupImage: function(imageSrc, markerValue, callSource = 'default') {
        const contentManager = this.el.sceneEl.components['marker-content-manager'];
        if (!contentManager || !this.centerImage) return;
        
        const content = contentManager.getMarkerContent(markerValue);

         if (content?.type === 'video') {
            return;
        }

        const contentScale = content?.scale || 1; // Get scale from JSON (default 1)
        const baseScale = 3 * contentScale; // Base size (3 units) * scale factor
        
        // Get navigation plane element
        const navigationPlane = getId('centerControls');
        
        // Check if controls are enabled for this specific content
        const controlsEnabled = contentManager.getControlsEnabled(markerValue);
        
        // Set navigation visibility based on controls setting
        if (navigationPlane) {
            if (controlsEnabled) {
                navigationPlane.setVisible();
                
                // Also make sure zoom buttons and scrollers are visible
                document.querySelectorAll('.zoom-button, .scroller').forEach(btn => {
                    btn.setVisible();
                });
            } else {
                navigationPlane.setInvisible();
                
                // Also hide individual controls
                document.querySelectorAll('.zoom-button, .scroller').forEach(btn => {
                    btn.setInvisible();
                });
                
                //If controls are disabled, reset zoom and position
                // Use the same reset logic as the reset button
                if (content?.type === 'image') {
                    this.currentMarker = markerValue;
                    this.userScaleMultiplier = 1; // Reset zoom multiplier
                    
                    // Call resetImage which will center the image and reset to original scale
                    this.resetImage(markerValue, content.value, contentManager);
                }
            }
        }
        
        // RESET: Return to original position/size (for reset button)
        if (callSource === 'reset') {
            this.currentMarker && this.resetImage(this.currentMarker, content?.value, contentManager);
            return;
        }
        
        // MARKER/NAVIGATION: Track which marker we're viewing
        if (callSource === 'marker' || callSource === 'centerControls') {
            this.currentMarker = markerValue;
        }
        
        // Skip if it's the same image (unless it's a new marker detection)
        const currentSrc = this.centerImage.getAttribute('src');
        if (imageSrc && currentSrc === imageSrc && callSource !== 'marker') return;
        
        // Load and display the new image
        this.loadAndApplyImage(imageSrc, markerValue, baseScale, callSource);
    },
    
    // Load image and apply proper sizing/positioning
    loadAndApplyImage: function(src, markerValue, baseScale, callSource) {
        const img = new Image();
        img.crossOrigin = 'anonymous'; // Allow cross-origin images
        
        img.onload = () => {
            const aspect = img.naturalWidth / img.naturalHeight; // Image aspect ratio
            const currentPos = this.centerImage.getAttribute('position');
            const currentScale = this.centerImage.getAttribute('scale').x;
            
            // Calculate zoom multiplier: current size ÷ original size
            // This preserves user's zoom when switching images
            if (this.initialStates[markerValue]) {
                this.userScaleMultiplier = currentScale / this.initialStates[markerValue].scale.x;
            } else if (callSource === 'default') {
                this.userScaleMultiplier = 1; // Default zoom
            }
            
            const finalScale = baseScale * this.userScaleMultiplier; // Apply user's zoom
            
            // Update the displayed image
            this.centerImage.setAttribute('src', src);
            this.centerImage.setAttribute('width', baseScale);
            this.centerImage.setAttribute('height', baseScale / aspect); // Maintain aspect
            this.centerImage.setAttribute('scale', { x: finalScale, y: finalScale, z: finalScale });
            
            // Store original state for this marker (for reset/zoom calculations)
            if (callSource === 'marker' || callSource === 'centerControls') {
                this.initialStates[markerValue] = {
                    position: currentPos, // Keep current position
                    scale: { x: baseScale, y: baseScale, z: baseScale }, // Original size
                    width: baseScale,
                    height: baseScale / aspect
                };
            }
        };
        
        img.src = src; // Start loading
    },
    
    // Reset image to center with original size
    resetImage: function(markerValue, imageSrc, contentManager) {
        this.userScaleMultiplier = 1; // Reset zoom to 1x
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            const content = contentManager.getMarkerContent(markerValue);
            const contentScale = content?.scale || 1;
            const baseScale = 3 * contentScale;
            const aspect = img.naturalWidth / img.naturalHeight;
            
            // Reset to center with original size
            this.centerImage.setAttribute('position', { x: 0, y: 0, z: 0 }); // Center
            this.centerImage.setAttribute('width', baseScale);
            this.centerImage.setAttribute('height', baseScale / aspect);
            this.centerImage.setAttribute('scale', { 
                x: baseScale,  // Original width
                y: baseScale,  // Original height
                z: baseScale 
            });
            
            // Update stored initial state
            this.initialStates[markerValue] = {
                position: { x: 0, y: 0, z: 0 }, // Center position
                scale: { x: baseScale, y: baseScale, z: baseScale }, // Original scale
                width: baseScale,
                height: baseScale / aspect
            };
        };
        
        img.src = imageSrc;
    },
    
    // Cleanup
    remove: function() {
        this.stopMovement(); // Stop any running movement
    }
});