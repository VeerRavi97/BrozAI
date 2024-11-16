// background.js

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");

  // Set up the side panel
  chrome.sidePanel.setOptions({
    path: "sidebar/sidebar.html", // Specify the path to the side panel HTML file
    enabled: true, // Enable the side panel
  });
});

chrome.runtime.onStartup.addListener(() => {
  console.log("Extension started");
});
