// marker-navigation-ui.js - Updated with bottom positioning
AFRAME.registerComponent('marker-navigation-ui', {
    schema: { contentLoaded: { default: false } },
    
    init: function() {
        this.contentManager = null;
        this.centerpieceGrids = {}; // Store grids attached to centerpiece
        
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
        document.querySelectorAll('a-marker').forEach(marker => {
            const markerValue = marker.getAttribute('value');
            const useMarkerNavigation = this.contentManager?.getMarkerNavigationFlag(markerValue);
            const content = this.contentManager?.contentSequences?.[markerValue] || [];
            const hasMedia = content.some(item => item.type === 'image' || item.type === 'video' || item.type === '3d');
            
            if (hasMedia) {
                if (useMarkerNavigation) {
                    // Create grid on marker (existing functionality)
                    if (!marker._imageGrid) {
                        this.addImageGridToMarker(marker);
                    }
                } else {
                    // Create grid on centerpiece
                    this.addGridToCenterpiece(markerValue, content);
                }
            }
        });
    },
    
    // Add grid to centerpiece for a specific marker
    addGridToCenterpiece: function(markerValue, content) {
        const centerpiece = getId('centerpiece');
        if (!centerpiece) return;
        
        // Remove existing grid for this marker if any
        const existingGrid = document.getElementById(`centerpiece-grid-${markerValue}`);
        if (existingGrid) {
            existingGrid.remove();
        }
        
        const mediaContent = content.filter(item => 
            item.type === 'image' || item.type === 'video' || item.type === '3d'
        );
        
        if (mediaContent.length <= 1) return; // Only show grid if multiple items
        
        const gridContainer = this.createCenterpieceGridContainer(markerValue);
        centerpiece.appendChild(gridContainer);
        
        this.centerpieceGrids[markerValue] = gridContainer;
        
        // Create grid items (3x3 layout)
        this.createCenterpieceGridMedia(gridContainer, mediaContent, markerValue);
        
        // Initially hide the grid (will be shown when marker is detected)
        gridContainer.setAttribute('visible', 'false');
    },
    
    createCenterpieceGridContainer: function(markerValue) {
        const container = document.createElement('a-entity');
        container.setAttribute('id', `centerpiece-grid-${markerValue}`);
        container.setAttribute('class', 'centerpiece-grid-container');
        // Position below the controls (controls are at z=2, so put grid at z=3 and lower y)
        container.setAttribute('position', '0 -1.8 3'); // Below the controls
        container.setAttribute('rotation', '0 0 0');
        return container;
    },
    
    // Create grid items for centerpiece
    createCenterpieceGridMedia: function(container, mediaContent, markerValue) {
        const rows = 3, cols = 3;
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
            imageEl.setAttribute('position', `${offsetX} ${-offsetY} 0.01`); // Slightly in front
            imageEl.setAttribute('material', 'depthTest: false;');
            
            // Add a border/background
            const bgEl = document.createElement('a-plane');
            bgEl.setAttribute('width', maxWidth + 0.05);
            bgEl.setAttribute('height', maxHeight + 0.05);
            bgEl.setAttribute('color', '#333');
            bgEl.setAttribute('position', '0 0 0');
            
            container.appendChild(bgEl);
            container.appendChild(imageEl);
        };
        
        img.src = imageSrc;
    },
    
    createCenterpieceVideoThumbnail: function(container, videoSrc, maxWidth, maxHeight, index, markerValue) {
        // Background
        const bgEl = document.createElement('a-plane');
        bgEl.setAttribute('width', maxWidth + 0.05);
        bgEl.setAttribute('height', maxHeight + 0.05);
        bgEl.setAttribute('color', '#333');
        bgEl.setAttribute('position', '0 0 0');
        container.appendChild(bgEl);
        
        // Video icon
        const iconEl = document.createElement('a-image');
        iconEl.setAttribute('src', 'assets/icons/video-thumbnail.png');
        iconEl.setAttribute('width', maxWidth * 0.8);
        iconEl.setAttribute('height', maxHeight * 0.8);
        iconEl.setAttribute('position', '0 0 0.01');
        iconEl.setAttribute('material', 'depthTest: false;');
        container.appendChild(iconEl);
        
        // Optional: Add text "VIDEO" or just rely on icon
    },
    
    createCenterpiece3DThumbnail: function(container, modelSrc, maxWidth, maxHeight, index, markerValue) {
        // Background
        const bgEl = document.createElement('a-plane');
        bgEl.setAttribute('width', maxWidth + 0.05);
        bgEl.setAttribute('height', maxHeight + 0.05);
        bgEl.setAttribute('color', '#333');
        bgEl.setAttribute('position', '0 0 0');
        container.appendChild(bgEl);
        
        // 3D model icon
        const iconEl = document.createElement('a-image');
        iconEl.setAttribute('src', 'assets/icons/model-thumbnail.png');
        iconEl.setAttribute('width', maxWidth * 0.8);
        iconEl.setAttribute('height', maxHeight * 0.8);
        iconEl.setAttribute('position', '0 0 0.01');
        iconEl.setAttribute('material', 'depthTest: false;');
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
        thumbnailEl.setAttribute('material', 'depthTest: false;');
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
        thumbnailEl.setAttribute('material', 'depthTest: false;');
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
            imageEl.setAttribute('material', 'depthTest: false;');
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
    
    // Show/hide centerpiece grid for a marker
    setCenterpieceGridVisibility: function(markerValue, visible) {
        const grid = document.getElementById(`centerpiece-grid-${markerValue}`);
        if (grid) {
            grid.setAttribute('visible', visible);
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
        
        // Also handle centerpiece grid
        this.setCenterpieceGridVisibility(markerValue, visible);
    },
    
    remove: function() {
        if (this.checkContentInterval) clearInterval(this.checkContentInterval);
        this.el.removeEventListener('content-loaded', () => {});
    }
});