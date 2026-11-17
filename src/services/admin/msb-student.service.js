import { postBlobRequest, postRequest } from "../api.request";

/** MSB CSV students — separate from /student/udise/* */
export const fetchMsbCsvStudents = async (body) =>
  await postRequest("/student/msb/fetch-csv", body);

export const previewMsbPdf = async (body) =>
  await postBlobRequest("/student/msb/preview", body);
