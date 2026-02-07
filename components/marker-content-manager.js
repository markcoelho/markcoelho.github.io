
// marker-content-manager.js
AFRAME.registerComponent('marker-content-manager', {
    init: function() {
        this.centerImage = getId('centerImage');
        this.centerpiece = getId('centerpiece');
        this.contentSequences = {};
        this.currentContentIndex = {};
        this.narrations = {};
        
        this.loadContentFromJSON();
    },
    
    // Load content from JSON file
    loadContentFromJSON: function() {
        fetch('content.json')
            .then(response => response.ok ? response.json() : Promise.reject(response.status))
            .then(data => {
                this.processJSONData(data);
                this.createDynamicMarkers();
            })
            .catch(error => console.error('Error loading content.json:', error));
    },
    
    // Process JSON into internal structures
    processJSONData: function(jsonData) {
        this.contentSequences = {};
        this.narrations = {};
        this.currentContentIndex = {};

        jsonData.pages.forEach(page => {
            const marker = page.barcode_number.toString();
            const centralSide = page.central_side;
            
            if (page.narration) this.narrations[marker] = page.narration;
            
            this.contentSequences[marker] = centralSide.map(item => ({
                type: item.type,
                value: item.src || item.value,
                controls: item.controls === "true",
                scale: item.scale || 1
            }));
            
            this.currentContentIndex[marker] = 0;
        });
        
        console.log("Content sequences loaded:", this.contentSequences);
    },
    
    // Create markers based on content.json
    createDynamicMarkers: function() {
        const camera = document.querySelector('a-camera');
        if (!camera) return;
        
        const markerNumbers = Object.keys(this.contentSequences);
        
        markerNumbers.forEach(markerValue => {
            this.createMarkerElement(markerValue, camera);
        });
        
        console.log(`Created ${markerNumbers.length} markers`);
        
        this.el.sceneEl.emit('markers-created');
    },
    
    // Create single marker element
    createMarkerElement: function(markerValue, parent) {
        const markerEl = document.createElement('a-marker');
        markerEl.setAttribute('type', 'barcode');
        markerEl.setAttribute('value', markerValue);
        
        const imageEl = document.createElement('a-image');
        imageEl.setAttribute('src', '');
        imageEl.setAttribute('visible', 'false');
        markerEl.appendChild(imageEl);
        
        parent.appendChild(markerEl);
        
        return markerEl;
    },
    
    // Get current content for marker
    getMarkerContent: function(marker) {
        return this.contentSequences[marker]?.[this.currentContentIndex[marker] || 0];
    },

    // Check if controls are enabled
    getControlsEnabled: function(marker) {
        const content = this.getMarkerContent(marker);
        return content ? content.controls : false;
    },
    
    // Get scale value
    getScale: function(marker) {
        const content = this.getMarkerContent(marker);
        return content ? content.scale : 1;
    },
    
    // Get narration audio
    getNarration: function(marker) {
        return this.narrations[marker] || null;
    }
});