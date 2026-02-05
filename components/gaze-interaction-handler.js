//gaze-interaction-handler.js
AFRAME.registerComponent('gaze-interaction-handler', {
    schema: {
        fuseTimeout: { default: 500 },
        action: { type: 'string' },
        markerValue: { type: 'string' },
        zoomFactor: { default: 0.25 }
    },
    
    init: function() {
        this.timer = null;
        this.isFusing = false;
        this.intersected = false;
        this.triggered = false;
        this.buttonType = this.el.classList.contains('zoom-button') ? 'zoom' : 
                        this.el.classList.contains('nav-button') ? 'nav' : '';
        this.loading = document.getElementById('loading_animation');
        
        this.el.addEventListener('raycaster-intersected', () => {
            this.intersected = true;
            this.triggered = false;
            if (this.buttonType === 'zoom' || (this.buttonType === 'nav' && !this.triggered) || 
                this.el.classList.contains('reset')) {
                this.loading?.setAttribute('visible', 'true');
            }
            this.startFuse();
        });
        
        this.el.addEventListener('raycaster-intersected-cleared', () => {
            this.intersected = false;
            this.reset();
            this.triggered = false;
            this.loading?.setAttribute('visible', 'false');
        });
    },
    
    startFuse: function() {
        if (this.isFusing || !this.intersected || 
            (this.buttonType === 'nav' && this.triggered) ||
            (this.el.classList.contains('reset') && this.triggered)) return;
        
        this.isFusing = true;
        this.timer = setTimeout(() => {
            this.triggerAction();
            this.isFusing = false;
            
            if (this.intersected) {
                if (this.buttonType === 'zoom') this.startFuse();
                else if (this.buttonType === 'nav' || this.el.classList.contains('reset')) {
                    this.triggered = true;
                    this.loading?.setAttribute('visible', 'false');
                }
            } else {
                this.loading?.setAttribute('visible', 'false');
            }
        }, this.data.fuseTimeout);
    },
    
    reset: function() {
        if (this.timer) clearTimeout(this.timer);
        this.timer = null;
        this.isFusing = false;
        this.loading?.setAttribute('visible', 'false');
    },
    
    triggerAction: function() {
        if (this.buttonType === 'zoom') {
            const outsideCamera = document.getElementById('outsidecamera');
            if (!outsideCamera) return;
            
            const currentScale = outsideCamera.getAttribute('scale').x;
            const zoomMultiplier = this.data.zoomFactor;
            let newScale;
            
            if (this.data.action === 'increase') {
                newScale = currentScale * (1 + zoomMultiplier);
            } else {
                newScale = currentScale * (1 - zoomMultiplier);
                newScale = Math.max(0.1, newScale);
            }
            
            outsideCamera.setAttribute('scale', { x: newScale, y: newScale, z: newScale });
        } 
        else if (this.buttonType === 'nav' && !this.triggered) {
            const scene = document.querySelector('a-scene');
            const contentManager = scene.components['marker-content-manager'];
            const marker = this.data.markerValue;
            
            if (!contentManager || !contentManager.contentSequences[marker]) return;
            
            if (contentManager.currentContentIndex[marker] === undefined) {
                contentManager.currentContentIndex[marker] = 0;
            }
            
            const sequence = contentManager.contentSequences[marker];
            let index = contentManager.currentContentIndex[marker];
            
            index = this.data.action === 'right' ? 
                (index + 1) % sequence.length : 
                (index - 1 + sequence.length) % sequence.length;
            
            contentManager.currentContentIndex[marker] = index;
            const content = sequence[index];
            
            if (content.type === 'image') {
                const outsideCamera = document.getElementById('outsidecamera');
                if (outsideCamera) {
                    outsideCamera.setAttribute('src', content.value);
                    
                    setTimeout(() => {
                        const img = outsideCamera.components.material?.material?.map?.image;
                        if (img) {
                            const aspectRatio = img.naturalWidth / img.naturalHeight;
                            outsideCamera.setAttribute('width', 3);
                            outsideCamera.setAttribute('height', 3 / aspectRatio);
                        }
                    }, 500);
                }
            }
            
            this.triggered = true;
        }
        else if (this.el.classList.contains('reset')) {
            const outsideCamera = document.getElementById('outsidecamera');
            if (outsideCamera) {
                outsideCamera.setAttribute('scale', { x: 3, y: 3, z: 3 });
                outsideCamera.setAttribute('position', { x: 0, y: 0, z: 0 });
            }
        }
    },
    
    remove: function() {
        this.reset();
        this.el.removeEventListener('raycaster-intersected', () => {});
        this.el.removeEventListener('raycaster-intersected-cleared', () => {});
    }
});







