/**
 * Central configuration for the opening countdown.
 * Change the birthday target and visit messages here only.
 */

export const testMode = false;

export const BIRTHDAY = {
  year: 2026,
  month: 9,
  day: 7,
  hour: 0,
  minute: 0,
  second: 0,
  timeZone: "Asia/Karachi",
};

export const VISITOR = {
  storageKey: "noor_birthday_visit_count",
};

export const MESSAGES = {
  experienceWaiting: "A GREAT EXPERIENCE IS WAITING FOR YOU",
  unlockedPlaceholder: "Birthday unlocked. The full experience will live here.",
  testBirthdayPlaceholder: "HAPPY BIRTHDAY 🎉",
  entryButtonDefault: "ENTER TO VIEW AN EXPERIENCE",
  visitor: {
    1: "SO... YOU FINALLY MADE IT HERE 👀",
    2: "DON'T BE SO IMPATIENT 😭",
    3: "BRO... IT'S STILL NOT YOUR BIRTHDAY 😂",
    4: "YOU REALLY THOUGHT IT UNLOCKED? 💀",
    5: "YOU'RE REALLY CHECKING AGAIN? 😭",
    6: "THE PATIENCE LEVEL IS CONCERNING 😂",
    7: "AT THIS POINT, JUST WAIT FOR SEPTEMBER 7TH 🎂😂",
  },
};

export const PRANK_MESSAGES = {
  click1: "⚠️ Unexpected error detected... Please try again",
  click2: "🚨 Service unavailable! Something went seriously wrong... 😭",
  click3: "SERVICE CRASHED... TRY AGAIN",
};

export const REVEAL_MESSAGES = {
  message1: "HAPPY BIRTHDAY TO THE PRECIOUS PERSON OF MY LIFE",
  message2: "HAPPY BIRTHDAY NOOR ABBAS 🎂🎉",
};

export const CINEMATIC_MESSAGES = {
  firstMessage: "May your life always be filled with happiness, success, and beautiful moments. ✨ May every dream you carry in your heart find its way to you, and may you always have reasons to smile. 🤍🌙 Keep shining, keep growing, and keep being the amazing person you are. ✨ May this new year of your life bring you nothing but the best. 🎂❤️",
  secondMessage: "Once again, wishing you the happiest birthday of your life, my dear. ❤️✨",
  signature: "from : Ch Arman",
};

export function getVisitorMessage(visitCount) {
  if (visitCount <= 1) {
    return MESSAGES.visitor[1];
  }

  if (visitCount >= 7) {
    return MESSAGES.visitor[7];
  }

  return MESSAGES.visitor[visitCount];
}
