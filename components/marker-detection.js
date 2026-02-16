// marker-detection.js - Shortened version
AFRAME.registerComponent('marker-detection', {
    init: function() {
        this.audioElements = {};
        this.currentPlayingAudio = null;
        this.centerImage = getId('centerImage');
        this.centerpiece = getId('centerpiece');
        this.camera = document.querySelector('a-camera');
        this.currentMarker = null;
        
        this.setupVideoControls();
        this.el.sceneEl.addEventListener('markers-created', () => {
            document.querySelectorAll('a-marker').forEach(marker => {
                marker.addEventListener('markerFound', () => this.onMarkerFound(marker));
                marker.addEventListener('markerLost', () => this.onMarkerLost(marker));
            });
        });
    },

    setupVideoControls: function() {
        const setupButton = (btnId, callback) => {
            const btn = getId(btnId);
            if (btn) btn.addEventListener('click', callback);
        };
        
        setupButton('restart', () => this.controlVideo('restart'));
        setupButton('mute', () => this.controlVideo('mute'));
    },

    controlVideo: function(action, video = getId('centerVideo')) {
        if (!video) return;
        try {
            const img = video.components?.material?.material?.map?.image;
            if (!img) return;
            
            if (action === 'restart') {
                img.currentTime = 0;
                img.play();
            } else if (action === 'mute') {
                img.muted = !img.muted;
                const muteBtn = getId('mute');
                if (muteBtn) muteBtn.setAttribute('src', `assets/icons/${img.muted ? 'unmute' : 'mute'}.png`);
            }
        } catch (e) { console.warn(`Could not ${action} video:`, e); }
    },

    playContentAudio: function(audioSrc) {
        if (this.currentPlayingAudio) {
            this.currentPlayingAudio.pause();
            this.currentPlayingAudio.currentTime = 0;
        }
        if (!audioSrc) return;
        
        if (!this.audioElements[audioSrc]) {
            this.audioElements[audioSrc] = new Audio(audioSrc);
            this.audioElements[audioSrc].preload = 'auto';
        }
        this.currentPlayingAudio = this.audioElements[audioSrc];
        this.currentPlayingAudio.currentTime = 0;
        this.currentPlayingAudio.play().catch(e => console.warn("Could not play audio:", e));
    },

    onMarkerFound: function(marker) {
        const value = marker.getAttribute('value');
        const isNewMarker = this.currentMarker !== value;
        this.currentMarker = value;
        
        if (this.currentPlayingAudio) this.currentPlayingAudio.pause();
        
        const scene = this.el.sceneEl;
        const contentManager = scene.components['content-manager'];
        
        if (contentManager?.narrations?.[value]) {
            this.playAudio(value, contentManager.narrations[value]);
        }
        
        if (this.centerpiece && this.camera) {
            positionBetweenCameraAndMarker(this.camera, marker, this.centerpiece);
        }
        
        if (isNewMarker) {
            this.loadMarkerContent(value, scene, contentManager);
        } else {
            this.updateGridVisibility(value, contentManager);
        }
    },

    loadMarkerContent: function(value, scene, contentManager) {
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
    },

    updateSideControls: function(side, content, markerValue) {
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
    },

    updateLeftPieceControls: function(content, markerValue) { this.updateSideControls('left', content, markerValue); },
    updateRightPieceControls: function(content, markerValue) { this.updateSideControls('right', content, markerValue); },
    hideLeftPieceControls: function() { ['Controls', 'VideoControls', '3dControls'].forEach(t => getId(`left${t}`)?.setInvisible()); },
    hideRightPieceControls: function() { ['Controls', 'VideoControls', '3dControls'].forEach(t => getId(`right${t}`)?.setInvisible()); },

    showSideContent: function(side, content, markerValue, scene) {
        console.log(`Showing ${side} piece content for marker ${markerValue}:`, content);
        
        const image = getId(`${side}Image`);
        const video = getId(`${side}Video`);
        const model = getId(`${side}Model`);
        
        [image, video, model].forEach(el => { if (el) el.setAttribute('visible', 'false'); });
        
        const contentScale = content.scale || 1;
        const baseSize = 3 * contentScale;
        
        if (content.audio) this.playContentAudio(content.audio);
        
        const mediaMap = {
            image: { el: image, handler: this.loadImage },
            video: { el: video, handler: this.loadVideo },
            '3d': { el: model, handler: this.loadModel }
        };
        
        const media = mediaMap[content.type];
        if (media) media.handler.call(this, content, media.el, baseSize);
    },

    loadImage: function(content, imgEl, baseSize) {
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
    },

    loadVideo: function(content, videoEl, baseSize) {
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
    },

    loadModel: function(content, modelEl) {
        modelEl.setAttribute('gltf-model', content.value);
        modelEl.setAttribute('scale', { x: content.scale || 1, y: content.scale || 1, z: content.scale || 1 });
        modelEl.setAttribute('visible', 'true');
        modelEl.setAttribute('position', { x: 0, y: 0, z: 0 });
    },

    showLeftPieceContent: function(content, markerValue, scene) { this.showSideContent('left', content, markerValue, scene); },
    showRightPieceContent: function(content, markerValue, scene) { this.showSideContent('right', content, markerValue, scene); },

    showMarkerImage: function(markerValue, markerElement, scene) {
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
    },

    loadMarkerImage: function(item, imgEl, markerValue) {
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
    },

    loadMarkerVideo: function(item, videoEl, markerValue) {
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
    },

    loadMarkerModel: function(item, modelEl, markerValue) {
        modelEl.setAttribute('gltf-model', item.src);
        modelEl.setAttribute('rotation', '-90 0 0');
        const scale = item.scale || 1;
        modelEl.setAttribute('scale', `${scale} ${scale} ${scale}`);
        modelEl.setAttribute('visible', 'true');
    },

    updateSurroundContent: function(markerValue, surroundSrc) {
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
    },

    showImage: function(src, markerValue, scene) {
        const centerImage = getId('centerImage');
        const centerVideo = getId('centerVideo');
        const centerModel = getId('centerModel');
        
        [centerVideo, centerModel].forEach(el => { if (el) el.setInvisible(); });
        if (centerVideo) pauseVideo(centerVideo);
        
        ['centerVideoControls', 'center3dControls', 'centerControls'].forEach(id => getId(id)?.setInvisible());
        
        centerImage.setVisible();
        
        const contentManager = scene.components['content-manager'];
        const content = contentManager?.getMarkerContent(markerValue);
        if (content?.audio) this.playContentAudio(content.audio);
        
        const imageController = scene.components['image-controller'];
        if (imageController) imageController.setupImage(src, markerValue, 'marker');
    },

    showVideo: function(src, markerValue, scene) {
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
        
        if (content?.audio) this.playContentAudio(content.audio);
        
        const baseSize = 3 * contentScale;
        centerVideo.setAttribute('width', baseSize * 16/9);
        centerVideo.setAttribute('height', baseSize);
        
        centerVideoControls?.setAttribute('visible', hasControls);
        getId('center3dControls')?.setInvisible();
        getId('centerControls')?.setInvisible();
    },

    show3DModel: function(src, markerValue, scene) {
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
        
        if (content?.audio) this.playContentAudio(content.audio);
        
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
    },

    updateGridVisibility: function(markerValue, contentManager) {
        const navUI = this.el.sceneEl.components['navigation-ui'];
        if (navUI) navUI.setGridVisibility(markerValue, navUI.hasMultipleImages(markerValue));
    },

    onMarkerLost: function(marker) {
        const value = marker.getAttribute('value');
        const markerVideo = document.querySelector(`#marker-${value}-video`);
        if (markerVideo) pauseVideo(markerVideo);
    },

    updateNavigationVisibility: function(marker, markerValue, contentManager) {
        const content = contentManager?.getMarkerContent(markerValue);
        if (!content) return;
        
        const typeMap = { image: 'centerControls', video: 'centerVideoControls', '3d': 'center3dControls' };
        const controlId = typeMap[content.type];
        
        ['centerControls', 'centerVideoControls', 'center3dControls'].forEach(id => getId(id)?.setInvisible());
        
        const controlsEnabled = content.controls === "true" || content.controls === true;
        if (controlsEnabled && controlId) getId(controlId)?.setVisible();
    },

    playAudio: function(markerValue, url) {
        if (!this.audioElements[markerValue]) {
            this.audioElements[markerValue] = new Audio(url);
            this.audioElements[markerValue].preload = 'auto';
        }
        this.currentPlayingAudio = this.audioElements[markerValue];
        this.currentPlayingAudio.currentTime = 0;
        this.currentPlayingAudio.play();
    }
});