// app-init.js

document.addEventListener("DOMContentLoaded", () => {
    const scene = document.querySelector('a-scene');
    
    scene.setAttribute('image-controller', '');
    scene.setAttribute('navigation-ui', '');
    scene.setAttribute('content-manager', '');
    scene.setAttribute('marker-detection', '');
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