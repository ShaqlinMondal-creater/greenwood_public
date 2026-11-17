import { postRequest } from "../api.request";

const COLLECTION_REPORT_PATH = "/collection_report";

/**
 * Collection Report — class-wise collection retrieve.
 * Request: { ay_id?, cg_id? | cg_ids?, fee_status, date_from?, date_to?, offset, limit }
 * Response data row includes others_detail: [{ fee_name, fee_count, amount }]
 */
export const getCollectionReport = async (body) =>
  await postRequest(`${COLLECTION_REPORT_PATH}/retrieve`, body);

/**
 * Generate Collection Report PDF (same filters as retrieve, no paging).
 * Also backed by /revenue_collected_new
 */
export const generateCollectionReportPdf = async (body) =>
  await postRequest(`${COLLECTION_REPORT_PATH}/generate_pdf`, body);
