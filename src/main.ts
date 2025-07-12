import './style.css'

declare global {
  interface Window {
    FloatingUIDOM: typeof import("@floating-ui/dom")
  }
}


const componentSelector = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id || tab.url?.startsWith("chrome://") || tab.url?.startsWith("chrome-extension://")) {
    console.warn("Cannot inject into this page.");
    return;
  }

  // Inject computePosition script FIRST
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['assets/injectFloaing.js'],
  });

  // Then inject your logic that uses it
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const FloatingUIDOM = window.FloatingUIDOM;
      if (!FloatingUIDOM) {
        return;
      }
      const style = document.createElement("style");
      style.textContent = `
      .hoverEffectEl {
        position: absolute;
        z-index: 999999999;
        background-color: lightblue;
        opacity: 0.7;
        pointer-events: none;
        border: 1px soild #01245e;
      }
    `;
      document.head.appendChild(style);


      const container = document.createElement("div");
      container.id = "container";

      const hoverEffectEl = document.createElement("div");
      hoverEffectEl.classList.add("hoverEffectEl");
      container.append(hoverEffectEl);
      document.body.appendChild(container);
      let currSrc = ""

      function getDevToolSrc(element: HTMLElement | null) {
        if (!element) return null
        let current = element.parentElement;


        while (current) {
          for (let node of current.childNodes) {
            if (node.nodeType === Node.COMMENT_NODE) {
              const commentText = node.textContent?.trim();

              const match = commentText?.match(/<DevTool\s+src="([^"]*)"[^>]*>/);
              if (match) {
                return { src: match[1], el: current }
              }
            }
          }

          current = current.parentElement;
        }

        return null;
      }

      function hoveringEl(event: Event) {

        let el = event.target as HTMLElement | null;
        let res = getDevToolSrc(el)
        if (!res) return
        el = res.el
        console.log(el)
        if (!el || !(el instanceof HTMLElement) || el === hoverEffectEl) return;
        currSrc = res.src

        const FloatingUIDOM = window.FloatingUIDOM;
        if (!FloatingUIDOM?.computePosition) {
          console.error("computePosition not available.");
          return;
        }

        // Match width/height
        hoverEffectEl.style.width = el.offsetWidth + "px";
        hoverEffectEl.style.height = el.offsetHeight + "px";

        // Position exactly over the element to highlight it
        const rect = el.getBoundingClientRect();
        Object.assign(hoverEffectEl.style, {
          left: `${rect.left + window.scrollX}px`,
          top: `${rect.top + window.scrollY}px`,
          display: 'block',
        });
      }

      function clickingEl(event: Event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        alert(currSrc);
        document.removeEventListener("click", clickingEl);
        document.removeEventListener("mouseover", hoveringEl);
        container?.remove();
      }

      document.addEventListener("click", clickingEl);
      document.addEventListener("mouseover", hoveringEl);
    },
  });
}


document.getElementById("SelectorButton")!.addEventListener("click", componentSelector)
