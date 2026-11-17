/** Same-month monthly + taekwondo can be paid independently. Sequence is per type. */

/** ACTIVE CISCE COUNCIL PHYSICAL ASSESSMENT must be selected before other fees. */
export const isMandatoryPriorityFee = (row) => {
  const name = String(row?.fpp_name || "").toUpperCase();
  if (!name) return false;

  return (
    name.includes("PHYSICAL ASSESSMENT") ||
    (name.includes("ACTIVE CISCE") && name.includes("PHYSICAL"))
  );
};

export const getMandatoryPriorityFees = (rows) =>
  (rows || []).filter(isMandatoryPriorityFee);

export const getPendingFeeGroup = (row) => {
  if (
    row?.fee_group === "taekwondo" ||
    row?.fee_group === "monthly" ||
    row?.fee_group === "optional"
  ) {
    return row.fee_group;
  }

  const name = String(row?.fpp_name || "").toUpperCase();
  if (name.includes("TAEKWONDO")) {
    return "taekwondo";
  }

  return row?.is_compulsory === "1" ? "monthly" : "optional";
};

export const isSequentialFeeGroup = (group) =>
  group === "monthly" || group === "taekwondo";

/** Academic year: Apr=1 … Mar=12 */
const academicMonthOrder = (monthNo) => {
  const month = Number(monthNo);
  if (!month || month < 1 || month > 12) {
    return 99;
  }
  return month >= 4 ? month - 3 : month + 9;
};

export const getPendingFeeMonth = (row) => {
  const month = Number(row?.fpp_month_no);
  if (month >= 1 && month <= 12) {
    return month;
  }
  return 0;
};

export const sequentialGroupRows = (rows, group) =>
  (rows || [])
    .filter((row) => getPendingFeeGroup(row) === group)
    .slice()
    .sort((a, b) => {
      const monthDiff =
        academicMonthOrder(getPendingFeeMonth(a)) -
        academicMonthOrder(getPendingFeeMonth(b));
      if (monthDiff !== 0) {
        return monthDiff;
      }
      return String(a?.fpp_due_date || "").localeCompare(
        String(b?.fpp_due_date || "")
      );
    });

export const isPendingFeeDisabled = (row, rows, selectedRowIds) => {
  const mandatoryFees = getMandatoryPriorityFees(rows);
  if (mandatoryFees.length > 0 && !isMandatoryPriorityFee(row)) {
    const allMandatorySelected = mandatoryFees.every((fee) =>
      selectedRowIds.includes(fee.id),
    );
    if (!allMandatorySelected) {
      return true;
    }
  }

  const group = getPendingFeeGroup(row);
  if (!isSequentialFeeGroup(group)) {
    return false;
  }

  const groupRows = sequentialGroupRows(rows, group);
  const currentIndex = groupRows.findIndex((item) => item.id === row.id);
  if (currentIndex <= 0) {
    return false;
  }

  return !selectedRowIds.includes(groupRows[currentIndex - 1]?.id);
};

export const idsToUnselectInGroup = (row, rows) => {
  // Unchecking mandatory CISCE fee also clears all other selected fees
  if (isMandatoryPriorityFee(row)) {
    return (rows || []).map((item) => item.id);
  }

  const group = getPendingFeeGroup(row);
  if (!isSequentialFeeGroup(group)) {
    return [row.id];
  }

  const groupRows = sequentialGroupRows(rows, group);
  const currentIndex = groupRows.findIndex((item) => item.id === row.id);
  if (currentIndex < 0) {
    return [row.id];
  }

  return groupRows.slice(currentIndex).map((item) => item.id);
};
