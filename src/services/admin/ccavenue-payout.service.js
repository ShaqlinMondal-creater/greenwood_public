import dayjs from "dayjs";
import bankPayoutDaysJson from "../../demo-data/bank-payout-days.json";
import bankPayoutDayDetailsJson from "../../demo-data/bank-payout-day-details.json";
import bankPayoutFeesPreviewJson from "../../demo-data/bank-payout-fees-preview.json";
import {
  createDemoPdfBlob,
  createDemoPdfFileUrl,
} from "../demo-router";

const wait = (ms = 80) => new Promise((resolve) => setTimeout(resolve, ms));

const filterDaysByRange = (days, dateFrom, dateTo) => {
  if (!dateFrom && !dateTo) return days;
  return days.filter((row) => {
    const d = row.payment_date;
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    return true;
  });
};

const buildDaysSummary = (days, fullSummary) => {
  const school_amount = days.reduce((s, r) => s + Number(r.school_amount || 0), 0);
  const cc_amount = days.reduce((s, r) => s + Number(r.cc_amount || 0), 0);
  const matched_days = days.filter((r) => r.result === "matched").length;
  return {
    ...fullSummary,
    days: days.length,
    matched_days,
    school_amount,
    cc_amount,
    school_credit: school_amount + Number(fullSummary.other_amount || 0),
  };
};

export const importCcAvenuePayout = async () => {
  await wait();
  return {
    code: 200,
    status: true,
    message: "Demo import accepted (no file persisted).",
    data: { payouts: 12, transactions: 48 },
  };
};

export const getCcAvenuePayoutDays = async (body = {}) => {
  await wait();
  const all = Array.isArray(bankPayoutDaysJson?.data) ? bankPayoutDaysJson.data : [];
  const filtered = filterDaysByRange(all, body.date_from, body.date_to);
  return {
    code: 200,
    status: true,
    message: "OK",
    data: filtered,
    summary: buildDaysSummary(filtered, bankPayoutDaysJson?.summary || {}),
  };
};

export const getCcAvenuePayoutDay = async (body = {}) => {
  await wait();
  const detail = bankPayoutDayDetailsJson?.[body.date];
  if (detail) {
    return {
      code: 200,
      status: true,
      message: "OK",
      data: Array.isArray(detail.data) ? detail.data : [],
      summary: detail.summary || {},
    };
  }
  return {
    code: 200,
    status: true,
    message: "No demo orders for this date.",
    data: [],
    summary: {
      school_count: 0,
      school_amount: 0,
      cc_count: 0,
      cc_amount: 0,
      next_payouts: [],
      payout_dues: [],
    },
  };
};

export const getCcAvenueFeesPreview = async () => {
  await wait();
  return {
    code: 200,
    status: true,
    message: "OK",
    data: bankPayoutFeesPreviewJson?.data || {},
  };
};

export const generateCcAvenueSettlementPdf = async () => {
  await wait();
  return {
    code: 200,
    status: true,
    message: "Demo report generated.",
    data: { file_url: createDemoPdfFileUrl("Demo Settlement Report") },
  };
};

export const generateCcAvenueClassPdf = async () => {
  await wait();
  return {
    code: 200,
    status: true,
    message: "Demo report generated.",
    data: { file_url: createDemoPdfFileUrl("Demo Class Report") },
  };
};

export const generateCcAvenueFeesPdf = async () => {
  await wait();
  return {
    code: 200,
    status: true,
    message: "Demo report generated.",
    data: { file_url: createDemoPdfFileUrl("Demo Fees Collection Report") },
  };
};

const dailyReportFileName = (date) =>
  `date_wise_collection_${dayjs(date).format("DD-MM-YYYY_HH-mm-ss")}.pdf`;

const triggerBrowserDownload = (blob, filename) => {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
};

export const generateCcAvenuePayoutDayPdf = async (body = {}) => {
  await wait();
  const fileName = dailyReportFileName(body?.date);
  const blob = createDemoPdfBlob(`Demo Daily Report ${body?.date || ""}`);
  triggerBrowserDownload(blob, fileName);
  return { code: 200, status: true, message: "Report downloaded." };
};
