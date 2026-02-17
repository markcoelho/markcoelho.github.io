// marker-display.js - Internal content display module
// This is NOT an AFRAME component - it's used internally by marker-detection.js

class MarkerDisplay {
    constructor(component) {
        this.component = component;
        this.centerImage = getId('centerImage');
        this.centerVideo = getId('centerVideo');
        this.centerModel = getId('centerModel');
    }

    loadMarkerContent(value, scene, contentManager) {
        this.showMarkerImage(value, document.querySelector(`a-marker[value="${value}"]`), scene);
        
        if (!contentManager) return;
        
        this.updateSurroundContent(value, contentManager.getSurroundContent(value));
        
        ['left', 'right'].forEach(side => {
            const content = contentManager[`get${side.charAt(0).toUpperCase() + side.slice(1)}SideContent`](value);
            if (content) {
                this[`show${side.charAt(0).toUpperCase() + side.slice(1)}PieceContent`](content, value, scene);
                this[`update${side.charAt(0).toUpperCase() + side.slice(1)}PieceControls`](content, value);
                
                const navUI = scene.components['navigation-ui'];
                if (navUI) navUI[`update${side.charAt(0).toUpperCase() + side.slice(1)}Grid`](value);
            } else {
                this[`hide${side.charAt(0).toUpperCase() + side.slice(1)}PieceControls`]();
                const navUI = scene.components['navigation-ui'];
                if (navUI && navUI[`${side}Grid`]) navUI[`${side}Grid`].setAttribute('visible', 'false');
            }
        });

        const content = contentManager.getMarkerContent(value);
        if (content) {
            const actions = { image: 'showImage', video: 'showVideo', '3d': 'show3DModel' };
            if (actions[content.type]) this[actions[content.type]](content.value, value, scene);
        }

        this.updateNavigationVisibility(document.querySelector(`a-marker[value="${value}"]`), value, contentManager);
        this.updateGridVisibility(value, contentManager);
        
        const navUI = scene.components['navigation-ui'];
        if (navUI) {
            document.querySelectorAll('a-marker').forEach(m => { if (m._imageGrid) m._imageGrid.setAttribute('visible', 'false'); });
            
            const useMarkerNav = contentManager?.getMarkerNavigationFlag?.(value);
            if (useMarkerNav) {
                const currentMarker = document.querySelector(`a-marker[value="${value}"]`);
                if (currentMarker?._imageGrid) currentMarker._imageGrid.setAttribute('visible', navUI.hasMultipleImages(value));
                navUI.setCenterpieceGridVisibility(false);
            } else {
                navUI.updateCenterpieceGrid(value);
                navUI.setCenterpieceGridVisibility(navUI.hasMultipleImages(value));
            }
        }
    }

    updateSideControls(side, content, markerValue) {
        const controlsEnabled = content.controls === "true" || content.controls === true;
        const types = ['Controls', 'VideoControls', '3dControls'];
        types.forEach(type => {
            const el = getId(`${side}${type}`);
            if (el) el.setInvisible();
        });
        
        if (controlsEnabled) {
            const typeMap = { image: 'Controls', video: 'VideoControls', '3d': '3dControls' };
            const controlId = `${side}${typeMap[content.type]}`;
            const controlEl = getId(controlId);
            if (controlEl) controlEl.setVisible();
        }
    }

    updateLeftPieceControls(content, markerValue) { this.updateSideControls('left', content, markerValue); }
    updateRightPieceControls(content, markerValue) { this.updateSideControls('right', content, markerValue); }
    hideLeftPieceControls() { ['Controls', 'VideoControls', '3dControls'].forEach(t => getId(`left${t}`)?.setInvisible()); }
    hideRightPieceControls() { ['Controls', 'VideoControls', '3dControls'].forEach(t => getId(`right${t}`)?.setInvisible()); }

    showSideContent(side, content, markerValue, scene) {
        console.log(`Showing ${side} piece content for marker ${markerValue}:`, content);
        
        const image = getId(`${side}Image`);
        const video = getId(`${side}Video`);
        const model = getId(`${side}Model`);
        
        [image, video, model].forEach(el => { if (el) el.setAttribute('visible', 'false'); });
        
        const contentScale = content.scale || 1;
        const baseSize = 3 * contentScale;
        
        if (content.audio) this.component.playContentAudio(content.audio);
        
        const mediaMap = {
            image: { el: image, handler: this.loadImage },
            video: { el: video, handler: this.loadVideo },
            '3d': { el: model, handler: this.loadModel }
        };
        
        const media = mediaMap[content.type];
        if (media) media.handler.call(this, content, media.el, baseSize);
    }

    loadImage(content, imgEl, baseSize) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const aspect = img.naturalWidth / img.naturalHeight;
            const isLandscape = aspect >= 1;
            const width = isLandscape ? baseSize : baseSize * aspect;
            const height = isLandscape ? baseSize / aspect : baseSize;
            
