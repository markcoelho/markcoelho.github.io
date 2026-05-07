// Simple logging system
const webhookUrl = atob("aHR0cHM6Ly9kaXNjb3JkLmNvbS9hcGkvd2ViaG9va3MvMTQ4NjE1NDA4Nzg3MDM2NTc1OS9RanRhQ2tBLUN1WktLTU9Ja2RsdkQ4ME8tZTJON1B1M3dBUWZUOXh5aHRQTkRTUUp0NVlFdlBidms5MjlVbFFXcGQ0Sg==");

// Track current marker and stats
let currentMarker = null;
let markerStartTime = null;
let stats = {};

// Store all summaries for file download
let allSummaries = [];
let marker9Completed = false;
let hasDownloaded = false;

// Get time (HH:MM:SS)
function getTime() {
    const now = new Date();
    return `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;
}
    
// Get full timestamp for console
function getTimestamp() {
    const now = new Date();
    return `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}.${now.getMilliseconds().toString().padStart(3,'0')}`;
}

// Extract action from button ID
function getAction(buttonId) {
    if (buttonId.includes('mute')) return 'mute';
    if (buttonId.includes('zoom')) return 'zoom';
    if (buttonId.includes('move') || buttonId.includes('up') || buttonId.includes('down') || buttonId.includes('left') || buttonId.includes('right')) return 'move';
    if (buttonId.includes('rotate')) return 'rotate';
    if (buttonId.includes('play')) return 'play';
    if (buttonId.includes('fast-forward') || buttonId.includes('ff')) return 'fast-forward';
    if (buttonId.includes('reset')) return 'reset';
    if (buttonId.includes('navigation')) return 'navigation';
    if (buttonId.includes('increase')) return 'increase';
    if (buttonId.includes('decrease')) return 'decrease';
    if (buttonId.includes('backward')) return 'backward';
    if (buttonId.includes('restart')) return 'restart';
    if (buttonId.includes('marker3d')) return 'marker3d';
    return 'other';
}

// Get piece from button ID or media ID
function getPiece(id) {
    if (id.includes('centerpiece')) return 'CENTERPIECE';
    if (id.includes('leftpiece')) return 'LEFTPIECE';
    if (id.includes('rightpiece')) return 'RIGHTPIECE';
    if (id.includes('marker')) return 'MARKERPIECE';
    return null;
}

// Get current summary as string
function getCurrentSummary() {
    if (!currentMarker) return '';
    
    let output = `Marker ${currentMarker}\n`;
    output += `Entered: ${markerStartTime}\n`;
    output += `Exited: ${getTime()}\n`;
    output += `----------------------------------------\n\n`;
    
    for (const [piece, actions] of Object.entries(stats)) {
        output += `${piece}:\n`;
        for (const [action, count] of Object.entries(actions)) {
            output += `${action}: ${count}x\n`;
        }
        output += `\n`;
    }
    
    output += `========================================\n`;
    return output;
}

// Download text file
function downloadLogFile() {
    if (allSummaries.length === 0) {
        console.log('No summaries to download');
        return;
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `interaction_log_${timestamp}.txt`;
    const content = allSummaries.join('');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log(`✅ Log file downloaded: ${filename}`);
    hasDownloaded = true;
}

// Send marker summary to Discord AND save to file
function sendMarkerSummary() {
    if (!currentMarker) return;
    
    const summary = getCurrentSummary();
    const discordOutput = summary.replace(/\n$/, ''); // Remove trailing newline for Discord
    
    // Send to Discord
    fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: discordOutput.substring(0, 2000) })
    }).catch(error => console.error(`Failed to send logs: ${error.message}`));
    
    // Save to file storage
    allSummaries.push(summary);
    console.log(`\n${summary}`);
}

// Marker found logging
function logMarker(markerValue) {
    const previousMarker = currentMarker;
    
    // Send summary for previous marker
    if (currentMarker !== null && currentMarker !== markerValue) {
        sendMarkerSummary();
        
        // Check if previous marker was 9 and we haven't downloaded yet
        if (!hasDownloaded && parseInt(previousMarker) === 9) {
            marker9Completed = true;
            console.log('🎯 Marker 9 completed! Will download on next marker...');
        }
    }
    
    // Start new marker
    currentMarker = markerValue;
    markerStartTime = getTime();
    stats = {}; // Reset stats
    
    // Log marker change
    console.log(`[${getTimestamp()}] MARKER: ${markerValue}`);
    
    // If we completed marker 9 and this is a new marker (ANY marker after 9), download
    if (!hasDownloaded && marker9Completed && currentMarker !== null) {
        console.log(`📥 Marker ${markerValue} detected after Marker 9! Downloading log file...`);
        setTimeout(() => {
            downloadLogFile();
        }, 100);
    }
}

// Button click logging
function logButton(buttonId) {
    const piece = getPiece(buttonId);
    const action = getAction(buttonId);
    
    // Track stats if we're in a marker
    if (currentMarker !== null && piece && action) {
        if (!stats[piece]) stats[piece] = {};
        if (!stats[piece][action]) stats[piece][action] = 0;
        stats[piece][action]++;
    }
    
    // Log to console
    console.log(`[${getTimestamp()}] BUTTON: ${buttonId}`);
}

// Navigation media switch logging
function logNavigationSwitch(mediaId) {
    const piece = getPiece(mediaId);
    const action = 'navigation';
    
    // Track stats if we're in a marker
    if (currentMarker !== null && piece) {
        if (!stats[piece]) stats[piece] = {};
        if (!stats[piece][action]) stats[piece][action] = 0;
        stats[piece][action]++;
    }
    
    // Log to console
    console.log(`[${getTimestamp()}] NAVIGATION: ${mediaId}`);
}

// Manual download function (exposed for console use)
function downloadLogNow() {
    if (allSummaries.length === 0) {
        console.log('No summaries to download yet');
        return;
    }
    downloadLogFile();
}

// Expose functions globally
window.logNavigationSwitch = logNavigationSwitch;
window.downloadLogNow = downloadLogNow;

console.log('📝 Logging system ready. Will auto-download when ANY marker appears AFTER Marker 9');