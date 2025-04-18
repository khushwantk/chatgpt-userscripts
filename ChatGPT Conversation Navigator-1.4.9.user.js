// ==UserScript==
// @name         ChatGPT Conversation Navigator
// @author       Khushwant Kaswan
// @version      1.4.9
// @description  Floating sidebar that navigates user messages. Scrolls smoothly to a message on click and includes a manual refresh button.
// @match        https://chatgpt.com/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  let userMsgCounter = 0,
    retryCount = 0,
    MAX_RETRIES = 3;

  // Create or retrieve the floating container.
  function createContainer() {
    let container = document.getElementById("chatgpt-message-nav");
    if (container) return container;

    container = document.createElement("div");
    container.id = "chatgpt-message-nav";
    Object.assign(container.style, {
      position: "fixed",
      top: "180px",
      right: "10px",
      width: "300px",
      maxHeight: "80vh",
      overflowY: "auto",
      zIndex: "10000",
      fontFamily: "Arial, sans-serif",
      fontSize: "14px",
      color: "#d1d5db",
      backgroundColor: "#202123",
      border: "1px solid #444654",
      borderRadius: "8px",
      transition: "width 0.3s, padding 0.3s",
    });

    const header = document.createElement("div");
    header.id = "chatgpt-message-nav-header";
    Object.assign(header.style, {
      display: "flex",
      flexDirection: "column",
      padding: "12px",
      backgroundColor: "#202123",
      borderBottom: "1px solid #444654",
      cursor: "pointer",
    });
    header.onclick = () => {
      updateMessageList();
    };

    // First row - Instruction text
    const instructionRow = document.createElement("div");
    instructionRow.id = "chatgpt-message-nav-instruction";
    instructionRow.textContent = "Click message to scroll there";
    Object.assign(instructionRow.style, {
      color: "#d1d5db", // Lighter gray color for secondary text
      fontSize: "12px",
      marginBottom: "8px",
      display: "none",
    });

    // Second row container (title + actions)
    const mainRow = document.createElement("div");
    Object.assign(mainRow.style, {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    });

    // Title element.
    const title = document.createElement("div");
    title.id = "chatgpt-message-nav-title";
    title.textContent = "Your Messages";
    Object.assign(title.style, {
      fontWeight: "bold",
      color: "#ffffff",
    });

    // Container for refresh and toggle buttons.
    const actionsContainer = document.createElement("div");
    actionsContainer.id = "chatgpt-message-nav-actions";
    Object.assign(actionsContainer.style, {
      display: "flex",
      alignItems: "center",
      gap: "8px",
    });

    // Refresh button.
    const refreshBtn = document.createElement("button");
    refreshBtn.id = "chatgpt-message-nav-refresh";
    refreshBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24">
    <path fill="currentColor" d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6a6 6 0 0 1-6 6 6 6 0 0 1-6-6H4a8 8 0 0 0 8 8 8 8 0 0 0 8-8c0-4.42-3.58-8-8-8z"></path>
</svg>`;
    Object.assign(refreshBtn.style, {
      background: "none",
      border: "none",
      color: "#ffffff",
      cursor: "pointer",
      transition: "transform 0.3s",
    });
    refreshBtn.onclick = (e) => {
      e.stopPropagation();
      updateMessageList();
    };

    // Toggle button.
    const toggleBtn = document.createElement("button");
    toggleBtn.id = "chatgpt-message-nav-toggle";
    toggleBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24">
    <path d="M12 21C11.7348 21 11.4804 20.8946 11.2929 20.7071L4.29289 13.7071C3.90237 13.3166 3.90237 12.6834 4.29289 12.2929C4.68342 11.9024 5.31658 11.9024 5.70711 12.2929L11 17.5858V4C11 3.44772 11.4477 3 12 3C12.5523 3 13 3.44772 13 4V17.5858L18.2929 12.2929C18.6834 11.9024 19.3166 11.9024 19.7071 12.2929C20.0976 12.6834 20.0976 13.3166 19.7071 13.7071L12.7071 20.7071C12.5196 20.8946 12.2652 21 12 21Z" fill="currentColor"></path>
</svg>`;
    Object.assign(toggleBtn.style, {
      background: "none",
      border: "none",
      color: "#ffffff",
      transform: "rotate(-90deg)",
      transition: "transform 0.3s",
      cursor: "pointer",
    });
    toggleBtn.onclick = (e) => {
      e.stopPropagation();
      updateMessageList();
      const content = document.getElementById("chatgpt-message-nav-content");
      if (!content) return;

      if (content.style.display === "none") {
        content.style.display = "block";
        container.style.width = "300px";
        title.style.display = "block";
        instructionRow.style.display = "block"; // Show instruction row
        toggleBtn.style.transform = "rotate(-90deg)";
      } else {
        content.style.display = "none";
        container.style.width = "min-content";
        title.style.display = "none";
        instructionRow.style.display = "none"; // Hide instruction row
        toggleBtn.style.transform = "rotate(90deg)";
      }

      localStorage.setItem(
        "chatgptMessageNavCollapsed",
        content.style.display === "none"
      );
    };

    // Append buttons to the actions container.
    actionsContainer.appendChild(refreshBtn);
    actionsContainer.appendChild(toggleBtn);

    // Append title and actions container to the main row.
    mainRow.appendChild(title);
    mainRow.appendChild(actionsContainer);

    // Append both rows to the header.
    header.appendChild(mainRow);
    header.appendChild(instructionRow);

    // Content container.
    const content = document.createElement("div");
    content.id = "chatgpt-message-nav-content";
    Object.assign(content.style, {
      padding: "10px",
      paddingTop: "0",
      height: "auto",
      display: "block",
    });
    // Remove the hidden attribute if it's set
    content.removeAttribute("hidden");

    container.appendChild(header);
    container.appendChild(content);
    document.body.appendChild(container);

    // Apply stored collapsed state.
    if (localStorage.getItem("chatgptMessageNavCollapsed") === "true") {
      content.style.display = "none";
      container.style.width = "min-content";
      title.style.display = "none";
      toggleBtn.style.transform = "rotate(90deg)";
    }

    return container;
  }

  // Ensure each message has a unique ID.
  function assignId(msgElem) {
    if (!msgElem.id) {
      userMsgCounter++;
      msgElem.id = "user-msg-" + userMsgCounter;
    }
  }

  // Update the message list in the navigation container.
  function updateMessageList() {
    const content = document.getElementById("chatgpt-message-nav-content");
    if (!content) return;

    // Remove any 'hidden' attribute that might be present.
    content.removeAttribute("hidden");
    content.innerHTML = "";

    const container = createContainer();
    container.style.height = "auto";
    container.style.minHeight = "";
    content.innerHTML = "";

    const list = document.createElement("ul");
    list.style.cssText = "padding:0;margin:0;list-style:none;";

    const messages = document.querySelectorAll(
      'div[data-message-author-role="user"]'
    );
    messages.forEach((msgElem) => {
      assignId(msgElem);
      let text = msgElem.innerText.trim();
      if (!text) {
        text =
          msgElem.querySelectorAll("img").length > 0
            ? "[Image]"
            : "[No Content]";
      }
      const li = document.createElement("li");
      li.textContent = text;
      Object.assign(li.style, {
        cursor: "pointer",
        padding: "8px 12px",
        margin: "6px 0",
        borderRadius: "6px",

        transition: "background 0.2s",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      });
      li.addEventListener("mouseenter", () => {
        li.style.background = "#565869";
      });
      li.addEventListener("mouseleave", () => {
        li.style.background = "transparent";
      });
      li.onclick = () => {
        const target = document.getElementById(msgElem.id);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      };
      list.appendChild(li);
    });

    content.appendChild(list);

    content.style.height = "auto";
    content.style.minHeight = "";
    if (list.childElementCount === 0 && retryCount < MAX_RETRIES) {
      retryCount++;
      setTimeout(updateMessageList, 100);
    } else {
      retryCount = 0;
    }
  }

  // Observe changes in the conversation area.
  function observeChanges() {
    const main = document.querySelector("main");
    if (!main) return;
    const observer = new MutationObserver(updateMessageList);
    observer.observe(main, { childList: true, subtree: true });
  }

  // Check periodically if the navigator exists, and recreate it if missing.
  function ensureNavigatorExists() {
    if (!document.getElementById("chatgpt-message-nav")) {
      createContainer();
      updateMessageList();
      observeChanges();
    }
  }

  // Initialize the navigator once the main content is ready.
  function initNavigator() {
    if (!document.querySelector("main")) return setTimeout(initNavigator, 500);
    createContainer();
    updateMessageList();
    observeChanges();
  }

  // Observe URL changes for SPA navigation.
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      userMsgCounter = 0;
      updateMessageList();
    }
  }).observe(document.body, { childList: true, subtree: true });

  // Also add event listeners for popstate and hashchange events.
  window.addEventListener("popstate", () => {
    console.log("popstate event detected");
    userMsgCounter = 0;
    updateMessageList();
  });
  window.addEventListener("hashchange", () => {
    console.log("hashchange event detected");
    userMsgCounter = 0;
    updateMessageList();
  });

  initNavigator();
  setInterval(ensureNavigatorExists, 100);
})();
