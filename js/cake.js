/** Coordinates the cinematic pre-fireworks cake ceremony. */
export function initCakeCeremony(stage) {
  const panel = stage.querySelector("#ceremony-panel");
  const copy = stage.querySelector("#ceremony-copy");
  const actions = stage.querySelector("#ceremony-actions");
  const yes = stage.querySelector("#ceremony-yes");
  const no = stage.querySelector("#ceremony-no");
  const loader = stage.querySelector("#ceremony-loader");
  const intro = stage.querySelector("#cake-intro");
  const frame = stage.querySelector("#cake-video-frame");
  const video = stage.querySelector("#cake-video");
  const FIRST_LOADING_MS = 5000;
  const PRANK_HOLD_MS = 5000;
  const SECOND_LOADING_MS = 5000;
  let running = false;
  let listenersBound = false;
  let finished = false;
  let state = "idle";
  let noOffset = { x: 0, y: 0 };
  let postVideoNoClicks = 0;
  let completeCallback = null;

  const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
  const reveal = (element) => {
    element.hidden = false;
    requestAnimationFrame(() => element.classList.add("is-visible"));
  };
  const conceal = (element) => element.classList.remove("is-visible");
  const showQuestion = (message) => {
    copy.textContent = message;
    noOffset = { x: 0, y: 0 };
    no.style.transform = "translate3d(0, 0, 0)";
    reveal(panel);
    reveal(actions);
  };

  function rectanglesOverlap(first, second, gap = 18) {
    return !(
      first.right + gap < second.left ||
      first.left - gap > second.right ||
      first.bottom + gap < second.top ||
      first.top - gap > second.bottom
    );
  }

  function moveNoButton(event) {
    const stageRect = stage.getBoundingClientRect();
    const currentRect = no.getBoundingClientRect();
    const yesRect = yes.getBoundingClientRect();
    const buttonWidth = currentRect.width;
    const buttonHeight = currentRect.height;
    const baseLeft = currentRect.left - noOffset.x;
    const baseTop = currentRect.top - noOffset.y;
    const pointerX = event?.clientX ?? stageRect.left + stageRect.width / 2;
    const pointerY = event?.clientY ?? stageRect.top + stageRect.height / 2;
    const margin = 18;
    let target = null;

    for (let attempt = 0; attempt < 48; attempt += 1) {
      const left = stageRect.left + margin + Math.random() * Math.max(1, stageRect.width - buttonWidth - margin * 2);
      const top = stageRect.top + margin + Math.random() * Math.max(1, stageRect.height - buttonHeight - margin * 2);
      const candidate = { left, top, right: left + buttonWidth, bottom: top + buttonHeight };
      const distance = Math.hypot(left + buttonWidth / 2 - pointerX, top + buttonHeight / 2 - pointerY);
      if (!rectanglesOverlap(candidate, yesRect) && distance > 140) {
        target = candidate;
        break;
      }
    }

    if (!target) return;
    noOffset = { x: target.left - baseLeft, y: target.top - baseTop };
    no.style.transform = `translate3d(${noOffset.x}px, ${noOffset.y}px, 0)`;
  }

  async function runLoader(duration) {
    conceal(panel);
    conceal(actions);
    reveal(loader);
    await wait(duration);
    conceal(loader);
    await wait(500);
  }

  async function showNothingPrank() {
    state = "first-loading";
    await runLoader(FIRST_LOADING_MS);
    if (state !== "first-loading") return;
    state = "nothing";
    showQuestion("There is nothing for you! 😂 LOL 😂😂😂");
    conceal(actions);
    actions.hidden = true;
    await wait(PRANK_HOLD_MS);
    if (state !== "nothing") return;
    state = "wait-question";
    panel.classList.add("is-card-flipping");
    await wait(500);
    copy.textContent = "WAIT! I have something to show you... 👀✨. Do you wanna see ?" ;
    reveal(actions);
    await wait(500);
    panel.classList.remove("is-card-flipping");
  }

  async function showCakeIntro() {
    state = "second-loading";
    await runLoader(SECOND_LOADING_MS);
    if (state !== "second-loading") return;
    state = "cake-intro";
    stage.classList.add("is-flipping");
    await wait(900);
    stage.classList.remove("is-flipping");
    reveal(intro);
    await wait(3100);
    if (state !== "cake-intro") return;
    conceal(intro);
    reveal(frame);
    state = "video";
    try {
      await video.play();
    } catch {
      // Browsers that require a fresh gesture keep the video ready without affecting the fireworks state.
    }
  }

  async function showPostVideoQuestion() {
    state = "post-video-question";
    postVideoNoClicks = 0;
    conceal(frame);
    await wait(650);
    showQuestion("Do you want to see something MORE? ✨");
  }

  async function handoff(onComplete) {
    if (finished) return;
    finished = true;
    state = "handoff";
    stage.classList.add("is-suspense");
    conceal(panel);
    conceal(actions);
    await wait(1250);
    stage.classList.add("is-exiting");
    await wait(700);
    stage.hidden = true;
    if (typeof onComplete === "function") onComplete();
  }

  function handleYes() {
    if (state === "intro-question") showNothingPrank();
    else if (state === "wait-question") showCakeIntro();
    else if (state === "post-video-question") handoff(completeCallback);
  }

  async function handleNo(event) {
    event.preventDefault();
    if (state === "intro-question" || state === "wait-question") {
      moveNoButton(event);
      return;
    }

    if (state === "post-video-question") {
      if (postVideoNoClicks === 0) {
        postVideoNoClicks = 1;
        copy.innerHTML = `NO? Teri marzi kab se chalne lagi? 💀😂<span style="display:block;font-size:clamp(0.85rem,2.2vw,1.1rem);font-family:system-ui,sans-serif;font-weight:500;letter-spacing:0.04em;margin-top:0.85rem;opacity:0.85;text-shadow:none;">Choose Yes or No to move next</span>`;
      } else if (postVideoNoClicks === 1) {
        postVideoNoClicks = 2;
        state = "post-video-final";
        conceal(actions);
        actions.hidden = true;
        copy.innerHTML = `pata hi cc tera minu .<br />wait ! i will do now myself`;
        await wait(5000);
        await runLoader(FIRST_LOADING_MS);
        await handoff(completeCallback);
      }
    }
  }

  function bindListeners(onComplete) {
    if (listenersBound) return;
    listenersBound = true;
    completeCallback = onComplete;
    yes.addEventListener("click", handleYes);
    no.addEventListener("pointerenter", (event) => {
      if (state === "intro-question" || state === "wait-question") moveNoButton(event);
    });
    no.addEventListener("pointerdown", (event) => {
      if (state === "intro-question" || state === "wait-question") {
        event.preventDefault();
        moveNoButton(event);
      }
    });
    no.addEventListener("click", handleNo);
    video.addEventListener("ended", showPostVideoQuestion, { once: true });
  }

  return {
    start(onComplete) {
      if (running) return;
      running = true;
      bindListeners(onComplete);
      stage.hidden = false;
      requestAnimationFrame(() => {
        stage.classList.add("is-visible");
        state = "intro-question";
        showQuestion("You really thought it was a error 😂😂! Choose an option if want to see what I made for you? ✨");
      });
    },
  };
}
