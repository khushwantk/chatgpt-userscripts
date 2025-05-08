// ==UserScript==
// @name         ChatGPT Enter as Newline (Shift+Enter Simulation)
// @namespace    http://tampermonkey.net/
// @version      0.9
// @description  Makes Enter behave like Shift+Enter for newlines, Ctrl+Enter to send
// @author       Khushwant Kaswan
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

//   const newPlaceholder = "Ask anything (Press Ctrl+Enter to Send)";

//     const observer = new MutationObserver(() => {
//         const placeholderElement = document.querySelector('[data-placeholder="Ask anything"]');
//         if (placeholderElement) {
//             placeholderElement.setAttribute("data-placeholder", newPlaceholder);
//             placeholderElement.textContent = newPlaceholder;
//             placeholderElement.classList.add("placeholder");
//             observer.disconnect(); // Stop observing once updated
//         }
//     });

//     observer.observe(document.body, {
//         childList: true,
//         subtree: true
//     });


  // Function to simulate Shift+Enter
  function simulateShiftEnter() {
    const promptEl = document.querySelector("#prompt-textarea");
    if (!promptEl) return;

    // Create and dispatch Shift+Enter keydown event
    const shiftEnterDown = new KeyboardEvent("keydown", {
      key: "Enter",
      code: "Enter",
      keyCode: 13,
      which: 13,
      shiftKey: true,
      bubbles: true,
      cancelable: true,
      composed: true,
    });

    // Create and dispatch Shift+Enter keypress event
    const shiftEnterPress = new KeyboardEvent("keypress", {
      key: "Enter",
      code: "Enter",
      keyCode: 13,
      which: 13,
      shiftKey: true,
      bubbles: true,
      cancelable: true,
      composed: true,
    });

    // Create and dispatch Shift+Enter keyup event
    const shiftEnterUp = new KeyboardEvent("keyup", {
      key: "Enter",
      code: "Enter",
      keyCode: 13,
      which: 13,
      shiftKey: true,
      bubbles: true,
      cancelable: true,
      composed: true,
    });

    // Dispatch all events
    promptEl.dispatchEvent(shiftEnterDown);
    promptEl.dispatchEvent(shiftEnterPress);
    promptEl.dispatchEvent(shiftEnterUp);
  }

  document.addEventListener(
    "keydown",
    function (e) {
      const promptEl = e.target.closest("#prompt-textarea");
      if (!promptEl) return;

      // console.log(`[DEBUG] Key: ${e.key}, Ctrl: ${e.ctrlKey}, Meta: ${e.metaKey}, Shift: ${e.shiftKey}`);

      if (e.key === "Enter") {
        if (e.ctrlKey || e.metaKey) {
          // Send message on Ctrl+Enter or Cmd+Enter
          e.preventDefault();
          const sendButton =
            document.querySelector('[data-testid="send-button"]') ||
            document.getElementById("composer-submit-button");
          if (sendButton && !sendButton.disabled) {
            sendButton.click();
          }
        } else if (!e.shiftKey) {
          // Make Enter behave exactly like Shift+Enter
          e.preventDefault();
          e.stopImmediatePropagation();
          simulateShiftEnter();
        }
        // Allow actual Shift+Enter to work normally
      }
    },
    true
  );

  // Ensure we capture the event early
  document.addEventListener(
    "keydown",
    function (e) {
      if (
        e.target.closest("#prompt-textarea") &&
        e.key === "Enter" &&
        !e.shiftKey
      ) {
        e.stopPropagation();
      }
    },
    false
  );

  // Focus helper
  function maintainFocus() {
    const promptEl = document.querySelector("#prompt-textarea");

    const isDropdownOpen = document.querySelector(
      '.dropdown-menu, .popover, .menu, [role="menu"]'
    ); // customize if needed
    if (!isDropdownOpen && promptEl && document.activeElement !== promptEl) {
      promptEl.focus();
    }
  }

  // Set up periodic focus check
  setInterval(maintainFocus, 5000);
})();
