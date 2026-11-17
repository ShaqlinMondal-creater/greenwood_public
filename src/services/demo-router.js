/**
 * Offline demo API router — every module uses local JSON.
 * Live school API is never called while DEMO_MODE is on in api.request.js.
 */
import authJson from "../demo-data/auth.json";
import academicYearsJson from "../demo-data/academic-years.json";
import dashboardJson from "../demo-data/dashboard.json";
import bankPayoutDaysJson from "../demo-data/bank-payout-days.json";
import bankPayoutDayDetailsJson from "../demo-data/bank-payout-day-details.json";
import bankPayoutFeesPreviewJson from "../demo-data/bank-payout-fees-preview.json";
import studentsJson from "../demo-data/students.json";
import classesJson from "../demo-data/classes.json";
import teachersJson from "../demo-data/teachers.json";
import usersJson from "../demo-data/users.json";
import newAdmissionsJson from "../demo-data/new-admissions.json";
import feesJson from "../demo-data/fees.json";
import accountsJson from "../demo-data/accounts.json";
import optionsJson from "../demo-data/options.json";

const delay = (ms = 60) => new Promise((resolve) => setTimeout(resolve, ms));

const ok = (data = [], extra = {}) => ({
  code: 200,
  status: true,
  message: "Demo OK",
  data,
  total: Array.isArray(data) ? data.length : undefined,
  count: Array.isArray(data) ? data.length : undefined,
  total_records: Array.isArray(data) ? data.length : undefined,
  ...extra,
});

const mutateOk = (message = "Demo saved.") =>
  ok({ saved: true }, { message });

const normalizePath = (path = "") => {
  const bare = String(path).split("?")[0];
  return bare.startsWith("/") ? bare : `/${bare}`;
};

const paginate = (rows, body = {}) => {
  const list = Array.isArray(rows) ? rows : [];
  const total = list.length;
  const offset = Number(body.offset) || 0;
  const limit = Number(body.limit) || total || 20;
  return ok(list.slice(offset, offset + limit), {
    total,
    count: total,
    total_records: total,
  });
};

/** Minimal valid PDF for demo downloads / new-tab open. */
export const createDemoPdfBlob = (title = "Demo Report") => {
  const text = String(title).replace(/[()\\]/g, " ");
  const content = `BT /F1 18 Tf 50 750 Td (${text}) Tj ET`;
  const objects = [
    "1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n",
    "2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n",
    "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj\n",
    `4 0 obj<< /Length ${content.length} >>stream\n${content}\nendstream\nendobj\n`,
    "5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((obj) => {
    offsets.push(pdf.length);
    pdf += obj;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefStart}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
};

export const createDemoPdfFileUrl = (title) =>
  URL.createObjectURL(createDemoPdfBlob(title));

const pdfOk = (title = "Demo Report") =>
  ok({ file_url: createDemoPdfFileUrl(title) }, { message: "Demo report generated." });

const isReadLike = (path) =>
  /\/(view|list|get|details|options|modes|fetch|retrieve|preview|day|days|profile|confirmation|instructions|tabulation|dashboard|category|units|currency|master_list|distinct_list|house|blood|modules|term|class_admitted|last_rolls|payment_details|optional_details|get_roll|student-list|student-details|class_fm|aggregate|audit-compare)(\/|$)/i.test(
    path
  ) ||
  /\/(view_all|one_time|view\/|print\/|get\/)/i.test(path);

const isMutate = (path) => {
  if (isReadLike(path)) return false;
  return (
    /\/(register|update|create|delete|export|upload|apply|change_class$|upgrade|off_roll|set_|add|send|record|copy|correct|print|generate|import|fetch-csv|compress|addToSchool|add-money|current$)/i.test(
      path
    ) ||
    path.includes("/export") ||
    path.endsWith("/print") ||
    path.includes("/pdf")
  );
};

const isPdfPath = (path) =>
  /pdf|print|export|preview|compress|udise_export|day-pdf/i.test(path);

/* -------------------- Bank payouts -------------------- */
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

