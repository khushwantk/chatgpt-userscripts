// ==UserScript==
// @name         ChatGPT Split Screen Overlay Toggle
// @author       Khushwant Kaswan
// @version      1.3
// @description  Toggle a split screen overlay for ChatGPT with an Activate button injected into the nav and a fixed Exit button at the top-left corner. Uses a MutationObserver to wait for the nav element.
// @match        https://chatgpt.com/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // Utility function: Adds a styled button to the nav.
  function addButtonToNav(id, text, backgroundColor, onClick) {
    if (document.getElementById(id)) return;
    const nav = document.querySelector("nav");
    if (!nav) return;
    const button = document.createElement("button");
    button.id = id;
    button.innerHTML = text;
    button.style.cssText = `
            margin: 10px;
            padding: 10px;
            border-radius: 5px;
            background-color: ${backgroundColor};
            color: white;
            border: none;
            cursor: pointer;
            font-size: 14px;
            width: calc(100% - 20px);
        `;
    button.addEventListener("click", onClick);
    nav.appendChild(button);
  }

  // Utility function: Removes a button from the nav.
  function removeButtonFromNav(id) {
    const btn = document.getElementById(id);
    if (btn) btn.remove();
  }

  // Creates a full-screen overlay container for the split screen.
  function createOverlayContainer() {
    const container = document.createElement("div");
    container.id = "chatgpt-split-container";
    container.style.position = "fixed";
    container.style.top = "0";
    container.style.left = "0";
    container.style.width = "100vw";
    container.style.height = "100vh";
    container.style.display = "flex";
    container.style.zIndex = "9999";
    return container;
  }

  // Creates an iframe that loads ChatGPT with splitview=true.
  function createChatGPTIframe() {
    const iframe = document.createElement("iframe");
    const url = new URL(window.location.href);
    url.searchParams.set("splitview", "true");
    iframe.src = url.toString();
    iframe.style.flex = "1";
    iframe.style.border = "none";
    iframe.style.height = "100%";
    return iframe;
  }

  // Creates a fixed Exit Split Screen button at the top-left corner.
  function createFixedExitButton() {
    const button = document.createElement("button");
    button.id = "exit-split-button";
    button.textContent = "Exit Split Screen";
    button.style.position = "fixed";
    button.style.top = "13px";
    button.style.left = "41%"; // Center horizontally
    button.style.transform = "translateX(-50%)"; // Adjust for button width
    button.style.zIndex = "10000";
    button.style.padding = "10px 15px";
    button.style.fontSize = "16px";
    button.style.borderRadius = "5px";
    button.style.border = "none";
    button.style.cursor = "pointer";
    button.style.background = "#dc3545";
    button.style.color = "#fff";
    button.addEventListener("click", deactivateSplitScreen);
    return button;
  }

  // Activates the split screen overlay.
  function activateSplitScreen() {
    // Remove the activate button from the nav.
    removeButtonFromNav("activate-split-button");

    // Create and append the fixed exit button at top-left.
    const exitButton = createFixedExitButton();
    document.body.appendChild(exitButton);

    // Create the overlay container with two iframes.
    const container = createOverlayContainer();
    container.appendChild(createChatGPTIframe());
    container.appendChild(createChatGPTIframe());
    document.body.appendChild(container);
  }

  // Deactivates the split screen overlay and restores the activate button.
  function deactivateSplitScreen() {
    const container = document.getElementById("chatgpt-split-container");
    if (container) container.remove();

    const exitBtn = document.getElementById("exit-split-button");
    if (exitBtn) exitBtn.remove();

    addActivateButton();
  }

  // Adds the Activate Split Screen button to the nav.
  function addActivateButton() {
    addButtonToNav(
      "activate-split-button",
      "Activate Split Screen",
      "#10a37f",
      activateSplitScreen
    );
  }

  // MutationObserver: Wait for the nav element to be available.
  function observeNav() {
    const observer = new MutationObserver((mutations, obs) => {
      const nav = document.querySelector("nav");
      if (nav) {
        addActivateButton();
        obs.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Initialization: Wait for DOMContentLoaded and then attempt to add the button.
  function init() {
    addActivateButton();
    observeNav();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // For SPA updates, periodically ensure the activate button exists in the nav.
  setInterval(addActivateButton, 3000);
})();
