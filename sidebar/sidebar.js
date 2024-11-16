/**
 * Sidebar JavaScript with Dynamic Tree Hierarchy and Sorting Options.
 */

// Global variables for preferences
let sortOrder = "desc"; // Default sort order
let currentSortMode = "default"; // Tracks current sort mode: 'default' or 'recent'

// DOM references
const container = document.getElementById("tree-container");
const searchBar = document.getElementById("search-bar");
const themeToggle = document.getElementById("theme-toggle");
const sortToggle = document.getElementById("sort-toggle");
const recentSortToggle = document.getElementById("recent-sort-toggle");
const sortIcon = document.getElementById("sort-icon");

// Initialize the extension
document.addEventListener("DOMContentLoaded", initialize);

/**
 * Main initialization function.
 */
function initialize() {
  chrome.storage.sync.get(["sortOrder", "darkMode"], (data) => {
    if (data.sortOrder) {
      sortOrder = data.sortOrder;
      updateSortButton();
    }

    if (data.darkMode) {
      document.body.classList.add("dark-mode");
      themeToggle.textContent = "☀️";
    } else {
      themeToggle.textContent = "🌙";
    }

    loadTabsAndRenderTree();

    // Add event listeners for dynamic updates
    chrome.tabs.onCreated.addListener(handleTabChange);
    chrome.tabs.onRemoved.addListener(handleTabChange);
    chrome.tabs.onUpdated.addListener(handleTabChange);
    chrome.tabs.onMoved.addListener(handleTabChange);
    chrome.tabs.onAttached.addListener(handleTabChange);
    chrome.tabs.onDetached.addListener(handleTabChange);
  });

  // Add event listeners for sorting buttons
  addSortingListeners();
}

/**
 * Add event listeners for sorting buttons.
 */
function addSortingListeners() {
  // Default sorting toggle
  sortToggle.addEventListener("click", () => {
    currentSortMode = "default"; // Switch to default sorting
    sortOrder = sortOrder === "asc" ? "desc" : "asc"; // Toggle between ascending and descending
    updateSortButton();
    loadTabsAndRenderTree();

    // Update button visuals
    sortToggle.classList.add("active");
    recentSortToggle.classList.remove("active");
  });

  // Recent sort toggle
  recentSortToggle.addEventListener("click", () => {
    currentSortMode = "recent"; // Switch to recent sorting
    loadTabsAndRenderTree("recent");

    // Update button visuals
    recentSortToggle.classList.add("active");
    sortToggle.classList.remove("active");
  });
}

/**
 * Handle changes in tab structure.
 */
function handleTabChange() {
  loadTabsAndRenderTree(currentSortMode);
}

/**
 * Update sort button icon based on sortOrder.
 */
function updateSortButton() {
  if (sortOrder === "asc") {
    sortToggle.classList.add("asc"); // Rotate the icon via CSS
    sortToggle.setAttribute("aria-label", "Sort Ascending");
    sortIcon.alt = "Sort Ascending";
  } else {
    sortToggle.classList.remove("asc"); // Default orientation
    sortToggle.setAttribute("aria-label", "Sort Descending");
    sortIcon.alt = "Sort Descending";
  }
}

/**
 * Load tabs from the current window and render them as a tree structure.
 * @param {string} sortBy - The sorting method ('default' or 'recent').
 */
function loadTabsAndRenderTree(sortBy = "default") {
  chrome.windows.getCurrent((currentWindow) => {
    chrome.tabs.query({ windowId: currentWindow.id }, (tabs) => {
      // Apply sorting logic
      if (sortBy === "recent" || currentSortMode === "recent") {
        tabs.sort((a, b) => b.lastAccessed - a.lastAccessed); // Sort by recent visits
      } else if (sortOrder === "asc") {
        tabs.sort((a, b) => a.index - b.index); // Default ascending
      } else {
        tabs.sort((a, b) => b.index - a.index); // Default descending
      }

      const tabTree = buildTabTree(tabs);
      renderTabTree(tabTree);
    });
  });
}

/**
 * Build a hierarchical tree structure of tabs.
 * @param {Array} tabs - Array of tab objects.
 * @returns {Object} - Tab tree object.
 */
function buildTabTree(tabs) {
  const tree = {};
  tabs.forEach((tab) => {
    if (tab.openerTabId) {
      if (!tree[tab.openerTabId]) tree[tab.openerTabId] = [];
      tree[tab.openerTabId].push(tab);
    } else {
      if (!tree.root) tree.root = [];
      tree.root.push(tab);
    }
  });
  return tree;
}

/**
 * Render the tab tree in the DOM.
 * @param {Object} tree - Tab tree object.
 */
