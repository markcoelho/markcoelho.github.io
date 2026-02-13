AFRAME.registerComponent('marker-content-manager', {
    init: function() {
        this.centerImage = getId('centerImage');
        this.centerpiece = getId('centerpiece');
        this.contentSequences = {};
        this.currentContentIndex = {};
        this.narrations = {};
        this.surroundContent = {};
        
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
    
    // Process JSON into internal structures - TAKES FIRST ELEMENT FROM ARRAYS
    // In marker-content-manager.js, update processJSONData function
processJSONData: function(jsonData) {
    this.contentSequences = {};
    this.narrations = {};
    this.currentContentIndex = {};
    this.surroundContent = {}; 
    this.markerData = {};
    this.leftSideContent = {};
    this.rightSideContent = {};
    this.markerNavigationFlags = {}; // Add this line

    jsonData.pages.forEach(page => {
        const marker = page.barcode_number.toString();
        const centralSide = page.central_side;
        
        // Store marker_navigation flag
        this.markerNavigationFlags[marker] = page.marker_navigation === "true";
        
        if (page.narration) this.narrations[marker] = page.narration;
        
        this.surroundContent[marker] = page.surround || "";
        
        // Store marker data - take FIRST ELEMENT if it exists
        if (page.marker && page.marker.length > 0 && page.marker[0].type && page.marker[0].type !== "") {
            this.markerData[marker] = {
                type: page.marker[0].type,
                src: page.marker[0].src,
                scale: page.marker[0].scale || 1
            };
        }
        
        // Store left_side content - take FIRST ELEMENT if it exists
        if (page.left_side && page.left_side.length > 0 && page.left_side[0].type && page.left_side[0].type !== "") {
            this.leftSideContent[marker] = {
                type: page.left_side[0].type,
                value: page.left_side[0].src || page.left_side[0].value,
                controls: page.left_side[0].controls === "true",
                scale: page.left_side[0].scale || 1
            };
        }
        
        // Store right_side content - take FIRST ELEMENT if it exists
        if (page.right_side && page.right_side.length > 0 && page.right_side[0].type && page.right_side[0].type !== "") {
            this.rightSideContent[marker] = {
                type: page.right_side[0].type,
                value: page.right_side[0].src || page.right_side[0].value,
                controls: page.right_side[0].controls === "true",
                scale: page.right_side[0].scale || 1
            };
        }
        
        this.contentSequences[marker] = centralSide.map(item => ({
            type: item.type,
            value: item.src || item.value,
            controls: item.controls === "true",
            scale: item.scale || 1
        }));
        
        this.currentContentIndex[marker] = 0;
    });
    
    console.log("Content sequences loaded:", this.contentSequences);
    console.log("Marker data loaded (first element):", this.markerData);
    console.log("Left side content loaded (first element):", this.leftSideContent);
    console.log("Right side content loaded (first element):", this.rightSideContent);
    console.log("Surround content loaded:", this.surroundContent);
    console.log("Marker navigation flags:", this.markerNavigationFlags);
},

// Add getter for marker navigation flag
getMarkerNavigationFlag: function(marker) {
    return this.markerNavigationFlags[marker] === true;
},

    // Add getter for right side content
    getRightSideContent: function(marker) {
        return this.rightSideContent[marker];
    },
    
    // Create markers based on content.json
    createDynamicMarkers: function() {
        const camera = document.querySelector('a-camera');
        if (!camera) return;
        
        const markerNumbers = Object.keys(this.contentSequences);
        
        markerNumbers.forEach(markerValue => {
            this.createMarkerElement(markerValue, camera);
        });
        
        console.log(`Created ${markerNumbers.length} markers with content entities`);
        
        this.el.sceneEl.emit('markers-created');
    },
    
    // Create single marker element
    createMarkerElement: function(markerValue, parent) {
        const markerEl = document.createElement('a-marker');
        markerEl.setAttribute('type', 'barcode');
        markerEl.setAttribute('value', markerValue);
        
        // Create image element
        const imageEl = document.createElement('a-image');
        imageEl.setAttribute('id', `marker-${markerValue}-image`);
        imageEl.setAttribute('src', '');
        imageEl.setAttribute('scale', '3 3 3');
        imageEl.setAttribute('render-order', '1');
        imageEl.setAttribute('visible', 'false');
        imageEl.setAttribute('class', 'content-entity');
        markerEl.appendChild(imageEl);
        
        // Create video element
        const videoEl = document.createElement('a-video');
        videoEl.setAttribute('id', `marker-${markerValue}-video`);
        videoEl.setAttribute('src', '');
        videoEl.setAttribute('scale', '3 3 3');
        videoEl.setAttribute('render-order', '1');
        videoEl.setAttribute('visible', 'false');
        videoEl.setAttribute('class', 'content-entity');
        markerEl.appendChild(videoEl);
        
        // Create 3D model element
        const modelEl = document.createElement('a-entity');
        modelEl.setAttribute('id', `marker-${markerValue}-model`);
        modelEl.setAttribute('gltf-model', '');
        modelEl.setAttribute('scale', '1 1 1');
        modelEl.setAttribute('render-order', '1');
        modelEl.setAttribute('visible', 'false');
        modelEl.setAttribute('class', 'content-entity');
        markerEl.appendChild(modelEl);
        
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
    },

    // Get surround content
    getSurroundContent: function(marker) {
        return this.surroundContent[marker] || "";
    },
    
    // Helper method to get image element for a specific marker
    getImageElement: function(markerValue) {
        return document.querySelector(`#marker-${markerValue}-image`);
    },
    
    // Helper method to get video element for a specific marker
    getVideoElement: function(markerValue) {
        return document.querySelector(`#marker-${markerValue}-video`);
    },
    
    // Helper method to get model element for a specific marker
    getModelElement: function(markerValue) {
        return document.querySelector(`#marker-${markerValue}-model`);
    },
    
    // Helper method to hide all content entities for a specific marker
    hideAllContentForMarker: function(markerValue) {
        const contentEntities = document.querySelectorAll(`#marker-${markerValue}-image, #marker-${markerValue}-video, #marker-${markerValue}-model`);
        contentEntities.forEach(entity => {
            entity.setAttribute('visible', 'false');
        });
    },

    getLeftSideContent: function(marker) {
        return this.leftSideContent[marker];
    },

    getMarkerData: function(markerValue) {
        return this.markerData[markerValue] || null;
    },
    
    // Helper method to show specific content type for a marker
    showContentForMarker: function(markerValue, contentType, src) {
        this.hideAllContentForMarker(markerValue);
        
        switch(contentType) {
            case 'image':
                const imgEl = this.getImageElement(markerValue);
                imgEl.setAttribute('src', src);
                imgEl.setAttribute('visible', 'true');
                break;
                
            case 'video':
                const videoEl = this.getVideoElement(markerValue);
                videoEl.setAttribute('src', src);
                videoEl.setAttribute('visible', 'true');
                break;
                
            case '3d':
                const modelEl = this.getModelElement(markerValue);
                modelEl.setAttribute('gltf-model', src);
                modelEl.setAttribute('visible', 'true');
                break;
        }
    }
});