const handleBankPayouts = (path, body = {}) => {
  if (path === "/ccavenue-payouts/days") {
    const all = bankPayoutDaysJson.data || [];
    const filtered = filterDaysByRange(all, body.date_from, body.date_to);
    return {
      ...bankPayoutDaysJson,
      data: filtered,
      summary: buildDaysSummary(filtered, bankPayoutDaysJson.summary || {}),
    };
  }
  if (path === "/ccavenue-payouts/day") {
    return (
      bankPayoutDayDetailsJson[body.date] ||
      ok([], {
        summary: {
          school_count: 0,
          school_amount: 0,
          cc_count: 0,
          cc_amount: 0,
          next_payouts: [],
          payout_dues: [],
        },
      })
    );
  }
  if (path === "/ccavenue-payouts/fees-preview") return bankPayoutFeesPreviewJson;
  if (
    path === "/ccavenue-payouts/settlement-pdf" ||
    path === "/ccavenue-payouts/class-pdf" ||
    path === "/ccavenue-payouts/fees-pdf"
  ) {
    return pdfOk("Demo Report");
  }
  if (path === "/ccavenue-payouts/import") {
    return ok({ payouts: 12, transactions: 48 }, { message: "Demo import accepted." });
  }
  if (path.startsWith("/ccavenue-payouts")) {
    return isPdfPath(path) ? pdfOk("Demo Payout Report") : mutateOk();
  }
  return null;
};

/* -------------------- Students / classes -------------------- */
const filterStudents = (body = {}) => {
  let rows = [...(studentsJson.data || [])];
  if (body.ay_id) rows = rows.filter((s) => Number(s.ay_id) === Number(body.ay_id));
  if (body.stExternal !== undefined && body.stExternal !== "" && body.stExternal !== "%") {
    rows = rows.filter((s) => String(s.st_external) === String(body.stExternal));
  }
  if (body.st_on_roll !== undefined && body.st_on_roll !== "" && body.st_on_roll !== "%") {
    rows = rows.filter((s) => String(s.st_on_roll) === String(body.st_on_roll));
  }
  if (body.is_promoted !== undefined && body.is_promoted !== "" && body.is_promoted !== "%") {
    rows = rows.filter((s) => String(s.is_promoted) === String(body.is_promoted));
  }
  if (body.bohra !== undefined && body.bohra !== "") {
    rows = rows.filter((s) => String(s.bohra) === String(body.bohra));
  }
  if (body.gender) {
    rows = rows.filter(
      (s) => String(s.st_gender).toUpperCase() === String(body.gender).toUpperCase()
    );
  }
  if (body.cg_id) {
    const ids = String(body.cg_id)
      .split(",")
      .map((x) => String(x).trim())
      .filter(Boolean);
    if (ids.length) rows = rows.filter((s) => ids.includes(String(s.cg_id)));
  }
  if (body.search) {
    const q = String(body.search).toLowerCase();
    rows = rows.filter((s) => {
      const name = `${s.st_first_name || ""} ${s.st_last_name || ""}`.toLowerCase();
      return name.includes(q) || String(s.st_roll_no || "").toLowerCase().includes(q);
    });
  }
  if (body.parent_search) {
    const q = String(body.parent_search).toLowerCase();
    rows = rows.filter(
      (s) =>
        String(s.father_name || "").toLowerCase().includes(q) ||
        String(s.mother_name || "").toLowerCase().includes(q)
    );
  }
  if (body.dob_from) rows = rows.filter((s) => s.st_dob && s.st_dob >= body.dob_from);
  if (body.dob_to) rows = rows.filter((s) => s.st_dob && s.st_dob <= body.dob_to);
  return paginate(rows, body);
};

const datasetForPath = (path) => {
  if (path.includes("scholarship")) return optionsJson.scholarship || [];
  if (path.includes("concession")) return optionsJson.concession_students || [];
  if (path.includes("teacher")) return teachersJson.data || [];
  if (path.includes("user")) return usersJson.data || [];
  if (path.includes("admission")) return newAdmissionsJson.data || [];
  if (path.includes("class_group") || path.includes("/class")) return classesJson.data || [];
  if (path.includes("debit")) return accountsJson.debit || [];
  if (path.includes("credit-note") || path.includes("/credit")) return accountsJson.credit || [];
  if (path.includes("/bank")) return accountsJson.bank || [];
  if (path.includes("pg-log")) return optionsJson.pg_logs || [];
  if (path.includes("action-log")) return optionsJson.action_logs || [];
  if (path.includes("certificate")) return optionsJson.certificates || [];
  if (path.includes("subject") || path.includes("remarks")) return optionsJson.subjects || [];
  if (path.includes("supplier")) return optionsJson.procurement_suppliers || [];
  if (path.includes("purchase") || path.includes("/item") || path.includes("procurement")) {
    return optionsJson.procurement_products || [];
  }
  if (path.includes("fee_plan")) return optionsJson.fee_plans || [];
  if (path.includes("transaction") || path.includes("payment-attempt")) {
    return feesJson.transactions || [];
  }
  if (path.includes("fee") || path.includes("student")) return feesJson.data || studentsJson.data || [];
  return [
    { id: 1, name: "Demo record", label: "Offline demo", status: "ok", amount: 1000 },
    { id: 2, name: "Demo record 2", label: "Offline demo", status: "ok", amount: 2500 },
  ];
};

