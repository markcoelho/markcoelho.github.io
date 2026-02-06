
// dynamic-marker-creator.js
AFRAME.registerComponent('dynamic-marker-creator', {
    init: function() {
        this.markerContainer = document.getElementById('marker-container');
        this.markers = new Map(); // Store marker references
        this.contentManager = null;
        
        // Wait for content to load
        this.checkContentInterval = setInterval(() => {
            this.contentManager = this.el.sceneEl.components['marker-content-manager'];
            if (this.contentManager?.contentSequences) {
                this.createMarkersFromContent();
                clearInterval(this.checkContentInterval);
                
                // Dispatch event that markers are created
                this.el.sceneEl.emit('markers-created');
            }
        }, 500);
    },
    
    // Create markers based on content.json
    createMarkersFromContent: function() {
        const contentSequences = this.contentManager.contentSequences;
        
        // Clear any existing markers (if re-initializing)
        while (this.markerContainer.firstChild) {
            this.markerContainer.removeChild(this.markerContainer.firstChild);
        }
        
        // Create a marker for each entry in contentSequences
        Object.keys(contentSequences).forEach(markerValue => {
            this.createMarker(markerValue);
        });
        
        console.log(`Created ${Object.keys(contentSequences).length} markers dynamically`);
    },
    
    // Create a single marker element
    createMarker: function(markerValue) {
        // Create marker element
        const markerEl = document.createElement('a-marker');
        markerEl.setAttribute('type', 'barcode');
        markerEl.setAttribute('value', markerValue);
        markerEl.setAttribute('id', `marker-${markerValue}`);
        
        // Add hidden image placeholder (required by some AR.js versions)
        const imageEl = document.createElement('a-image');
        imageEl.setAttribute('src', '');
        imageEl.setAttribute('visible', 'false');
        markerEl.appendChild(imageEl);
        
        // Add event listeners
        markerEl.addEventListener('markerFound', (evt) => this.onMarkerFound(evt.target));
        markerEl.addEventListener('markerLost', (evt) => this.onMarkerLost(evt.target));
        
        // Add to container and store reference
        this.markerContainer.appendChild(markerEl);
        this.markers.set(markerValue, markerEl);
        
        return markerEl;
    },
    
    // Handle marker found event
    onMarkerFound: function(marker) {
        const markerValue = marker.getAttribute('value');
        const scene = this.el.sceneEl;
        
        // Get existing detection handler or create one
        let detectionHandler = scene.components['marker-detection-handler'];
        
        // If detection handler exists, call its onMarkerFound
        if (detectionHandler && detectionHandler.onMarkerFound) {
            detectionHandler.onMarkerFound(marker);
        } else {
            // Fallback: handle it here
            this.handleMarkerDetection(markerValue);
        }
    },
    
    // Handle marker lost event
    onMarkerLost: function(marker) {
        const scene = this.el.sceneEl;
        const detectionHandler = scene.components['marker-detection-handler'];
        
        if (detectionHandler && detectionHandler.onMarkerLost) {
            detectionHandler.onMarkerLost(marker);
        }
    },
    
    // Fallback handler for marker detection
    handleMarkerDetection: function(markerValue) {
        console.log(`Marker ${markerValue} detected`);
        
        const scene = this.el.sceneEl;
        const contentManager = scene.components['marker-content-manager'];
        const imageController = scene.components['image-position-controller'];
        
        if (!contentManager || !imageController) return;
        
        const content = contentManager.getMarkerContent(markerValue);
        if (content?.type === 'image') {
            imageController.setupImage(content.value, markerValue, 'marker');
        }
    },
    
    // Get a marker by its value
    getMarker: function(markerValue) {
        return this.markers.get(markerValue) || 
               document.querySelector(`a-marker[value="${markerValue}"]`);
    },
    
    // Get all markers
    getAllMarkers: function() {
        return Array.from(this.markers.values());
    },
    
    // Cleanup
    remove: function() {
        if (this.checkContentInterval) clearInterval(this.checkContentInterval);
    }
});