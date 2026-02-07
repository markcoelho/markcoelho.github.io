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
        if (!marker || !marker._imageGrid) return;
        
        marker._imageGrid.setAttribute('visible', visible);
    },
    
    // Create grids for all markers
    createAllGrids: function() {
        document.querySelectorAll('a-marker').forEach(marker => {
            if (!marker._imageGrid) {
                const markerValue = marker.getAttribute('value');
                const content = this.contentManager?.contentSequences?.[markerValue] || [];
                const hasMedia = content.some(item => item.type === 'image' || item.type === 'video');
                
                if (hasMedia) {
                    this.addImageGridToMarker(marker);
                }
            }
        });
    },
    
    // Add 3x3 grid to marker
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
        container.setInvisible();
        return container;
    },
    
    // Create grid items for images and videos
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
        thumbnailEl.setVisible();
        
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
    
    // Create video thumbnail in grid
    createGridVideoThumbnail: function(videoSrc, index, x, y, container, markerValue, maxCellWidth, maxCellHeight) {
        const thumbnailEl = document.createElement('a-image');
        thumbnailEl.setAttribute('class', 'image-grid-item');
        thumbnailEl.setAttribute('position', `${x} ${y} 0`);
        thumbnailEl.setAttribute('material', 'depthTest: false;');
        thumbnailEl.setVisible();
        
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
    
    // Create image in grid
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