// app-init.js

document.addEventListener("DOMContentLoaded", () => {
    const scene = document.querySelector('a-scene');
    
    scene.setAttribute('image-position-controller', '');
    scene.setAttribute('marker-navigation-ui', '');
    scene.setAttribute('marker-content-manager', '');
    scene.setAttribute('marker-detection-handler', '');
    scene.setAttribute('model-controller', '');
    
    // Setup AR video feed
    setTimeout(() => {
        const arjsVideo = getId("arjs-video");
        if (arjsVideo?.srcObject) {
            const arFeed = getId('arjs_feed');
            arFeed.srcObject = arjsVideo.srcObject;
            arFeed.setAttribute('src', '#arjs-video');
        }
    }, 3000);
});