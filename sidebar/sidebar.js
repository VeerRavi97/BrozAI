document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("tree-container");
  const searchBar = document.getElementById("search-bar");
  const themeToggle = document.getElementById("theme-toggle");

  // Fetch and render tabs from the current window in correct order
  function loadTabsFromCurrentWindow() {
    chrome.windows.getCurrent((currentWindow) => {
      chrome.tabs.query({ windowId: currentWindow.id }, (tabs) => {
        // Sort tabs by index to ensure correct order
        tabs.sort((a, b) => a.index - b.index);
        console.log("Sorted Tabs:", tabs); // Debugging
        renderTabs(tabs); // Render tabs directly in order
      });
    });
  }

  // Render the tabs in order
  function renderTabs(tabs) {
    container.innerHTML = ""; // Clear previous content
    tabs.forEach((tab) => renderTab(tab)); // Render each tab
  }

  // Render individual tabs
  function renderTab(tab) {
    if (!tab) return; // Skip if the tab no longer exists

    const tabElement = document.createElement("div");
    tabElement.className = "tab";
    tabElement.dataset.tabId = tab.id;

    // Add favicon
    const favicon = document.createElement("img");
    favicon.src = tab.favIconUrl || "default-icon.png";
    favicon.alt = "Tab Icon";
    tabElement.appendChild(favicon);

    // Add tab title
    const title = document.createElement("span");
    title.textContent = tab.title || `Tab ${tab.id}`;
    tabElement.appendChild(title);

    // Add close button
    const closeButton = document.createElement("button");
    closeButton.textContent = "X";
    closeButton.addEventListener("click", (e) => {
      e.stopPropagation();
      chrome.tabs.remove(tab.id); // Close the tab
    });
    tabElement.appendChild(closeButton);

    // Add click functionality to switch to the tab
    tabElement.addEventListener("click", () => {
      chrome.tabs.update(tab.id, { active: true }); // Activate the tab
    });

    // Append to container
    container.appendChild(tabElement);
  }

  // Search functionality
  searchBar.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    const tabs = document.querySelectorAll(".tab span");
    tabs.forEach((tab) => {
      const title = tab.textContent.toLowerCase();
      tab.parentElement.style.display = title.includes(query) ? "flex" : "none";
    });
  });

  // Theme toggle functionality
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDarkMode = document.body.classList.contains("dark-mode");
    themeToggle.textContent = isDarkMode ? "☀️" : "🌙";
  });

  // Load tabs from the current window on initialization
  loadTabsFromCurrentWindow();

  // Refresh tabs when updated or removed
  chrome.tabs.onUpdated.addListener(() => {
    loadTabsFromCurrentWindow();
  });

  chrome.tabs.onRemoved.addListener(() => {
    loadTabsFromCurrentWindow();
  });
});