function renderTabTree(tree) {
  container.innerHTML = "";
  const fragment = document.createDocumentFragment();
  const rootTabs = tree.root || [];
  rootTabs.forEach((tab) => {
    const tabElement = renderTab(tab, tree);
    fragment.appendChild(tabElement);
  });
  container.appendChild(fragment);
}

/**
 * Render an individual tab along with its children.
 * @param {Object} tab - Tab object.
 * @param {Object} tree - Tab tree object.
 * @returns {HTMLElement} - Tab element.
 */
function renderTab(tab, tree) {
  const tabElement = document.createElement("div");
  tabElement.className = "tab";
  tabElement.dataset.tabId = tab.id;

  // Add favicon
  const favicon = document.createElement("img");
  favicon.src = tab.favIconUrl || "assets/default-icon.png";
  favicon.alt = "Tab Icon";
  favicon.onerror = () => {
    favicon.src = "assets/default-icon.png"; // Fallback if favicon fails to load
  };
  tabElement.appendChild(favicon);

  // Add tab title
  const title = document.createElement("span");
  title.className = "tab-title";
  title.textContent = tab.title || `Tab ${tab.id}`;
  tabElement.appendChild(title);

  // Add URL
  const url = document.createElement("span");
  url.className = "tab-url";
  url.textContent = getShortenedURL(tab.url);
  url.title = tab.url;
  tabElement.appendChild(url);

  // Add close button
  const closeButton = document.createElement("button");
  closeButton.className = "close-button";
  closeButton.setAttribute("aria-label", "Close Tab");
  closeButton.setAttribute("title", "Close Tab");

  const closeIcon = document.createElement("img");
  closeIcon.src = "../assets/close.svg";
  closeIcon.alt = "Close";
  closeIcon.className = "close-icon";
  closeButton.appendChild(closeIcon);

  // Event listener to close the tab and remove it from the DOM
  closeButton.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent triggering parent click events

    // Close the tab in the browser
    chrome.tabs.remove(tab.id, () => {
      if (chrome.runtime.lastError) {
        console.error("Failed to close tab:", chrome.runtime.lastError);
      } else {
        // Remove the tab element from the DOM
        tabElement.remove();
      }
    });
  });

  tabElement.appendChild(closeButton);

  // Add child tabs recursively
  // if (tree[tab.id]) {
  //   const childrenContainer = document.createElement("div");
  //   childrenContainer.className = "children";
  //   tree[tab.id].forEach((childTab) => {
  //     const childElement = renderTab(childTab, tree);
  //     childrenContainer.appendChild(childElement);
  //   });
  //   tabElement.appendChild(childrenContainer);
  // }

  // Add click functionality to activate the tab
  tabElement.addEventListener("click", () => {
    chrome.tabs.update(tab.id, { active: true });
  });

  return tabElement;
}

/**
 * Extracts and shortens the URL to display the hostname.
 * @param {string} url - The full URL of the tab.
 * @returns {string} - The shortened URL (hostname).
 */
function getShortenedURL(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace("www.", "");
    const parts = hostname.split(".");
    // Display only the last two parts (e.g., example.com)
    return parts.slice(-2).join(".");
  } catch (error) {
    console.error("Invalid URL:", url);
    return "Invalid URL";
  }
}

/**
 * Debounce function to optimize performance.
 * @param {Function} func - Function to debounce.
 * @param {number} delay - Delay in milliseconds.
 * @returns {Function} - Debounced function.
 */
function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// Search functionality
searchBar.addEventListener("input", (e) => {
  const query = e.target.value.toLowerCase();
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach((tab) => {
    const title = tab.querySelector(".tab-title").textContent.toLowerCase();
    const url = tab.querySelector(".tab-url").textContent.toLowerCase();
    tab.style.display =
      title.includes(query) || url.includes(query) ? "flex" : "none";
  });
});

// Theme toggle functionality
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  const isDarkMode = document.body.classList.contains("dark-mode");
  themeToggle.textContent = isDarkMode ? "☀️" : "🌙";
  chrome.storage.sync.set({ darkMode: isDarkMode });
});

/**
 * Adjust the sidebar width to fit the Chrome Side Panel dynamically.
 */
function adjustSidebarWidth() {
  const sidePanelWidth = window.innerWidth; // Get the Chrome Side Panel width
  sidebar.style.width = `${sidePanelWidth}px`; // Match the sidebar width to the panel width
}

/**
 * Initialize the sidebar width adjustment for Chrome Side Panel.
 */
document.addEventListener("DOMContentLoaded", () => {
  adjustSidebarWidth(); // Set initial width to fit the panel

  // Adjust width dynamically when the Chrome Side Panel resizes
  window.addEventListener("resize", adjustSidebarWidth);
});
