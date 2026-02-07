//utils.js

// Helper function: Gets an entity's position in 3D world coordinates
// (Used by other components for positioning)
function getWorldPosition(entity) {
    const position = new THREE.Vector3(); // Create 3D vector
    entity.object3D.getWorldPosition(position); // Get position from Three.js object
    return position; // Return the position
}

// Calculate image size while keeping aspect ratio, fitting within max bounds
function calcImageSize(aspectRatio, maxWidth, maxHeight) {
    // If image is wider than tall (landscape)
    if (aspectRatio > 1) {
        return { width: maxWidth, height: maxWidth / aspectRatio };
    } 
    // If image is taller than wide (portrait)
    else {
        return { width: maxHeight * aspectRatio, height: maxHeight };
    }
}

//Position content panel between camera and marker
function positionBetweenCameraAndMarker(camera, marker, contentPanel) {
    // Get positions
    const markerPos = getWorldPosition(marker);
    const cameraPos = getWorldPosition(camera);
    
    // Use only X and Z coordinates (ignore height/Y)
    const markerXZ = new THREE.Vector3(markerPos.x, 0, markerPos.z);
    const cameraXZ = new THREE.Vector3(cameraPos.x, 0, cameraPos.z);
    
    // Calculate direction from camera to marker
    const direction = new THREE.Vector3().subVectors(markerXZ, cameraXZ).normalize();
    // Position panel 5 units from marker toward camera
    const centerPos = new THREE.Vector3().copy(markerXZ).add(direction.multiplyScalar(5));
    
    // Calculate rotation to face camera
    const lookDir = new THREE.Vector3().subVectors(cameraXZ, centerPos).normalize();
    const yRot = THREE.Math.radToDeg(Math.atan2(lookDir.x, lookDir.z));
    
    // Apply position and rotation to content panel
    contentPanel.setAttribute('position', { 
        x: centerPos.x, 
        y: 0, 
        z: centerPos.z 
    });
    contentPanel.setAttribute('rotation', { 
        x: 0, 
        y: yRot, 
        z: 0 
    });
}


// Extend all DOM Simple visibility helper functions
if (typeof Element !== 'undefined') {
    Element.prototype.setVisible = function(isVisible = true) {
        this.setAttribute('visible', isVisible);
        
        // Add or remove "not-interactive" class based on visibility
        if (isVisible) {
            this.classList.remove('not-interactive');
            // Also remove from all children
            this.querySelectorAll('.not-interactive').forEach(child => {
                child.classList.remove('not-interactive');
            });
        } else {
            this.classList.add('not-interactive');
            // Also add to all children
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
        
        // Toggle the "not-interactive" class
        if (!isCurrentlyVisible) {
            this.classList.remove('not-interactive');
            // Also remove from all children
            this.querySelectorAll('.not-interactive').forEach(child => {
                child.classList.remove('not-interactive');
            });
        } else {
            this.classList.add('not-interactive');
            // Also add to all children
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