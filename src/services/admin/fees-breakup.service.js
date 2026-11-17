import { postRequest } from "../api.request";

const FEES_BREAKUP_PATH = "/fee_revenue_breakup";

export const getFeeRevenueBreakups = async (body) =>
  await postRequest(`${FEES_BREAKUP_PATH}/retrieve`, body);

export const updateFeeRevenueBreakup = async (id, body) =>
  await postRequest(`${FEES_BREAKUP_PATH}/update/${id}`, body);

export const copyFeeStructureYear = async (body) =>
  await postRequest(`${FEES_BREAKUP_PATH}/copy_year`, body);

export const copyFeeStructureClasses = async (body) =>
  await postRequest(`${FEES_BREAKUP_PATH}/copy_classes`, body);
