AFRAME.registerComponent('content-manager', {
    init: function() {
    this.centerImage = getId('centerImage');
    this.centerpiece = getId('centerpiece');
    this.contentSequences = {};
    this.currentContentIndex = {};
    this.narrations = {};
    this.surroundContent = {};
    
    // ADD THESE LINES - stores for marker zoom levels
    this.markerImageScales = {};  // Stores user-adjusted scale for marker images
    this.markerModelScales = {};  // Stores user-adjusted scale for marker 3D models
    this.markerOriginalScales = {}; // Stores original scale from content.json for marker images
    
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
    // In content-manager.js, update processJSONData function
// In content-manager.js - update processJSONData function

processJSONData: function(jsonData) {
    this.contentSequences = {};
    this.narrations = {};
    this.currentContentIndex = {};
    this.surroundContent = {}; 
    this.markerData = {};
    this.leftSideContent = {};
    this.rightSideContent = {};
    this.markerNavigationFlags = {};
    this.audioPaths = {}; // Add this line

    jsonData.pages.forEach(page => {
        const marker = page.barcode_number.toString();
        const centralSide = page.central_side;
        
        // Store marker_navigation flag
        this.markerNavigationFlags[marker] = page.marker_navigation === "true";
        
        if (page.narration) this.narrations[marker] = page.narration;
        
        this.surroundContent[marker] = page.surround || "";
        
        // Store marker data - process ALL marker items (not just first)
        // Create an array to store all marker content
        this.markerData[marker] = [];
        
        // Initialize audioPaths for this marker
        this.audioPaths[marker] = {};
        
        if (page.marker && Array.isArray(page.marker)) {
            page.marker.forEach(item => {
                if (item.type && item.type !== "") {
                    const contentItem = {
                        type: item.type,
                        src: item.src,
                        scale: item.scale || 1,
                        controls: item.controls === "true",
                        audio: item.audio || "" // Store audio path
                    };
                    this.markerData[marker].push(contentItem);
                    
                    // Store audio path for this index
                    this.audioPaths[marker][`marker-${this.markerData[marker].length-1}`] = item.audio || "";
                }
            });
        }
        
        // Store left_side content - take FIRST ELEMENT if it exists
        if (page.left_side && page.left_side.length > 0 && page.left_side[0].type && page.left_side[0].type !== "") {
            this.leftSideContent[marker] = {
                type: page.left_side[0].type,
                value: page.left_side[0].src || page.left_side[0].value,
                controls: page.left_side[0].controls === "true",
                scale: page.left_side[0].scale || 1,
                audio: page.left_side[0].audio || "" // Store audio
            };
        }
        
        // Store right_side content - take FIRST ELEMENT if it exists
        if (page.right_side && page.right_side.length > 0 && page.right_side[0].type && page.right_side[0].type !== "") {
            this.rightSideContent[marker] = {
                type: page.right_side[0].type,
                value: page.right_side[0].src || page.right_side[0].value,
                controls: page.right_side[0].controls === "true",
                scale: page.right_side[0].scale || 1,
                audio: page.right_side[0].audio || "" // Store audio
            };
        }

        if (page.left_side && Array.isArray(page.left_side)) {
            page.left_side.forEach((item, index) => {
                if (item.type && item.type !== "") {
                    // Ensure leftSideContent still stores the first item for immediate display
                    if (index === 0) {
                        this.leftSideContent[marker] = {
                            type: item.type,
                            value: item.src || item.value,
                            controls: item.controls === "true",
                            scale: item.scale || 1,
                            audio: item.audio || ""
                        };
                    }
                    
                    // Add ALL items to markerData with side property
                    if (!this.markerData[marker]) this.markerData[marker] = [];
                    const contentItem = {
                        type: item.type,
                        src: item.src || item.value,
                        value: item.src || item.value,
                        scale: item.scale || 1,
                        controls: item.controls === "true",
                        side: 'left',
                        index: index,
                        audio: item.audio || ""
                    };
                    this.markerData[marker].push(contentItem);
                    
                    // Store audio path for this index
                    this.audioPaths[marker][`left-${index}`] = item.audio || "";
                }
            });
        }

        // Store right_side content with side property for tracking
        if (page.right_side && Array.isArray(page.right_side)) {
            page.right_side.forEach((item, index) => {
                if (item.type && item.type !== "") {
                    // Ensure rightSideContent still stores the first item for immediate display
                    if (index === 0) {
                        this.rightSideContent[marker] = {
                            type: item.type,
                            value: item.src || item.value,
                            controls: item.controls === "true",
                            scale: item.scale || 1,
                            audio: item.audio || ""
                        };
                    }
                    
                    // Add ALL items to markerData with side property
                    if (!this.markerData[marker]) this.markerData[marker] = [];
                    const contentItem = {
                        type: item.type,
                        src: item.src || item.value,
                        value: item.src || item.value,
                        scale: item.scale || 1,
                        controls: item.controls === "true",
                        side: 'right',
                        index: index,
                        audio: item.audio || ""
                    };
                    this.markerData[marker].push(contentItem);
                    
                    // Store audio path for this index
                    this.audioPaths[marker][`right-${index}`] = item.audio || "";
                }
            });
        }

        // Also update the marker array processing to include side property (default 'center')
        if (page.marker && Array.isArray(page.marker)) {
            page.marker.forEach((item, index) => {
                if (item.type && item.type !== "") {
                    const contentItem = {
                        type: item.type,
                        src: item.src || item.value,
                        value: item.src || item.value,
                        scale: item.scale || 1,
                        controls: item.controls === "true",
                        side: 'center',
                        index: index,
                        audio: item.audio || ""
                    };
                    this.markerData[marker].push(contentItem);
                    
                    // Store audio path for this index
                    this.audioPaths[marker][`center-${index}`] = item.audio || "";
                }
            });
        }
        
        this.contentSequences[marker] = centralSide.map(item => ({
            type: item.type,
            value: item.src || item.value,
            controls: item.controls === "true",
            scale: item.scale || 1,
            audio: item.audio || "" // Store audio
        }));
        
        this.currentContentIndex[marker] = 0;
    });
    
    console.log("Marker data loaded (all items):", this.markerData);
    console.log("Audio paths loaded:", this.audioPaths);
},

getAudioForContent: function(markerValue, side, index) {
    if (!this.audioPaths[markerValue]) return "";
    
    const key = `${side}-${index}`;
    return this.audioPaths[markerValue][key] || "";
},

// Add getter for specific marker item by index
getMarkerItem: function(marker, index) {
    return this.markerData[marker]?.[index] || null;
},

// Add getter for current marker item (based on current index)
getCurrentMarkerItem: function(marker) {
    const index = this.currentContentIndex[marker] || 0;
    return this.getMarkerItem(marker, index);
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
    // In content-manager.js - update createMarkerElement function

// In content-manager.js - update createMarkerElement function

createMarkerElement: function(markerValue, parent) {
    const markerEl = document.createElement('a-marker');
    markerEl.setAttribute('type', 'barcode');
    markerEl.setAttribute('value', markerValue);
    
    // Create a CONTAINER for all marker content (like centerpiece)
    // This will NOT be directly affected by AR.js tracking
    const markerContainer = document.createElement('a-entity');
    markerContainer.setAttribute('id', `marker-${markerValue}-container`);
    markerContainer.setAttribute('class', 'marker-content-container');
    // Position it slightly above the marker to avoid z-fighting
    markerContainer.setAttribute('position', '0 0 0.1');
    
    // Create image element inside container
    const imageEl = document.createElement('a-image');
    imageEl.setAttribute('id', `marker-${markerValue}-image`);
    imageEl.setAttribute('src', '');
    imageEl.setAttribute('scale', '3 3 3');
    imageEl.setAttribute('render-order', '1');
    imageEl.setAttribute('visible', 'false');
    imageEl.setAttribute('class', 'content-entity');
    markerContainer.appendChild(imageEl);
    
    // Create video element inside container
    const videoEl = document.createElement('a-video');
    videoEl.setAttribute('id', `marker-${markerValue}-video`);
    videoEl.setAttribute('src', '');
    videoEl.setAttribute('scale', '3 3 3');
    videoEl.setAttribute('render-order', '1');
    videoEl.setAttribute('visible', 'false');
    videoEl.setAttribute('class', 'content-entity');
    markerContainer.appendChild(videoEl);
    
    // Create 3D model element inside container
    const modelEl = document.createElement('a-entity');
    modelEl.setAttribute('id', `marker-${markerValue}-model`);
    modelEl.setAttribute('gltf-model', '');
    modelEl.setAttribute('scale', '1 1 1');
    modelEl.setAttribute('rotation', '0 0 0');
    modelEl.setAttribute('render-order', '1');
    modelEl.setAttribute('visible', 'false');
    modelEl.setAttribute('class', 'content-entity');
    markerContainer.appendChild(modelEl);
    
    // Create controls for marker images inside container
    const markerControls = this.createMarkerControls(markerValue, 'image');
    markerContainer.appendChild(markerControls);
    
    // Create controls for marker videos inside container
    const markerVideoControls = this.createMarkerVideoControls(markerValue);
    markerContainer.appendChild(markerVideoControls);
    
    // Create controls for marker 3D models inside container
    const marker3dControls = this.createMarker3dControls(markerValue);
    markerContainer.appendChild(marker3dControls);
    
    // Append the container to the marker, NOT the individual elements
    markerEl.appendChild(markerContainer);
    
    parent.appendChild(markerEl);
    
    return markerEl;
},

// Helper function to create marker image controls - BETTER CENTERING
// In content-manager.js - update the createMarkerControls, createMarkerVideoControls, and createMarker3dControls functions

// Helper function to create marker image controls - FIXED IDs
createMarkerControls: function(markerValue, type) {
    // Create a plane to hold all controls (similar to centerControls)
    const controlsPlane = document.createElement('a-plane');
    controlsPlane.setAttribute('id', `marker-${markerValue}-controls`);
    controlsPlane.setAttribute('class', 'marker-controls');
    controlsPlane.setAttribute('position', '0 0 0.2');
    controlsPlane.setAttribute('rotation', '-90 0 0');
    controlsPlane.setAttribute('width', '2.2');
    controlsPlane.setAttribute('height', '0.5');
    controlsPlane.setAttribute('opacity', '0');
    controlsPlane.setAttribute('visible', 'false');
    controlsPlane.setAttribute('render-order', '2');

    // Reset button
    const resetBtn = document.createElement('a-image');
    resetBtn.setAttribute('src', 'assets/icons/reset.png');
    resetBtn.setAttribute('class', 'marker-reset');
    resetBtn.setAttribute('position', '-0.9 0 0.1');
    resetBtn.setAttribute('scale', '0.22 0.22 0.22');
    resetBtn.setAttribute('rotation', '0 0 0');
    resetBtn.setAttribute('material', 'depthTest: false;');
    resetBtn.setAttribute('render-order', '3');
    resetBtn.setAttribute('gaze-interaction-handler', 
        `action: marker-reset; markerValue: ${markerValue}; fuseTimeout: 1000`);
    controlsPlane.appendChild(resetBtn);

    // Scrolling arrows - FIXED IDs to match what image-position-controller expects
    // The controller looks for IDs like 'marker-scroller-up', 'marker-scroller-down', etc.
    const directions = [
        { id: 'up', pos: '0 0.15 0.1' },
        { id: 'right', pos: '0.25 0 0.1' },
        { id: 'down', pos: '0 -0.15 0.1' },
        { id: 'left', pos: '-0.25 0 0.1' }
    ];

    directions.forEach(dir => {
        const arrow = document.createElement('a-image');
        arrow.setAttribute('src', `assets/icons/${dir.id}.png`);
        arrow.setAttribute('class', `marker-scroller marker-scroller-${dir.id}`);
        // FIXED: Set ID to 'marker-scroller-up', 'marker-scroller-down', etc.
        arrow.setAttribute('id', `marker-scroller-${dir.id}`);
        arrow.setAttribute('position', dir.pos);
        arrow.setAttribute('scale', '0.22 0.22 0.22');
        arrow.setAttribute('rotation', '0 0 0');
        arrow.setAttribute('material', 'depthTest: false;');
        arrow.setAttribute('render-order', '3');
        arrow.setAttribute('data-direction', dir.id);
        arrow.setAttribute('data-target', `marker-${markerValue}`);
        arrow.setAttribute('gaze-interaction-handler', 
            `action: marker-move; markerValue: ${markerValue}; fuseTimeout: 500`);
        controlsPlane.appendChild(arrow);
    });

    // Zoom controls
    const zoomIn = document.createElement('a-image');
    zoomIn.setAttribute('src', 'assets/icons/zoom-in.png');
    zoomIn.setAttribute('class', 'marker-zoom-button');
    zoomIn.setAttribute('position', '0.65 0 0.2');
    zoomIn.setAttribute('scale', '0.22 0.22 0.22');
    zoomIn.setAttribute('rotation', '0 0 0');
    zoomIn.setAttribute('data-action', 'increase');
    zoomIn.setAttribute('data-target', `marker-${markerValue}`);
    zoomIn.setAttribute('material', 'depthTest: false;');
    zoomIn.setAttribute('render-order', '3');
    zoomIn.setAttribute('gaze-interaction-handler', 
        `action: increase; markerValue: ${markerValue}; fuseTimeout: 500`);
    controlsPlane.appendChild(zoomIn);

    const zoomOut = document.createElement('a-image');
    zoomOut.setAttribute('src', 'assets/icons/zoom-out.png');
    zoomOut.setAttribute('class', 'marker-zoom-button');
    zoomOut.setAttribute('position', '0.9 0 0.2');
    zoomOut.setAttribute('scale', '0.22 0.22 0.22');
    zoomOut.setAttribute('rotation', '0 0 0');
    zoomOut.setAttribute('data-action', 'decrease');
    zoomOut.setAttribute('data-target', `marker-${markerValue}`);
    zoomOut.setAttribute('material', 'depthTest: false;');
    zoomOut.setAttribute('render-order', '3');
    zoomOut.setAttribute('gaze-interaction-handler', 
        `action: decrease; markerValue: ${markerValue}; fuseTimeout: 500`);
    controlsPlane.appendChild(zoomOut);

    return controlsPlane;
},

// Helper function to create marker video controls - FIXED IDs (though video doesn't use scrollers)
createMarkerVideoControls: function(markerValue) {
    const controlsPlane = document.createElement('a-plane');
    controlsPlane.setAttribute('id', `marker-${markerValue}-video-controls`);
    controlsPlane.setAttribute('class', 'marker-video-controls');
    controlsPlane.setAttribute('position', '0 0 0.2');
    controlsPlane.setAttribute('rotation', '-90 0 0');
    controlsPlane.setAttribute('width', '2.2');
    controlsPlane.setAttribute('height', '0.5');
    controlsPlane.setAttribute('opacity', '0');
    controlsPlane.setAttribute('visible', 'false');
    controlsPlane.setAttribute('render-order', '2');

    // Restart button
    const restartBtn = document.createElement('a-image');
    restartBtn.setAttribute('src', 'assets/icons/reset.png');
    restartBtn.setAttribute('class', 'marker-restart');
    restartBtn.setAttribute('position', '-0.9 0 0.1');
    restartBtn.setAttribute('scale', '0.22 0.22 0.22');
    restartBtn.setAttribute('rotation', '0 0 0');
    restartBtn.setAttribute('material', 'depthTest: false;');
    restartBtn.setAttribute('render-order', '3');
    restartBtn.setAttribute('gaze-interaction-handler', 
        `action: marker-restart; markerValue: ${markerValue}; fuseTimeout: 1000`);
    controlsPlane.appendChild(restartBtn);

    // Mute button
    const muteBtn = document.createElement('a-image');
    muteBtn.setAttribute('src', 'assets/icons/mute.png');
    muteBtn.setAttribute('class', 'marker-mute');
    muteBtn.setAttribute('position', '-0.4 0 0.1');
    muteBtn.setAttribute('scale', '0.22 0.22 0.22');
    muteBtn.setAttribute('rotation', '0 0 0');
    muteBtn.setAttribute('material', 'depthTest: false;');
    muteBtn.setAttribute('render-order', '3');
    muteBtn.setAttribute('gaze-interaction-handler', 
        `action: marker-mute; markerValue: ${markerValue}; fuseTimeout: 1000`);
    controlsPlane.appendChild(muteBtn);

    // Fast backward
    const backwardBtn = document.createElement('a-image');
    backwardBtn.setAttribute('src', 'assets/icons/fastbackward.png');
    backwardBtn.setAttribute('class', 'marker-fast-backward');
    backwardBtn.setAttribute('position', '0.4 0 0.1');
    backwardBtn.setAttribute('scale', '0.22 0.22 0.22');
    backwardBtn.setAttribute('rotation', '0 0 0');
    backwardBtn.setAttribute('data-action', 'backward');
    backwardBtn.setAttribute('material', 'depthTest: false;');
    backwardBtn.setAttribute('render-order', '3');
    backwardBtn.setAttribute('gaze-interaction-handler', 
        `action: marker-backward; markerValue: ${markerValue}; fuseTimeout: 500`);
    controlsPlane.appendChild(backwardBtn);

    // Fast forward
    const forwardBtn = document.createElement('a-image');
    forwardBtn.setAttribute('src', 'assets/icons/fastforward.png');
    forwardBtn.setAttribute('class', 'marker-fast-forward');
    forwardBtn.setAttribute('position', '0.9 0 0.1');
    forwardBtn.setAttribute('scale', '0.22 0.22 0.22');
    forwardBtn.setAttribute('rotation', '0 0 0');
    forwardBtn.setAttribute('data-action', 'forward');
    forwardBtn.setAttribute('material', 'depthTest: false;');
    forwardBtn.setAttribute('render-order', '3');
    forwardBtn.setAttribute('gaze-interaction-handler', 
        `action: marker-forward; markerValue: ${markerValue}; fuseTimeout: 500`);
    controlsPlane.appendChild(forwardBtn);

    return controlsPlane;
},

// Helper function to create marker 3D controls - FIXED IDs
createMarker3dControls: function(markerValue) {
    const controlsPlane = document.createElement('a-plane');
    controlsPlane.setAttribute('id', `marker-${markerValue}-3d-controls`);
    controlsPlane.setAttribute('class', 'marker-3d-controls');
    controlsPlane.setAttribute('position', '0 0 0.2');
    controlsPlane.setAttribute('rotation', '-90 0 0');
    controlsPlane.setAttribute('width', '2.2');
    controlsPlane.setAttribute('height', '0.5');
    controlsPlane.setAttribute('opacity', '0');
    controlsPlane.setAttribute('visible', 'false');
    controlsPlane.setAttribute('render-order', '2');

    // Reset button
    const resetBtn = document.createElement('a-image');
    resetBtn.setAttribute('src', 'assets/icons/reset.png');
    resetBtn.setAttribute('class', 'marker-3dreset');
    resetBtn.setAttribute('position', '-0.9 0 0.1');
    resetBtn.setAttribute('scale', '0.22 0.22 0.22');
    resetBtn.setAttribute('rotation', '0 0 0');
    resetBtn.setAttribute('material', 'depthTest: false;');
    resetBtn.setAttribute('render-order', '3');
    resetBtn.setAttribute('data-target', `marker-${markerValue}`);
    resetBtn.setAttribute('gaze-interaction-handler', 
        `action: 3dreset; markerValue: ${markerValue}; fuseTimeout: 1000`);
    controlsPlane.appendChild(resetBtn);

    // Rotating arrows - FIXED IDs to match what model-controller expects
    // The controller looks for IDs like 'marker-roller-up', 'marker-roller-down', etc.
    const directions = [
        { id: 'up', pos: '0 0.15 0.1' },
        { id: 'right', pos: '0.25 0 0.1' },
        { id: 'down', pos: '0 -0.15 0.1' },
        { id: 'left', pos: '-0.25 0 0.1' }
    ];

    directions.forEach(dir => {
        const arrow = document.createElement('a-image');
        arrow.setAttribute('src', `assets/icons/${dir.id}.png`);
        arrow.setAttribute('class', `marker-roller`);
        // FIXED: Set ID to 'marker-roller-up', 'marker-roller-down', etc.
        arrow.setAttribute('id', `marker-roller-${dir.id}`);
        arrow.setAttribute('position', dir.pos);
        arrow.setAttribute('scale', '0.22 0.22 0.22');
        arrow.setAttribute('rotation', '0 0 0');
        arrow.setAttribute('material', 'depthTest: false;');
        arrow.setAttribute('render-order', '3');
        arrow.setAttribute('data-direction', dir.id);
        arrow.setAttribute('data-target', `marker-${markerValue}`);
        arrow.setAttribute('gaze-interaction-handler', 
            `action: model-rotate; markerValue: ${markerValue}; fuseTimeout: 500`);
        controlsPlane.appendChild(arrow);
    });

    // Zoom controls
    const zoomIn = document.createElement('a-image');
    zoomIn.setAttribute('src', 'assets/icons/zoom-in.png');
    zoomIn.setAttribute('class', 'marker-model-zoom-button');
    zoomIn.setAttribute('position', '0.65 0 0.1');
    zoomIn.setAttribute('scale', '0.22 0.22 0.22');
    zoomIn.setAttribute('rotation', '0 0 0');
    zoomIn.setAttribute('data-action', '3dincrease');
    zoomIn.setAttribute('data-target', `marker-${markerValue}`);
    zoomIn.setAttribute('material', 'depthTest: false;');
    zoomIn.setAttribute('render-order', '3');
    zoomIn.setAttribute('gaze-interaction-handler', 
        `action: 3dincrease; markerValue: ${markerValue}; fuseTimeout: 500`);
    controlsPlane.appendChild(zoomIn);

    const zoomOut = document.createElement('a-image');
    zoomOut.setAttribute('src', 'assets/icons/zoom-out.png');
    zoomOut.setAttribute('class', 'marker-model-zoom-button');
    zoomOut.setAttribute('position', '0.9 0 0.1');
    zoomOut.setAttribute('scale', '0.22 0.22 0.22');
    zoomOut.setAttribute('rotation', '0 0 0');
    zoomOut.setAttribute('data-action', '3ddecrease');
    zoomOut.setAttribute('data-target', `marker-${markerValue}`);
    zoomOut.setAttribute('material', 'depthTest: false;');
    zoomOut.setAttribute('render-order', '3');
    zoomOut.setAttribute('gaze-interaction-handler', 
        `action: 3ddecrease; markerValue: ${markerValue}; fuseTimeout: 500`);
    controlsPlane.appendChild(zoomOut);

    return controlsPlane;
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
