// marker-navigation-ui.js - Updated with transparent grid cells
AFRAME.registerComponent('marker-navigation-ui', {
    schema: { contentLoaded: { default: false } },
    
    init: function() {
        this.contentManager = null;
        this.centerpieceGrid = null; // Single grid for centerpiece
        this.currentGridMarker = null; // Track which marker's content is currently in the grid
        
        this.checkContentInterval = setInterval(() => {
            this.contentManager = this.el.sceneEl.components['marker-content-manager'];
            if (this.contentManager?.contentSequences && !this.data.contentLoaded) {
                this.data.contentLoaded = true;
                this.createAllNavigation();
                clearInterval(this.checkContentInterval);
            }
        }, 500);
        
        this.el.addEventListener('content-loaded', () => {
            this.data.contentLoaded = true;
            this.createAllNavigation();
        });
    },
    
    // Create all navigation elements (both marker and centerpiece)
    createAllNavigation: function() {
        // Create the single centerpiece grid if it doesn't exist
        if (!this.centerpieceGrid) {
            this.createCenterpieceGrid();
        }
        
        document.querySelectorAll('a-marker').forEach(marker => {
            const markerValue = marker.getAttribute('value');
            const useMarkerNavigation = this.contentManager?.getMarkerNavigationFlag(markerValue);
            const content = this.contentManager?.contentSequences?.[markerValue] || [];
            const hasMedia = content.some(item => item.type === 'image' || item.type === 'video' || item.type === '3d');
            
            if (hasMedia && useMarkerNavigation) {
                // Create grid on marker (existing functionality)
                if (!marker._imageGrid) {
                    this.addImageGridToMarker(marker);
                }
            }
        });
    },
    
    // Create the single centerpiece grid
    createCenterpieceGrid: function() {
        const centerpiece = getId('centerpiece');
        if (!centerpiece) return;
        
        const gridContainer = document.createElement('a-entity');
        gridContainer.setAttribute('id', 'centerpiece-grid');
        gridContainer.setAttribute('class', 'centerpiece-grid-container');
        // Position below the controls (controls are at z=2, so put grid at z=3 and lower y)
        gridContainer.setAttribute('position', '0 -1.8 3'); // Below the controls
        gridContainer.setAttribute('rotation', '0 0 0');
        gridContainer.setAttribute('visible', 'false'); // Initially hidden
        
        centerpiece.appendChild(gridContainer);
        this.centerpieceGrid = gridContainer;
        
        console.log('Created single centerpiece grid');
    },
    
    // Update centerpiece grid with content for a specific marker
    updateCenterpieceGrid: function(markerValue) {
        if (!this.centerpieceGrid) {
            this.createCenterpieceGrid();
            if (!this.centerpieceGrid) return;
        }
        
        // Clear existing grid items
        while (this.centerpieceGrid.firstChild) {
            this.centerpieceGrid.removeChild(this.centerpieceGrid.firstChild);
        }
        
        const content = this.contentManager?.contentSequences?.[markerValue] || [];
        const mediaContent = content.filter(item => 
            item.type === 'image' || item.type === 'video' || item.type === '3d'
        );
        
        if (mediaContent.length <= 1) {
            // Hide grid if only one item
            this.centerpieceGrid.setAttribute('visible', 'false');
            this.currentGridMarker = null;
            return;
        }
        
        // Create grid items (3x3 layout)
        this.createCenterpieceGridMedia(this.centerpieceGrid, mediaContent, markerValue);
        this.currentGridMarker = markerValue;
        
        console.log(`Updated centerpiece grid for marker ${markerValue} with ${mediaContent.length} items`);
    },
    
    // Create grid items for centerpiece
    createCenterpieceGridMedia: function(container, mediaContent, markerValue) {
    const rows = 2, cols = 4; // Changed to 4x2
    const maxCellWidth = 0.8, maxCellHeight = 0.7; // Larger for centerpiece
    const spacingX = maxCellWidth * 1.4, spacingY = maxCellHeight * 1.4;
    
    for (let i = 0; i < Math.min(mediaContent.length, rows * cols); i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        
        const x = (col - (cols - 1) / 2) * spacingX;
        const y = -((row - (rows - 1) / 2) * spacingY); // Negative Y to go down
        
        const item = mediaContent[i];
        const src = item.value || item.src;
        
        // Create a container for each grid item to handle hover/click
        const itemContainer = document.createElement('a-entity');
        itemContainer.setAttribute('class', 'centerpiece-grid-item');
        itemContainer.setAttribute('position', `${x} ${y} 0`);
        itemContainer.setAttribute('data-content-index', i);
        itemContainer.setAttribute('data-marker-value', markerValue);
        itemContainer.setAttribute('data-media-type', item.type);
        
        // Create thumbnail based on media type
        if (item.type === 'image') {
            this.createCenterpieceImageThumbnail(itemContainer, src, maxCellWidth, maxCellHeight, i, markerValue);
        } else if (item.type === 'video') {
            this.createCenterpieceVideoThumbnail(itemContainer, src, maxCellWidth, maxCellHeight, i, markerValue);
        } else if (item.type === '3d') {
            this.createCenterpiece3DThumbnail(itemContainer, src, maxCellWidth, maxCellHeight, i, markerValue);
        }
        
        // Add gaze interaction to the container
        itemContainer.setAttribute('gaze-interaction-handler', 
            `action: select-grid-image; fuseTimeout: 1000; markerValue: ${markerValue}`);
        
        container.appendChild(itemContainer);
    }
},
    
    createCenterpieceImageThumbnail: function(container, imageSrc, maxWidth, maxHeight, index, markerValue) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            const aspectRatio = img.naturalWidth / img.naturalHeight;
            const { width, height } = calcImageSize(aspectRatio, maxWidth, maxHeight);
            
            const offsetX = (maxWidth - width) / 2;
            const offsetY = (maxHeight - height) / 2;
            
            const imageEl = document.createElement('a-image');
            imageEl.setAttribute('src', imageSrc);
            imageEl.setAttribute('width', width);
            imageEl.setAttribute('height', height);
            imageEl.setAttribute('position', `${offsetX} ${-offsetY} 0`);
            imageEl.setAttribute('material', 'depthTest: false; transparent: true;');
            
            // NO background plane - just the image with transparency
            container.appendChild(imageEl);
        };
        
        img.src = imageSrc;
    },
    
    createCenterpieceVideoThumbnail: function(container, videoSrc, maxWidth, maxHeight, index, markerValue) {
        // Video icon only - no background
        const iconEl = document.createElement('a-image');
        iconEl.setAttribute('src', 'assets/icons/video-thumbnail.png');
        iconEl.setAttribute('width', maxWidth * 0.8);
        iconEl.setAttribute('height', maxHeight * 0.8);
        iconEl.setAttribute('position', '0 0 0');
        iconEl.setAttribute('material', 'depthTest: false; transparent: true;');
        container.appendChild(iconEl);
    },
    
    createCenterpiece3DThumbnail: function(container, modelSrc, maxWidth, maxHeight, index, markerValue) {
        // 3D model icon only - no background
        const iconEl = document.createElement('a-image');
        iconEl.setAttribute('src', 'assets/icons/model-thumbnail.png');
        iconEl.setAttribute('width', maxWidth * 0.8);
        iconEl.setAttribute('height', maxHeight * 0.8);
        iconEl.setAttribute('position', '0 0 0');
        iconEl.setAttribute('material', 'depthTest: false; transparent: true;');
        container.appendChild(iconEl);
    },
    
    // Original marker grid functions (keep existing ones)
    addImageGridToMarker: function(marker) {
        const markerValue = marker.getAttribute('value');
        const content = this.contentManager?.contentSequences?.[markerValue] || [];
        
        const mediaContent = content.filter(item => 
            item.type === 'image' || item.type === 'video' || item.type === '3d'
        );
        
        if (mediaContent.length === 0) return;
        
        const gridContainer = this.createGridContainer();
        marker._imageGrid = gridContainer;
        
        const shouldBeVisible = mediaContent.length > 1;
        gridContainer.setAttribute('visible', shouldBeVisible.toString());
        
        marker.appendChild(gridContainer);
        
        this.createGridMedia(gridContainer, mediaContent, markerValue);
    },
    
    createGridContainer: function() {
        const container = document.createElement('a-entity');
        container.setAttribute('class', 'image-grid-container');
        container.setAttribute('position', '0 0 0');
        container.setAttribute('rotation', '-90 0 0');
        return container;
    },
    
    createGridMedia: function(container, mediaContent, markerValue) {
        const rows = 3, cols = 3;
        const maxCellWidth = 0.3, maxCellHeight = 0.27;
        const spacingX = maxCellWidth * 1.4, spacingY = maxCellHeight * 1.4;
        
        for (let i = 0; i < Math.min(mediaContent.length, rows * cols); i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            
            const x = (col - (cols - 1) / 2) * spacingX;
            const y = -((row - (rows - 1) / 2) * spacingY);
            
            const item = mediaContent[i];
            const src = item.value || item.src;
            
            if (item.type === 'image') {
                this.createGridImage(src, i, x, y, container, markerValue, maxCellWidth, maxCellHeight);
            } else if (item.type === 'video') {
                this.createGridVideoThumbnail(src, i, x, y, container, markerValue, maxCellWidth, maxCellHeight);
            } else if (item.type === '3d') {
                this.createGrid3DThumbnail(src, i, x, y, container, markerValue, maxCellWidth, maxCellHeight);
            }
        }
    },
    
    createGrid3DThumbnail: function(modelSrc, index, x, y, container, markerValue, maxCellWidth, maxCellHeight) {
        const thumbnailEl = document.createElement('a-image');
        thumbnailEl.setAttribute('class', 'image-grid-item');
        thumbnailEl.setAttribute('position', `${x} ${y} 0`);
        thumbnailEl.setAttribute('material', 'depthTest: false; transparent: true;');
        thumbnailEl.setAttribute('src', 'assets/icons/model-thumbnail.png');
        thumbnailEl.setAttribute('width', maxCellWidth);
        thumbnailEl.setAttribute('height', maxCellHeight);
        thumbnailEl.setAttribute('data-content-index', index);
        thumbnailEl.setAttribute('data-marker-value', markerValue);
        thumbnailEl.setAttribute('data-media-type', '3d');
        
        thumbnailEl.setAttribute('gaze-interaction-handler', 
            `action: select-grid-image; fuseTimeout: 1000; markerValue: ${markerValue}`);
        
        container.appendChild(thumbnailEl);
    },
    
    createGridVideoThumbnail: function(videoSrc, index, x, y, container, markerValue, maxCellWidth, maxCellHeight) {
        const thumbnailEl = document.createElement('a-image');
        thumbnailEl.setAttribute('class', 'image-grid-item');
        thumbnailEl.setAttribute('position', `${x} ${y} 0`);
        thumbnailEl.setAttribute('material', 'depthTest: false; transparent: true;');
        thumbnailEl.setAttribute('src', 'assets/icons/video-thumbnail.png');
        thumbnailEl.setAttribute('width', maxCellWidth);
        thumbnailEl.setAttribute('height', maxCellHeight);
        thumbnailEl.setAttribute('data-content-index', index);
        thumbnailEl.setAttribute('data-marker-value', markerValue);
        thumbnailEl.setAttribute('data-media-type', 'video');
        
        thumbnailEl.setAttribute('gaze-interaction-handler', 
            `action: select-grid-image; fuseTimeout: 1000; markerValue: ${markerValue}`);
        
        container.appendChild(thumbnailEl);
    },
    
    createGridImage: function(imageSrc, index, x, y, container, markerValue, maxCellWidth, maxCellHeight) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            const aspectRatio = img.naturalWidth / img.naturalHeight;
            const { width, height } = calcImageSize(aspectRatio, maxCellWidth, maxCellHeight);
            
            const offsetX = (maxCellWidth - width) / 2;
            const offsetY = (maxCellHeight - height) / 2;
            
            const imageEl = document.createElement('a-image');
            imageEl.setAttribute('class', 'image-grid-item');
            imageEl.setAttribute('position', `${x + offsetX} ${y - offsetY} 0`);
            imageEl.setAttribute('material', 'depthTest: false; transparent: true;');
            imageEl.setAttribute('src', imageSrc);
            imageEl.setAttribute('width', width);
            imageEl.setAttribute('height', height);
            imageEl.setAttribute('data-content-index', index);
            imageEl.setAttribute('data-marker-value', markerValue);
            imageEl.setAttribute('data-media-type', 'image');
            
            imageEl.setAttribute('gaze-interaction-handler', 
                `action: select-grid-image; fuseTimeout: 1000; markerValue: ${markerValue}`);
            
            container.appendChild(imageEl);
        };
        
        img.src = imageSrc;
    },
    
    // Show/hide centerpiece grid
    setCenterpieceGridVisibility: function(visible) {
        if (this.centerpieceGrid) {
            this.centerpieceGrid.setAttribute('visible', visible);
        }
    },
    
    // Check if marker has multiple media items
    hasMultipleImages: function(markerValue) {
        const content = this.contentManager?.contentSequences?.[markerValue] || [];
        const mediaCount = content.filter(item => 
            item.type === 'image' || item.type === 'video' || item.type === '3d'
        ).length;
        return mediaCount > 1;
    },
    
    setGridVisibility: function(markerValue, visible) {
        const marker = document.querySelector(`a-marker[value="${markerValue}"]`);
        if (marker && marker._imageGrid) {
            marker._imageGrid.setAttribute('visible', visible);
        }
    },
    
    remove: function() {
        if (this.checkContentInterval) clearInterval(this.checkContentInterval);
        this.el.removeEventListener('content-loaded', () => {});
        
        // Remove centerpiece grid
        if (this.centerpieceGrid) {
            this.centerpieceGrid.remove();
        }
    }
});