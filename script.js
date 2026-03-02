// script.js - Only contains AR feed code now

// Keep your existing setTimeout for AR feed
setTimeout(() => {
    const arjsVideo = document.getElementById('arjs-video');
    if (arjsVideo?.srcObject) {
        const arFeed = document.getElementById('arjs_feed');
        arFeed.srcObject = arjsVideo.srcObject;
        arFeed.setAttribute('src', '#arjs-video');
    }
}, 3000);

// Helper function
function getId(elementId) {
    if (!elementId || typeof elementId !== 'string') {
        console.error('Invalid element ID provided');
        return null;
    }
    return document.getElementById(elementId);
}