
// model-controller.js
AFRAME.registerComponent('model-controller', {
    schema: {
        minScale: { default: 0.1 },
        maxScale: { default: 10 },
        rotationStep: { default: 1 },
        rotationInterval: { default: 25 }
    },
    
    init: function() {
        this.models = {
            center: getId('centerModel'),
            left: getId('leftModel'),
            right: getId('rightModel')
        };
        
        this.currentMarker = null;
        this.modelScales = {};
        this.originalScales = {};
        this.modelRotations = {};
        this.activeRotationSessions = {};
        
        this.setupListeners();
    },
    
    setupListeners: function() {
        // Marker found listener
        this.el.sceneEl.addEventListener('markerFound', (evt) => {
            const marker = evt.target;
            const markerValue = marker.getAttribute('value');
            const contentManager = this.el.sceneEl.components['content-manager'];
            
            if (contentManager) {
                const content = contentManager.getMarkerContent(markerValue);
                if (content?.type === '3d') {
                    this.setCurrentMarker(markerValue, content.scale || 1);
                }
            }
        });
        
        // Setup all roller listeners
        ['center', 'left', 'right'].forEach(target => this.setupRollerListeners(target));
        
        // Observe for marker rollers
        this.observeMarkerRollers();
    },
    
    setupRollerListeners: function(target) {
        const rollers = document.querySelectorAll(target === 'center' ? '.roller' : `.${target}-roller`);
        const sessionId = `rotate-${target}`;
        
        rollers.forEach(roller => {
            roller.addEventListener('raycaster-intersected', (evt) => {
                if (roller.classList.contains('not-interactive')) return;
                const targetModel = this.models[target];
                if (!targetModel?.getAttribute('visible')) return;
                
                this.activeRotationSessions[sessionId] = this.activeRotationSessions[sessionId] || {
                    activeRollers: new Set(), rotateTimer: null, targetModel, target
                };
                
                this.activeRotationSessions[sessionId].activeRollers.add(roller.id);
                this.startRotation(sessionId);
            });
            
            roller.addEventListener('raycaster-intersected-cleared', (evt) => {
                const session = this.activeRotationSessions[sessionId];
                if (session) {
                    session.activeRollers.delete(roller.id);
                    if (session.activeRollers.size === 0) this.stopRotation(sessionId);
                }
            });
        });
    },
    
    startRotation: function(sessionId) {
        const session = this.activeRotationSessions[sessionId];
        if (session && !session.rotateTimer) {
            session.rotateTimer = setInterval(() => this.continuousRotate(sessionId), this.data.rotationInterval);
        }
    },
    
    stopRotation: function(sessionId) {
        const session = this.activeRotationSessions[sessionId];
        if (session?.rotateTimer) {
            clearInterval(session.rotateTimer);
            session.rotateTimer = null;
        }
    },
    
    continuousRotate: function(sessionId) {
        const session = this.activeRotationSessions[sessionId];
        if (!session?.targetModel || session.activeRollers.size === 0) {
            this.stopRotation(sessionId);
            return;
        }
        
        const rot = session.targetModel.getAttribute('rotation');
        let rotateY = 0, rotateZ = 0;
        
        session.activeRollers.forEach(id => {
            if (id.includes('up')) rotateZ -= this.data.rotationStep;
            if (id.includes('down')) rotateZ += this.data.rotationStep;
            if (id.includes('left')) rotateY += this.data.rotationStep;
            if (id.includes('right')) rotateY -= this.data.rotationStep;
        });
        
        session.targetModel.setAttribute('rotation', { x: rot.x, y: rot.y + rotateY, z: rot.z + rotateZ });
        
        // Save rotation for current marker
        if (session.target === 'center' && this.currentMarker) {
            this.modelRotations[this.currentMarker] = { x: rot.x, y: rot.y + rotateY, z: rot.z + rotateZ };
        }
    },
    
    observeMarkerRollers: function() {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(m => {
                m.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        if (node.classList?.contains('marker-roller')) this.setupMarkerRoller(node);
                        node.querySelectorAll?.('.marker-roller').forEach(r => this.setupMarkerRoller(r));
                    }
                });
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
    },
    
    setupMarkerRoller: function(roller) {
        const markerTarget = roller.getAttribute('data-target');
        if (!markerTarget?.startsWith('marker-')) return;
        
        const markerValue = markerTarget.replace('marker-', '');
        const sessionId = `rotate-marker-${markerValue}`;
        
        roller.addEventListener('raycaster-intersected', (evt) => {
            if (roller.classList.contains('not-interactive')) return;
            const markerModel = document.querySelector(`#${markerTarget}-container #${markerTarget}-model`);
            if (!markerModel?.getAttribute('visible')) return;
            
            this.activeRotationSessions[sessionId] = this.activeRotationSessions[sessionId] || {
                activeRollers: new Set(), rotateTimer: null, targetModel: markerModel, target: markerTarget
            };
            
            this.activeRotationSessions[sessionId].activeRollers.add(roller.id);
            this.startRotation(sessionId);
        });
        
        roller.addEventListener('raycaster-intersected-cleared', (evt) => {
            const session = this.activeRotationSessions[sessionId];
            if (session) {
                session.activeRollers.delete(roller.id);
                if (session.activeRollers.size === 0) this.stopRotation(sessionId);
            }
        });
    },
    
    setCurrentMarker: function(markerValue, originalScale) {
        this.currentMarker = markerValue;
        this.originalScales[markerValue] = originalScale;
        this.modelScales[markerValue] = this.modelScales[markerValue] || originalScale;
        this.modelRotations[markerValue] = this.modelRotations[markerValue] || { x: 0, y: 0, z: 0 };
        
        if (this.models.center.getAttribute('visible')) {
            this.models.center.setAttribute('scale', { x: this.modelScales[markerValue], y: this.modelScales[markerValue], z: this.modelScales[markerValue] });
            this.models.center.setAttribute('rotation', this.modelRotations[markerValue]);
        }
    },
    
    resetModel: function(target) {
        let targetModel, markerValue;
        
        if (target === 'center') {
            targetModel = this.models.center;
            markerValue = this.currentMarker;
        } else if (target === 'left' || target === 'right') {
            targetModel = this.models[target];
            markerValue = this.el.sceneEl.components['marker-detection']?.currentMarker;
        } else if (target.startsWith('marker-')) {
            targetModel = document.querySelector(`#${target}-container #${target}-model`);
            markerValue = target.replace('marker-', '');
        }
        
        if (!targetModel?.getAttribute('visible')) return;
        
        // Get original scale from content manager
        let originalScale = 1;
        const contentManager = this.el.sceneEl.components['content-manager'];
        if (contentManager && markerValue) {
            const content = target === 'center' ? contentManager.getMarkerContent(markerValue) :
                           target === 'left' ? contentManager.getLeftSideContent(markerValue) :
                           target === 'right' ? contentManager.getRightSideContent(markerValue) :
                           contentManager.getCurrentMarkerItem?.(markerValue);
            originalScale = content?.scale || 1;
        }
        
        targetModel.setAttribute('scale', { x: originalScale, y: originalScale, z: originalScale });
        targetModel.setAttribute('rotation', { x: 0, y: 0, z: 0 });
        
        if (markerValue) {
            this.modelScales[markerValue] = originalScale;
            this.modelRotations[markerValue] = { x: 0, y: 0, z: 0 };
        }
    },
    
    handleGridSelection: function(markerValue, originalScale) {
        this.setCurrentMarker(markerValue, originalScale);
        this.modelScales[markerValue] = originalScale;
        if (this.models.center.getAttribute('visible')) {
            this.models.center.setAttribute('scale', { x: originalScale, y: originalScale, z: originalScale });
        }
    },
    
    getUserScale: function(markerValue) {
        return this.modelScales[markerValue] || this.originalScales[markerValue] || 1;
    },
    
    remove: function() {
        Object.keys(this.activeRotationSessions).forEach(id => this.stopRotation(id));
    }
});

