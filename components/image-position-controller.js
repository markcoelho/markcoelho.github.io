// image-position-controller.js
AFRAME.registerComponent('image-position-controller', {
    init: function() {
        this.centerImage = getId('centerImage');
        this.scrollerElements = document.querySelectorAll('.scroller');
        this.initialStates = {};
        this.currentMarker = null;
        this.userScaleMultiplier = 1;
        
        this.activeScrollers = new Set();
        this.moveInterval = null;
        this.isImageIntersected = false;
        
        this.setupEventListeners();
    },
    
    setupEventListeners: function() {
        this.centerImage.addEventListener('raycaster-intersected', () => {
            this.isImageIntersected = true;
            this.checkForDoubleIntersection();
        });
        
        this.centerImage.addEventListener('raycaster-intersected-cleared', () => {
            this.isImageIntersected = false;
            this.stopMovement();
        });
        
        this.scrollerElements.forEach(scroller => {
            scroller.addEventListener('raycaster-intersected', (evt) => {
                if (evt.target.classList.contains('not-interactive')) return;
                this.activeScrollers.add(evt.target.id);
                this.checkForDoubleIntersection();
            });
            
            scroller.addEventListener('raycaster-intersected-cleared', (evt) => {
                this.activeScrollers.delete(evt.target.id);
                if (this.activeScrollers.size === 0) this.stopMovement();
            });
        });
    },
    
    // Start movement if both image and arrow are looked at
    checkForDoubleIntersection: function() {
        if (this.isImageIntersected && this.activeScrollers.size > 0 && !this.moveInterval) {
            this.startMovement();
        }
    },
    
    startMovement: function() {
        this.moveInterval = setInterval(() => this.continuousMove(), 50);
    },
    
    stopMovement: function() {
        if (this.moveInterval) {
            clearInterval(this.moveInterval);
            this.moveInterval = null;
        }
    },
    
    // Move image based on active arrows
    continuousMove: function() {
        if (!this.centerImage || this.activeScrollers.size === 0 || !this.isImageIntersected) {
            this.stopMovement();
            return;
        }
        
        const currentPos = this.centerImage.getAttribute('position');
        let moveX = 0, moveY = 0;
        
        const moves = {
            'scroller-top': () => moveY -= 0.1,
            'scroller-right': () => moveX -= 0.1,
            'scroller-bottom': () => moveY += 0.1,
            'scroller-left': () => moveX += 0.1
        };
        
        this.activeScrollers.forEach(id => moves[id]?.());
        
        this.centerImage.setAttribute('position', {
            x: currentPos.x + moveX,
            y: currentPos.y + moveY,
            z: currentPos.z
        });
    },
    
    // Setup or change displayed image
    setupImage: function(imageSrc, markerValue, callSource = 'default') {
        const contentManager = this.el.sceneEl.components['marker-content-manager'];
        if (!contentManager || !this.centerImage) return;
        
        const content = contentManager.getMarkerContent(markerValue);
        
        if (content?.type === 'video') return;
        
        const contentScale = content?.scale || 1;
        const baseScale = 3 * contentScale;
        
        const navigationPlane = getId('centerControls');
        const controlsEnabled = contentManager.getControlsEnabled(markerValue);
        
        if (navigationPlane) {
            if (controlsEnabled) {
                navigationPlane.setVisible();
                document.querySelectorAll('.zoom-button, .scroller').forEach(btn => {
                    btn.setVisible();
                });
            } else {
                navigationPlane.setInvisible();
                document.querySelectorAll('.zoom-button, .scroller').forEach(btn => {
                    btn.setInvisible();
                });
                
                if (content?.type === 'image') {
                    this.currentMarker = markerValue;
                    this.userScaleMultiplier = 1;
                    this.resetImage(markerValue, content.value, contentManager);
                }
            }
        }
        
        // Reset button action
        if (callSource === 'reset') {
            this.currentMarker && this.resetImage(this.currentMarker, content?.value, contentManager);
            return;
        }
        
        // Track current marker
        if (callSource === 'marker' || callSource === 'centerControls') {
            this.currentMarker = markerValue;
        }
        
        // Skip if same image (unless new marker)
        const currentSrc = this.centerImage.getAttribute('src');
        if (imageSrc && currentSrc === imageSrc && callSource !== 'marker') return;
        
        this.loadAndApplyImage(imageSrc, markerValue, baseScale, callSource);
    },
    
    // Load and apply image with sizing
    loadAndApplyImage: function(src, markerValue, baseScale, callSource) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            const aspect = img.naturalWidth / img.naturalHeight;
            const currentPos = this.centerImage.getAttribute('position');
            const currentScale = this.centerImage.getAttribute('scale').x;
            
            // Preserve user zoom
            if (this.initialStates[markerValue]) {
                this.userScaleMultiplier = currentScale / this.initialStates[markerValue].scale.x;
            } else if (callSource === 'default') {
                this.userScaleMultiplier = 1;
            }
            
            const finalScale = baseScale * this.userScaleMultiplier;
            
            this.centerImage.setAttribute('src', src);
            this.centerImage.setAttribute('width', baseScale);
            this.centerImage.setAttribute('height', baseScale / aspect);
            this.centerImage.setAttribute('scale', { x: finalScale, y: finalScale, z: finalScale });
            
            // Store original state
            if (callSource === 'marker' || callSource === 'centerControls') {
                this.initialStates[markerValue] = {
                    position: currentPos,
                    scale: { x: baseScale, y: baseScale, z: baseScale },
                    width: baseScale,
                    height: baseScale / aspect
                };
            }
        };
        
        img.src = src;
    },
    
    // Reset image to center with original size
    resetImage: function(markerValue, imageSrc, contentManager) {
        this.userScaleMultiplier = 1;
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            const content = contentManager.getMarkerContent(markerValue);
            const contentScale = content?.scale || 1;
            const baseScale = 3 * contentScale;
            const aspect = img.naturalWidth / img.naturalHeight;
            
            this.centerImage.setAttribute('position', { x: 0, y: 0, z: 0 });
            this.centerImage.setAttribute('width', baseScale);
            this.centerImage.setAttribute('height', baseScale / aspect);
            this.centerImage.setAttribute('scale', { 
                x: baseScale, y: baseScale, z: baseScale 
            });
            
            this.initialStates[markerValue] = {
                position: { x: 0, y: 0, z: 0 },
                scale: { x: baseScale, y: baseScale, z: baseScale },
                width: baseScale,
                height: baseScale / aspect
            };
        };
        
        img.src = imageSrc;
    },
    
    remove: function() {
        this.stopMovement();
    }
});