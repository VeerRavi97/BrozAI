// sidebar.js

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("tree-container");
  const searchBar = document.getElementById("search-bar");
  const themeToggle = document.getElementById("theme-toggle");
  const sortToggle = document.getElementById("sort-toggle");

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
      sortToggle.textContent = "↑"; // Ascending
      sortToggle.setAttribute("aria-label", "Sort Ascending");
    } else {
      sortToggle.textContent = "↓"; // Descending
      sortToggle.setAttribute("aria-label", "Sort Descending");
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
    favicon.src = tab.favIconUrl || "assets/default-icon.png";
    favicon.alt = "Tab Icon";
    favicon.onerror = () => {
      favicon.src = "assets/default-icon.png"; // Fallback if favicon fails to load
    };
    tabElement.appendChild(favicon);

    // Add tab title
    const title = document.createElement("span");
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

  // Refresh tabs when updated or removed
  chrome.tabs.onUpdated.addListener(() => {
    loadTabsFromCurrentWindow();
  });

  chrome.tabs.onRemoved.addListener(() => {
    loadTabsFromCurrentWindow();
  });

  chrome.tabs.onCreated.addListener(() => {
    loadTabsFromCurrentWindow();
  });

  chrome.tabs.onMoved.addListener(() => {
    loadTabsFromCurrentWindow();
  });

  chrome.tabs.onAttached.addListener(() => {
    loadTabsFromCurrentWindow();
  });

  chrome.tabs.onDetached.addListener(() => {
    loadTabsFromCurrentWindow();
  });
});
