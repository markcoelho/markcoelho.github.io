
// marker-content-manager.js
// Loads and manages all content from JSON file for different markers
AFRAME.registerComponent('marker-content-manager', {
    init: function() {
        this.centerImage = getId('centerImage'); // Main image element
        this.centerpiece = getId('centerpiece'); // Main container
        this.contentSequences = {};    // Stores all content arrays per marker
        this.currentContentIndex = {}; // Tracks which content is selected per marker
        this.narrations = {};          // Audio narrations per marker
        
        // Load content from JSON file immediately
        this.loadContentFromJSON();
    },
    
    // Fetch and parse the content.json file
    loadContentFromJSON: function() {
        fetch('content.json')
            .then(response => response.ok ? response.json() : Promise.reject(response.status))
            .then(data => {
                this.processJSONData(data);
                // Create markers after processing the JSON data
                this.createDynamicMarkers();
            })
            .catch(error => console.error('Error loading content.json:', error));
    },
    
    // Convert JSON data into internal data structures
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
    
    // Create markers dynamically based on content.json
    createDynamicMarkers: function() {
        const camera = document.querySelector('a-camera');
        if (!camera) return;
        
        // Get all barcode numbers from content.json
        const markerNumbers = Object.keys(this.contentSequences);
        
        // Create a marker for each barcode number
        markerNumbers.forEach(markerValue => {
            this.createMarkerElement(markerValue, camera);
        });
        
        console.log(`Created ${markerNumbers.length} markers dynamically`);
        
        // Dispatch event that markers are created
        this.el.sceneEl.emit('markers-created');
    },
    
    // Create a single marker element
    createMarkerElement: function(markerValue, parent) {
        // Create marker element exactly like in HTML
        const markerEl = document.createElement('a-marker');
        markerEl.setAttribute('type', 'barcode');
        markerEl.setAttribute('value', markerValue);
        
        // Create the hidden image placeholder
        const imageEl = document.createElement('a-image');
        imageEl.setAttribute('src', '');
        imageEl.setAttribute('visible', 'false');
        markerEl.appendChild(imageEl);
        
        // Add to the camera element (inside the camera like in original HTML)
        parent.appendChild(markerEl);
        
        return markerEl;
    },
    
    // Get the currently selected content for a marker
    getMarkerContent: function(marker) {
        return this.contentSequences[marker]?.[this.currentContentIndex[marker] || 0];
    },

    getControlsEnabled: function(marker) {
        const content = this.getMarkerContent(marker);
        return content ? content.controls : false;
    },
    
    // Get scale value for current content
    getScale: function(marker) {
        const content = this.getMarkerContent(marker);
        return content ? content.scale : 1;
    },
    
    // Get narration audio URL for a marker
    getNarration: function(marker) {
        return this.narrations[marker] || null;
    }
});