// script.js 
setTimeout(() => {
    const arjsVideo = document.getElementById('arjs-video');
    if (arjsVideo?.srcObject) {
        const arFeed = document.getElementById('arjs_feed');
        arFeed.srcObject = arjsVideo.srcObject;
        arFeed.setAttribute('src', '#arjs-video');
    }
}, 3000);