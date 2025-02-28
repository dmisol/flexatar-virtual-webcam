


    
export function actionsLoggerUI(maxVisibleLogCount, containerWidth, containerHeight, logContainerId) {
  const logContainer = document.getElementById(logContainerId);
  logContainer.style.width = `${containerWidth}px`;
  logContainer.style.height = `${containerHeight}px`;
  logContainer.style.border = '1px solid black';
  const logHeader = document.createElement('div');
  logHeader.textContent = 'Logs';
  logContainer.appendChild(logHeader);
  const logEntries = [];
  
  return function addLog(logMessage) {
    try {
      const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const logEntry = document.createElement('div');
      logEntry.textContent = `${currentTime} _> ${logMessage}`;
      logContainer.appendChild(logEntry);
      logEntries.push(logEntry);
      
      if (logEntries.length > maxVisibleLogCount) {
        logContainer.removeChild(logEntries.shift());
      }
      
      const logEntryWidth = logEntry.offsetWidth;
      const logEntryHeight = logEntry.offsetHeight;
      
      if (logEntryWidth > containerWidth || logEntryHeight > containerHeight) {
        const words = logMessage.split(' ');
        let newLogMessage = '';
        let newLogEntryWidth = 0;
        
        for (let i = 0; i < words.length; i++) {
          const newLogEntry = document.createElement('div');
          newLogEntry.textContent = `${currentTime} _> ${newLogMessage} ${words[i]}`;
          newLogEntryWidth = newLogEntry.offsetWidth;
          
          if (newLogEntryWidth > containerWidth) {
            logEntry.textContent = `${currentTime} _> ${newLogMessage.trim()}`;
            newLogEntry.textContent = `${currentTime} _> ${words[i]}`;
            logContainer.appendChild(newLogEntry);
            logEntries.push(newLogEntry);
          } else {
            newLogMessage += `${words[i]} `;
          }
        }
      }
    } catch (error) {
      return {
        addLog: function () {}
      };
    }
  };
}
    

