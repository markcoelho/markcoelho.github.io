// raycast-interaction.js
(function() {
    console.log('🔍 Raycast interaction initializing...');
    
    // Store currently visible media for each piece
    const visibleMediaMap = new Map();
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    function init() {
        console.log('📄 DOM loaded, looking for scene...');
        
        // Get the scene
        const scene = document.querySelector('a-scene');
        if (!scene) {
            console.error('❌ Scene not found, retrying in 1 second...');
            setTimeout(init, 1000);
            return;
        }

        scene.addEventListener('loaded', function() {
            console.log('✅ Scene loaded, setting up raycast listeners');
            
            function addRaycastableAttributes() {
                console.log('🔧 Adding raycastable attributes to all children of Controls containers...');
                
                // Find all elements with ID containing "Controls"
                const controlContainers = document.querySelectorAll('[id*="Controls"]');
                console.log(`📦 Found ${controlContainers.length} control containers`);
                
                let totalCount = 0;
                
                // Add data-raycastable to every child of each Controls container
                controlContainers.forEach(container => {
                    const children = container.children;
                    Array.from(children).forEach(child => {
                        child.setAttribute('data-raycastable', '');
                        totalCount++;
                    });
                    console.log(`  ${container.id}: added to ${children.length} children`);
                });
            }                                       
            
            // Run initially and watch for new elements
            setTimeout(() => {
                addRaycastableAttributes();
            }, 3000); // Delay to ensure all elements are present
            
            // Watch for DOM changes to add attribute to new elements
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1) { // Element node
                            // Check if this element or its children are interactive
                            if (node.matches) {
                                // Valid class selectors (no classes starting with numbers)
                                if (node.matches('.zoom-button, .scroller, .roller, .marker-zoom-button, .marker-scroller, .marker-roller, .reset, .restart, .mute, .fast-backward, .fast-forward, .model-zoom-button')) {
                                    node.setAttribute('data-raycastable', '');
                                    console.log('Added raycastable to:', node.className);
                                }
                                // Use attribute selector for classes containing 3dreset
                                if (node.getAttribute && node.getAttribute('class')?.includes('3dreset')) {
                                    node.setAttribute('data-raycastable', '');
                                }
                                // Check if it's a navigation thumbnail
                                if (node.id && node.id.includes('_navigation')) {
                                    node.querySelectorAll('a-image').forEach(child => {
                                        child.setAttribute('data-raycastable', '');
                                    });
                                }
                            }
                            
                            // Check children with valid selectors
                            if (node.querySelectorAll) {
                                const children = node.querySelectorAll('.zoom-button, .scroller, .roller, .marker-zoom-button, .marker-scroller, .marker-roller, .reset, .restart, .mute, .fast-backward, .fast-forward, .model-zoom-button');
                                children.forEach(child => {
                                    child.setAttribute('data-raycastable', '');
                                });
                                
                                // Check for elements with class containing 3dreset
                                const resetChildren = node.querySelectorAll('[class*="3dreset"]');
                                resetChildren.forEach(child => {
                                    child.setAttribute('data-raycastable', '');
                                });
                                
                                // Check for navigation thumbnails
                                const navChildren = node.querySelectorAll('[id$="_navigation"] a-image');
                                navChildren.forEach(child => {
                                    child.setAttribute('data-raycastable', '');
                                });
                            }
                        }
                    });
                });
            });
            
            observer.observe(document.body, { childList: true, subtree: true });
            
            // Get the raycaster entity
            const raycaster = document.getElementById('raycaster');
            if (!raycaster) {
                console.error('❌ Raycaster not found');
                return;
            }

            console.log('🎯 Raycaster found, monitoring intersections (ignoring invisible elements)...');

            // Helper function to check if element is visible (checks self AND parent)
            function isElementVisible(el) {
                if (!el) return false;
                
                // Check self visibility
                let selfVisible = false;
                if (el.components && el.components.visible) {
                    el.components.visible.update();
                    selfVisible = el.components.visible.data === true;
                } else {
                    const attr = el.getAttribute('visible');
                    selfVisible = attr !== 'false' && attr !== false;
                }
                
                if (!selfVisible) return false;
                
                // Check parent visibility (recursively up to 3 levels)
                let parent = el.parentNode;
                let level = 0;
                while (parent && level < 3) {
                    if (parent.components && parent.components.visible) {
                        parent.components.visible.update();
                        if (parent.components.visible.data === false) {
                            return false;
                        }
                    } else {
                        const parentAttr = parent.getAttribute('visible');
                        if (parentAttr === 'false' || parentAttr === false) {
                            return false;
                        }
                    }
                    parent = parent.parentNode;
                    level++;
                }
                
                return true;
            }

            // Helper function to get button type and direction
            function getButtonInfo(button) {
                if (!button) return { type: 'unknown', direction: '' };
                
                const classes = button.className || '';
                const dataAction = button.getAttribute('data-action');
                const dataDirection = button.getAttribute('data-direction');
                let type = 'unknown';
                let direction = '';
                
                // Log for debugging
                if (classes.includes('marker-model-zoom-button')) {
                    console.log('🔍 Processing marker zoom button:', classes, 'data-action:', dataAction);
                }
                
                // Determine button type - check in order from most specific to least specific
                
                // Check for 3D reset buttons (marker and regular)
                if (classes.includes('3dreset') || classes.includes('marker-3dreset')) {
                    type = '3d-reset';
                }
                // Check for 3D zoom buttons (marker and regular)
                else if (classes.includes('model-zoom-button') || classes.includes('marker-model-zoom-button')) {
                    type = '3d-zoom';
                    // Check for zoom direction from data-action attribute
                    if (dataAction === '3dincrease' || dataAction === 'marker3dincrease') {
                        direction = 'in';
                    } else if (dataAction === '3ddecrease' || dataAction === 'marker3ddecrease') {
                        direction = 'out';
                    } else if (button.src?.includes('zoom-in')) {
                        direction = 'in';
                    } else if (button.src?.includes('zoom-out')) {
                        direction = 'out';
                    }
                }
                // Check for regular zoom buttons
                else if (classes.includes('zoom-button')) {
                    type = 'zoom';
                    // Check for zoom direction from data-action attribute
                    if (dataAction === 'increase') {
                        direction = 'in';
                    } else if (dataAction === 'decrease') {
                        direction = 'out';
                    } else if (button.src?.includes('zoom-in')) {
                        direction = 'in';
                    } else if (button.src?.includes('zoom-out')) {
                        direction = 'out';
                    }
                }
                // Check for reset buttons
                else if (classes.includes('reset')) {
                    type = 'reset';
                }
                // Check for scroller buttons (marker and regular)
                else if (classes.includes('scroller') || classes.includes('marker-scroller')) {
                    type = 'scroller';
                    // Extract direction from data-direction attribute or ID
                    direction = dataDirection || '';
                    if (!direction) {
                        const dirMatch = button.id?.match(/_(up|down|left|right)_/);
                        direction = dirMatch ? dirMatch[1] : '';
                    }
                }
                // Check for roller buttons (marker and regular)
                else if (classes.includes('roller') || classes.includes('marker-roller')) {
                    type = 'roller';
                    // Extract direction from data-direction attribute or ID
                    direction = dataDirection || '';
                    if (!direction) {
                        const dirMatch = button.id?.match(/_(up|down|left|right)_/);
                        direction = dirMatch ? dirMatch[1] : '';
                    }
                }
                // Check for video control buttons (marker and regular)
                else if (classes.includes('restart') || classes.includes('marker-restart')) {
                    type = 'restart';
                }
                else if (classes.includes('mute') || classes.includes('marker-mute')) {
                    type = 'mute';
                }
                else if (classes.includes('fast-forward') || classes.includes('marker-fast-forward')) {
                    type = 'fast-forward';
                }
                else if (classes.includes('fast-backward') || classes.includes('marker-fast-backward')) {
                    type = 'fast-backward';
                }
                
                return { type, direction };
            }

            // Helper function to find which media element this button controls
            function findTargetMedia(button) {
                if (!button) return 'unknown';
                
                // Get parent control plane
                const controlPlane = button.parentNode;
                if (!controlPlane) return 'unknown';
                
                // Get the container (centerpiece_X, leftpiece_X, rightpiece_X)
                const container = controlPlane.parentNode;
                if (!container) return 'unknown';
                
                const containerId = container.id || '';
                const buttonId = button.id || '';
                const buttonClasses = button.className || '';
                
                // Determine media type from button class or ID
                let mediaType = 'image';
                if (buttonClasses.includes('roller') || 
                    buttonClasses.includes('model-zoom-button') || 
                    buttonClasses.includes('3dreset') || 
                    buttonClasses.includes('marker-roller') ||
                    buttonClasses.includes('marker-model-zoom-button') || 
                    buttonClasses.includes('marker-3dreset') ||
                    buttonId.includes('_3d_')) {
                    mediaType = '3d';
                } else if (buttonClasses.includes('restart') || buttonClasses.includes('mute') ||
                            buttonClasses.includes('fast-backward') || buttonClasses.includes('fast-forward') ||
                            buttonId.includes('_video_')) {
                        mediaType = 'video';
                    }
                
                // Extract the media index from the button ID or control plane ID
                let mediaIndex = '0';
                
                // Try to get index from button ID first (e.g., centerpiece_0_3d_up_0 -> index 0)
                const buttonIndexMatch = buttonId.match(/_(\d+)$/);
                if (buttonIndexMatch) {
                    mediaIndex = buttonIndexMatch[1];
                } else {
                    // Fall back to control plane ID
                    const controlPlaneId = controlPlane.id || '';
                    const planeIndexMatch = controlPlaneId.match(/_(\d+)$/);
                    if (planeIndexMatch) {
                        mediaIndex = planeIndexMatch[1];
                    }
                }
                
                // Look for the media element in the container
                let mediaId = 'unknown';
                
                if (mediaType === 'image') {
                    // Try to find image with matching index
                    const image = container.querySelector(`[id$="_image_${mediaIndex}"]`);
                    mediaId = image ? image.id : `${containerId}_image_${mediaIndex}`;
                } else if (mediaType === '3d') {
                    // Try to find 3d model with matching index
                    const model = container.querySelector(`[id$="_3d_${mediaIndex}"]`);
                    mediaId = model ? model.id : `${containerId}_3d_${mediaIndex}`;
                } else if (mediaType === 'video') {
                    // Try to find video with matching index
                    const video = container.querySelector(`[id$="_video_${mediaIndex}"]`);
                    mediaId = video ? video.id : `${containerId}_video_${mediaIndex}`;
                }
                
                // Verify this media element is actually the one that should be controlled
                // by checking if the control plane is for this media type
                const controlPlaneId = controlPlane.id || '';
                const expectedPattern = mediaType === '3d' ? '3dControls' : 
                                       (mediaType === 'video' ? 'VideoControls' : 'Controls');
                
                if (!controlPlaneId.includes(expectedPattern)) {
                    // Try to determine correct type from control plane
                    if (controlPlaneId.includes('3dControls')) {
                        mediaType = '3d';
                    } else if (controlPlaneId.includes('VideoControls')) {
                        mediaType = 'video';
                    } else if (controlPlaneId.includes('Controls')) {
                        mediaType = 'image';
                    }
                    
                    // Re-find with corrected type
                    if (mediaType === 'image') {
                        const image = container.querySelector(`[id$="_image_${mediaIndex}"]`);
                        mediaId = image ? image.id : `${containerId}_image_${mediaIndex}`;
                    } else if (mediaType === '3d') {
                        const model = container.querySelector(`[id$="_3d_${mediaIndex}"]`);
                        mediaId = model ? model.id : `${containerId}_3d_${mediaIndex}`;
                    } else if (mediaType === 'video') {
                        const video = container.querySelector(`[id$="_video_${mediaIndex}"]`);
                        mediaId = video ? video.id : `${containerId}_video_${mediaIndex}`;
                    }
                }
                
                return mediaId;
            }

            raycaster.addEventListener('raycaster-intersection', function(evt) {
                evt.detail.intersections.forEach(intersection => {
                    const el = intersection.object.el;
                    if (el) {
                        // Use setTimeout to ensure visibility updates have taken effect
                        setTimeout(() => {
                            const buttonInfo = getButtonInfo(el);
                            
                            // For regular controls, only log if they're actually visible
                            if (isElementVisible(el)) {
                                const targetMedia = findTargetMedia(el);

                                if (buttonInfo.type === 'zoom' && buttonInfo.direction) {
                                    console.log(`👉 ENTER: zoom ${buttonInfo.direction} on ${targetMedia} (button: ${el})`);
                                    window.controlsAPI.handleButtonAction(targetMedia, buttonInfo.type, buttonInfo.direction, el);
                                    el.removeAttribute('data-raycastable'); 
                                    setTimeout(() => el.setAttribute('data-raycastable', ''), 500);
                                } else if (buttonInfo.type === '3d-zoom' && buttonInfo.direction) {
                                    console.log(`👉 ENTER: 3d-zoom ${buttonInfo.direction} on ${targetMedia} (button: ${el})`);
                                    window.controlsAPI.handleButtonAction(targetMedia, buttonInfo.type, buttonInfo.direction, el);
                                    el.removeAttribute('data-raycastable'); 
                                    setTimeout(() => el.setAttribute('data-raycastable', ''), 500);
                                } else if (buttonInfo.type === 'reset') {
                                    console.log(`👉 ENTER: reset on ${targetMedia} (button: ${el})`);
                                    window.controlsAPI.handleButtonAction(targetMedia, buttonInfo.type, null, el);
                                    el.removeAttribute('data-raycastable'); 
                                    setTimeout(() => el.setAttribute('data-raycastable', ''), 500);
                                } else if (buttonInfo.type === '3d-reset') {
                                    console.log(`👉 ENTER: 3d-reset on ${targetMedia} (button: ${el})`);
                                    window.controlsAPI.handleButtonAction(targetMedia, buttonInfo.type, null, el);
                                    el.removeAttribute('data-raycastable'); 
                                    setTimeout(() => el.setAttribute('data-raycastable', ''), 500);
                                } else if (buttonInfo.direction) {
                                    console.log(`👉 ENTER: ${buttonInfo.type} ${buttonInfo.direction} on ${targetMedia} (button: ${el})`);
                                    window.controlsAPI.handleButtonAction(targetMedia, buttonInfo.type, buttonInfo.direction, el);
                                    if (buttonInfo.type === 'scroller' || buttonInfo.type === 'roller') {
                                        el.removeAttribute('data-raycastable'); 
                                        setTimeout(() => el.setAttribute('data-raycastable', ''), 500);
                                    }
                                } else {
                                    console.log(`👉 ENTER: ${buttonInfo.type} on ${targetMedia} (button: ${el})`);
                                    window.controlsAPI.handleButtonAction(targetMedia, buttonInfo.type, null, el);
                                    if (buttonInfo.type === 'scroller' || buttonInfo.type === 'roller') {
                                        el.removeAttribute('data-raycastable'); 
                                        setTimeout(() => el.setAttribute('data-raycastable', ''), 500);
                                    }
                                }
                            }
                        }, 50); // Small delay to allow visibility updates
                    }
                });
            });

            raycaster.addEventListener('raycaster-intersection-cleared', function(evt) {
                evt.detail.elms?.forEach(el => {
                    if (el) {
                        // Use setTimeout to ensure visibility updates have taken effect
                        setTimeout(() => {
                            const buttonInfo = getButtonInfo(el);
                            
                            if (isElementVisible(el)) {
                                const targetMedia = findTargetMedia(el);
                                const buttonId = el.id;
                                
                                if (buttonInfo.type === 'zoom' && buttonInfo.direction) {
                                    console.log(`👈 LEAVE: zoom ${buttonInfo.direction} on ${targetMedia} (button: ${buttonId})`);
                                } else if (buttonInfo.type === '3d-zoom' && buttonInfo.direction) {
                                    console.log(`👈 LEAVE: 3d-zoom ${buttonInfo.direction} on ${targetMedia} (button: ${buttonId})`);
                                } else if (buttonInfo.type === 'reset') {
                                    console.log(`👈 LEAVE: reset on ${targetMedia} (button: ${buttonId})`);
                                } else if (buttonInfo.type === '3d-reset') {
                                    console.log(`👈 LEAVE: 3d-reset on ${targetMedia} (button: ${buttonId})`);
                                } else if (buttonInfo.direction) {
                                    console.log(`👈 LEAVE: ${buttonInfo.type} ${buttonInfo.direction} on ${targetMedia} (button: ${buttonId})`);
                                } else {
                                    console.log(`👈 LEAVE: ${buttonInfo.type} on ${targetMedia} (button: ${buttonId})`);
                                }
                            }
                        }, 50); // Small delay to allow visibility updates
                    }
                });
            });

            console.log('👆 Ready - raycast interaction initialized');
        });
    }
})();