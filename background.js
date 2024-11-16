// background.js

chrome.runtime.onInstalled.addListener(() => {
  console.log("Tree-Style Tabs extension installed.");
});

chrome.runtime.onStartup.addListener(() => {
  console.log("Tree-Style Tabs extension started.");
});

// Optional: Add any background tasks or listeners if needed in the future.
