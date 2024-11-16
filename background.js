chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");

  // Set up the side panel with the correct path
  chrome.sidePanel.setOptions({
    path: "sidebar/sidebar.html", // Path to the sidebar HTML
    enabled: true, // Enable the side panel
  });
});

chrome.runtime.onStartup.addListener(() => {
  console.log("Extension started");
});
