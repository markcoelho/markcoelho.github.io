// app-init.js
document.addEventListener("DOMContentLoaded", () => {
    const scene = document.querySelector('a-scene');
    
    // Attach components to the scene
    scene.setAttribute('image-position-controller', '');
    scene.setAttribute('marker-navigation-ui', '');
    scene.setAttribute('marker-content-manager', '');
    scene.setAttribute('marker-detection-handler', '');
    
    // Setup AR video feed (keep this here)
    setTimeout(() => {
        const arjsVideo = document.getElementById("arjs-video");
        if (arjsVideo?.srcObject) {
            const arFeed = document.getElementById('arjs_feed');
            arFeed.srcObject = arjsVideo.srcObject;
            arFeed.setAttribute('src', '#arjs-video');
        }
    }, 3000);
});

// Helper function for world position (kept for compatibility)
function getWorldPosition(entity) {
    const position = new THREE.Vector3();
    entity.object3D.getWorldPosition(position);
    return position;
}






