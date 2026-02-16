// navigation-utils.js - Shared navigation utilities
window.NavigationUtils = {
    createGrid(targetId, gridId, className, position = '0 -1.8 3') {
        const target = document.getElementById(targetId);
        if (!target) return null;
        
        const grid = document.createElement('a-entity');
        grid.setAttribute('id', gridId);
        grid.setAttribute('class', className);
        grid.setAttribute('position', position);
        grid.setAttribute('rotation', '0 0 0');
        grid.setAttribute('visible', 'false');
        target.appendChild(grid);
        return grid;
    },

    clearGrid(grid) {
        if (grid) while (grid.firstChild) grid.removeChild(grid.firstChild);
    },

    createImageThumbnail(container, imageSrc, maxWidth, maxHeight) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const aspectRatio = img.naturalWidth / img.naturalHeight;
            const { width, height } = calcImageSize(aspectRatio, maxWidth, maxHeight);
            const offsetX = (maxWidth - width) / 2, offsetY = (maxHeight - height) / 2;
            
            const imageEl = document.createElement('a-image');
            imageEl.setAttribute('src', imageSrc);
            imageEl.setAttribute('width', width);
            imageEl.setAttribute('height', height);
            imageEl.setAttribute('position', `${offsetX} ${-offsetY} 0`);
            imageEl.setAttribute('material', 'depthTest: false; transparent: true;');
            container.appendChild(imageEl);
        };
        img.src = imageSrc;
    },

    createThumbnailIcon(container, iconSrc, maxWidth, maxHeight) {
        const iconEl = document.createElement('a-image');
        iconEl.setAttribute('src', iconSrc);
        iconEl.setAttribute('width', maxWidth * 0.8);
        iconEl.setAttribute('height', maxHeight * 0.8);
        iconEl.setAttribute('position', '0 0 0');
        iconEl.setAttribute('material', 'depthTest: false; transparent: true;');
        container.appendChild(iconEl);
    },

    createGridItem(item, index, x, y, maxWidth, maxHeight, markerValue, side, type) {
        const itemContainer = document.createElement('a-entity');
        itemContainer.setAttribute('class', `${side === 'center' ? 'centerpiece' : side}-grid-item`);
        itemContainer.setAttribute('position', `${x} ${y} 0`);
        itemContainer.setAttribute('data-content-index', index);
        itemContainer.setAttribute('data-marker-value', markerValue);
        itemContainer.setAttribute('data-media-type', item.type);
        if (side !== 'center') itemContainer.setAttribute('data-side', side);
        
        const src = item.value || item.src;
        if (item.type === 'image') {
            NavigationUtils.createImageThumbnail(itemContainer, src, maxWidth, maxHeight);
        } else if (item.type === 'video') {
            NavigationUtils.createThumbnailIcon(itemContainer, 'assets/icons/video-thumbnail.png', maxWidth, maxHeight);
        } else if (item.type === '3d') {
            NavigationUtils.createThumbnailIcon(itemContainer, 'assets/icons/model-thumbnail.png', maxWidth, maxHeight);
        }
        
        return itemContainer;
    },

    calculateGridPosition(index, rows, cols, spacingX, spacingY) {
        const row = Math.floor(index / cols);
        const col = index % cols;
        const x = (col - (cols - 1) / 2) * spacingX;
        const y = -((row - (rows - 1) / 2) * spacingY);
        return { x, y };
    },

    filterMediaTypes(items) {
        return items.filter(item => ['image', 'video', '3d'].includes(item.type));
    },

    shouldShowGrid(mediaContent) {
        return mediaContent.length > 1;
    },

    getMediaContent(contentManager, markerValue, side = 'center') {
        if (!contentManager) return [];
        if (side === 'center') {
            return contentManager.contentSequences?.[markerValue] || [];
        } else {
            return contentManager.markerData?.[markerValue]?.filter(item => item.side === side) || [];
        }
    }
};