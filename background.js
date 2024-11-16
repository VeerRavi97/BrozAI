let tabTree = {};

// Function to initialize the tab tree with currently open tabs
function initializeTabTree() {
  chrome.tabs.query({}, (tabs) => {
    tabTree = {}; // Reset the tree
    tabs.forEach((tab) => {
      const parentId = tab.openerTabId || null;
      if (parentId) {
        if (!tabTree[parentId]) tabTree[parentId] = [];
        tabTree[parentId].push(tab.id);
      } else {
        tabTree[tab.id] = [];
      }
    });
    console.log("Initialized tabTree:", tabTree); // Debugging
    saveTabTree();
  });
}

// Save the tab tree to Chrome's local storage
function saveTabTree() {
  chrome.storage.local.set({ tabTree }, () => {
    console.log("Tab tree saved:", tabTree);
  });
}

// Event listener for new tabs
chrome.tabs.onCreated.addListener((tab) => {
  const parentId = tab.openerTabId || null;
  if (parentId) {
    if (!tabTree[parentId]) tabTree[parentId] = [];
    tabTree[parentId].push(tab.id);
  } else {
    tabTree[tab.id] = [];
  }
  saveTabTree();
});

// Event listener for removed tabs
chrome.tabs.onRemoved.addListener((tabId) => {
  delete tabTree[tabId];
  for (const parentId in tabTree) {
    tabTree[parentId] = tabTree[parentId].filter((id) => id !== tabId);
  }
  saveTabTree();
});

// Initialize the tab tree when the extension is loaded
initializeTabTree();
