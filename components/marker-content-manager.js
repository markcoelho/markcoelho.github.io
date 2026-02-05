// marker-content-manager.js
// Loads and manages all content from JSON file for different markers
AFRAME.registerComponent('marker-content-manager', {
    init: function() {
        this.outsideCamera = document.getElementById('outsidecamera'); // Main image element
        this.centerpiece = document.getElementById('centerpiece'); // Main container
        this.contentSequences = {};    // Stores all content arrays per marker
        this.currentContentIndex = {}; // Tracks which content is selected per marker
        this.narrations = {};          // Audio narrations per marker
        this.zoomingEnabled = {};      // Whether zooming is allowed per marker
        this.contentScales = {};       // Custom scale values per marker/content
        
        // Load content from JSON file immediately
        this.loadContentFromJSON();
    },
    
    // Fetch and parse the content.json file
    loadContentFromJSON: function() {
        fetch('content.json')
            .then(response => response.ok ? response.json() : Promise.reject(response.status))
            .then(data => this.processJSONData(data));
            // Note: Error handling would be good here in production
    },
    
    // Convert JSON data into internal data structures
    processJSONData: function(jsonData) {
        // Reset all data
        this.contentSequences = {};
        this.narrations = {};
        this.zoomingEnabled = {};
        this.contentScales = {}; // NEW: Initialize scale storage
        
        // Process each page/marker in the JSON
        jsonData.pages.forEach(page => {
            const marker = page.barcode_number.toString(); // Marker ID (0-9)
            const centralSide = page.central_side || {}; // Now an object
            const contentArray = centralSide.content || []; // Get content array from the object
            
            // Store narration audio URL if present
            if (page.narration) this.narrations[marker] = page.narration;
            
            // Process each content item for this marker
            this.contentSequences[marker] = contentArray.map(item => ({
                type: item.type,           // 'image', 'video', etc.
                value: item.src || item.value, // URL or source
                scrolling: item.scrolling === "true", // Can user scroll? (boolean)
                zooming: item.zooming === "true",     // Can user zoom? (boolean)
                scale: item.scale || 1     // Custom scale factor (NEW: default 1)
            }));
            
            // Start at first content item (index 0)
            this.currentContentIndex[marker] = 0;
        });
        
        // Debug log to verify data loaded correctly
        console.log("Content sequences loaded:", this.contentSequences);
    },
    
    // Get the currently selected content for a marker
    getCurrentContentForMarker: function(marker) {
        // Return content at current index, or first item if none selected
        return this.contentSequences[marker]?.[this.currentContentIndex[marker] || 0];
    },
    
    // NEW: Get scale value for current content
    getScaleForCurrentContent: function(marker) {
        const content = this.getCurrentContentForMarker(marker);
        return content ? content.scale : 1; // Return scale or default to 1
    },
    
    // Check if zooming is allowed for current content
    isZoomingEnabledForCurrentContent: function(marker) {
        const content = this.getCurrentContentForMarker(marker);
        return content ? content.zooming : false; // Return boolean
    },
    
    // Check if scrolling is allowed for current content
    isScrollingEnabledForCurrentContent: function(marker) {
        const content = this.getCurrentContentForMarker(marker);
        return content ? content.scrolling : false; // Return boolean
    },
    
    // Get narration audio URL for a marker
    getNarrationForMarker: function(marker) {
        return this.narrations[marker] || null; // Return URL or null
    }
});