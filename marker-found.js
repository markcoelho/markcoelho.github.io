// marker-found.js - Complete version with navigation support
(function() {
    // Store current visible marker
    let currentVisibleMarker = null;

    // Hide all content initially
    function hideAllContent() {
        // Hide all markers
        document.querySelectorAll('[id^="markerpiece_"]').forEach(el => {
            el.setAttribute('visible', false);
        });
        
        // Hide all centerpieces
        document.querySelectorAll('[id^="centerpiece_"]').forEach(el => {
            el.setAttribute('visible', false);
        });
        
        // Hide all leftpieces
        document.querySelectorAll('[id^="leftpiece_"]').forEach(el => {
            el.setAttribute('visible', false);
        });
        
        // Hide all rightpieces
        document.querySelectorAll('[id^="rightpiece_"]').forEach(el => {
            el.setAttribute('visible', false);
        });
        
        // Hide all navigation panels and their children
        document.querySelectorAll('[id$="_navigation"]').forEach(el => {
            el.setAttribute('visible', false);
            // Hide all children of navigation panel
            el.querySelectorAll('*').forEach(child => {
                child.setAttribute('visible', false);
            });
        });
    }

    // Helper function to show an element and all its children
    function showElementWithChildren(element, label) {
        if (!element) {
            console.log(`  ❌ ${label} not found`);
            return;
        }
        element.setAttribute('visible', true);
        console.log(`  ✅ ${label} visible`);
        // Show all children
        element.querySelectorAll('*').forEach(child => {
            child.setAttribute('visible', true);
        });
    }

    // Helper function to find first media element (excluding control buttons)
    function findFirstMediaElement(container) {
        // Get all potential media elements
        const allElements = container.children;
        
        // First, look for direct children that are actual media (not in control panels)
        for (let i = 0; i < allElements.length; i++) {
            const el = allElements[i];
            const tagName = el.tagName;
            const id = el.id || '';
            
            // Skip control planes and their children
            if (tagName === 'A-PLANE' || id.includes('Controls_')) {
                continue;
            }
            
            // Check if it's a media element
            if (tagName === 'A-IMAGE' || 
                tagName === 'A-VIDEO' || 
                tagName === 'A-ENTITY' || 
                el.hasAttribute('gltf-model')) {
                return el;
            }
        }
        
        return null;
    }

    // Show content for specific marker value
    function showContentForMarker(value) {
        console.log(`\n=== MARKER ${value} FOUND ===`);
        
        // Hide all content first
        hideAllContent();
        
        // Show marker piece
        var markerPiece = document.getElementById('markerpiece_' + value);
        if (markerPiece) {
            markerPiece.setAttribute('visible', true);
            console.log(`📌 markerpiece_${value}`);
            
            // Show marker content
            var markerContent = markerPiece.querySelector('[id^="markerContent_"]');
            if (markerContent) {
                markerContent.setAttribute('visible', true);
                
                // Find first media element in marker content
                var firstMarkerMedia = findFirstMediaElement(markerContent);
                if (firstMarkerMedia) {
                    firstMarkerMedia.setAttribute('visible', true);
                    console.log(`  📸 ${firstMarkerMedia.id}`);
                    
                    // Find and show the matching controls for the first media
                    var mediaType = 'image';
                    if (firstMarkerMedia.tagName === 'A-VIDEO') mediaType = 'video';
                    else if (firstMarkerMedia.tagName === 'A-ENTITY' || firstMarkerMedia.hasAttribute('gltf-model')) mediaType = '3d';
                    
                    var controlsId;
                    if (mediaType === 'image') {
                        controlsId = 'markerControls_0';
                    } else if (mediaType === 'video') {
                        controlsId = 'markerVideoControls_0';
                    } else if (mediaType === '3d') {
                        controlsId = 'marker3dControls_0';
                    }
                    
                    var markerControls = markerContent.querySelector('#' + controlsId);
                    showElementWithChildren(markerControls, `${controlsId} (controls)`);
                }
            }
            
            // Show marker navigation if it exists
            var markerNavigation = markerPiece.querySelector(`#markerpiece_${value}_navigation`);
            if (markerNavigation) {
                showElementWithChildren(markerNavigation, `markerpiece_${value}_navigation`);
            }
        }
        
        // Show centerpiece
        var centerPiece = document.getElementById('centerpiece_' + value);
        if (centerPiece) {
            centerPiece.setAttribute('visible', true);
            console.log(`🖼️ centerpiece_${value}`);
            
            // Find first media element in centerpiece
            var firstCenterMedia = findFirstMediaElement(centerPiece);
            if (firstCenterMedia) {
                firstCenterMedia.setAttribute('visible', true);
                console.log(`  📸 ${firstCenterMedia.id}`);
                
                // Determine media type and find matching controls
                var mediaIndex = '0';
                var controlsId;
                
                if (firstCenterMedia.tagName === 'A-IMAGE') {
                    controlsId = `centerpiece_${value}_Controls_${mediaIndex}`;
                } else if (firstCenterMedia.tagName === 'A-VIDEO') {
                    controlsId = `centerpiece_${value}_VideoControls_${mediaIndex}`;
                } else if (firstCenterMedia.tagName === 'A-ENTITY' || firstCenterMedia.hasAttribute('gltf-model')) {
                    controlsId = `centerpiece_${value}_3dControls_${mediaIndex}`;
                }
                
                var centerControls = centerPiece.querySelector('#' + controlsId);
                showElementWithChildren(centerControls, `${controlsId} (controls)`);
            }
            
            // Show center navigation if it exists
            var centerNavigation = centerPiece.querySelector(`#centerpiece_${value}_navigation`);
            if (centerNavigation) {
                showElementWithChildren(centerNavigation, `centerpiece_${value}_navigation`);
            }
        }
        
        // Show leftpiece
        var leftPiece = document.getElementById('leftpiece_' + value);
        if (leftPiece) {
            leftPiece.setAttribute('visible', true);
            console.log(`⬅️ leftpiece_${value}`);
            
            // Find first image in leftpiece
            var firstLeftMedia = findFirstMediaElement(leftPiece);
            if (firstLeftMedia) {
                firstLeftMedia.setAttribute('visible', true);
                console.log(`  📸 ${firstLeftMedia.id}`);
                
                // Show first controls for leftpiece
                var leftControls = leftPiece.querySelector(`#leftpiece_${value}_Controls_0`);
                showElementWithChildren(leftControls, `leftpiece_${value}_Controls_0 (controls)`);
            }
            
            // Show left navigation if it exists
            var leftNavigation = leftPiece.querySelector(`#leftpiece_${value}_navigation`);
            if (leftNavigation) {
                showElementWithChildren(leftNavigation, `leftpiece_${value}_navigation`);
            }
        }
        
        // Show rightpiece
        var rightPiece = document.getElementById('rightpiece_' + value);
        if (rightPiece) {
            rightPiece.setAttribute('visible', true);
            console.log(`➡️ rightpiece_${value}`);
            
            // Find first media in rightpiece
            var firstRightMedia = findFirstMediaElement(rightPiece);
            if (firstRightMedia) {
                firstRightMedia.setAttribute('visible', true);
                console.log(`  📸 ${firstRightMedia.id}`);
                
                // Determine media type and show matching controls
                var mediaIndex = '0';
                var controlsId;
                
                if (firstRightMedia.tagName === 'A-IMAGE') {
                    controlsId = `rightpiece_${value}_Controls_${mediaIndex}`;
                } else if (firstRightMedia.tagName === 'A-VIDEO') {
                    controlsId = `rightpiece_${value}_VideoControls_${mediaIndex}`;
                }
                
                var rightControls = rightPiece.querySelector('#' + controlsId);
                showElementWithChildren(rightControls, `${controlsId} (controls)`);
            }
            
            // Show right navigation if it exists
            var rightNavigation = rightPiece.querySelector(`#rightpiece_${value}_navigation`);
            if (rightNavigation) {
                showElementWithChildren(rightNavigation, `rightpiece_${value}_navigation`);
            }
        }
        
        console.log(`=== DONE ===\n`);
        currentVisibleMarker = value;
    }

    // Initialize marker listeners
    function initMarkerListeners() {
        console.log('🎯 Initializing marker listeners...');
        var markers = document.querySelectorAll('[id^="markerpiece_"]');
        console.log(`Found ${markers.length} markers`);
        
        markers.forEach(function(marker) {
            var value = marker.getAttribute('value');
            
            marker.addEventListener('markerFound', function() {
                showContentForMarker(value);
            });
            
            marker.addEventListener('markerLost', function() {
                console.log(`\n👋 Marker ${value} lost`);
                if (currentVisibleMarker === value) {
                    // Optional: hide content when marker is lost
                    // Uncomment next line if you want to hide when marker disappears
                    // hideAllContent();
                    currentVisibleMarker = null;
                }
            });
        });
    }

    // Start when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(initMarkerListeners, 2000);
        });
    } else {
        setTimeout(initMarkerListeners, 2000);
    }

    // Also try when scene loads
    var scene = document.querySelector('a-scene');
    if (scene) {
        scene.addEventListener('loaded', function() {
            console.log('Scene loaded, initializing markers');
            setTimeout(initMarkerListeners, 1000);
        });
    }
})();