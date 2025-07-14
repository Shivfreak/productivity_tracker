let activeTabId = null;
let activeDomain = null;
let sessionStart = null;

function updateDuration(domain, duration) {
  if (!domain || duration <= 0) return;
  chrome.storage.local.get(['siteDurations'], (result) => {
    const durations = result.siteDurations || {};
    durations[domain] = (durations[domain] || 0) + duration;
    chrome.storage.local.set({ siteDurations: durations });
  });
}

chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId === 0 && details.url.startsWith('http')) {
    const now = Date.now();
    const newTabId = details.tabId;
    let newDomain = null;
    try {
      newDomain = new URL(details.url).hostname;
    } catch (e) {
      console.warn('Invalid URL:', details.url);
      return;
    }

    if (activeTabId !== null && activeDomain && sessionStart) {
      const duration = Math.floor((now - sessionStart) / 1000);
      updateDuration(activeDomain, duration);
    }

    activeTabId = newTabId;
    activeDomain = newDomain;
    sessionStart = now;
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === activeTabId && activeDomain && sessionStart) {
    const duration = Math.floor((Date.now() - sessionStart) / 1000);
    updateDuration(activeDomain, duration);
    activeTabId = null;
    activeDomain = null;
    sessionStart = null;
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  const now = Date.now();
  if (activeTabId !== null && activeDomain && sessionStart) {
    const duration = Math.floor((now - sessionStart) / 1000);
    updateDuration(activeDomain, duration);
  }

  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab?.url?.startsWith('http')) {
      try {
        activeTabId = activeInfo.tabId;
        activeDomain = new URL(tab.url).hostname;
        sessionStart = now;
      } catch (e) {
        console.warn('Invalid URL in tab:', tab.url);
        activeTabId = null;
        activeDomain = null;
        sessionStart = null;
      }
    } else {
      activeTabId = null;
      activeDomain = null;
      sessionStart = null;
    }
  });
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  const now = Date.now();
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    if (activeTabId !== null && activeDomain && sessionStart) {
      const duration = Math.floor((now - sessionStart) / 1000);
      updateDuration(activeDomain, duration);
      sessionStart = null;
    }
  } else {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url?.startsWith('http')) {
        try {
          activeTabId = tabs[0].id;
          activeDomain = new URL(tabs[0].url).hostname;
          sessionStart = now;
        } catch (e) {
          console.warn('Invalid URL in active tab:', tabs[0].url);
          activeTabId = null;
          activeDomain = null;
          sessionStart = null;
        }
      }
    });
  }
});