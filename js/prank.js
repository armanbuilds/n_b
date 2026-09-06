/**
 * Configurable loading durations for the prank connection sequence (in milliseconds).
 */
export const PRANK_TIMERS = {
  RETRY_1_CONNECT_MS: 2200,     // 1st "Try Again" click: loading before 404
  RETRY_2_CONNECT_MS: 2200,     // 2nd "Try Again" click: loading before 503
  FINAL_LAUNCH_MS: 3600,        // 3rd "Try Again" click: total loading time (includes Web found step) before opening web
};

/**
 * Prank States:
 * Attempt 0: 303 — Web not found (dim dark blue rgba(13, 13, 80, 0.72), top-middle, no box, direct)
 * Attempt 1: 404 — Page not found
 * Attempt 2: 503 — Service temporarily unavailable
 * Attempt 3: 3rd Try Again -> progressive loading steps including "Web found" -> cinematic web entry
 */
export const ERROR_STATES = [
  ["303 — Web not found", ""],
  ["404 — Page not found", "The requested experience could not be loaded."],
  ["503 — Service temporarily unavailable", "We're having trouble connecting to this experience. Please try again."],
];

/** Progressive status messages displayed during loading for retries */
const LOADING_STEPS = {
  1: [
    { delay: 0, text: "Reconnecting to server…", sub: "Initiating second handshake" },
    { delay: 1000, text: "Retrying gateway request…", sub: "Contacting primary service cluster" },
  ],
  2: [
    { delay: 0, text: "Retrying connection protocol…", sub: "Testing fallback route" },
    { delay: 1000, text: "Querying secondary cluster nodes…", sub: "Verifying service availability" },
  ],
  3: [
    { delay: 0, text: "Reconnecting to experience…", sub: "Establishing secure session" },
    { delay: 1100, text: "Connecting to server…", sub: "Finalizing handshake" },
    { delay: 2200, text: "Web found", sub: "Connected successfully " },
  ],
};

/**
 * Keeps the entry prank interaction separate from the existing birthday launch flow.
 */