            imgEl.setAttribute('src', content.value);
            imgEl.setAttribute('width', width);
            imgEl.setAttribute('height', height);
            imgEl.setAttribute('scale', { x: 1, y: 1, z: 1 });
            imgEl.setAttribute('visible', 'true');
            imgEl.setAttribute('position', { x: 0, y: 0, z: 0 });
        };
        img.src = content.value;
    }

    loadVideo(content, videoEl, baseSize) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
            const aspect = video.videoWidth / video.videoHeight;
            const isLandscape = aspect >= 1;
            const width = isLandscape ? baseSize : baseSize * aspect;
            const height = isLandscape ? baseSize / aspect : baseSize;
            
            videoEl.setAttribute('src', content.value);
            videoEl.setAttribute('width', width);
            videoEl.setAttribute('height', height);
            videoEl.setAttribute('scale', { x: 1, y: 1, z: 1 });
            videoEl.setAttribute('visible', 'true');
            videoEl.setAttribute('position', { x: 0, y: 0, z: 0 });
            
            try { videoEl.components?.material?.material?.map?.image?.play(); } catch (e) {}
        };
        video.src = content.value;
    }

    loadModel(content, modelEl) {
        modelEl.setAttribute('gltf-model', content.value);
        modelEl.setAttribute('scale', { x: content.scale || 1, y: content.scale || 1, z: content.scale || 1 });
        modelEl.setAttribute('visible', 'true');
        modelEl.setAttribute('position', { x: 0, y: 0, z: 0 });
    }

    showLeftPieceContent(content, markerValue, scene) { this.showSideContent('left', content, markerValue, scene); }
    showRightPieceContent(content, markerValue, scene) { this.showSideContent('right', content, markerValue, scene); }

    showMarkerImage(markerValue, markerElement, scene) {
        const container = document.querySelector(`#marker-${markerValue}-container`);
        if (!container) return;
        
        const image = container.querySelector(`#marker-${markerValue}-image`);
        const model = container.querySelector(`#marker-${markerValue}-model`);
        const video = container.querySelector(`#marker-${markerValue}-video`);
        
        [image, model, video].forEach(el => { if (el) el.setAttribute('visible', 'false'); });
        
        ['controls', 'video-controls', '3d-controls'].forEach(type => {
            const el = container.querySelector(`#marker-${markerValue}-${type}`);
            if (el) el.setAttribute('visible', 'false');
        });

        const contentManager = scene.components['content-manager'];
        const currentIndex = contentManager?.currentContentIndex[markerValue] || 0;
        const markerItems = contentManager?.markerData?.[markerValue] || [];
        const currentItem = markerItems[currentIndex];
        
        if (!currentItem) return;

        const mediaMap = {
            image: { el: image, handler: this.loadMarkerImage },
            video: { el: video, handler: this.loadMarkerVideo },
            '3d': { el: model, handler: this.loadMarkerModel }
        };
        
        const media = mediaMap[currentItem.type];
        if (media) {
            media.handler.call(this, currentItem, media.el, markerValue);
            if (currentItem.controls) {
                const controlEl = container.querySelector(`#marker-${markerValue}-${currentItem.type === 'video' ? 'video-controls' : currentItem.type === '3d' ? '3d-controls' : 'controls'}`);
                if (controlEl) controlEl.setAttribute('visible', 'true');
            }
        }
    }

    loadMarkerImage(item, imgEl, markerValue) {
        imgEl.setAttribute('src', item.src);
        imgEl.setAttribute('rotation', '-90 0 0');
        
        const img = new Image();
        img.onload = () => {
            const aspect = img.naturalWidth / img.naturalHeight;
            const scale = item.scale || 1;
            imgEl.setAttribute('scale', `${scale * aspect} ${scale} 1`);
            imgEl.setAttribute('visible', 'true');
        };
        img.src = item.src;
    }

    loadMarkerVideo(item, videoEl, markerValue) {
        videoEl.setAttribute('src', item.src);
        videoEl.setAttribute('rotation', '-90 0 0');
        
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
            const aspect = video.videoWidth / video.videoHeight;
            const scale = item.scale || 1;
            videoEl.setAttribute('scale', `${scale * aspect} ${scale} 1`);
            videoEl.setAttribute('visible', 'true');
            try { videoEl.components?.material?.material?.map?.image?.play(); } catch (e) {}
        };
        video.src = item.src;
    }

    loadMarkerModel(item, modelEl, markerValue) {
        modelEl.setAttribute('gltf-model', item.src);
        modelEl.setAttribute('rotation', '-90 0 0');
        const scale = item.scale || 1;
        modelEl.setAttribute('scale', `${scale} ${scale} ${scale}`);
        modelEl.setAttribute('visible', 'true');
    }

    updateSurroundContent(markerValue, surroundSrc) {
        const video360 = document.querySelector('a-videosphere');
        const image360 = document.querySelector('a-sphere');
        
        [video360, image360].forEach(el => el?.setAttribute('visible', 'false'));
        
        if (!surroundSrc) return;
        
        const ext = surroundSrc.split('.').pop().toLowerCase();
        const isVideo = ['mp4', 'webm', 'ogg', 'mov'].includes(ext);
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
        
        if (isVideo) {
            video360.setAttribute('src', surroundSrc);
            video360.setAttribute('visible', 'true');
        } else if (isImage) {
            image360.setAttribute('src', surroundSrc);
            image360.setAttribute('visible', 'true');
        }
    }

    showImage(src, markerValue, scene) {
        const centerImage = getId('centerImage');
        const centerVideo = getId('centerVideo');
        const centerModel = getId('centerModel');
        
        [centerVideo, centerModel].forEach(el => { if (el) el.setInvisible(); });
        if (centerVideo) pauseVideo(centerVideo);
        
        ['centerVideoControls', 'center3dControls', 'centerControls'].forEach(id => getId(id)?.setInvisible());
        
        centerImage.setVisible();
        
        const contentManager = scene.components['content-manager'];
        const content = contentManager?.getMarkerContent(markerValue);
        if (content?.audio) this.component.playContentAudio(content.audio);
        
        const imageController = scene.components['image-controller'];
        if (imageController) imageController.setupImage(src, markerValue, 'marker');
    }

    showVideo(src, markerValue, scene) {
        const centerImage = getId('centerImage');
        const centerVideo = getId('centerVideo');
        const centerModel = getId('centerModel');
        const centerVideoControls = getId('centerVideoControls');
        
        [centerImage, centerModel].forEach(el => el?.setInvisible());
        centerVideo.setVisible();
        playVideo(centerVideo);
        centerVideo.setAttribute('src', src);
        
        const contentManager = scene.components['content-manager'];
        const content = contentManager?.getMarkerContent(markerValue);
        const contentScale = content?.scale || 1;
        const hasControls = content?.controls === true || content?.controls === "true";
        
        if (content?.audio) this.component.playContentAudio(content.audio);
        
        const baseSize = 3 * contentScale;
        centerVideo.setAttribute('width', baseSize * 16/9);
        centerVideo.setAttribute('height', baseSize);
        
        centerVideoControls?.setAttribute('visible', hasControls);
        getId('center3dControls')?.setInvisible();
        getId('centerControls')?.setInvisible();
    }

    show3DModel(src, markerValue, scene) {
        const centerImage = getId('centerImage');
        const centerVideo = getId('centerVideo');
        const centerModel = getId('centerModel');
        const center3dControls = getId('center3dControls');
        
        [centerImage, centerVideo].forEach(el => el?.setInvisible());
        if (centerVideo) pauseVideo(centerVideo);
        
        centerModel.setVisible();
        centerModel.setAttribute('gltf-model', src);
        
        const contentManager = scene.components['content-manager'];
        const content = contentManager?.getMarkerContent(markerValue);
        const controlsEnabled = content?.controls === "true" || content?.controls === true;
        const originalScale = content?.scale || 1;
        
        if (content?.audio) this.component.playContentAudio(content.audio);
        
        const modelController = scene.components['model-controller'];
        const targetScale = modelController?.getUserScale?.(markerValue) || originalScale;
        const savedRotation = modelController?.modelRotations?.[markerValue] || { x: 0, y: 0, z: 0 };
        
        setTimeout(() => {
            centerModel.setAttribute('scale', { x: targetScale, y: targetScale, z: targetScale });
            centerModel.setAttribute('rotation', savedRotation);
        }, 100);
        
        setTimeout(() => {
            center3dControls?.setAttribute('visible', controlsEnabled);
            if (controlsEnabled) {
                document.querySelectorAll('.model-zoom-button, .roller, .3dreset').forEach(btn => btn.setVisible());
            }
        }, 150);
        
        if (modelController?.setCurrentMarker) modelController.setCurrentMarker(markerValue, originalScale);
        
        getId('centerVideoControls')?.setInvisible();
        getId('centerControls')?.setInvisible();
    }

    updateGridVisibility(markerValue, contentManager) {
        const navUI = this.component.el.sceneEl.components['navigation-ui'];
        if (navUI) navUI.setGridVisibility(markerValue, navUI.hasMultipleImages(markerValue));
    }

    updateNavigationVisibility(marker, markerValue, contentManager) {
        const content = contentManager?.getMarkerContent(markerValue);
        if (!content) return;
        
        const typeMap = { image: 'centerControls', video: 'centerVideoControls', '3d': 'center3dControls' };
        const controlId = typeMap[content.type];
        
        ['centerControls', 'centerVideoControls', 'center3dControls'].forEach(id => getId(id)?.setInvisible());
        
        const controlsEnabled = content.controls === "true" || content.controls === true;
        if (controlsEnabled && controlId) getId(controlId)?.setVisible();
    }
}