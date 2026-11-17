import { getRequest, postBlobRequest, postRequest } from "../api.request";

const TRANSFER_CERTIFICATE = "/transfer_certificate";
const CHARACTER_CERTIFICATE = "/character_certificate";
const TERMS_PATH = "/terms";
const MARKS_PATH = "/marks";
const SUBJECT_PATH = "/subject";

// Transter Certificate
export const getTransferCertificates = async (body) =>
  await postRequest(`${TRANSFER_CERTIFICATE}/view`, body);

export const getStudentByRollNo = async (body) =>
  await postRequest(`${TRANSFER_CERTIFICATE}/student-details`, body);

export const exportTCDetails = async (body) =>
  await postRequest(`${TRANSFER_CERTIFICATE}/export`, body);

export const createTransferCertificate = async (body) =>
  await postRequest(`${TRANSFER_CERTIFICATE}/register`, body);

export const updateTransferCertificate = async (body) =>
  await postRequest(`${TRANSFER_CERTIFICATE}/register/${body?.id}`, body);

export const printTCPdf = async (body) =>
  await getRequest(`${TRANSFER_CERTIFICATE}/print/${body?.id}`);

// Character Certificate
export const getCharacterCertificates = async (body) =>
  await postRequest(`${CHARACTER_CERTIFICATE}/view`, body);

export const exportCCDetails = async (body) =>
  await postRequest(`${CHARACTER_CERTIFICATE}/export`, body);

export const createCharacterCertificate = async (body) =>
  await postRequest(`${CHARACTER_CERTIFICATE}/register`, body);

export const updateCharacterCertificate = async (body) =>
  await postRequest(`${CHARACTER_CERTIFICATE}/register/${body?.id}`, body);

export const printCCPdf = async (body) =>
  await getRequest(`${CHARACTER_CERTIFICATE}/print/${body?.id}`);

export const createBulkCharacterCertificate = async (body) =>
  await postRequest(`${CHARACTER_CERTIFICATE}/bulk`, body);

// terms
export const getTerms = async (body) => await postRequest(TERMS_PATH, body);

// marks
export const getMarksDetails = async (body) =>
  await postRequest(`${MARKS_PATH}/details`, body);

export const addMarks = async (body) =>
  await postRequest(`${MARKS_PATH}/create`, body);

export const exportTabular = async (body) =>
  await postRequest(`${MARKS_PATH}/export`, body);

export const addTotalAttendance = async (body) =>
  await postRequest(`${MARKS_PATH}/total_att`, body);

export const saveStudentRemarks = async (body) =>
  await postRequest(`${MARKS_PATH}/remarks`, body);

// export const exportReportCard = async (body, term) =>
//   await postRequest(`/reports/${term?.term_name}/${body?.cg_id}/0`, body);

// export const exportStudentWiseReport = async (body) =>
//   await postRequest(
//     `/reports/${body?.term_name}/${body?.cg_id}/${body?.st_id}`,
//     body
//   );

export const exportReportCard = async (body, term) =>
  await getRequest(`/reports/${term?.term_name}/${body?.cg_id}/0`);

export const exportStudentWiseReport = async (body) =>
  await getRequest(
    `/reports/${body?.term_name}/${body?.cg_id}/${body?.st_id}`,
    body
  );

// subject
export const getSubjectsList = async (body) =>
  await postRequest(`${SUBJECT_PATH}/class`, body);

export const getMasterSubjects = async (body) =>
  await postRequest(`${SUBJECT_PATH}/master_list`, body);

export const getDistinctSubjects = async (body) =>
  await postRequest(`${SUBJECT_PATH}/distinct_list`, body);

export const copyPreviousYearSubjects = async (body) =>
  await postRequest(`${SUBJECT_PATH}/copy_previous`, body);

export const previewPreviousYearSubjects = async (body) =>
  await postRequest(`${SUBJECT_PATH}/copy_previous_preview`, body);

export const addSubjectToClass = async (body) =>
  await postRequest(`${SUBJECT_PATH}/add_to_class`, body);

export const addAggregateColumn = async (body) =>
  await postRequest(`${SUBJECT_PATH}/aggregate`, body);

export const getClassFmSubjects = async (body) =>
  await postRequest(`${SUBJECT_PATH}/class_fm`, body);

export const getAllClassFmSubjects = async (body) =>
  await postRequest(`${SUBJECT_PATH}/class_fm_all`, body);

export const updateClassFmSubjectName = async (body) =>
  await postRequest(`${SUBJECT_PATH}/update_class_name`, body);

export const getRemarkBank = async (body) =>
  await postRequest(`${SUBJECT_PATH}/remarks/list`, body);

export const createRemarkPoint = async (body) =>
  await postRequest(`${SUBJECT_PATH}/remarks/create`, body);

export const updateRemarkPoint = async (body) =>
  await postRequest(`${SUBJECT_PATH}/remarks/update`, body);

export const deleteRemarkPoint = async (body) =>
  await postRequest(`${SUBJECT_PATH}/remarks/delete`, body);

export const printRemarkBank = async (body) =>
  await postBlobRequest(`${SUBJECT_PATH}/remarks/print`, body);

export const getRemarkCorrectBank = async (body = {}) =>
  await postRequest(`${SUBJECT_PATH}/remarks/correct/list`, body);

export const getRemarksAuditCompare = async (body = {}) =>
  await postRequest(`${SUBJECT_PATH}/remarks/audit-compare`, body);

export const fixRemarksAudit = async (body = {}) =>
  await postRequest(`${SUBJECT_PATH}/remarks/audit-fix`, body);

export const printAdmitCards = async (body) =>
  await postRequest("/admit_card/print", body);
