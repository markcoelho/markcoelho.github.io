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
    
    // Position leftpiece if it exists
    const leftpiece = getId('leftpiece');
    if (leftpiece && contentPanel.id === 'centerpiece') {
        // Calculate perpendicular vector to the direction from camera to centerpiece
        const perpX = direction.z;  // Perpendicular in XZ plane for left
        const perpZ = -direction.x; // Perpendicular in XZ plane for left
        
        // Left offset (2 units to the left)
        const leftOffset = 2;
        const offsetX = perpX * leftOffset;
        const offsetZ = perpZ * leftOffset;
        
        // Camera offset (1 unit toward the camera)
        const cameraOffset = 1;
        const towardCameraX = -direction.x * cameraOffset;
        const towardCameraZ = -direction.z * cameraOffset;
        
        // Combined offset: left + toward camera
        const totalOffsetX = offsetX + towardCameraX;
        const totalOffsetZ = offsetZ + towardCameraZ;
        
        // Set leftpiece position (to the left of centerpiece and closer to camera)
        leftpiece.setAttribute('position', {
            x: centerPos.x + totalOffsetX,
            y: 0,
            z: centerPos.z + totalOffsetZ
        });
        
        // Rotate leftpiece to face camera
        leftpiece.setAttribute('rotation', {
            x: 0,
            y: yRot - 90, // Rotated 90 degrees left
            z: 0
        });
    }
    
    // Position rightpiece if it exists
    const rightpiece = getId('rightpiece');
    if (rightpiece && contentPanel.id === 'centerpiece') {
        // Calculate perpendicular vector in opposite direction for right
        const perpX = -direction.z;  // Perpendicular in XZ plane for right
        const perpZ = direction.x;   // Perpendicular in XZ plane for right
        
        // Right offset (2 units to the right)
        const rightOffset = 2;
        const offsetX = perpX * rightOffset;
        const offsetZ = perpZ * rightOffset;
        
        // Camera offset (1 unit toward the camera)
        const cameraOffset = 1;
        const towardCameraX = -direction.x * cameraOffset;
        const towardCameraZ = -direction.z * cameraOffset;
        
        // Combined offset: right + toward camera
        const totalOffsetX = offsetX + towardCameraX;
        const totalOffsetZ = offsetZ + towardCameraZ;
        
        // Set rightpiece position (to the right of centerpiece and closer to camera)
        rightpiece.setAttribute('position', {
            x: centerPos.x + totalOffsetX,
            y: 0,
            z: centerPos.z + totalOffsetZ
        });
        
        // Rotate rightpiece to face camera
        rightpiece.setAttribute('rotation', {
            x: 0,
            y: yRot + 90, // Rotated 90 degrees right
            z: 0
        });
    }
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