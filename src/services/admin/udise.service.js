import { postBlobRequest, postRequest } from "../api.request";

export const getUdiseStudents = async (body) =>
  await postRequest("/student/udise/list", body);

export const getUdisePreviewData = async (body) =>
  await postRequest("/student/udise/preview-data", body);

export const previewUdisePdf = async (body) =>
  await postBlobRequest("/student/udise/preview", body);

export const previewUdisePdfV2 = async (body) =>
  await postBlobRequest("/student/udise/preview-v2", body);

export const exportUdise = async (body) =>
  await postBlobRequest("/student/udise/udise_export", body);

export const exportUdiseV3 = async (body) =>
  await postBlobRequest("/student/udise/udise_export_v3", body);
