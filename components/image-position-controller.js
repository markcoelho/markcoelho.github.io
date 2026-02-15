// image-position-controller.js - Fixed version
AFRAME.registerComponent('image-position-controller', {
    schema: {
        moveSpeed: { default: 0.1 },
        moveInterval: { default: 50 }
    },
    
    init: function() {
        this.centerImage = getId('centerImage');
        this.leftImage = getId('leftImage');
        this.rightImage = getId('rightImage');
        
        // Store active scrolling sessions by target
        this.activeScrollSessions = {}; // { targetId: { activeScrollers: Set, moveTimer: null } }
        
        this.setupListeners();
    },
    
    setupListeners: function() {
        // Set up listeners for centerpiece scrollers (IDs: scroller-top, scroller-right, etc.)
        this.setupCenterScrollers();
        
        // Set up listeners for leftpiece scrollers
        this.setupScrollerListeners('left');
        
        // Set up listeners for rightpiece scrollers
        this.setupScrollerListeners('right');
        
        // Set up listeners for marker scrollers
        this.observeMarkerScrollers();
    },
    
    setupCenterScrollers: function() {
        const scrollers = document.querySelectorAll('.scroller');
        
        scrollers.forEach(scroller => {
            // Remove any existing listeners
            scroller.removeEventListener('raycaster-intersected', this.onCenterScrollerIntersect);
            scroller.removeEventListener('raycaster-intersected-cleared', this.onCenterScrollerIntersectCleared);
            
            // Add new listeners with bound target
            scroller.addEventListener('raycaster-intersected', (evt) => {
                this.onCenterScrollerIntersect(evt);
            });
            
            scroller.addEventListener('raycaster-intersected-cleared', (evt) => {
                this.onCenterScrollerIntersectCleared(evt);
            });
        });
    },
    
    onCenterScrollerIntersect: function(evt) {
        const scroller = evt.target;
        if (scroller.classList.contains('not-interactive')) return;
        
        // Get the target image element
        const targetImage = this.centerImage;
        if (!targetImage || !targetImage.getAttribute('visible')) return;
        
        const sessionId = 'scroll-center';
        
        // Initialize session if needed
        if (!this.activeScrollSessions[sessionId]) {
            this.activeScrollSessions[sessionId] = {
                activeScrollers: new Set(),
                moveTimer: null,
                targetImage: targetImage,
                target: 'center'
            };
        }
        
        // Add this scroller to the active set
        this.activeScrollSessions[sessionId].activeScrollers.add(scroller.id);
        
        // Check if we should start moving
        this.checkMovement(sessionId);
    },
    
    onCenterScrollerIntersectCleared: function(evt) {
        const scroller = evt.target;
        const sessionId = 'scroll-center';
        
        if (this.activeScrollSessions[sessionId]) {
            this.activeScrollSessions[sessionId].activeScrollers.delete(scroller.id);
            
            // Stop movement if no more active scrollers
            if (this.activeScrollSessions[sessionId].activeScrollers.size === 0) {
                this.stopMovement(sessionId);
            }
        }
    },
    
    setupScrollerListeners: function(target) {
        const scrollers = document.querySelectorAll(`.${target}-scroller`);
        
        scrollers.forEach(scroller => {
            // Remove any existing listeners
            scroller.removeEventListener('raycaster-intersected', this.onScrollerIntersect);
            scroller.removeEventListener('raycaster-intersected-cleared', this.onScrollerIntersectCleared);
            
            // Add new listeners with bound target
            scroller.addEventListener('raycaster-intersected', (evt) => {
                this.onScrollerIntersect(evt, target);
            });
            
            scroller.addEventListener('raycaster-intersected-cleared', (evt) => {
                this.onScrollerIntersectCleared(evt, target);
            });
        });
    },
    
    onScrollerIntersect: function(evt, target) {
        const scroller = evt.target;
        if (scroller.classList.contains('not-interactive')) return;
        
        // Get the target image element
        const targetImage = this.getTargetImage(target);
        if (!targetImage || !targetImage.getAttribute('visible')) return;
        
        const sessionId = `scroll-${target}`;
        
        // Initialize session if needed
        if (!this.activeScrollSessions[sessionId]) {
            this.activeScrollSessions[sessionId] = {
                activeScrollers: new Set(),
                moveTimer: null,
                targetImage: targetImage,
                target: target
            };
        }
        
        // Add this scroller to the active set
        this.activeScrollSessions[sessionId].activeScrollers.add(scroller.id);
        
        // Check if we should start moving
        this.checkMovement(sessionId);
    },
    
    onScrollerIntersectCleared: function(evt, target) {
        const scroller = evt.target;
        const sessionId = `scroll-${target}`;
        
        if (this.activeScrollSessions[sessionId]) {
            this.activeScrollSessions[sessionId].activeScrollers.delete(scroller.id);
            
            // Stop movement if no more active scrollers
            if (this.activeScrollSessions[sessionId].activeScrollers.size === 0) {
                this.stopMovement(sessionId);
            }
        }
    },
    
    getTargetImage: function(target) {
        switch(target) {
            case 'center': return this.centerImage;
            case 'left': return this.leftImage;
            case 'right': return this.rightImage;
            default: return null;
        }
    },
    
    checkMovement: function(sessionId) {
        const session = this.activeScrollSessions[sessionId];
        if (!session) return;
        
        // Only start moving if we have active scrollers and no timer already running
        if (session.activeScrollers.size > 0 && !session.moveTimer) {
            this.startMovement(sessionId);
        }
    },
    
    startMovement: function(sessionId) {
        const session = this.activeScrollSessions[sessionId];
        if (!session) return;
        
        session.moveTimer = setInterval(() => {
            this.moveImage(sessionId);
        }, this.data.moveInterval);
    },
    
    stopMovement: function(sessionId) {
        const session = this.activeScrollSessions[sessionId];
        if (session && session.moveTimer) {
            clearInterval(session.moveTimer);
            session.moveTimer = null;
        }
    },
    
    moveImage: function(sessionId) {
        const session = this.activeScrollSessions[sessionId];
        if (!session || !session.targetImage || session.activeScrollers.size === 0) {
            this.stopMovement(sessionId);
            return;
        }
        
        const pos = session.targetImage.getAttribute('position');
        const target = session.target;
        
        // Define movement directions based on scroller IDs
        const moves = {};
        
        if (target === 'center') {
            // Center scrollers have IDs like 'scroller-top', 'scroller-right', etc.
            moves['scroller-top'] = [0, -this.data.moveSpeed];
            moves['scroller-right'] = [-this.data.moveSpeed, 0];
            moves['scroller-bottom'] = [0, this.data.moveSpeed];
            moves['scroller-left'] = [this.data.moveSpeed, 0];
        } else if (target === 'marker') {
            // Marker scrollers are handled separately
            // This will be overridden in the marker-specific method
        } else {
            // Left/right scrollers have IDs like 'left-scroller-top', 'right-scroller-bottom', etc.
            moves[`${target}-scroller-top`] = [0, -this.data.moveSpeed];
            moves[`${target}-scroller-right`] = [-this.data.moveSpeed, 0];
            moves[`${target}-scroller-bottom`] = [0, this.data.moveSpeed];
            moves[`${target}-scroller-left`] = [this.data.moveSpeed, 0];
        }
        
        let moveX = 0, moveY = 0;
        
        session.activeScrollers.forEach(scrollerId => {
            if (moves[scrollerId]) {
                moveX += moves[scrollerId][0];
                moveY += moves[scrollerId][1];
            }
        });
        
        session.targetImage.setAttribute('position', {
            x: pos.x + moveX,
            y: pos.y + moveY,
            z: pos.z
        });
    },
    
    // Observe for dynamically added marker scrollers
    observeMarkerScrollers: function() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        // Check if this is a marker scroller
                        if (node.classList && node.classList.contains('marker-scroller')) {
                            this.setupMarkerScroller(node);
                        }
                        
                        // Also check children
                        if (node.querySelectorAll) {
                            node.querySelectorAll('.marker-scroller').forEach(scroller => {
                                this.setupMarkerScroller(scroller);
                            });
                        }
                    }
                });
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    },
    
    setupMarkerScroller: function(scroller) {
        // Get marker value from the scroller's data-target
        const markerTarget = scroller.getAttribute('data-target');
        if (!markerTarget || !markerTarget.startsWith('marker-')) return;
        
        const markerValue = markerTarget.replace('marker-', '');
        
        scroller.addEventListener('raycaster-intersected', (evt) => {
            this.onMarkerScrollerIntersect(evt, markerValue, markerTarget);
        });
        
        scroller.addEventListener('raycaster-intersected-cleared', (evt) => {
            this.onMarkerScrollerIntersectCleared(evt, markerValue, markerTarget);
        });
    },
    
    onMarkerScrollerIntersect: function(evt, markerValue, markerTarget) {
        const scroller = evt.target;
        if (scroller.classList.contains('not-interactive')) return;
        
        // Get the marker image element
        const markerImage = document.querySelector(`#${markerTarget}-image`);
        if (!markerImage || !markerImage.getAttribute('visible')) return;
        
        const sessionId = `scroll-marker-${markerValue}`;
        
        // Initialize session if needed
        if (!this.activeScrollSessions[sessionId]) {
            this.activeScrollSessions[sessionId] = {
                activeScrollers: new Set(),
                moveTimer: null,
                targetImage: markerImage,
                target: 'marker',
                markerValue: markerValue
            };
        }
        
        this.activeScrollSessions[sessionId].activeScrollers.add(scroller.id);
        this.checkMovement(sessionId);
    },
    
    onMarkerScrollerIntersectCleared: function(evt, markerValue, markerTarget) {
        const scroller = evt.target;
        const sessionId = `scroll-marker-${markerValue}`;
        
        if (this.activeScrollSessions[sessionId]) {
            this.activeScrollSessions[sessionId].activeScrollers.delete(scroller.id);
            
            if (this.activeScrollSessions[sessionId].activeScrollers.size === 0) {
                this.stopMovement(sessionId);
            }
        }
    },
    
    // Keep original methods for backward compatibility
    setupImage: function(imageSrc, markerValue, source = 'default') {
        // Keep the original centerpiece-specific functionality
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
            if (this.states && this.states[markerValue] && source !== 'marker') {
                this.scaleMultiplier = this.centerImage.getAttribute('scale').x / this.states[markerValue].scale.x;
            } else {
                this.scaleMultiplier = 1;
            }
            
            const finalScale = baseScale * this.scaleMultiplier;
            
            // Apply all attributes at once for smoother transition
            this.applyImageAttributes(src, baseScale, aspect, finalScale);
            
            if (source === 'marker' || source === 'centerControls') {
                if (!this.states) this.states = {};
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
                if (!this.states) this.states = {};
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
        // Stop all movement sessions
        Object.keys(this.activeScrollSessions).forEach(sessionId => {
            this.stopMovement(sessionId);
        });
    }
});