import authJson from "../demo-data/auth.json";

const wait = (ms = 80) => new Promise((resolve) => setTimeout(resolve, ms));

/** Demo login — any credentials succeed; never hits Sanctum / live API. */
export const loginApi = async () => {
  await wait();
  return {
    ...authJson,
    message: "Demo login success",
  };
};

export const loginAsStudentApi = async () => {
  await wait();
  return {
    ...authJson,
    message: "Demo login success",
  };
};
