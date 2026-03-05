// controls.js
(function() {
    console.log('🎮 Controls API initializing...');
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    function init() {
        console.log('📄 Controls DOM loaded');
        
        // Get the scene
        const scene = document.querySelector('a-scene');
        if (!scene) {
            console.error('❌ Scene not found for controls, retrying...');
            setTimeout(init, 1000);
            return;
        }
        
        scene.addEventListener('loaded', function() {
            console.log('✅ Scene loaded, controls API ready');
            
            
                 window.handleButtonAction = function(mediaId, actionType, direction, button) {
                    console.log(`🎮 Control action: ${actionType} ${direction || ''} on ${mediaId} (button: ${button})`);
                    
                    // Find the media element
                    const mediaElement = document.getElementById(mediaId);
                    if (!mediaElement) {
                        console.warn(`⚠️ Media element not found: ${mediaId}`);
                        return;
                    }
                    
                    // Handle different action types
                    switch(actionType) {
                        case 'zoom':
                        case '3d-zoom':
                            handleZoom(mediaElement, direction);
                            break;
                        case 'reset':
                        case '3d-reset':
                            handleReset(mediaElement);
                            break;
                        case 'scroller':
                            handleScroller(mediaElement, direction);
                            break;
                        case 'roller':
                            handleRoller(mediaElement, direction);
                            break;
                        case 'restart':
                            handleRestart(mediaElement);
                            break;
                        case 'mute':
                            handleMute(mediaElement, button);
                            break;
                        case 'fast-forward':
                            handleFastForward(mediaElement);
                            break;
                        case 'fast-backward':
                            handleFastBackward(mediaElement);
                            break;
                        default:
                            console.log(`Unknown action type: ${actionType}`);
                    }
                }
            
            
            console.log('✅ Controls API ready - window.controlsAPI available');
        });
    }
    
    // Action handler functions
    function handleZoom(mediaElement, direction) {
        console.log(`🔍 Zoom ${direction} on ${mediaElement.id}`);
        
        // Get current scale
        let currentScale = mediaElement.getAttribute('scale') || {x: 1, y: 1, z: 1};
        
        // Calculate new scale
        let newScale = {...currentScale};
        const factor = direction === 'in' ? 1.1 : 0.9;
        newScale.x *= factor;
        newScale.y *= factor;
        newScale.z *= factor;
        
        // Apply new scale
        mediaElement.setAttribute('scale', newScale);
    }
    
    function handleReset(mediaElement) {
        console.log(`🔄 Reset ${mediaElement.id}`);
        
        // Get original rotation and scale from data attributes
        const originalRotation = mediaElement.getAttribute('data-original-rotation') || 0;
        const originalScale = mediaElement.getAttribute('data-original-scale') || 1;
        
        // Reset position, and use original rotation and scale
        mediaElement.setAttribute('position', {x: 0, y: 0, z: 0});
        mediaElement.setAttribute('scale', {x: originalScale, y: originalScale, z: originalScale});
        mediaElement.setAttribute('rotation', {x: 0, y: originalRotation, z: 0});
        
        console.log(`  Reset to original rotation: ${originalRotation}°, original scale: ${originalScale}`);
    }
    
    function handleScroller(mediaElement, direction) {
        console.log(`📜 Scroller ${direction} on ${mediaElement.id}`);
        
        // Get current position
        let currentPos = mediaElement.getAttribute('position') || {x: 0, y: 0, z: 0};
        
        // Calculate new position
        let newPos = {...currentPos};
        const step = 0.1; // Movement step
        
        switch(direction) {
            case 'up':
                newPos.y += step;
                break;
            case 'down':
                newPos.y -= step;
                break;
            case 'left':
                newPos.x -= step;
                break;
            case 'right':
                newPos.x += step;
                break;
        }
        
        // Apply new position
        mediaElement.setAttribute('position', newPos);
    }
    
    function handleRoller(mediaElement, direction) {
        console.log(`🔄 Roller ${direction} on ${mediaElement.id}`);
        
        // Get current rotation
        let currentRot = mediaElement.getAttribute('rotation') || {x: 0, y: 0, z: 0};
        
        // Calculate new rotation
        let newRot = {...currentRot};
        const step = 10; // Rotation step in degrees
        
        switch(direction) {
            case 'up':
                newRot.x += step;
                break;
            case 'down':
                newRot.x -= step;
                break;
            case 'left':
                newRot.y -= step;
                break;
            case 'right':
                newRot.y += step;
                break;
        }
        
        // Apply new rotation
        mediaElement.setAttribute('rotation', newRot);
    }
    
    function handleRestart(mediaElement) {
        console.log(`⏮️ Restart video ${mediaElement.id}`);
        
        // For video elements
        try {
            const video = mediaElement.components.material.material.map.image;
            if (video) {
                video.currentTime = 0;
                video.play();
            }
        } catch(e) {
            console.warn(`Could not restart video: ${e}`);
        }
    }
    
    function handleMute(mediaElement, button) {
        console.log(`🔇 Mute video ${mediaElement.id}`);
        
        // For video elements
        try {
            const video = mediaElement.components.material.material.map.image;
            if (video) {
                video.muted = !video.muted;
                console.log(`Video muted: ${video.muted}`);
                button.setAttribute('src', video.muted ? 'assets/icons/unmute.png' : 'assets/icons/mute.png');
            }
        } catch(e) {
            console.warn(`Could not mute video: ${e}`);
        }
    }
    
    function handleFastForward(mediaElement) {
        console.log(`⏩ Fast forward ${mediaElement.id}`);
        
        // For video elements
        try {
            const video = mediaElement.components.material.material.map.image;
            if (video) {
                video.currentTime += 10; // Skip forward 10 seconds
            }
        } catch(e) {
            console.warn(`Could not fast forward video: ${e}`);
        }
    }
    
    function handleFastBackward(mediaElement) {
        console.log(`⏪ Fast backward ${mediaElement.id}`);
        
        // For video elements
        try {
            const video = mediaElement.components.material.material.map.image;
            if (video) {
                video.currentTime = Math.max(0, video.currentTime - 10); // Skip back 10 seconds
            }
        } catch(e) {
            console.warn(`Could not fast backward video: ${e}`);
        }
    }
})();