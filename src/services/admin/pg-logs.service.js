import { getRequest, postRequest } from "../api.request";

const PG_LOGS_PATH = "/pg-logs";

export const getPgLogs = async (body) =>
  await postRequest(`${PG_LOGS_PATH}/list`, body);

export const getStudentPgLogs = async (body) =>
  await postRequest(`${PG_LOGS_PATH}/student-list`, body);

export const getPgLogDetail = async (id) =>
  await getRequest(`${PG_LOGS_PATH}/${id}`);

export const getCreditReport = async (body) =>
  await postRequest(`${PG_LOGS_PATH}/credit-report`, body);

export const getCreditReportDay = async (body) =>
  await postRequest(`${PG_LOGS_PATH}/credit-report/day`, body);
