// navigation-ui.js - Main navigation component
AFRAME.registerComponent('navigation-ui', {
    schema: {
        contentLoaded: { default: false }
    },
    
    init: function() {
        this.contentManager = null;
        this.grids = { center: null, left: null, right: null };
        this.currentGridMarker = null;
        this.utils = window.NavigationUtils;
        
        // Grid configurations
        this.config = {
            center: { rows: 2, cols: 4, cellWidth: 0.8, cellHeight: 0.7 },
            side: { rows: 2, cols: 4, cellWidth: 0.8, cellHeight: 0.7 },
            marker: { rows: 3, cols: 3, cellWidth: 0.3, cellHeight: 0.27 }
        };
        
        this.checkContentInterval = setInterval(() => {
            this.contentManager = this.el.sceneEl.components['marker-content-manager'];
            if (this.contentManager?.contentSequences && !this.data.contentLoaded) {
                this.data.contentLoaded = true;
                this.onContentReady();
                clearInterval(this.checkContentInterval);
            }
        }, 500);
        
        this.el.addEventListener('content-loaded', () => {
            this.data.contentLoaded = true;
            this.createAllNavigation();
            this.createSideGrid('left');
            this.createSideGrid('right');
        });
    },

    onContentReady: function() {
        this.createAllNavigation();
    },

    // Grid creation methods
    createGrid: function(targetId, gridId, className, position = '0 -1.8 3') {
        return this.utils.createGrid(targetId, gridId, className, position);
    },

    clearGrid: function(grid) {
        this.utils.clearGrid(grid);
    },

    createGridItem: function(item, index, x, y, maxWidth, maxHeight, markerValue, side) {
        return this.utils.createGridItem(item, index, x, y, maxWidth, maxHeight, markerValue, side);
    },

    calculateGridPosition: function(index, rows, cols, spacingX, spacingY) {
        return this.utils.calculateGridPosition(index, rows, cols, spacingX, spacingY);
    },

    getMediaContent: function(markerValue, side) {
        return this.utils.getMediaContent(this.contentManager, markerValue, side);
    },

    // Main navigation methods
    createAllNavigation: function() {
        if (!this.grids.center) this.createCenterpieceGrid();
        
        document.querySelectorAll('a-marker').forEach(marker => {
            const markerValue = marker.getAttribute('value');
            const useMarkerNavigation = this.contentManager?.getMarkerNavigationFlag(markerValue);
            const content = this.contentManager?.contentSequences?.[markerValue] || [];
            const hasMedia = content.some(item => ['image', 'video', '3d'].includes(item.type));
            
            if (hasMedia && useMarkerNavigation && !marker._imageGrid) {
                this.addImageGridToMarker(marker);
            }
        });
    },
    
    createCenterpieceGrid: function() {
        this.grids.center = this.utils.createGrid('centerpiece', 'centerpiece-grid', 'centerpiece-grid-container');
    },

    createSideGrid: function(side) {
        this.grids[side] = this.utils.createGrid(`${side}piece`, `${side}piece-grid`, `${side}piece-grid-container`);
    },

    updateCenterpieceGrid: function(markerValue) {
        if (!this.grids.center) this.createCenterpieceGrid();
        this.updateGrid('center', markerValue, 'center');
    },

    updateLeftGrid: function(markerValue) {
        if (!this.grids.left) this.createSideGrid('left');
        this.updateGrid('left', markerValue, 'left');
    },

    updateRightGrid: function(markerValue) {
        if (!this.grids.right) this.createSideGrid('right');
        this.updateGrid('right', markerValue, 'right');
    },

    updateGrid: function(gridKey, markerValue, side) {
        const grid = this.grids[gridKey];
        if (!grid) return;
        
        this.utils.clearGrid(grid);
        
        const mediaContent = this.utils.filterMediaTypes(this.utils.getMediaContent(this.contentManager, markerValue, side));
        
        if (!this.utils.shouldShowGrid(mediaContent)) {
            grid.setAttribute('visible', 'false');
            return;
        }
        
        this.createGridMedia(grid, mediaContent, markerValue, side);
        grid.setAttribute('visible', 'true');
    },

    createGridMedia: function(container, mediaContent, markerValue, side) {
        const config = this.config[side === 'center' ? 'center' : 'side'];
        const { rows, cols, cellWidth, cellHeight } = config;
        const spacingX = cellWidth * 1.4, spacingY = cellHeight * 1.4;
        
        mediaContent.slice(0, rows * cols).forEach((item, i) => {
            const { x, y } = this.utils.calculateGridPosition(i, rows, cols, spacingX, spacingY);
            const itemContainer = this.utils.createGridItem(item, i, x, y, cellWidth, cellHeight, markerValue, side);
            
            const gazeAttr = `action: select-grid-image; fuseTimeout: 1000; markerValue: ${markerValue}`;
            itemContainer.setAttribute('gaze-interaction-handler', 
                side !== 'center' ? `${gazeAttr}; side: ${side}` : gazeAttr);
            
            container.appendChild(itemContainer);
        });
    },

    addImageGridToMarker: function(marker) {
        const markerValue = marker.getAttribute('value');
        const content = this.contentManager?.contentSequences?.[markerValue] || [];
        const mediaContent = this.utils.filterMediaTypes(content);
        
        if (mediaContent.length === 0) return;
        
        const gridContainer = this.createGridContainer();
        marker._imageGrid = gridContainer;
        gridContainer.setAttribute('visible', (mediaContent.length > 1).toString());
        marker.appendChild(gridContainer);
        
        this.createMarkerGridMedia(gridContainer, mediaContent, markerValue);
    },

    createGridContainer: function() {
        const container = document.createElement('a-entity');
        container.setAttribute('class', 'image-grid-container');
        container.setAttribute('position', '0 0 0');
        container.setAttribute('rotation', '-90 0 0');
        return container;
    },

    createMarkerGridMedia: function(container, mediaContent, markerValue) {
        const config = this.config.marker;
        const { rows, cols, cellWidth, cellHeight } = config;
        const spacingX = cellWidth * 1.4, spacingY = cellHeight * 1.4;
        
        mediaContent.slice(0, rows * cols).forEach((item, i) => {
            const { x, y } = this.utils.calculateGridPosition(i, rows, cols, spacingX, spacingY);
            const src = item.value || item.src;
            
            if (item.type === 'image') {
                this.createGridImage(src, i, x, y, container, markerValue, cellWidth, cellHeight);
            } else {
                this.createGridThumbnail(item.type, i, x, y, container, markerValue, cellWidth, cellHeight);
            }
        });
    },

    createGridImage: function(imageSrc, index, x, y, container, markerValue, maxCellWidth, maxCellHeight) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const aspectRatio = img.naturalWidth / img.naturalHeight;
            const { width, height } = this.calcImageSize(aspectRatio, maxCellWidth, maxCellHeight);
            const offsetX = (maxCellWidth - width) / 2, offsetY = (maxCellHeight - height) / 2;
            
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
            imageEl.setAttribute('gaze-interaction-handler', `action: select-grid-image; fuseTimeout: 1000; markerValue: ${markerValue}`);
            container.appendChild(imageEl);
        };
        img.src = imageSrc;
    },

    calcImageSize: function(aspectRatio, maxWidth, maxHeight) {
        let width = maxWidth;
        let height = width / aspectRatio;
        
        if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
        }
        
        return { width, height };
    },

    createGridThumbnail: function(type, index, x, y, container, markerValue, maxCellWidth, maxCellHeight) {
        const thumbnailEl = document.createElement('a-image');
        thumbnailEl.setAttribute('class', 'image-grid-item');
        thumbnailEl.setAttribute('position', `${x} ${y} 0`);
        thumbnailEl.setAttribute('material', 'depthTest: false; transparent: true;');
        thumbnailEl.setAttribute('src', type === 'video' ? 'assets/icons/video-thumbnail.png' : 'assets/icons/model-thumbnail.png');
        thumbnailEl.setAttribute('width', maxCellWidth);
        thumbnailEl.setAttribute('height', maxCellHeight);
        thumbnailEl.setAttribute('data-content-index', index);
        thumbnailEl.setAttribute('data-marker-value', markerValue);
        thumbnailEl.setAttribute('data-media-type', type);
        thumbnailEl.setAttribute('gaze-interaction-handler', `action: select-grid-image; fuseTimeout: 1000; markerValue: ${markerValue}`);
        container.appendChild(thumbnailEl);
    },

    setCenterpieceGridVisibility: function(visible) {
        if (this.grids.center) this.grids.center.setAttribute('visible', visible);
    },

    hasMultipleImages: function(markerValue) {
        const content = this.contentManager?.contentSequences?.[markerValue] || [];
        return this.utils.filterMediaTypes(content).length > 1;
    },

    setGridVisibility: function(markerValue, visible) {
        const marker = document.querySelector(`a-marker[value="${markerValue}"]`);
        if (marker && marker._imageGrid) marker._imageGrid.setAttribute('visible', visible);
    },

    remove: function() {
        clearInterval(this.checkContentInterval);
        this.el.removeEventListener('content-loaded', () => {});
        ['left', 'right', 'center'].forEach(key => {
            if (this.grids[key]) this.grids[key].remove();
        });
    }
});