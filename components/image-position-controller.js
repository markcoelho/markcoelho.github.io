//image-position-controller.js
AFRAME.registerComponent('image-position-controller', {
    init: function() {
        this.outsideCamera = document.getElementById('outsidecamera');
        this.scrollerElements = document.querySelectorAll('.scroller');
        this.isImageIntersected = false;
        this.activeScrollers = new Set();
        this.moveInterval = null;
        this.moveDistance = 0.1;
        this.moveSpeed = 50;
        
        this.outsideCamera.addEventListener('raycaster-intersected', () => {
            this.isImageIntersected = true;
            this.checkForDoubleIntersection();
        });
        this.outsideCamera.addEventListener('raycaster-intersected-cleared', () => {
            this.isImageIntersected = false;
            this.stopMovement();
        });
        
        this.scrollerElements.forEach(scroller => {
            scroller.addEventListener('raycaster-intersected', (evt) => {
                this.activeScrollers.add(evt.target.id);
                this.checkForDoubleIntersection();
            });
            scroller.addEventListener('raycaster-intersected-cleared', (evt) => {
                this.activeScrollers.delete(evt.target.id);
                if (this.activeScrollers.size === 0) this.stopMovement();
            });
        });
    },
    
    checkForDoubleIntersection: function() {
        if (this.isImageIntersected && this.activeScrollers.size > 0 && !this.moveInterval) {
            this.startMovement();
        }
    },
    
    startMovement: function() {
        this.moveInterval = setInterval(() => this.continuousMove(), this.moveSpeed);
    },
    
    stopMovement: function() {
        if (this.moveInterval) {
            clearInterval(this.moveInterval);
            this.moveInterval = null;
        }
    },
    
    continuousMove: function() {
        if (!this.outsideCamera || this.activeScrollers.size === 0 || !this.isImageIntersected) {
            this.stopMovement();
            return;
        }
        
        const currentPos = this.outsideCamera.getAttribute('position');
        let moveX = 0, moveY = 0;
        
        if (this.activeScrollers.has('scroller-top')) moveY -= this.moveDistance;
        if (this.activeScrollers.has('scroller-right')) moveX -= this.moveDistance;
        if (this.activeScrollers.has('scroller-bottom')) moveY += this.moveDistance;
        if (this.activeScrollers.has('scroller-left')) moveX += this.moveDistance;
        
        this.outsideCamera.setAttribute('position', {
            x: currentPos.x + moveX,
            y: currentPos.y + moveY,
            z: currentPos.z
        });
    },
    
    remove: function() {
        if (this.moveInterval) clearInterval(this.moveInterval);
    }
});






