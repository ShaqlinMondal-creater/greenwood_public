import { deleteRequest, getRequest, postRequest } from "../api.request";
import studentsJson from "../../demo-data/students.json";
import classesJson from "../../demo-data/classes.json";

const STUDENTS_PATH = "/student";
const CLASS_PATH = "/class_group";
const ACADEMIC_PATH = "/academic_year";
const BLOOD_GROUP_PATH = "/users/blood-groups";
const HOUSE_PATH = "/users/house-options";
const FEE_PLAN_PATH = "/fee_plan";
const NEW_ADMISSION_PATH = "/new_admission";

const wait = (ms = 80) => new Promise((resolve) => setTimeout(resolve, ms));

const filterDemoStudents = (body = {}) => {
  let rows = [...(studentsJson.data || [])];

  if (body.ay_id) {
    rows = rows.filter((s) => Number(s.ay_id) === Number(body.ay_id));
  }
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
    rows = rows.filter((s) => String(s.st_gender).toUpperCase() === String(body.gender).toUpperCase());
  }
  if (body.cg_id) {
    const ids = String(body.cg_id)
      .split(",")
      .map((x) => String(x).trim())
      .filter(Boolean);
    if (ids.length) {
      rows = rows.filter((s) => ids.includes(String(s.cg_id)));
    }
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
  if (body.dob_from) {
    rows = rows.filter((s) => s.st_dob && s.st_dob >= body.dob_from);
  }
  if (body.dob_to) {
    rows = rows.filter((s) => s.st_dob && s.st_dob <= body.dob_to);
  }

  const total = rows.length;
  const offset = Number(body.offset) || 0;
  const limit = Number(body.limit) || total || 10;
  const pageRows = rows.slice(offset, offset + limit);

  return {
    code: 200,
    status: true,
    message: "OK",
    data: pageRows,
    total,
    count: total,
    total_records: total,
  };
};

// students apis

export const getAllStudents = async (body) => {
  await wait();
  return filterDemoStudents(body || {});
};

export const getStudentById = async (body) => {
  await wait();
  const student = (studentsJson.data || []).find(
    (s) => Number(s.id) === Number(body?.id)
  );
  if (!student) {
    return { code: 404, status: false, message: "Demo student not found.", data: null };
  }
  return { code: 200, status: true, message: "OK", data: student };
};

export const exportStudents = async (body) =>
  await postRequest(`${STUDENTS_PATH}/export`, body); // to download the report

export const uploadStudentImage = async (body) =>
  await postRequest(`${STUDENTS_PATH}/upload`, body, true);

export const createStudent = async (body) =>
  await postRequest(`${STUDENTS_PATH}/register`, body);

export const createExternalStudent = async (body) =>
  await postRequest(`${STUDENTS_PATH}/register_external`, body);

export const checkStudentRoll = async (body) =>
  await postRequest(`${STUDENTS_PATH}/check_roll`, body);

export const updateStudent = async (id, body) =>
  await postRequest(`${STUDENTS_PATH}/update/${id}`, body);

export const upgradeStudent = async (body) =>
  await postRequest(`${STUDENTS_PATH}/upgrade`, body);

export const getChangeClassOptions = async (body) =>
  await postRequest(`${STUDENTS_PATH}/change_class/options`, body);

export const changeStudentClass = async (body) =>
  await postRequest(`${STUDENTS_PATH}/change_class`, body);

export const applyFeePlan = async (body) =>
  await postRequest(`${STUDENTS_PATH}/apply_fee`, body);

export const getAllPendingFees = async (body) =>
  await postRequest(`${STUDENTS_PATH}/pending_fees`, body);

export const getAllPaidFees = async (body) =>
  await postRequest(`${STUDENTS_PATH}/paid_fees`, body);

export const getAttachments = async (body) =>
  await postRequest(`${STUDENTS_PATH}/files`, body);

export const applyConcession = async (body) =>
  await postRequest(`${STUDENTS_PATH}/apply_concession`, body);

export const getConcessionStudents = async (body) =>
  await postRequest(`${STUDENTS_PATH}/concession_students`, body);

export const getConcessionStudentFees = async (body) =>
  await postRequest(`${STUDENTS_PATH}/concession_students/fees`, body);

export const offRollStudent = async (body) =>
  await postRequest(`${STUDENTS_PATH}/off_roll`, body);

export const updateCisceNo = async (body) =>
  await postRequest(`${STUDENTS_PATH}/update_cisce_no`, body);

export const updateStudentDetail = async (body) =>
  await postRequest(`${STUDENTS_PATH}/update_field`, body);

