// raycast-interaction.js
(function() {
    console.log('🔍 Raycast interaction initializing...');
    
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
            
            // Add data-raycastable attribute to all interactive elements
            function addRaycastableAttributes() {
                // Use valid CSS selectors only (no classes starting with numbers)
                const selectors = [
                    '.zoom-button', '.nav-button', '#centerImage', '.scroller', '.roller',
                    '.centerpiece-grid-item', '.image-grid-item', '.left-grid-item', '.right-grid-item',
                    '.left-zoom-button', '.right-zoom-button', '.left-model-zoom-button', '.right-model-zoom-button',
                    '.marker-zoom-button', '.marker-model-zoom-button', '.marker-reset', '.marker-3dreset',
                    '.marker-restart', '.marker-mute', '.marker-fast-backward', '.marker-fast-forward',
                    '.marker-scroller', '.marker-roller', '.left-scroller', '.right-scroller',
                    '.left-roller', '.right-roller', '.reset', '.model-zoom-button'
                ].join(',');
                
                const elements = document.querySelectorAll(selectors);
                elements.forEach(el => {
                    el.setAttribute('data-raycastable', '');
                });
                
                // Handle 3dreset separately (starts with number, so can't use class selector)
                const resetElements = document.querySelectorAll('[class*="3dreset"]');
                resetElements.forEach(el => {
                    el.setAttribute('data-raycastable', '');
                });
                
                console.log(`🏷️ Added data-raycastable to ${elements.length + resetElements.length} elements`);
            }
            
            // Run initially and watch for new elements
            addRaycastableAttributes();
            
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
                
                // Determine button type - check in order from most specific to least specific
                if (classes.includes('3dreset')) {
                    type = '3d-reset';
                } else if (classes.includes('model-zoom-button')) {
                    type = '3d-zoom';
                    // Check for zoom direction from data-action attribute
                    if (dataAction === '3dincrease') {
                        direction = 'in';
                    } else if (dataAction === '3ddecrease') {
                        direction = 'out';
                    } else if (button.src?.includes('zoom-in')) {
                        direction = 'in';
                    } else if (button.src?.includes('zoom-out')) {
                        direction = 'out';
                    }
                } else if (classes.includes('zoom-button')) {
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
                } else if (classes.includes('reset')) {
                    type = 'reset';
                } else if (classes.includes('scroller')) {
                    type = 'scroller';
                    // Extract direction from data-direction attribute or ID
                    direction = dataDirection || '';
                    if (!direction) {
                        const dirMatch = button.id?.match(/_(up|down|left|right)_/);
                        direction = dirMatch ? dirMatch[1] : '';
                    }
                } else if (classes.includes('roller')) {
                    type = 'roller';
                    // Extract direction from data-direction attribute or ID
                    direction = dataDirection || '';
                    if (!direction) {
                        const dirMatch = button.id?.match(/_(up|down|left|right)_/);
                        direction = dirMatch ? dirMatch[1] : '';
                    }
                } else if (classes.includes('restart') || classes.includes('marker-restart')) {
                    type = 'restart';
                } else if (classes.includes('mute') || classes.includes('marker-mute')) {
                    type = 'mute';
                } else if (classes.includes('fast-forward') || classes.includes('marker-fast-forward')) {
                    type = 'fast-forward';
                } else if (classes.includes('fast-backward') || classes.includes('marker-fast-backward')) {
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
                const buttonClasses = button.className || '';
                
                // Determine the media index from the control plane ID
                let mediaIndex = '0';
                const controlPlaneId = controlPlane.id || '';
                const indexMatch = controlPlaneId.match(/_(\d+)$/);
                if (indexMatch) {
                    mediaIndex = indexMatch[1];
                }
                
                // Determine media type from button class
                let mediaType = 'image';
                if (buttonClasses.includes('roller') || buttonClasses.includes('model-zoom-button') || 
                    buttonClasses.includes('3dreset')) {
                    mediaType = '3d';
                } else if (buttonClasses.includes('restart') || buttonClasses.includes('mute') ||
                           buttonClasses.includes('fast-backward') || buttonClasses.includes('fast-forward')) {
                    mediaType = 'video';
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
                
                return mediaId;
            }

            // Add intersection event listeners - only log visible elements (self AND parent)
            raycaster.addEventListener('raycaster-intersection', function(evt) {
                evt.detail.intersections.forEach(intersection => {
                    const el = intersection.object.el;
                    if (el && isElementVisible(el)) {
                        const buttonInfo = getButtonInfo(el);
                        const targetMedia = findTargetMedia(el);
                        
                        if (buttonInfo.type === 'zoom' && buttonInfo.direction) {
                            console.log(`👉 ENTER: zoom ${buttonInfo.direction} on ${targetMedia}`);
                        } else if (buttonInfo.type === '3d-zoom' && buttonInfo.direction) {
                            console.log(`👉 ENTER: 3d-zoom ${buttonInfo.direction} on ${targetMedia}`);
                        } else if (buttonInfo.type === 'reset') {
                            console.log(`👉 ENTER: reset on ${targetMedia}`);
                        } else if (buttonInfo.type === '3d-reset') {
                            console.log(`👉 ENTER: 3d-reset on ${targetMedia}`);
                        } else if (buttonInfo.direction) {
                            console.log(`👉 ENTER: ${buttonInfo.type} ${buttonInfo.direction} on ${targetMedia}`);
                        } else {
                            console.log(`👉 ENTER: ${buttonInfo.type} on ${targetMedia}`);
                        }
                    }
                });
            });

            raycaster.addEventListener('raycaster-intersection-cleared', function(evt) {
                evt.detail.elms?.forEach(el => {
                    if (el && isElementVisible(el)) {
                        const buttonInfo = getButtonInfo(el);
                        const targetMedia = findTargetMedia(el);
                        
                        if (buttonInfo.type === 'zoom' && buttonInfo.direction) {
                            console.log(`👈 LEAVE: zoom ${buttonInfo.direction} on ${targetMedia}`);
                        } else if (buttonInfo.type === '3d-zoom' && buttonInfo.direction) {
                            console.log(`👈 LEAVE: 3d-zoom ${buttonInfo.direction} on ${targetMedia}`);
                        } else if (buttonInfo.type === 'reset') {
                            console.log(`👈 LEAVE: reset on ${targetMedia}`);
                        } else if (buttonInfo.type === '3d-reset') {
                            console.log(`👈 LEAVE: 3d-reset on ${targetMedia}`);
                        } else if (buttonInfo.direction) {
                            console.log(`👈 LEAVE: ${buttonInfo.type} ${buttonInfo.direction} on ${targetMedia}`);
                        } else {
                            console.log(`👈 LEAVE: ${buttonInfo.type} on ${targetMedia}`);
                        }
                    }
                });
            });

            console.log('👆 Ready - only buttons with visible self AND parent will trigger logs');
        });
    }
})();