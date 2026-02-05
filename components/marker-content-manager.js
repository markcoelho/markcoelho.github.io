// marker-content-manager.js
AFRAME.registerComponent('marker-content-manager', {
    init: function() {
        this.outsideCamera = document.getElementById('outsidecamera');
        this.centerpiece = document.getElementById('centerpiece');
        this.contentSequences = {};
        this.currentContentIndex = {};
        this.narrations = {};
        this.zoomingEnabled = {}; // Store zooming enabled/disabled per marker/content
        
        this.loadContentFromJSON();
    },
    
    loadContentFromJSON: function() {
        fetch('content.json')
            .then(response => response.ok ? response.json() : Promise.reject(response.status))
            .then(data => this.processJSONData(data))
            .catch(error => console.error('Error loading content.json:', error));
    },
    
    processJSONData: function(jsonData) {
        this.contentSequences = {};
        this.narrations = {};
        this.zoomingEnabled = {};
        
        jsonData.pages.forEach(page => {
            const marker = page.barcode_number.toString();
            const centralSide = page.central_side || [];
            
            if (page.narration) this.narrations[marker] = page.narration;
            
            this.contentSequences[marker] = centralSide.map(item => ({
                type: item.type,
                value: item.src || item.value,
                position: item.position,
                scrolling: item.scrolling === 'true',
                zooming: item.zooming === 'true' // Store zooming setting per content
            }));
            
            this.currentContentIndex[marker] = 0;
        });
    },
    
    getCurrentContentForMarker: function(marker) {
        return this.contentSequences[marker]?.[this.currentContentIndex[marker] || 0];
    },
    
    isZoomingEnabledForCurrentContent: function(marker) {
        const content = this.getCurrentContentForMarker(marker);
        return content ? content.zooming : false;
    },

    isScrollingEnabledForCurrentContent: function(marker) {
        const content = this.getCurrentContentForMarker(marker);
        return content ? content.scrolling : false;
    },
    
    getNarrationForMarker: function(marker) {
        return this.narrations[marker] || null;
    }
});





