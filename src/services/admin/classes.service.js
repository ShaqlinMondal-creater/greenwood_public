import { getRequest, postRequest, deleteRequest } from "../api.request";
import classesJson from "../../demo-data/classes.json";

const CLASS_GROUP_PATH = "/class_group";
const TEACHERS_PATH = "/teacher";

const wait = (ms = 80) => new Promise((resolve) => setTimeout(resolve, ms));

const demoClasses = async (body = {}) => {
  await wait();
  let rows = [...(classesJson.data || [])];
  if (body.ay_id) {
    rows = rows.filter((c) => Number(c.ay_id) === Number(body.ay_id));
  }
  return {
    code: 200,
    status: true,
    message: "OK",
    data: rows,
    total: rows.length,
  };
};

// class group apis

export const getAllClassGroup = async (body) => demoClasses(body);

// Full class list for a year (no pagination / term filter) — used to copy names.
export const getClassGroupsByYear = async (body) => demoClasses(body);

export const createClassGroup = async (body) =>
  await postRequest(`${CLASS_GROUP_PATH}/register`, body);

export const updateClassGroup = async (body) =>
  await postRequest(`${CLASS_GROUP_PATH}/register`, body);

export const deleteClassGroup = async (body) =>
  await deleteRequest(`${CLASS_GROUP_PATH}/${body?.id}`);

// teacher api

export const getTeachers = async () => await getRequest(`${TEACHERS_PATH}/get`);