export function initPrankManager(buttonElement, _buttonTextElement, onPrankComplete) {
  let attempt = 0;
  let isBusy = false;
  let hasLaunched = false;
  let overlay = null;
  let retryButton = null;
  const pendingTimers = [];

  function addTimeout(callback, delay) {
    const id = window.setTimeout(() => {
      const index = pendingTimers.indexOf(id);
      if (index !== -1) {
        pendingTimers.splice(index, 1);
      }
      callback();
    }, delay);
    pendingTimers.push(id);
    return id;
  }

  function clearAllTimers() {
    while (pendingTimers.length > 0) {
      window.clearTimeout(pendingTimers.pop());
    }
  }

  function launchExperience() {
    if (hasLaunched) return;
    hasLaunched = true;
    clearAllTimers();
    if (retryButton) {
      retryButton.removeEventListener("click", handleRetry);
      retryButton.disabled = true;
    }
    buttonElement?.removeEventListener("click", handleEntry);

    if (overlay) {
      overlay.classList.add("is-cinematic-opening");
      addTimeout(() => {
        overlay?.remove();
        overlay = null;
      }, 700);
    }

    if (typeof onPrankComplete === "function") {
      onPrankComplete();
    }
  }

  function revealError(currentAttempt) {
    if (!overlay || hasLaunched) return;

    const contentEl = overlay.querySelector(".server-error__content");
    const loadingEl = overlay.querySelector(".server-error__loading");
    const eyebrowEl = overlay.querySelector(".server-error__eyebrow");
    const titleEl = overlay.querySelector(".server-error__title");
    const messageEl = overlay.querySelector(".server-error__message");
    const techInfoEl = overlay.querySelector(".server-error__tech-info");
    const actionEl = overlay.querySelector(".server-error__action");

    if (loadingEl) {
      loadingEl.classList.add("is-hidden");
      loadingEl.hidden = true;
    }
    overlay.classList.remove("is-loading");

    if (currentAttempt === 0) {
      // 1st screen: rgb(13, 13, 80, 0.72) dim dark blue screen, top-middle, simple one line "303 — Web not found" without box
      overlay.classList.add("server-error--blue-303");
      if (eyebrowEl) eyebrowEl.hidden = true;
      if (titleEl) titleEl.textContent = "303 — Web not found";
      if (messageEl) messageEl.hidden = true;
      if (techInfoEl) techInfoEl.hidden = true;
      if (actionEl) actionEl.hidden = false;
      if (retryButton) retryButton.disabled = false;
    } else {
      // Standard error screens (404, 503)
      overlay.classList.remove("server-error--blue-303");
      const [code, message] = ERROR_STATES[currentAttempt];
      if (eyebrowEl) {
        eyebrowEl.hidden = false;
        eyebrowEl.textContent = "Connection problem";
      }
      if (titleEl) titleEl.textContent = code;
      if (messageEl) {
        messageEl.hidden = false;
        messageEl.textContent = message;
      }
      if (techInfoEl) techInfoEl.hidden = true;
      if (actionEl) actionEl.hidden = false;
      if (retryButton) retryButton.disabled = false;
    }

    if (contentEl) {
      contentEl.hidden = false;
      requestAnimationFrame(() => {
        contentEl.classList.add("is-visible");
      });
    }

    overlay.classList.add("is-visible");
    isBusy = false;
  }

  function startLoadingSequence(currentAttempt) {
    if (!overlay || hasLaunched) return;
    isBusy = true;
    if (retryButton) retryButton.disabled = true;

    overlay.classList.remove("server-error--blue-303");

    const contentEl = overlay.querySelector(".server-error__content");
    const loadingEl = overlay.querySelector(".server-error__loading");
    const labelEl = overlay.querySelector(".server-error__loading-label");
    const subEl = overlay.querySelector(".server-error__loading-sub");

    if (contentEl) {
      contentEl.classList.remove("is-visible");
      contentEl.hidden = true;
    }

    if (loadingEl) {
      loadingEl.hidden = false;
      loadingEl.classList.remove("is-hidden");
    }

    overlay.classList.add("is-loading");
    overlay.classList.add("is-visible");

    // Progressive status updates
    const steps = LOADING_STEPS[currentAttempt] || [];
    steps.forEach((step) => {
      addTimeout(() => {
        if (!overlay || hasLaunched) return;
        if (labelEl) labelEl.textContent = step.text;
        if (subEl) subEl.textContent = step.sub;
      }, step.delay);
    });

    // On 3rd Try Again: executes loading steps (including Web found), then opens the experience directly
    if (currentAttempt >= 3) {
      addTimeout(() => {
        launchExperience();
      }, PRANK_TIMERS.FINAL_LAUNCH_MS);
      return;
    }

    // Durations for retries (attempt 1 -> 404, attempt 2 -> 503)
    let loadDuration = PRANK_TIMERS.RETRY_1_CONNECT_MS;
    if (currentAttempt === 2) loadDuration = PRANK_TIMERS.RETRY_2_CONNECT_MS;

    addTimeout(() => {
      revealError(currentAttempt);
    }, loadDuration);
  }

  function handleRetry(event) {
    event.preventDefault();
    if (isBusy || hasLaunched) return;
    clearAllTimers();
    attempt += 1;
    startLoadingSequence(attempt);
  }

  function createOverlay() {
    overlay = document.createElement("section");
    overlay.className = "server-error";
    overlay.setAttribute("aria-live", "polite");
    overlay.setAttribute("aria-label", "Connection error");

    overlay.innerHTML = `
      <div class="server-error__container">
        <div class="server-error__loading" aria-live="polite" hidden>
          <span class="server-error__spinner" aria-hidden="true"></span>
          <div class="server-error__loading-text-wrap">
            <span class="server-error__loading-label">Connecting to server…</span>
            <span class="server-error__loading-sub">Establishing secure session</span>
          </div>
        </div>
        <div class="server-error__content">
          <div class="server-error__copy">
            <p class="server-error__eyebrow" hidden>Connection problem</p>
            <h1 class="server-error__title">303 — Web not found</h1>
            <p class="server-error__message" hidden></p>
            <div class="server-error__tech-info" hidden></div>
          </div>
          <div class="server-error__action">
            <button class="server-error__retry" type="button">Try again</button>
          </div>
        </div>
      </div>
    `;

    document.body.append(overlay);
    retryButton = overlay.querySelector(".server-error__retry");
    retryButton.addEventListener("click", handleRetry);
  }

  function handleEntry(event) {
    event.preventDefault();
    if (isBusy || hasLaunched || overlay) return;
    if (buttonElement) buttonElement.disabled = true;
    createOverlay();
    // 1st time click: directly open 303 screen without loading scene
    revealError(0);
  }

  buttonElement?.addEventListener("click", handleEntry);

  return {
    reset() {
      clearAllTimers();
      if (retryButton) {
        retryButton.removeEventListener("click", handleRetry);
      }
      overlay?.remove();
      overlay = null;
      retryButton = null;
      attempt = 0;
      isBusy = false;
      hasLaunched = false;
      if (buttonElement) buttonElement.disabled = false;
    },
    destroy() {
      this.reset();
      buttonElement?.removeEventListener("click", handleEntry);
    },
    getClickCount() {
      return attempt + (overlay ? 1 : 0);
    },
  };
}
