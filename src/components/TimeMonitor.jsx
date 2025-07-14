import { useState, useEffect } from 'react';

// Format time in seconds
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours > 0 ? `${hours}h ` : ''}${minutes > 0 ? `${minutes}m ` : ''}${secs > 0 ? `${secs}s` : ''}`.trim() || '0s';
}

function TimeMonitor() {
  const [siteDurations, setSiteDurations] = useState({});

  const loadDurations = () => {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['siteDurations'], (result) => {
        setSiteDurations(result.siteDurations || {});
      });
    }
  };

  useEffect(() => {
    loadDurations();

    const handleStorageUpdate = (changes, area) => {
      if (area === 'local' && changes.siteDurations) {
        loadDurations();
      }
    };
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener(handleStorageUpdate);
    }

    const handleMessage = (message) => {
      if (message.type === 'updateSiteDuration') {
        setSiteDurations((prev) => ({
          ...prev,
          [message.hostname]: (prev[message.hostname] || 0) + message.timeSpent,
        }));
      }
    };
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener(handleMessage);
    }

    return () => {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
        chrome.storage.onChanged.removeListener(handleStorageUpdate);
      }
      if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.removeListener(handleMessage);
      }
    };
  }, []);

  const sortedSites = Object.entries(siteDurations)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Website Time Monitor</h2>
      {sortedSites.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No time data available.</p>
      ) : (
        <ul className="space-y-2">
          {sortedSites.map(([site, time]) => (
            <li key={site} className="p-2 bg-gray-200 dark:bg-gray-600 rounded flex justify-between items-center">
              <span>{site}</span>
              <span>{formatDuration(time)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default TimeMonitor;