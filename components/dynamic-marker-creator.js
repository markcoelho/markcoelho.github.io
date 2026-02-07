
// dynamic-marker-creator.js
AFRAME.registerComponent('dynamic-marker-creator', {
    init: function() {
        this.markerContainer = document.getElementById('marker-container');
        this.markers = new Map();
        this.contentManager = null;
        
        this.checkContentInterval = setInterval(() => {
            this.contentManager = this.el.sceneEl.components['marker-content-manager'];
            if (this.contentManager?.contentSequences) {
                this.createMarkersFromContent();
                clearInterval(this.checkContentInterval);
                this.el.sceneEl.emit('markers-created');
            }
        }, 500);
    },
    
    // Create markers from content.json
    createMarkersFromContent: function() {
        const contentSequences = this.contentManager.contentSequences;
        
        while (this.markerContainer.firstChild) {
            this.markerContainer.removeChild(this.markerContainer.firstChild);
        }
        
        Object.keys(contentSequences).forEach(markerValue => {
            this.createMarker(markerValue);
        });
        
        console.log(`Created ${Object.keys(contentSequences).length} markers`);
    },
    
    // Create single marker element
    createMarker: function(markerValue) {
        const markerEl = document.createElement('a-marker');
        markerEl.setAttribute('type', 'barcode');
        markerEl.setAttribute('value', markerValue);
        markerEl.setAttribute('id', `marker-${markerValue}`);
        
        const imageEl = document.createElement('a-image');
        imageEl.setAttribute('src', '');
        imageEl.setAttribute('visible', 'false');
        markerEl.appendChild(imageEl);
        
        markerEl.addEventListener('markerFound', (evt) => this.onMarkerFound(evt.target));
        markerEl.addEventListener('markerLost', (evt) => this.onMarkerLost(evt.target));
        
        this.markerContainer.appendChild(markerEl);
        this.markers.set(markerValue, markerEl);
        
        return markerEl;
    },
    
    onMarkerFound: function(marker) {
        const markerValue = marker.getAttribute('value');
        const scene = this.el.sceneEl;
        const detectionHandler = scene.components['marker-detection-handler'];
        
        if (detectionHandler?.onMarkerFound) {
            detectionHandler.onMarkerFound(marker);
        }
    },
    
    onMarkerLost: function(marker) {
        const scene = this.el.sceneEl;
        const detectionHandler = scene.components['marker-detection-handler'];
        
        if (detectionHandler?.onMarkerLost) {
            detectionHandler.onMarkerLost(marker);
        }
    },
    
    getMarker: function(markerValue) {
        return this.markers.get(markerValue) || 
               document.querySelector(`a-marker[value="${markerValue}"]`);
    },
    
    getAllMarkers: function() {
        return Array.from(this.markers.values());
    },
    
    remove: function() {
        if (this.checkContentInterval) clearInterval(this.checkContentInterval);
    }
});