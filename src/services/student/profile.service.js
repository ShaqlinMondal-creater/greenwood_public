import { postRequest } from "../api.request";

export const getStudentProfile = async (body) =>
  await postRequest("/student/profile", body);

export const updateStudentProfile = async (body) =>
  await postRequest("/student/profile/update", body);