export const getStudentReportCards = async (body) =>
  await postRequest(`${STUDENTS_PATH}/report_cards`, body);

export const deleteFees = async (id) => await deleteRequest(`/fee/${id}`);

export const printFees = async (id) => await getRequest(`/fee/print/${id}`);

// other apis

export const getHouse = async () => await getRequest(HOUSE_PATH);

export const getBloodGroups = async () => await getRequest(BLOOD_GROUP_PATH);

export const getFeePlan = async (body) =>
  await postRequest(`${FEE_PLAN_PATH}/view`, body);

export const getClasses = async (body = {}) => {
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

export const marksGradeStatusChange = async (body) =>
  await postRequest(`${CLASS_PATH}/term_status`, body);

export const getAllAcademicYears = async () => {
  const { default: academicYearsJson } = await import(
    "../../demo-data/academic-years.json"
  );
  return academicYearsJson;
};

// new admission apis

export const getNewAdmissions = async (body) =>
  await postRequest(`${NEW_ADMISSION_PATH}/view`, body);

export const exportNewAdmissions = async (body) =>
  await postRequest(`${NEW_ADMISSION_PATH}/export`, body);

export const getNewAdmissionById = async (body) =>
  await postRequest(`${NEW_ADMISSION_PATH}/view/${body?.id}`, {});

export const setPrinted = async (body) =>
  await postRequest(`${NEW_ADMISSION_PATH}/set_printed/${body?.id}`, {
    printed: body?.printed,
  });
export const printNewAdmissionPdf = async (body) =>
  await getRequest(`${NEW_ADMISSION_PATH}/print/${body?.id}`);

export const setInterviewStatusApi = async (id, body) =>
  await postRequest(`${NEW_ADMISSION_PATH}/set_interview_status/${id}`, body);

export const setInterviewDateApi = async (body) =>
  await postRequest(`${NEW_ADMISSION_PATH}/set_interview_date/${body?.id}`, {
    interview_date: body?.interview_date,
  });

export const setWrittenTestDateApi = async (body) =>
  await postRequest(`${NEW_ADMISSION_PATH}/set_written_test_date/${body?.id}`, {
    written_test_date: body?.written_test_date,
  });

export const setWrittenTestStatusApi = async (id, body) =>
  await postRequest(`${NEW_ADMISSION_PATH}/set_written_test_status/${id}`, body);

export const setDocumentDateApi = async (body) =>
  await postRequest(`${NEW_ADMISSION_PATH}/set_document_date/${body?.id}`, {
    document_date: body?.document_date,
  });

export const setMarkCompleted = async (id, body) =>
  await postRequest(`${NEW_ADMISSION_PATH}/set_add_to_school/${id}`, body);

export const editStudentDetail = async (id, body) =>
  await postRequest(`${NEW_ADMISSION_PATH}/optional_details/${id}`, body);

export const sendPaymentLinkApi = async (body) =>
  await postRequest(`${NEW_ADMISSION_PATH}/send_payment_link`, body);

export const recordOfflineAdmissionPaymentApi = async (body) =>
  await postRequest(`${NEW_ADMISSION_PATH}/record_offline_payment`, body);

export const getAdmissionPaymentDetailsApi = async (id, params = {}) =>
  await getRequest(`${NEW_ADMISSION_PATH}/payment_details/${id}`, params);

export const getFinalFormDataApi = async (id) =>
  await getRequest(`${NEW_ADMISSION_PATH}/optional_details/${id}`);

export const setFinalFormDataApi = async (body) =>
  await postRequest(
    `${NEW_ADMISSION_PATH}/optional_details/${body?.id || ""}`,
    body,
  );

export const setFinalFormSubmitDataApi = async (id, body) =>
  await postRequest(`${NEW_ADMISSION_PATH}/set_document/${id}`, body);

export const getRollNoApi = async (body = {}) =>
  await getRequest(`${NEW_ADMISSION_PATH}/get_roll_no`, {
    ...(body?.ay_id ? { ay_id: body.ay_id } : {}),
    ...(body?.class ? { class: body.class } : {}),
    ...(body?.gender ? { gender: body.gender } : {}),
    ...(body?.stream ? { stream: body.stream } : {}),
    ...(body?.new_admission_id
      ? { new_admission_id: body.new_admission_id }
      : {}),
  });

export const addToSchoolApi = async (body) =>
  await postRequest(`${NEW_ADMISSION_PATH}/addToSchool`, body);

export const retryReconcileStudent = async (rollNo) =>
  await getRequest(`/retry-reconcile/${rollNo}`);
