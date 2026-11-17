import { getRequest, postRequest, patchRequest } from "./api.request";

const NEW_ADMISSION_PATH = "/admission";
const ADMISSION_CLASSES_PATH = "/admission_classes";
const NEW_ADMISSION_CLASSES_PATH = "/new-admission-classes";

export const newAdmission = async (body) =>
  await postRequest(`${NEW_ADMISSION_PATH}`, body, true);

export const checkApplicationStatus = async (params) =>
  await getRequest(`${NEW_ADMISSION_PATH}/check/${params.applicationNo}`);

export const getPaymentStatus = async (body) =>
  await getRequest(`${NEW_ADMISSION_PATH}/confirmation/${body?.txn_id}`);

export const getAdmissionInstructions = async () =>
  await getRequest(`${NEW_ADMISSION_PATH}/instructions`);

export const getAdmissionClasses = async () =>
  await getRequest(`${ADMISSION_CLASSES_PATH}`);

export const updateAdmissionClassStatus = async (id, body) =>
  await patchRequest(`${NEW_ADMISSION_CLASSES_PATH}/${id}/status`, body);

export const getAdmissionStatus = async (body = {}) =>
  await getRequest(`${NEW_ADMISSION_PATH}/tabulation`, {
    ...(body?.ay_id ? { ay_id: body.ay_id } : {}),
  });

export const getAdmittedClassStatus = async (body = {}) =>
  await getRequest(`${NEW_ADMISSION_PATH}/class_admitted`, {
    ...(body?.ay_id ? { ay_id: body.ay_id } : {}),
  });

export const getLastRollNumbers = async (body = {}) =>
  await getRequest(`${NEW_ADMISSION_PATH}/last_rolls_preview`, {
    ...(body?.ay_id ? { ay_id: body.ay_id } : {}),
  });
