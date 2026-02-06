// marker-navigation-ui.js
AFRAME.registerComponent('marker-navigation-ui', {
    schema: { contentLoaded: { default: false } },
    
    init: function() {
        this.contentManager = null;
        
        this.checkContentInterval = setInterval(() => {
            this.contentManager = this.el.sceneEl.components['marker-content-manager'];
            if (this.contentManager?.contentSequences && !this.data.contentLoaded) {
                this.data.contentLoaded = true;
                this.createAllGrids();
                clearInterval(this.checkContentInterval);
            }
        }, 500);
        
        this.el.addEventListener('content-loaded', () => {
            this.data.contentLoaded = true;
            this.createAllGrids();
        });
    },
    
    // Check if marker has more than one image OR video
    hasMultipleImages: function(markerValue) {
        const content = this.contentManager?.contentSequences?.[markerValue] || [];
        // Count both image and video types
        const mediaCount = content.filter(item => item.type === 'image' || item.type === 'video').length;
        return mediaCount > 1;
    },
    
    setGridVisibility: function(markerValue, visible) {
        const marker = document.querySelector(`a-marker[value="${markerValue}"]`);
        if (!marker || !marker._imageGrid) return;
        
        marker._imageGrid.setAttribute('visible', visible);
    },
    
    // Create image grids for ALL markers - UPDATE THIS FUNCTION
    createAllGrids: function() {
        document.querySelectorAll('a-marker').forEach(marker => {
            if (!marker._imageGrid) {
                const markerValue = marker.getAttribute('value');
                // Check if marker has any media (images OR videos)
                const content = this.contentManager?.contentSequences?.[markerValue] || [];
                const hasMedia = content.some(item => item.type === 'image' || item.type === 'video');
                
                if (hasMedia) {
                    this.addImageGridToMarker(marker);
                }
            }
        });
    },
    
    // Add a 3x3 image grid to a specific marker - UPDATE THIS FUNCTION
    addImageGridToMarker: function(marker) {
        const markerValue = marker.getAttribute('value');
        // Get ALL content for this marker (both images and videos)
        const content = this.contentManager?.contentSequences?.[markerValue] || [];
        
        // Filter to get only image and video items
        const mediaContent = content.filter(item => item.type === 'image' || item.type === 'video');
        
        if (mediaContent.length === 0) return; // No media? Skip this marker
        
        // Create container for the grid
        const gridContainer = this.createGridContainer();
        marker._imageGrid = gridContainer;
        
        // Set initial visibility based on media count
        const shouldBeVisible = mediaContent.length > 1;
        gridContainer.setAttribute('visible', shouldBeVisible.toString());
        
        marker.appendChild(gridContainer);
        
        // Fill grid with media (both images and videos)
        this.createGridMedia(gridContainer, mediaContent, markerValue);
    },
    
    createGridContainer: function() {
        const container = document.createElement('a-entity');
        container.setAttribute('class', 'image-grid-container');
        container.setAttribute('position', '0 0 0');
        container.setAttribute('rotation', '-90 0 0');
        container.setInvisible();
        return container;
    },
    
    // NEW FUNCTION: Create grid items for both images and videos
    createGridMedia: function(container, mediaContent, markerValue) {
        const rows = 3, cols = 3;
        const maxCellWidth = 0.3, maxCellHeight = 0.27;
        const spacingX = maxCellWidth * 1.4, spacingY = maxCellHeight * 1.4;
        
        // Create up to 9 items (rows * cols)
        for (let i = 0; i < Math.min(mediaContent.length, rows * cols); i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            
            // Calculate position: center items in grid
            const x = (col - (cols - 1) / 2) * spacingX;
            const y = -((row - (rows - 1) / 2) * spacingY);
            
            const item = mediaContent[i];
            const src = item.value || item.src;
            
            if (item.type === 'image') {
                // Create image grid item
                this.createGridImage(src, i, x, y, container, markerValue, maxCellWidth, maxCellHeight);
            } else if (item.type === 'video') {
                // Create video thumbnail for grid
                this.createGridVideoThumbnail(src, i, x, y, container, markerValue, maxCellWidth, maxCellHeight);
            }
        }
    },
    
    // Create video thumbnails in grid
    createGridVideoThumbnail: function(videoSrc, index, x, y, container, markerValue, maxCellWidth, maxCellHeight) {
        const thumbnailEl = document.createElement('a-image');
        thumbnailEl.setAttribute('class', 'image-grid-item');
        thumbnailEl.setAttribute('position', `${x} ${y} 0`);
        thumbnailEl.setAttribute('material', 'depthTest: false;');
        thumbnailEl.setVisible();
        
        // Use a video thumbnail/icon
        thumbnailEl.setAttribute('src', 'assets/icons/video-thumbnail.png');
        thumbnailEl.setAttribute('width', maxCellWidth);
        thumbnailEl.setAttribute('height', maxCellHeight);
        thumbnailEl.setAttribute('data-content-index', index);
        thumbnailEl.setAttribute('data-marker-value', markerValue);
        thumbnailEl.setAttribute('data-media-type', 'video');
        
        // Make it selectable with gaze interaction
        thumbnailEl.setAttribute('gaze-interaction-handler', 
            `action: select-grid-image; fuseTimeout: 1000; markerValue: ${markerValue}`);
        
        container.appendChild(thumbnailEl);
    },
    
    // Create a single image in the grid
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
            imageEl.setVisible();
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
    
    remove: function() {
        if (this.checkContentInterval) clearInterval(this.checkContentInterval);
        this.el.removeEventListener('content-loaded', () => {});
    }
});