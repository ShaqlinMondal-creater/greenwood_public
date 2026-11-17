import dashboardJson from "../../demo-data/dashboard.json";

const wait = (ms = 80) => new Promise((resolve) => setTimeout(resolve, ms));

export const getFeeStats = async () => {
  await wait();
  return dashboardJson.fees;
};

export const getStudentStats = async () => {
  await wait();
  return dashboardJson.students;
};

export const getTransactionStats = async () => {
  await wait();
  return dashboardJson.transactions;
};