const handleCore = (path, body = {}) => {
  if (path === "/login" || path === "/login_as_student") return authJson;

  if (path === "/dashboard") return dashboardJson.students;
  if (path === "/dashboardtransactions") return dashboardJson.transactions;
  if (path === "/dashboardfee") return dashboardJson.fees;
  if (path === "/dashboard_student") {
    return ok({
      name: "Demo Student",
      pending_fees: 12500,
      paid_fees: 45000,
      class_name: "5th A",
      roll_no: "2505101",
    });
  }

  if (path.startsWith("/academic_year")) {
    if (isMutate(path) || path === "/academic_year") return mutateOk("Academic year updated (demo).");
    return academicYearsJson;
  }

  // Scholarship before generic student routes
  if (path.includes("/scholarship")) {
    if (isPdfPath(path) || path.includes("compress") || path.includes("preview")) {
      return pdfOk("Demo Scholarship File");
    }
    if (isMutate(path)) return mutateOk("Scholarship updated (demo).");
    return paginate(optionsJson.scholarship || [], body);
  }

  if (path === "/student/view") return filterStudents(body);
  if (path.startsWith("/student/view/")) {
    const id = path.split("/").pop();
    const student = (studentsJson.data || []).find((s) => String(s.id) === String(id));
    return student ? ok(student) : { code: 404, status: false, message: "Not found", data: null };
  }
  if (path === "/student/change_class/options") {
    return ok(classesJson.data || []);
  }
  if (path === "/student/files" || path === "/student/report_cards") {
    return ok([
      { id: 1, name: "Birth Certificate", type: "pdf", url: "#" },
      { id: 2, name: "Report Card Term 1", type: "pdf", url: "#" },
    ]);
  }
  if (path === "/student/pending_fees" || path === "/student/fees_pending") {
    return paginate(
      (feesJson.data || []).filter((f) => f.status !== "paid"),
      body
    );
  }
  if (path === "/student/paid_fees") {
    return paginate(
      (feesJson.data || []).filter((f) => f.status === "paid"),
      body
    );
  }
  if (path === "/student/concession_students") {
    return paginate(optionsJson.concession_students || [], body);
  }
  if (path === "/student/concession_students/fees") {
    return paginate(feesJson.data || [], body);
  }
  if (path === "/student/udise/list" || path === "/student/udise/preview-data") {
    return paginate(studentsJson.data || [], body);
  }
  if (path.startsWith("/student/udise/")) {
    return isPdfPath(path) ? pdfOk("Demo UDISE Export") : paginate(studentsJson.data || [], body);
  }
  if (path.startsWith("/student/msb/")) {
    return isPdfPath(path)
      ? pdfOk("Demo MSB Preview")
      : ok({ rows: studentsJson.data || [] }, { message: "Demo MSB data." });
  }
  if (path === "/student/profile") {
    return ok(studentsJson.data?.[0] || {});
  }
  if (path.startsWith("/student/")) {
    if (isPdfPath(path)) return pdfOk("Demo Student Report");
    if (isMutate(path)) return mutateOk();
    return filterStudents(body);
  }

  if (path === "/class_group/view" || path === "/class_group/view_all") {
    let rows = [...(classesJson.data || [])];
    if (body.ay_id) rows = rows.filter((c) => Number(c.ay_id) === Number(body.ay_id));
    return paginate(rows, body);
  }
  if (path.startsWith("/class_group")) {
    return isMutate(path) ? mutateOk() : paginate(classesJson.data || [], body);
  }

  if (path === "/admission_classes" || path.startsWith("/new-admission-classes")) {
    return ok([
      { id: 1, name: "Nursery" },
      { id: 2, name: "LKG" },
      { id: 3, name: "UKG" },
      { id: 4, name: "1st" },
    ]);
  }
  if (path === "/new_admission/view" || path === "/admission") {
    return paginate(newAdmissionsJson.data || [], body);
  }
  if (path.startsWith("/new_admission/view/")) {
    const id = path.split("/").pop();
    const row = (newAdmissionsJson.data || []).find((a) => String(a.id) === String(id));
    return row ? ok(row) : ok({});
  }
  if (path.includes("/get_roll_no")) {
    return ok({ roll_no: "2509999", next_roll: "2509999" });
  }
  if (path.includes("/payment_details")) {
    return ok({
      amount: 15000,
      status: "paid",
      mode: "Offline",
      txn_id: "TXN-DEMO-ADMISSION",
      paid_at: "2025-11-01 12:00:00",
    });
  }
  if (path.includes("/optional_details")) {
    if (isMutate(path) && !path.match(/optional_details\/\d+$/)) return mutateOk();
    return ok({
      blood_group: "B+",
      previous_school: "Demo Primary School",
      address: "12 Lake Road, Demo City",
    });
  }
  if (path.includes("/new_admission") || path.includes("/admission")) {
    if (isPdfPath(path)) return pdfOk("Demo Admission Report");
    if (isMutate(path)) return mutateOk();
    return paginate(newAdmissionsJson.data || [], body);
  }

  if (path === "/teacher/view" || path === "/teacher/get") {
    return paginate(teachersJson.data || [], body);
  }
  if (path.startsWith("/teacher/view/")) {
    const id = path.split("/").pop();
    const row = (teachersJson.data || []).find((t) => String(t.id) === String(id));
    return row ? ok(row) : ok({});
  }
  if (path.includes("/teacher_attendance")) {
    if (isMutate(path)) return mutateOk();
    return ok(
      (teachersJson.data || []).map((t) => ({
        teacher_id: t.id,
        name: t.name,
        status: "present",
        date: body.date || "2025-11-10",
      }))
    );
  }
  if (path.startsWith("/teacher")) {
    return isMutate(path) ? mutateOk() : paginate(teachersJson.data || [], body);
  }

  if (path === "/users/fetch_users") return paginate(usersJson.data || [], body);
  if (path.startsWith("/users/fetch_users/")) {
    const id = path.split("/").pop();
    const row = (usersJson.data || []).find((u) => String(u.id) === String(id));
    return row ? ok(row) : ok(usersJson.data?.[0] || {});
  }
  if (path === "/users/modules") return ok(usersJson.modules || []);
  if (path === "/users/house-options") return ok(optionsJson.houses || []);
  if (path === "/users/blood-groups") return ok(optionsJson.blood_groups || []);
  if (path.startsWith("/users")) {
    return isMutate(path) ? mutateOk("Password / user updated (demo).") : paginate(usersJson.data || [], body);
  }

  if (path.includes("/fee_plan_period")) {
    return isMutate(path) ? mutateOk() : paginate(optionsJson.fee_plan_periods || [], body);
  }
  if (path.includes("/fee_plan")) {
    return isMutate(path) ? mutateOk() : paginate(optionsJson.fee_plans || [], body);
  }

  if (path === "/fee/view_all" || path === "/fee/one_time") {
    return paginate(feesJson.data || [], body);
  }
  if (path.startsWith("/fee/confirmation/") || path.startsWith("fee/confirmation/")) {
    return ok({ txn_id: path.split("/").pop(), status: "success", amount: 7000 });
  }
  if (path.includes("/fee_revenue_breakup") || path.includes("/collection_report")) {
    return isPdfPath(path)
      ? pdfOk("Demo Collection Report")
      : ok({
          total: 4856200,
          lines: feesJson.data || [],
          period: "Demo period",
          classes: classesJson.data || [],
        });
  }
  if (path.startsWith("/fee") || path === "test-fees") {
    return isPdfPath(path) ? pdfOk("Demo Fees Report") : isMutate(path) ? mutateOk() : paginate(feesJson.data || [], body);
  }

  if (path === "/transactions/payment-attempts") {
    return paginate(feesJson.payment_attempts || [], body);
  }
  if (
    path === "/transactions/all" ||
    path === "/transactions/records" ||
    path === "/transactions/student" ||
    path === "/transactions/admin_transactions"
  ) {
    if (path === "/transactions/admin_transactions") {
      return paginate(accountsJson.cash_received || [], body);
    }
    return paginate(feesJson.transactions || [], body);
  }
  if (path === "/transactions/modes") return ok(feesJson.modes || []);
  if (path.startsWith("/transactions") || path === "/transfer_amount") {
    return isPdfPath(path) ? pdfOk("Demo TXN Export") : isMutate(path) ? mutateOk() : paginate(feesJson.transactions || [], body);
  }

  if (path.startsWith("/debit-note")) {
    return isPdfPath(path)
      ? pdfOk("Demo Debit Voucher")
      : isMutate(path)
        ? mutateOk()
        : paginate(accountsJson.debit || [], body);
  }
  if (path.startsWith("/credit-note")) {
    return isPdfPath(path)
      ? pdfOk("Demo Credit Voucher")
      : isMutate(path)
        ? mutateOk()
        : paginate(accountsJson.credit || [], body);
  }
  if (path.startsWith("/bank")) {
    return isMutate(path) ? mutateOk() : paginate(accountsJson.bank || [], body);
  }

  if (path.includes("/pg-logs") || path.includes("/credit-report")) {
    if (path.includes("credit-report")) return paginate(optionsJson.credit_reports || [], body);
    if (path.match(/\/pg-logs\/\d+$/)) {
      const row = (optionsJson.pg_logs || []).find((r) => String(r.id) === path.split("/").pop());
      return ok(row || optionsJson.pg_logs?.[0] || {});
    }
    return paginate(optionsJson.pg_logs || [], body);
  }
  if (path.includes("/action-logs")) {
    if (path.match(/\/action-logs\/\d+$/)) {
      const row = (optionsJson.action_logs || []).find((r) => String(r.id) === path.split("/").pop());
      return ok(row || optionsJson.action_logs?.[0] || {});
    }
    return paginate(optionsJson.action_logs || [], body);
  }

  if (path.includes("/transfer_certificate") || path.includes("character_certificate")) {
    return isPdfPath(path)
      ? pdfOk("Demo Certificate")
      : isMutate(path)
        ? mutateOk()
        : paginate(optionsJson.certificates || [], body);
  }
  if (path === "/terms") return ok(optionsJson.terms || []);
  if (path.includes("/subject")) {
    if (path.includes("remarks")) {
      return isPdfPath(path)
        ? pdfOk("Demo Remarks")
        : isMutate(path)
          ? mutateOk()
          : paginate(optionsJson.remarks || [], body);
    }
    return isMutate(path) ? mutateOk() : paginate(optionsJson.subjects || [], body);
  }
  if (path.includes("/marks") || path.includes("/admit_card") || path.includes("/reports/")) {
    return isPdfPath(path)
      ? pdfOk("Demo Report Card")
      : ok({
          students: studentsJson.data || [],
          subjects: optionsJson.subjects || [],
          terms: optionsJson.terms || [],
        });
  }

  if (path.includes("/item") || path.includes("/procurement")) {
    if (path.includes("category")) return ok(["Stationery", "Science", "Sports"]);
    if (path.includes("dashboard")) {
      return ok({ products: 3, suppliers: 2, invoices: 2, stock_value: 48500 });
    }
    return isMutate(path) ? mutateOk() : paginate(optionsJson.procurement_products || [], body);
  }
  if (path.includes("/supplier")) {
    return isMutate(path) ? mutateOk() : paginate(optionsJson.procurement_suppliers || [], body);
  }
  if (path.includes("/purchase")) {
    if (path.includes("units")) return ok(["Box", "Pack", "Set", "Pcs"]);
    if (path.includes("currency")) return ok(["INR", "USD"]);
    return isMutate(path) ? mutateOk() : paginate(optionsJson.purchase_invoices || [], body);
  }

  if (path.startsWith("/retry-reconcile")) {
    return mutateOk("Reconcile queued (demo).");
  }

  return null;
};

/**
 * Route any request to local demo JSON.
 */
export async function resolveDemoRequest(method, path, body = {}) {
  await delay();
  const normalized = normalizePath(path);
  const upper = String(method || "GET").toUpperCase();

  const payout = handleBankPayouts(normalized, body || {});
  if (payout) return payout;

  const core = handleCore(normalized, body || {});
  if (core) return core;

  if (upper === "DELETE" || upper === "PUT" || upper === "PATCH") {
    return mutateOk();
  }

  if (isPdfPath(normalized)) {
    return pdfOk("Demo Report");
  }

  if (isMutate(normalized) && upper !== "GET") {
    return mutateOk();
  }

  // Never leave a module empty — return the closest demo dataset.
  return paginate(datasetForPath(normalized), body || {});
}

export async function resolveDemoBlobRequest(path, body = {}) {
  await delay();
  const normalized = normalizePath(path);
  const title =
    normalized.includes("day-pdf")
      ? `Demo Daily Report ${body?.date || ""}`
      : normalized.includes("scholarship")
        ? "Demo Scholarship File"
        : normalized.includes("udise")
          ? "Demo UDISE Export"
          : "Demo Report";
  return { data: createDemoPdfBlob(title), status: 200 };
}
