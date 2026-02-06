// marker-navigation-ui.js
// Creates 3x3 image grids above markers for image selection
AFRAME.registerComponent('marker-navigation-ui', {
    schema: { contentLoaded: { default: false } }, // Tracks if content JSON is loaded
    
    init: function() {
        this.contentManager = null; // Will store reference to content manager
        
        // Check every 500ms if content JSON is loaded
        this.checkContentInterval = setInterval(() => {
            this.contentManager = this.el.sceneEl.components['marker-content-manager'];
            // When content is loaded and we haven't created grids yet
            if (this.contentManager?.contentSequences && !this.data.contentLoaded) {
                this.data.contentLoaded = true;
                this.createAllGrids(); // Build grids for all markers
                clearInterval(this.checkContentInterval); // Stop checking
            }
        }, 500);
        
        // Alternative way: listen for content-loaded event
        this.el.addEventListener('content-loaded', () => {
            this.data.contentLoaded = true;
            this.createAllGrids();
        });
    },
    
    //check if central side has more than one image
    hasMultipleImages: function(markerValue) {
        const content = this.contentManager?.contentSequences?.[markerValue] || [];
        // Count only image type content
        const imageCount = content.filter(item => item.type === 'image').length;
        return imageCount > 1;
    },
    
    //Set grid visibility for a specific marker
    setGridVisibility: function(markerValue, visible) {
        const marker = document.querySelector(`a-marker[value="${markerValue}"]`);
        if (!marker || !marker._imageGrid) return;
        
        marker._imageGrid.setAttribute('visible', visible);
    },
    
    // Create image grids for ALL markers
    createAllGrids: function() {
        document.querySelectorAll('a-marker').forEach(marker => {
            // Only create grid if it doesn't exist yet AND marker has images
            if (!marker._imageGrid) {
                const markerValue = marker.getAttribute('value');
                // Check if marker has any images at all
                const content = this.contentManager?.contentSequences?.[markerValue] || [];
                const hasImages = content.some(item => item.type === 'image');
                
                if (hasImages) {
                    this.addImageGridToMarker(marker);
                }
            }
        });
    },
    
    // Add a 3x3 image grid to a specific marker
    addImageGridToMarker: function(marker) {
        const markerValue = marker.getAttribute('value');
        // Get all image content for this marker
        const content = this.contentManager?.contentSequences?.[markerValue] || [];
        // Extract just the image URLs
        const imageSources = content
            .filter(item => item.type === 'image')
            .map(item => item.value || item.src);
        
        if (imageSources.length === 0) return; // No images? Skip this marker
        
        // Create container for the grid
        const gridContainer = this.createGridContainer();
        marker._imageGrid = gridContainer; // Store reference on marker
        
        // Set initial visibility based on image count
        const shouldBeVisible = imageSources.length > 1;
        gridContainer.setAttribute('visible', shouldBeVisible.toString());
        
        marker.appendChild(gridContainer); // Add to marker
        
        // Fill grid with images
        this.createGridImages(gridContainer, imageSources, markerValue);
    },
    
    // Create the grid container (invisible by default)
    createGridContainer: function() {
        const container = document.createElement('a-entity');
        container.setAttribute('class', 'image-grid-container');
        container.setAttribute('position', '0 0 0'); // Center on marker
        container.setAttribute('rotation', '-90 0 0'); // Lay flat on table
        container.setInvisible(); // Start invisible
        return container;
    },
    
    // Create images arranged in a 3x3 grid
    createGridImages: function(container, imageSources, markerValue) {
        const rows = 3, cols = 3; // 3x3 grid
        const maxCellWidth = 0.3, maxCellHeight = 0.27; // Max size per image
        const spacingX = maxCellWidth * 1.4, spacingY = maxCellHeight * 1.4; // Spacing between images
        
        // Create up to 9 images (rows * cols)
        for (let i = 0; i < Math.min(imageSources.length, rows * cols); i++) {
            const row = Math.floor(i / cols); // Which row (0, 1, 2)
            const col = i % cols;             // Which column (0, 1, 2)
            
            // Calculate position: center images in grid
            const x = (col - (cols - 1) / 2) * spacingX;
            const y = -((row - (rows - 1) / 2) * spacingY);
            
            // Create this specific image in the grid
            this.createGridImage(imageSources[i], i, x, y, container, markerValue, maxCellWidth, maxCellHeight);
        }
    },
    
    // Create a single image in the grid
    createGridImage: function(imageSrc, index, x, y, container, markerValue, maxCellWidth, maxCellHeight) {
        const img = new Image();
        img.crossOrigin = 'anonymous'; // Allow cross-origin images
        
        // When image loads, create the A-Frame element
        img.onload = () => {
            // Calculate size while maintaining aspect ratio
            const aspectRatio = img.naturalWidth / img.naturalHeight;
            const { width, height } = calcImageSize(aspectRatio, maxCellWidth, maxCellHeight);
            
            // Center image in its grid cell
            const offsetX = (maxCellWidth - width) / 2;
            const offsetY = (maxCellHeight - height) / 2;
            
            // Create the clickable image element
            const imageEl = document.createElement('a-image');
            imageEl.setAttribute('class', 'image-grid-item');
            imageEl.setAttribute('position', `${x + offsetX} ${y - offsetY} 0`);
            imageEl.setAttribute('material', 'depthTest: false;'); // Always render on top
            imageEl.setVisible();
            imageEl.setAttribute('src', imageSrc);
            imageEl.setAttribute('width', width);
            imageEl.setAttribute('height', height);
            imageEl.setAttribute('data-content-index', index); // Which image this is (0-8)
            imageEl.setAttribute('data-marker-value', markerValue); // Which marker it belongs to
            // Make it selectable with gaze interaction
            imageEl.setAttribute('gaze-interaction-handler', 
                `action: select-grid-image; fuseTimeout: 1000; markerValue: ${markerValue}`);
            
            container.appendChild(imageEl); // Add to grid container
        };
        
        img.src = imageSrc; // Start loading the image
    },
    
    // Cleanup when component is removed
    remove: function() {
        if (this.checkContentInterval) clearInterval(this.checkContentInterval);
        this.el.removeEventListener('content-loaded', () => {});
    }
});