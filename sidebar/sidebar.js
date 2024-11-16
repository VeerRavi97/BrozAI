// sidebar.js

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

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("tree-container");
  const searchBar = document.getElementById("search-bar");
  const themeToggle = document.getElementById("theme-toggle");
  const sortToggle = document.getElementById("sort-toggle");
  const sortIcon = document.getElementById("sort-icon");

  let sortOrder = "desc"; // Default sort order

  // Initialize the extension
  initialize();

  // Function to initialize the extension
  function initialize() {
    // Retrieve stored sort order and dark mode preference
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

      loadTabsFromCurrentWindow();
    });
  }

  // Update sort button icon based on sortOrder
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

  // Fetch and render tabs from the current window in the selected order
  function loadTabsFromCurrentWindow() {
    chrome.windows.getCurrent((currentWindow) => {
      chrome.tabs.query({ windowId: currentWindow.id }, (tabs) => {
        // Sort tabs based on sortOrder
        if (sortOrder === "asc") {
          tabs.sort((a, b) => a.index - b.index);
        } else {
          tabs.sort((a, b) => b.index - a.index);
        }

        console.log(`Sorted Tabs (${sortOrder}):`, tabs); // Debugging
        renderTabs(tabs); // Render tabs in the selected order
      });
    });
  }

  // Render the tabs in order
  function renderTabs(tabs) {
    container.innerHTML = ""; // Clear previous content
    const fragment = document.createDocumentFragment(); // Use Document Fragment for performance
    tabs.forEach((tab) => {
      const tabElement = renderTab(tab);
      fragment.appendChild(tabElement);
    });
    container.appendChild(fragment); // Append all tabs at once
  }

  /**
   * Renders an individual tab entry in the sidebar.
   * @param {object} tab - The tab object containing information about the tab.
   * @returns {HTMLElement} - The DOM element representing the tab.
   */
  function renderTab(tab) {
    if (!tab) return; // Skip if the tab no longer exists

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

    // Add shortened URL
    const url = document.createElement("span");
    url.className = "tab-url";
    url.textContent = getShortenedURL(tab.url); // Use the helper function
    url.title = tab.url; // Add tooltip with full URL
    tabElement.appendChild(url);

    // Add tab title
    const title = document.createElement("span");
    title.className = "tab-title";
    title.textContent = tab.title || `Tab ${tab.id}`;
    tabElement.appendChild(title);

    // Add close button
    const closeButton = document.createElement("button");
    closeButton.textContent = "X";
    closeButton.className = "close-button";
    closeButton.addEventListener("click", (e) => {
      e.stopPropagation();
      chrome.tabs.remove(tab.id); // Close the tab
    });
    tabElement.appendChild(closeButton);

    // Add click functionality to switch to the tab
    tabElement.addEventListener("click", () => {
      chrome.tabs.update(tab.id, { active: true }); // Activate the tab
    });

    return tabElement; // Return the constructed tab element
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
    // Save dark mode preference
    chrome.storage.sync.set({ darkMode: isDarkMode }, () => {
      if (chrome.runtime.lastError) {
        console.error(
          "Error saving theme preference:",
          chrome.runtime.lastError
        );
      }
    });
  });

  // Sort toggle functionality
  sortToggle.addEventListener("click", () => {
    // Toggle sort order
    sortOrder = sortOrder === "asc" ? "desc" : "asc";
    updateSortButton();
    // Save sort order preference
    chrome.storage.sync.set({ sortOrder: sortOrder }, () => {
      if (chrome.runtime.lastError) {
        console.error(
          "Error saving sort order preference:",
          chrome.runtime.lastError
        );
      }
    });
    // Reload tabs in the new order
    loadTabsFromCurrentWindow();
  });

  // Debounced loadTabsFromCurrentWindow for performance
  function debounce(func, delay) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  }

  const debouncedLoadTabs = debounce(loadTabsFromCurrentWindow, 300);

  // Refresh tabs when updated or removed
  chrome.tabs.onUpdated.addListener(debouncedLoadTabs);
  chrome.tabs.onRemoved.addListener(debouncedLoadTabs);
  chrome.tabs.onCreated.addListener(debouncedLoadTabs);
  chrome.tabs.onMoved.addListener(debouncedLoadTabs);
  chrome.tabs.onAttached.addListener(debouncedLoadTabs);
  chrome.tabs.onDetached.addListener(debouncedLoadTabs);
});
