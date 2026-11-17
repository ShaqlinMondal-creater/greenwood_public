const ROMAN_CLASS = [
  ["XII", 12],
  ["XI", 11],
  ["IX", 9],
  ["VIII", 8],
  ["VII", 7],
  ["VI", 6],
  ["IV", 4],
  ["III", 3],
  ["II", 2],
  ["X", 10],
  ["V", 5],
  ["I", 1],
];

const romanClassNumber = (value) => {
  const n = String(value || "").toUpperCase().trim();
  for (const [roman, num] of ROMAN_CLASS) {
    if (n === roman || n.startsWith(`${roman} `) || n.startsWith(`${roman}-`)) {
      return num;
    }
  }
  return null;
};

export const classGroupSortRank = (name) => {
  const n = String(name || "")
    .toUpperCase()
    .replace(/\./g, "")
    .trim();

  if (!n) return 99;
  if (n.startsWith("NURSERY") || /\bNUR\b/.test(n)) return 1;
  if (n.startsWith("LKG")) return 2;
  if (n.startsWith("UKG")) return 3;
  if (n.startsWith("KG")) return 2;

  const classMatch = n.match(/^CLASS\s+(.+)$/);
  if (classMatch) {
    const rest = classMatch[1].trim();
    const roman = romanClassNumber(rest);
    if (roman) return roman + 3;
    const digits = rest.match(/^(\d+)/);
    if (digits) return Number(digits[1]) + 3;
  }

  const roman = romanClassNumber(n);
  if (roman) return roman + 3;

  const digits = n.match(/^(\d+)/);
  if (digits) return Number(digits[1]) + 3;

  return 99;
};

export const sortClassGroups = (list = []) =>
  [...list].sort((a, b) => {
    const rankDiff =
      classGroupSortRank(a?.cg_name) - classGroupSortRank(b?.cg_name);
    if (rankDiff !== 0) return rankDiff;
    return String(a?.cg_name || "").localeCompare(String(b?.cg_name || ""), undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });
