//marker-navigation-ui.js
AFRAME.registerComponent('marker-navigation-ui', {
    init: function() {
        const markers = document.querySelectorAll('a-marker');
        markers.forEach(marker => {
            this.addNavigationButtonsToMarker(marker);
        });
    },
    
    addNavigationButtonsToMarker: function(marker) {
        const markerValue = marker.getAttribute('value');
        if (marker.querySelectorAll('.nav-button').length > 0) return;
        
        // Always create navigation buttons
        const leftButton = this.createButton('assets/icons/left.png', '-1 -4 -3', 'left', markerValue, 'nav-button');
        const rightButton = this.createButton('assets/icons/right.png', '1 -4 -3', 'right', markerValue, 'nav-button');
        
        // Store buttons on marker for easy access
        marker._navButtons = { left: leftButton, right: rightButton };
        
        // Initially hide them
        leftButton.setAttribute('visible', 'false');
        rightButton.setAttribute('visible', 'false');
        
        marker.appendChild(leftButton);
        marker.appendChild(rightButton);
    },
    
    createButton: function(src, position, action, markerValue, className) {
        const button = document.createElement('a-image');
        button.setAttribute('class', className);
        button.setAttribute('src', src);
        button.setAttribute('position', position);
        button.setAttribute('rotation', '-90 0 0');
        button.setAttribute('scale', '0.6 0.6 0.6');
        button.setAttribute('data-action', action);
        button.setAttribute('ui-on-top', '');
        button.setAttribute('gaze-interaction-handler', `action: ${action}; markerValue: ${markerValue}; fuseTimeout: 500`);
        button.setAttribute('material', 'depthTest: false; transparent: true; opacity: 1;');
        return button;
    }
});






