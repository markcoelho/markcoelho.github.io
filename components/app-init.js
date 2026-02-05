// app-init.js
// Runs when the HTML page is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    const scene = document.querySelector('a-scene'); // Get the main A-Frame scene
    
    // Attach all our custom components to the scene
    // These components handle different parts of the AR experience
    scene.setAttribute('image-position-controller', '');     // Controls image movement/zoom
    scene.setAttribute('marker-navigation-ui', '');          // Shows image selection grid
    scene.setAttribute('marker-content-manager', '');        // Loads content from JSON file
    scene.setAttribute('marker-detection-handler', '');      // Handles marker detection
    
    // Setup AR video feed (shows camera view when no marker is visible)
    // Wait 3 seconds for AR.js to initialize
    setTimeout(() => {
        const arjsVideo = document.getElementById("arjs-video"); // AR.js internal video element
        if (arjsVideo?.srcObject) {
            const arFeed = document.getElementById('arjs_feed'); // Our video element
            // Copy the camera feed from AR.js to our video element
            arFeed.srcObject = arjsVideo.srcObject;
            arFeed.setAttribute('src', '#arjs-video'); // Set to use AR.js video
        }
    }, 3000);
});

// Helper function: Gets an entity's position in 3D world coordinates
// (Used by other components for positioning)
function getWorldPosition(entity) {
    const position = new THREE.Vector3(); // Create 3D vector
    entity.object3D.getWorldPosition(position); // Get position from Three.js object
    return position; // Return the position
}