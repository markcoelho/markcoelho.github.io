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
        const arjsVideo = getId("arjs-video"); // AR.js internal video element
        if (arjsVideo?.srcObject) {
            const arFeed = getId('arjs_feed'); // Our video element
            // Copy the camera feed from AR.js to our video element
            arFeed.srcObject = arjsVideo.srcObject;
            arFeed.setAttribute('src', '#arjs-video'); // Set to use AR.js video
        }
    }, 3000);
});