// ==UserScript==
// @name         ChatGPT Chat Exporter - PDF
// @author       Khushwant Kaswan
// @version      1.6.0
// @description  Export your ChatGPT conversations as printable PDF files with images (including user-uploaded ones) and deduplication for generated images.
// @match        https://chat.openai.com/*
// @match        https://chatgpt.com/*
// ==/UserScript==

(function () {
  "use strict";

  // Add the export button to the ChatGPT interface.
  function addExportButton() {
    if (document.getElementById("export-pdf-button")) return;
    const targetElement = document.querySelector("nav");
    if (!targetElement) return;
    const button = document.createElement("button");
    button.id = "export-pdf-button";
    button.innerHTML = "Export as PDF";
    button.style.cssText = `
            margin: 10px;
            padding: 10px;
            border-radius: 5px;
            background-color: #10a37f;
            color: white;
            border: none;
            cursor: pointer;
            font-size: 14px;
            width: calc(100% - 20px);
        `;
    button.addEventListener("click", exportPDF);
    targetElement.appendChild(button);
  }

  // Return date string in the format yyyy-mm-dd.
  function formatDate(date = new Date()) {
    return date.toISOString().split("T")[0];
  }

  // Basic sanitization for code blocks.
  function sanitize(text) {
    return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // Extract conversation content from each message,
  // while ensuring user-uploaded images (alt "Uploaded image") are handled.
  function extractFormattedContent() {
    let lastText = null;
    // Grab all message elements.
    //const messages = document.querySelectorAll('.text-base');
    const messages = document.querySelectorAll(
      'article[data-testid^="conversation-turn"]'
    );
    let html = "";
    // Track last image src used for deduplication (applies to generated images only)
    let lastImageSrc = null;
    // Dummy skeleton image (if an image fails due to CSP or error)
    const dummyImage =
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjY2NjIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2NjYiIGZvbnQtc2l6ZT0iMjAiPkltYWdlPC90ZXh0Pjwvc3ZnPg==";

    messages.forEach((msg, index) => {
      // Determine sender from hidden header tags.
      let sender = "Unknown";
      const youElem = msg.querySelector("h5.sr-only");
      const chatElem = msg.querySelector("h6.sr-only");
      if (youElem && youElem.textContent.includes("You said:")) {
        sender = "You";
      } else if (chatElem && chatElem.textContent.includes("ChatGPT said:")) {
        sender = "ChatGPT";
      }

      // Select a content container.
      // NOTE: We include the selector for uploaded images so that if an image element with alt "Uploaded image" is present,
      // it will be selected.
      let contentBlock = msg.querySelector(
        '.text-base, .whitespace-pre-wrap, .markdown,.group\\/dalle-image, .prose, .group\\/imagegen-image, img[alt="Uploaded image"]'
      );
      // If only an <img> tag with alt "Uploaded image" is found (i.e. not wrapped in a container), use the entire message.
      if (
        contentBlock &&
        contentBlock.tagName.toLowerCase() === "img" &&
        contentBlock.alt === "Uploaded image"
      ) {
        contentBlock = msg;
      }
      if (!contentBlock) return;

      // Clone the content block so that we don’t alter the live DOM.
      const clone = contentBlock.cloneNode(true);

      // Process code blocks: sanitize inner text.
      clone.querySelectorAll("pre").forEach((pre) => {
        const code = sanitize(pre.innerText.trim());
        pre.outerHTML = `<pre><code>${code}</code></pre>`;
      });

      // Convert <canvas> elements to images.
      clone.querySelectorAll("canvas").forEach((canvas) => {
        try {
          const dataUrl = canvas.toDataURL();
          const img = document.createElement("img");
          img.src = dataUrl;
          canvas.parentNode.replaceChild(img, canvas);
        } catch (e) {
          console.error("Error converting canvas to image:", e);
        }
      });

      // Process <img> elements.
      const allImages = clone.querySelectorAll("img");
      allImages.forEach((img) => {
        img.removeAttribute("srcset");
        img.removeAttribute("loading");
        img.onerror = function () {
          this.onerror = null;
          this.src = dummyImage;
        };
      });

      // Within this message, remove duplicate images (for generated images only)
      const seenSrcs = new Set();
      allImages.forEach((img) => {
        const src = img.getAttribute("src");
        // Skip deduplication if it's a user-uploaded image.
        if (img.alt === "Uploaded image") return;
        if (seenSrcs.has(src)) {
          const container = img.parentNode;
          if (container) container.remove();
        } else {
          seenSrcs.add(src);
        }
      });

      // Get the processed HTML for this message's content.

      let contentHTML;
      if (sender === "You") {
        contentHTML = clone.innerHTML.trim().replace(/\n/g, "<br>");
      } else {
        contentHTML = clone.innerHTML.trim();
      }

      let tempDiv = document.createElement("div");
      tempDiv.innerHTML = contentHTML;
      let currentText = tempDiv.innerText.trim();
      if (lastText && lastText === currentText) {
        return;
      }
      lastText = currentText;

      // Create a temporary container to check for images.
      const tempDiv2 = document.createElement("div");
      tempDiv2.innerHTML = contentHTML;
      const imgElement = tempDiv2.querySelector("img");

      // Across-message deduplication:
      // If the message contains an image (that is not user-uploaded) and it has the same src as the previous one, skip the message.
      if (imgElement) {
        if (imgElement.alt !== "Uploaded image") {
          if (lastImageSrc && lastImageSrc === imgElement.src) {
            return; // Skip duplicate generated image message.
          }
          lastImageSrc = imgElement.src;
        } else {
          // For uploaded images, do not deduplicate.
          lastImageSrc = null;
        }
      } else {
        lastImageSrc = null;
      }

      html += `
                <div class="message">
                    <div class="sender">${sender}</div>
                    <div class="content">${contentHTML}</div>
                </div>
            `;
    });

    return html;
  }

  // Generate export HTML and open in a new window for PDF creation.
  function exportPDF() {
    const date = formatDate();
    const source = window.location.href;
    const conversationHTML = extractFormattedContent();
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Conversation with ChatGPT - ${date}</title>
    <style>
        body {
            font-family: 'Segoe UI', sans-serif;
            max-width: 800px;
            margin: auto;
            padding: 2rem;
            background: #fff;
            color: #333;
        }
        h1 { text-align: center; }
        .meta {
            font-size: 0.9rem;
            color: #555;
            margin-bottom: 2rem;
            text-align: center;
        }
        .message {
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid #ddd;
        }
        .sender {
            font-weight: bold;
            font-size: 1.1rem;
            margin-bottom: 0.5rem;
        }
        pre {
            background: #f4f4f4;
            padding: 1rem;
            overflow-x: auto;
            border-radius: 5px;
            font-family: monospace;
            font-size: 0.9rem;
        }
        code { white-space: pre-wrap; }
        .content { line-height: 1.5; }
        img { max-width: 100%; height: auto; }
    </style>
</head>
<body>
    <h1>ChatGPT Conversation</h1>
    <div class="meta">
        <div><strong>Date:</strong> ${date}</div>
        <div><strong>Source:</strong> <a href="${source}">${source}</a></div>
    </div>
    ${conversationHTML}
    <script>
        window.onload = () => {
            window.print();
        };
    </script>
</body>
</html>
        `;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  }

  // Initialize the export button once the DOM is ready.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", addExportButton);
  } else {
    addExportButton();
  }
  setInterval(addExportButton, 3000);
})();
