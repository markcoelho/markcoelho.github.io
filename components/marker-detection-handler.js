// marker-detection-handler.js
AFRAME.registerComponent('marker-detection-handler', {
    init: function() {
        this.audioElements = {};
        this.currentPlayingAudio = null;
        this.outsideCamera = document.getElementById('outsidecamera');
        this.centerpiece = document.getElementById('centerpiece');
        this.camera = document.querySelector('a-camera');
        
        document.querySelectorAll('a-marker').forEach(marker => {
            marker.addEventListener('markerFound', () => this.onMarkerFound(marker));
            marker.addEventListener('markerLost', () => this.onMarkerLost(marker));
        });
    },
    
    onMarkerFound: function(marker) {
        const value = marker.getAttribute('value');
        
        // Handle audio
        if (this.currentPlayingAudio) {
            this.currentPlayingAudio.pause();
            this.currentPlayingAudio.currentTime = 0;
        }
        
        const scene = this.el.sceneEl;
        const contentManager = scene.components['marker-content-manager'];
        
        if (contentManager?.narrations?.[value]) {
            this.playAudio(value, contentManager.narrations[value]);
        }
        
        // Show/hide buttons based on content
        this.updateButtonVisibility(marker, value, contentManager);
        
        // Update image
        if (this.outsideCamera && contentManager) {
            const content = contentManager.getCurrentContentForMarker(value);
            if (content?.type === 'image') {
                this.updateImage(content.value);
            }
        }
        
        // Position centerpiece
        if (this.centerpiece && this.camera) {
            this.positionBetweenCameraAndMarker(marker);
        }
    },
    
    onMarkerLost: function(marker) {
        if (marker._navButtons) {
            marker._navButtons.left.setAttribute('visible', 'false');
            marker._navButtons.right.setAttribute('visible', 'false');
        }
    },
    
    updateButtonVisibility: function(marker, markerValue, contentManager) {
        // Navigation buttons
        const hasMultiple = contentManager?.contentSequences?.[markerValue]?.length > 1;
        if (marker._navButtons) {
            marker._navButtons.left.setAttribute('visible', hasMultiple.toString());
            marker._navButtons.right.setAttribute('visible', hasMultiple.toString());
        }
        
        // Zoom buttons - check if zooming is enabled for current content
        const zoomEnabled = contentManager?.isZoomingEnabledForCurrentContent(markerValue);
        const zoomButtons = document.querySelectorAll('.zoom-button');
        zoomButtons.forEach(btn => {
            btn.setAttribute('visible', zoomEnabled?.toString() || 'false');
        });
        
        // Scroll buttons - check if scrolling is enabled for current content
        const scrollingEnabled = contentManager?.isScrollingEnabledForCurrentContent(markerValue);
        const scrollButtons = document.querySelectorAll('.scroller');
        scrollButtons.forEach(btn => {
            btn.setAttribute('visible', scrollingEnabled?.toString() || 'false');
        });
    },
    
    playAudio: function(markerValue, url) {
        if (!this.audioElements[markerValue]) {
            this.audioElements[markerValue] = new Audio(url);
            this.audioElements[markerValue].preload = 'auto';
        }
        
        this.currentPlayingAudio = this.audioElements[markerValue];
        this.currentPlayingAudio.currentTime = 0;
        this.currentPlayingAudio.play().catch(e => console.log('Audio error:', e));
    },
    
    updateImage: function(imageSrc) {
        this.outsideCamera.setAttribute('src', imageSrc);
        setTimeout(() => {
            const img = this.outsideCamera.components.material?.material?.map?.image;
            if (img) {
                const aspect = img.naturalWidth / img.naturalHeight;
                this.outsideCamera.setAttribute('width', 3);
                this.outsideCamera.setAttribute('height', 3 / aspect);
            }
        }, 500);
    },
    
    positionBetweenCameraAndMarker: function(marker) {
        const getPos = (entity) => {
            const pos = new THREE.Vector3();
            entity.object3D.getWorldPosition(pos);
            return pos;
        };
        
        const markerPos = getPos(marker);
        const cameraPos = getPos(this.camera);
        
        const markerXZ = new THREE.Vector3(markerPos.x, 0, markerPos.z);
        const cameraXZ = new THREE.Vector3(cameraPos.x, 0, cameraPos.z);
        
        const direction = new THREE.Vector3().subVectors(markerXZ, cameraXZ).normalize();
        const centerPos = new THREE.Vector3().copy(markerXZ).add(direction.multiplyScalar(5));
        
        const lookDir = new THREE.Vector3().subVectors(cameraXZ, centerPos).normalize();
        const yRot = THREE.Math.radToDeg(Math.atan2(lookDir.x, lookDir.z));
        
        this.centerpiece.setAttribute('position', { x: centerPos.x, y: 0, z: centerPos.z });
        this.centerpiece.setAttribute('rotation', { x: 0, y: yRot, z: 0 });
    }
});




