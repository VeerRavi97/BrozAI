document.addEventListener("DOMContentLoaded", () => {
  const tabTree = document.getElementById("tabTree");
  const searchInput = document.getElementById("searchInput");
  let allTabs = [];

  // Fetch tabs and initialize the tree structure
  chrome.tabs.query({}, (tabs) => {
    allTabs = tabs; // Store all tabs for search functionality
    const tabGroups = groupTabsByDomain(tabs);
    displayTabGroups(tabGroups);
  });

  // Search input event listener
  searchInput.addEventListener("input", (e) => {
    searchTabs(e.target.value);
  });

  // Search function to filter tabs
  function searchTabs(query) {
    const filteredTabs = allTabs.filter(
      (tab) =>
        tab.title.toLowerCase().includes(query.toLowerCase()) ||
        tab.url.toLowerCase().includes(query.toLowerCase())
    );
    const filteredGroups = groupTabsByDomain(filteredTabs);
    displayTabGroups(filteredGroups);
  }

  // Utility function to group tabs by domain
  function groupTabsByDomain(tabs) {
    return tabs.reduce((acc, tab) => {
      const url = new URL(tab.url);
      const domain = url.hostname.replace("www.", "");
      if (!acc[domain]) acc[domain] = [];
      acc[domain].push(tab);
      return acc;
    }, {});
  }

  // Display tab groups in a tree format
  function displayTabGroups(tabGroups) {
    tabTree.innerHTML = ""; // Clear any existing tree
    Object.keys(tabGroups).forEach((domain) => {
      const domainContainer = document.createElement("div");
      domainContainer.classList.add("tree-domain");
      domainContainer.textContent = domain;

      const subContainer = document.createElement("div");
      subContainer.classList.add("tree-subcontainer");

      createTabTree(tabGroups[domain], subContainer);
      domainContainer.appendChild(subContainer);
      tabTree.appendChild(domainContainer);
    });
  }

  // Recursive function to create tab tree structure
  function createTabTree(tabs, container) {
    container.innerHTML = ""; // Clear existing content
    tabs.forEach((tab) => {
      const item = document.createElement("div");
      item.classList.add("tree-item");

      const link = document.createElement("a");
      link.href = tab.url;
      link.textContent = tab.title;
      link.target = "_blank";
      item.appendChild(link);

      container.appendChild(item);
    });
  }
});
