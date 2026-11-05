import { REVEAL_MESSAGES, CINEMATIC_MESSAGES } from "./config.js";

/**
 * Manages the final two-stage birthday message reveal sequence
 * followed by the Soft Pinkish-Gray Cinematic Final Scene.
 */
export function initRevealSequence(
  revealStageElement,
  revealMessageElement,
  cinematicStageElement,
  cinematicCardElement,
  cinematicTextElement,
  cinematicSignatureElement,
  enableStardustCallback,
  disableStardustCallback
) {
  function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  async function printTextLetterByLetter(targetElement, text, charDelayMs = 16) {
    targetElement.innerHTML = "";
    const charSpans = [];

    // Array.from correctly preserves multi-byte emojis
    const chars = Array.from(text);

    chars.forEach((char) => {
      const span = document.createElement("span");
      span.className = "cinematic-char";
      span.textContent = char;
      targetElement.appendChild(span);
      charSpans.push(span);
    });

    for (let i = 0; i < charSpans.length; i++) {
      const span = charSpans[i];
      void span.offsetWidth; // Force reflow for CSS transition
      span.classList.add("is-printed");
      await wait(charDelayMs);
    }
  }

  let isRunning = false;

  async function startReveal() {
    if (isRunning || !revealStageElement || !revealMessageElement) {
      return;
    }
    isRunning = true;

    // Step 1: Unhide stage container (on black screen + sparkles)
    revealStageElement.hidden = false;
    void revealStageElement.offsetWidth;
    revealStageElement.classList.add("is-visible");

    // Step 2: Show Message 1 ("HAPPY BIRTHDAY TO THE PRECIOUS PERSON OF MY LIFE")
    revealMessageElement.textContent = REVEAL_MESSAGES.message1;
    revealMessageElement.classList.remove("is-leaving");
    void revealMessageElement.offsetWidth;
    revealMessageElement.classList.add("is-revealed");

    // Step 3: Hold Message 1 for 4 seconds
    await wait(4000);

    // Step 4: Smoothly fade out Message 1
    revealMessageElement.classList.remove("is-revealed");
    revealMessageElement.classList.add("is-leaving");
    await wait(1000);

    // Step 5: Reveal Message 2 ("HAPPY BIRTHDAY NOOR ABBAS 🎂🎉") on the SAME black screen
    revealMessageElement.textContent = REVEAL_MESSAGES.message2;
    revealMessageElement.classList.remove("is-leaving");
    void revealMessageElement.offsetWidth;
    revealMessageElement.classList.add("is-revealed");

    // Step 6: Trigger subtle golden stardust particles in the background
    if (typeof enableStardustCallback === "function") {
      enableStardustCallback();
    }

    // Step 7: Hold Message 2 for 4.5 seconds
    await wait(4500);

    // Step 8: BLACK SCREEN + SPARKLES SLOWLY FADES AWAY (2.0s transition)
    if (typeof disableStardustCallback === "function") {
      disableStardustCallback();
    }
    revealStageElement.classList.remove("is-visible");
    await wait(2000);
    revealStageElement.hidden = true;

    // Step 9: Introduce NEW SOFT PINKISH / WARM-GRAY SCREEN
    if (cinematicStageElement && cinematicCardElement && cinematicTextElement) {
      cinematicTextElement.innerHTML = "";
      cinematicCardElement.classList.remove("is-visible", "is-leaving");

      cinematicStageElement.hidden = false;
      void cinematicStageElement.offsetWidth;
      cinematicStageElement.classList.add("is-visible");

      // Wait 1.8s for background environment to fade in, then 1.0s brief pause
      await wait(1800);
      await wait(1000);

      // Step 10: CENTER BOX EMERGES
      void cinematicCardElement.offsetWidth;
      cinematicCardElement.classList.add("is-visible");
      await wait(950);
      await wait(300);

      // Step 11: BLESSING PRINTS LETTER-BY-LETTER AS ONE CONTINUOUS PARAGRAPH
      await printTextLetterByLetter(
        cinematicTextElement,
        CINEMATIC_MESSAGES.firstMessage,
        16 // ~16ms per character -> ~4.5s total printing duration
      );

      // Step 12: HOLD COMPLETE MESSAGE FOR EXACTLY 7 SECONDS (after printing completes)
      await wait(7000);

      // Step 13: FIRST BOX + MESSAGE SLOWLY FADE AWAY
      cinematicCardElement.classList.remove("is-visible");
      cinematicCardElement.classList.add("is-leaving");
      await wait(1200);

      cinematicTextElement.innerHTML = "";
      cinematicCardElement.classList.remove("is-leaving");
      await wait(800);

      // Step 14: SECOND IDENTICAL BOX EMERGES
      void cinematicCardElement.offsetWidth;
      cinematicCardElement.classList.add("is-visible");
      await wait(950);
      await wait(300);

      // Step 15: FINAL MESSAGE PRINTS LETTER-BY-LETTER
      await printTextLetterByLetter(
        cinematicTextElement,
        CINEMATIC_MESSAGES.secondMessage,
        25
      );

      // Step 16: "from : Ch Arman" appears in the bottom-right corner of the SECOND BOX
      await wait(600);
      if (cinematicSignatureElement) {
        const textSpan =
          cinematicSignatureElement.querySelector(".cinematic-signature__text") ||
          cinematicSignatureElement;
        textSpan.textContent = CINEMATIC_MESSAGES.signature;
        cinematicSignatureElement.hidden = false;
        void cinematicSignatureElement.offsetWidth;
        cinematicSignatureElement.classList.add("is-printed");
      }
    }
  }

  return {
    startReveal,
  };
}
