import { getRequest, postRequest } from "../api.request";

const ACTION_LOGS_PATH = "/action-logs";

export const getActionLogs = async (body) =>
  await postRequest(`${ACTION_LOGS_PATH}/list`, body);

export const getActionLogDetail = async (id) =>
  await getRequest(`${ACTION_LOGS_PATH}/${id}`);
