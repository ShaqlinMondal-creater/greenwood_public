export const TERM_OPTIONS = [
  "Half Yearly",
  "Final Term",
  "Selection",
  "Pre Board",
];

export const TERM_PAIR_REGULAR = ["Half Yearly", "Final Term"];
export const TERM_PAIR_BOARD = ["Pre Board", "Selection"];

/**
 * Nursery-8, 10, 11 => Half Yearly + Final Term
 * Class 9, 12 => Pre Board + Selection
 */
export const getDefaultTermNamesForClass = (cgName = "") => {
  const upper = String(cgName || "").trim().toUpperCase();

  if (/\bXII\b/.test(upper) || /^12(\s|-|\()/.test(upper)) {
    return [...TERM_PAIR_BOARD];
  }

  if (/^9(\s|-|\()/.test(upper) || /\bCLASS\s*9\b/.test(upper)) {
    return [...TERM_PAIR_BOARD];
  }

  return [...TERM_PAIR_REGULAR];
};

export const toTermCheckboxState = (termNames = []) => ({
  "Half Yearly": termNames.includes("Half Yearly"),
  "Final Term": termNames.includes("Final Term"),
  Selection: termNames.includes("Selection"),
  "Pre Board": termNames.includes("Pre Board"),
});

export const fromTermCheckboxState = (state = {}) =>
  TERM_OPTIONS.filter((name) => Boolean(state?.[name]));

/**
 * Only one pair can be active at a time:
 * - Half Yearly + Final Term
 * - OR Pre Board + Selection
 * Mixed pairs are not allowed.
 */
export const toggleTermInExclusivePairs = (prevState = {}, termName, checked) => {
  const isRegular = TERM_PAIR_REGULAR.includes(termName);
  const isBoard = TERM_PAIR_BOARD.includes(termName);

  if (!isRegular && !isBoard) return prevState;

  if (checked) {
    if (isRegular) {
      return toTermCheckboxState(TERM_PAIR_REGULAR);
    }
    return toTermCheckboxState(TERM_PAIR_BOARD);
  }

  // Unchecking any term in the active pair clears that pair.
  return toTermCheckboxState([]);
};
