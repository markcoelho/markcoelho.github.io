//utils.js

// Get world position of entity
function getWorldPosition(entity) {
    const position = new THREE.Vector3();
    entity.object3D.getWorldPosition(position);
    return position;
}

// Calculate image size with aspect ratio
function calcImageSize(aspectRatio, maxWidth, maxHeight) {
    if (aspectRatio > 1) {
        return { width: maxWidth, height: maxWidth / aspectRatio };
    } else {
        return { width: maxHeight * aspectRatio, height: maxHeight };
    }
}

// Position panel between camera and marker
function positionBetweenCameraAndMarker(camera, marker, contentPanel) {
    const markerPos = getWorldPosition(marker);
    const cameraPos = getWorldPosition(camera);
    
    const markerXZ = new THREE.Vector3(markerPos.x, 0, markerPos.z);
    const cameraXZ = new THREE.Vector3(cameraPos.x, 0, cameraPos.z);
    
    const direction = new THREE.Vector3().subVectors(markerXZ, cameraXZ).normalize();
    const centerPos = new THREE.Vector3().copy(markerXZ).add(direction.multiplyScalar(5));
    
    const lookDir = new THREE.Vector3().subVectors(cameraXZ, centerPos).normalize();
    const yRot = THREE.Math.radToDeg(Math.atan2(lookDir.x, lookDir.z));
    
    contentPanel.setAttribute('position', { x: centerPos.x, y: 0, z: centerPos.z });
    contentPanel.setAttribute('rotation', { x: 0, y: yRot, z: 0 });
}

// Visibility helper functions
if (typeof Element !== 'undefined') {
    Element.prototype.setVisible = function(isVisible = true) {
        this.setAttribute('visible', isVisible);
        
        if (isVisible) {
            this.classList.remove('not-interactive');
            this.querySelectorAll('.not-interactive').forEach(child => {
                child.classList.remove('not-interactive');
            });
        } else {
            this.classList.add('not-interactive');
            this.querySelectorAll('*').forEach(child => {
                child.classList.add('not-interactive');
            });
        }
        
        return this;
    };
    
    Element.prototype.setInvisible = function() {
        return this.setVisible(false);
    };
    
    Element.prototype.toggleVisible = function() {
        const isCurrentlyVisible = this.getAttribute('visible');
        this.setAttribute('visible', !isCurrentlyVisible);
        
        if (!isCurrentlyVisible) {
            this.classList.remove('not-interactive');
            this.querySelectorAll('.not-interactive').forEach(child => {
                child.classList.remove('not-interactive');
            });
        } else {
            this.classList.add('not-interactive');
            this.querySelectorAll('*').forEach(child => {
                child.classList.add('not-interactive');
            });
        }
        
        return this;
    };
}

// Shortcut for getElementById
function getId(id) {
    return document.getElementById(id);
}

// Video control functions
function pauseVideo(aframeVideoElement) {
    if (!aframeVideoElement) return false;
    try {
        const material = aframeVideoElement.components?.material?.material;
        if (material?.map?.image) {
            material.map.image.pause();
            return true;
        }
        return false;
    } catch (e) {
        console.warn('Could not pause video:', e);
        return false;
    }
}

function playVideo(aframeVideoElement) {
    if (!aframeVideoElement) return false;
    try {
        const material = aframeVideoElement.components?.material?.material;
        if (material?.map?.image) {
            return material.map.image.play();
        }
        return false;
    } catch (e) {
        console.warn('Could not play video:', e);
        return false;
    }
}


// Continuous movement controller
class ContinuousMovementController {
  constructor(moveInterval = 50) {
    this.activeControls = new Set();
    this.timer = null;
    this.moveInterval = moveInterval;
    this.callback = null;
  }
  
  start(callback) {
    if (this.timer) return;
    this.callback = callback;
    this.timer = setInterval(() => {
      if (this.activeControls.size > 0 && this.callback) {
        this.callback(this.activeControls);
      } else {
        this.stop();
      }
    }, this.moveInterval);
  }
  
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.activeControls.clear();
  }
  
  addControl(id) {
    this.activeControls.add(id);
  }
  
  removeControl(id) {
    this.activeControls.delete(id);
  }
  
  hasControls() {
    return this.activeControls.size > 0;
  }
}

// Movement mappings (shared between files)
const IMAGE_MOVEMENTS = {
  'scroller-top': [0, -0.1, 0],
  'scroller-right': [-0.1, 0, 0],
  'scroller-bottom': [0, 0.1, 0],
  'scroller-left': [0.1, 0, 0]
};

const MODEL_ROTATIONS = {
  'roller-up': () => ({ y: 0, z: -1 }),
  'roller-down': () => ({ y: 0, z: 1 }),
  'roller-left': () => ({ y: 1, z: 0 }),
  'roller-right': () => ({ y: -1, z: 0 })
};