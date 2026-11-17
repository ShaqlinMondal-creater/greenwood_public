import PropTypes from "prop-types";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { toast } from "react-toastify";
import {
  previewUdisePdf,
  previewUdisePdfV2,
} from "../../../../services/admin/udise.service";
import { updateStudentDetail } from "../../../../services/admin/students-management.service";

const DEFAULT_FORM_META = {
  submitted_by: "",
  academic_year: "2026-27",
  udise_state: "WEST BENGAL",
  district: "KOLKATA",
  block: "KMC",
  udise_code: "19170106413",
  school_name: "GREENWOOD PUBLIC SCHOOL",
  school_contact: "8961501241 / 9330286477",
};

const DEFAULT_FORM_META_V2 = {
  ...DEFAULT_FORM_META,
  school_name: "GREENWOOD PUBLIC SCHOOL",
};

const DEFAULT_FOOTER = {
  head_signature: "",
  head_name: "MS SYEDA SUKAINA ALI",
  head_designation: "PRINCIPAL",
  head_date: "",
  head_seal: "",
  officer_signature: "",
  officer_name: "",
  officer_designation: "",
  officer_date: "",
  officer_seal: "",
  block_signature: "",
  block_name: "",
  block_designation: "",
  block_date: "",
  block_seal: "",
  district_signature: "",
  district_name: "",
  district_designation: "",
  district_date: "",
  district_seal: "",
};

const TABLE_HEAD_CELL = {
  fontWeight: 600,
  fontSize: "0.8rem",
  bgcolor: "#fafafa",
  border: "1px solid #ddd",
  verticalAlign: "top",
  py: 1,
};

const TABLE_BODY_CELL = {
  border: "1px solid #ddd",
  verticalAlign: "top",
  py: 1,
  px: 1,
};

const inputSx = { mb: 0.75 };

const STUDENT_GROUPS = [
  {
    key: "basic",
    label: "Basic Details",
    width: "16%",
    minWidth: 165,
    fields: [
      { key: "name", label: "Name" },
      { key: "gender", label: "Gender" },
      { key: "dob", label: "Date of Birth" },
      { key: "is_cwsn", label: "Is CWSN" },
    ],
  },
  {
    key: "admission",
    label: "Admission Details",
    width: "13%",
    minWidth: 140,
    fields: [
      { key: "class", label: "Class" },
      { key: "section", label: "Section" },
      { key: "admission_date", label: "Admission Date" },
    ],
  },
  {
    key: "parents",
    label: "Parents/Guardian details",
    width: "18%",
    minWidth: 170,
    fields: [
      { key: "mother_name", label: "Mother's Name" },
      { key: "father_name", label: "Father's Name" },
      { key: "guardian_name", label: "Guardian's Name" },
    ],
  },
  {
    key: "contact",
    label: "Contact details",
    width: "13%",
    minWidth: 140,
    fields: [
      { key: "mobile", label: "Mobile number" },
      { key: "alternate_mobile", label: "Alternate number" },
    ],
  },
  {
    key: "aadhaar",
    label: "Student's AADHAAR Details",
    width: "16%",
    minWidth: 165,
    fields: [
      { key: "aadhaar_no", label: "AADHAAR number" },
      { key: "aadhaar_name", label: "Name as per AADHAAR" },
    ],
  },
  {
    key: "note",
    label: "Why was this student not added in the Previous Academic Year?",
    width: "20%",
    minWidth: 180,
    fields: [{ key: "previous_year_note", label: "Previous Year Note", multiline: true }],
  },
];

const INVALID_ADMISSION_VALUES = [
  "yes",
  "no",
  "y",
  "n",
  "1",
  "0",
  "true",
  "false",
  "n/a",
  "na",
];

/**
 * dd-mm-yyyy while typing:
 * - DD / MM / YYYY stay as separate segments (mid-edit does not reshuffle digits)
 * - after completing DD or MM at the end → auto "-"
 * - returns { value, cursor } so caret can stay in place
 */
const formatAdmissionDateInput = (rawValue, prevValue = "", cursor = null) => {
  const raw = String(rawValue ?? "");
  const prev = String(prevValue ?? "");
  const selection = cursor == null ? raw.length : cursor;
  const prevDigits = prev.replace(/\D/g, "");
  const rawDigits = raw.replace(/\D/g, "");
  const isDeleting = rawDigits.length < prevDigits.length;

  const mapCursor = (formatted, digitIndex, preferAfterDash = false) => {
    if (digitIndex <= 0) return 0;
    let seen = 0;
    for (let i = 0; i < formatted.length; i += 1) {
      if (/\d/.test(formatted[i])) {
        seen += 1;
        if (seen === digitIndex) {
          let pos = i + 1;
          if (preferAfterDash && formatted[pos] === "-") pos += 1;
          return pos;
        }
      }
    }
    return formatted.length;
  };

  const digitIndexBeforeCursor = raw
    .slice(0, selection)
    .replace(/\D/g, "").length;

  if (!raw) {
    return { value: "", cursor: 0 };
  }

  // Segment mode once dashes exist — keep DD / MM / YYYY independent
  if (raw.includes("-") || prev.includes("-")) {
    const parts = raw.split("-");
    const p0 = (parts[0] || "").replace(/\D/g, "");
    const p1 = (parts[1] || "").replace(/\D/g, "");
    const p2 = (parts.slice(2).join("") || "").replace(/\D/g, "");

    let day = p0.slice(0, 2);
    let overflow = p0.slice(2);
    let month = (overflow + p1).slice(0, 2);
    overflow = (overflow + p1).slice(2);
    let year = (overflow + p2).slice(0, 4);

    // Manual "-" after 1-digit day/month → pad
    if (!isDeleting && /-$/.test(raw) && !/-$/.test(prev)) {
      if (parts.length === 2 && day.length === 1 && !month && !year) {
        day = day.padStart(2, "0");
      } else if (parts.length >= 3 && month.length === 1 && !year) {
        month = month.padStart(2, "0");
      }
    }

    let value = day;
    const hadMonthSeg = parts.length > 1 || month.length > 0 || year.length > 0;
    const hadYearSeg = parts.length > 2 || year.length > 0;

    if (hadMonthSeg) {
      value = `${day}-${month}`;
      if (hadYearSeg) {
        value = `${day}-${month}-${year}`;
      } else if (
        !isDeleting &&
        month.length === 2 &&
        (/-$/.test(raw) || selection >= raw.length)
      ) {
        value = `${day}-${month}-`;
      }
    } else if (!isDeleting && day.length === 2 && selection >= raw.length) {
      value = `${day}-`;
    }

    const preferAfterDash =
      !isDeleting &&
      selection >= raw.length &&
      (value.endsWith("-") || value.length > raw.length);

    return {
      value,
      cursor: mapCursor(value, digitIndexBeforeCursor, preferAfterDash),
    };
  }

  // Fresh typing (no dashes yet): digits only + auto "-"
  const digits = rawDigits.slice(0, 8);
  let value = "";

  if (digits.length <= 2) {
    value = digits;
    if (!isDeleting && digits.length === 2) value += "-";
  } else if (digits.length <= 4) {
    value = `${digits.slice(0, 2)}-${digits.slice(2)}`;
    if (!isDeleting && digits.length === 4) value += "-";
  } else {
    value = `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
  }

  const preferAfterDash =
    !isDeleting &&
    selection >= raw.length &&
    (value.endsWith("-") || value.length > raw.length);

  return {
    value,
    cursor: mapCursor(value, digitIndexBeforeCursor, preferAfterDash),
  };
};

const normalizeAdmissionDateValue = (value) => {
  const text = String(value ?? "").trim();
  if (!text || INVALID_ADMISSION_VALUES.includes(text.toLowerCase())) {
    return "";
  }

  const digits = text.replace(/\D/g, "");
  if (digits.length === 8) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 8)}`;
  }

  const match = text.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (match) {
    return `${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}-${match[3]}`;
  }

  return formatAdmissionDateInput(text).value;
};

const isValidAdmissionDate = (value) => {
  const text = String(value ?? "").trim();
  if (!text) return true;

  const match = text.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return false;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900) {
    return false;
  }

  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

const DEFAULT_UDISE_AADHAAR_DIGITS = "999999999999";

const formatAadhaarDisplay = (value) => {
  const digits = String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, 12);
  if (!digits) return "";
  return digits.match(/.{1,4}/g)?.join("-") || digits;
};

const getDefaultUdiseAadhaarDisplay = () =>
  formatAadhaarDisplay(DEFAULT_UDISE_AADHAAR_DIGITS);

/**
 * XXXX-XXXX-XXXX while typing:
 * - groups stay independent (mid-edit does not reshuffle digits)
 * - after completing a 4-digit group at the end → auto "-"
 * - returns { value, cursor }
 */
const formatAadhaarInput = (rawValue, prevValue = "", cursor = null) => {
  const raw = String(rawValue ?? "");
  const prev = String(prevValue ?? "");
  const selection = cursor == null ? raw.length : cursor;
  const prevDigits = prev.replace(/\D/g, "");
  const rawDigits = raw.replace(/\D/g, "").slice(0, 12);
  const isDeleting = rawDigits.length < prevDigits.length;

  const mapCursor = (formatted, digitIndex, preferAfterDash = false) => {
    if (digitIndex <= 0) return 0;
    let seen = 0;
    for (let i = 0; i < formatted.length; i += 1) {
      if (/\d/.test(formatted[i])) {
        seen += 1;
        if (seen === digitIndex) {
          let pos = i + 1;
          if (preferAfterDash && formatted[pos] === "-") pos += 1;
          return pos;
        }
      }
    }
    return formatted.length;
  };

  const digitIndexBeforeCursor = raw
    .slice(0, selection)
    .replace(/\D/g, "").length;

  if (!raw) {
    return { value: "", cursor: 0 };
  }

  if (raw.includes("-") || prev.includes("-")) {
    const parts = raw.split("-");
    const p0 = (parts[0] || "").replace(/\D/g, "");
    const p1 = (parts[1] || "").replace(/\D/g, "");
    const p2 = (parts.slice(2).join("") || "").replace(/\D/g, "");

    const g1 = p0.slice(0, 4);
    let overflow = p0.slice(4);
    const g2 = (overflow + p1).slice(0, 4);
    overflow = (overflow + p1).slice(4);
    const g3 = (overflow + p2).slice(0, 4);

    let value = g1;
    const hadG2 = parts.length > 1 || g2.length > 0 || g3.length > 0;
    const hadG3 = parts.length > 2 || g3.length > 0;

    if (hadG2) {
      value = `${g1}-${g2}`;
      if (hadG3) {
        value = `${g1}-${g2}-${g3}`;
      } else if (
        !isDeleting &&
        g2.length === 4 &&
        (/-$/.test(raw) || selection >= raw.length)
      ) {
        value = `${g1}-${g2}-`;
      }
    } else if (!isDeleting && g1.length === 4 && selection >= raw.length) {
      value = `${g1}-`;
    }

    const preferAfterDash =
      !isDeleting &&
      selection >= raw.length &&
      (value.endsWith("-") || value.length > raw.length);

    return {
      value,
      cursor: mapCursor(value, digitIndexBeforeCursor, preferAfterDash),
    };
  }

  const digits = rawDigits;
  let value = "";
  if (digits.length <= 4) {
    value = digits;
    if (!isDeleting && digits.length === 4) value += "-";
  } else if (digits.length <= 8) {
    value = `${digits.slice(0, 4)}-${digits.slice(4)}`;
    if (!isDeleting && digits.length === 8) value += "-";
  } else {
    value = `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
  }

  const preferAfterDash =
    !isDeleting &&
    selection >= raw.length &&
    (value.endsWith("-") || value.length > raw.length);

  return {
    value,
    cursor: mapCursor(value, digitIndexBeforeCursor, preferAfterDash),
  };
};

const getAadhaarDigits = (value) =>
  String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, 12);

function SegmentDashField({ value, onChange, formatFn, ...props }) {
  const inputRef = useRef(null);
  const cursorRef = useRef(null);

  useLayoutEffect(() => {
    if (cursorRef.current == null || !inputRef.current) return;
    const pos = cursorRef.current;
    inputRef.current.setSelectionRange(pos, pos);
    cursorRef.current = null;
  }, [value]);

  const applyFormatted = (nextRaw, selection) => {
    const formatted = formatFn(nextRaw, value, selection);
    cursorRef.current = formatted.cursor;
    onChange(formatted.value);
  };

  return (
    <TextField
      {...props}
      value={value}
      inputRef={inputRef}
      onKeyDown={(e) => {
        if (e.key !== "Backspace") return;
        const el = e.target;
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? 0;
        if (start !== end || start === 0) return;

        const charBefore = value[start - 1];
        if (charBefore !== "-") return;

        e.preventDefault();

        if (start === value.length) {
          applyFormatted(value.slice(0, -1), start - 1);
          return;
        }

        const digitPos = start - 2;
        if (digitPos < 0 || !/\d/.test(value[digitPos])) {
          applyFormatted(
            `${value.slice(0, start - 1)}${value.slice(start)}`,
            start - 1
          );
          return;
        }

        const next = `${value.slice(0, digitPos)}${value.slice(digitPos + 1)}`;
        applyFormatted(next, digitPos);
      }}
      onChange={(e) => {
        const nextRaw = e.target.value;
        const selection = e.target.selectionStart ?? nextRaw.length;
        applyFormatted(nextRaw, selection);
      }}
    />
  );
}

SegmentDashField.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  formatFn: PropTypes.func.isRequired,
};

/**
 * Parse UDISE class/section from names like:
 * - "XI A (BOYS / SCIENCE + COMP SCI)" → XI / A
 * - "10 - A ( BOYS/ SCI)" → 10 / A
 * - "XII - C ( BOYS/ SCI + COMM)" → XII / C
 * - class="XI", section="A ( BOYS/ SCI)" → XI / A
 */
const parseUdiseClassSection = (classRaw, sectionRaw) => {
  const classValueRaw = String(classRaw ?? "").trim();
  const sectionValueRaw = String(sectionRaw ?? "").trim();

  const classLooksFull =
    /\(/.test(classValueRaw) ||
    /\s-\s/.test(classValueRaw) ||
    /\s+[A-Za-z]\b/.test(classValueRaw);

  const source = classLooksFull
    ? classValueRaw
    : [classValueRaw, sectionValueRaw].filter(Boolean).join(" ");

  // Drop stream text in parentheses
  const withoutStream = source.split("(")[0].trim();
  // "10 - A" / "10-A" / "XI A" → "10 A" / "XI A"
  const cleaned = withoutStream
    .replace(/\s*-\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // XII before XI so "XII" is not read as "XI"
  const match = cleaned.match(
    /^(NURSERY|LKG|UKG|XII|XI|\d+)\s*([A-Za-z])?/i
  );

  let classValue = match?.[1] || cleaned.split(" ")[0] || "";
  let sectionValue = match?.[2] || "";

  if (!sectionValue && sectionValueRaw) {
    const sectionClean = sectionValueRaw
      .split("(")[0]
      .replace(/\s*-\s*/g, " ")
      .trim();
    const sectionMatch = sectionClean.match(/([A-Za-z])\b/);
    sectionValue = sectionMatch?.[1] || "";
  }

  if (classValue === "11") classValue = "XI";
  if (classValue === "12") classValue = "XII";

  if (/^xii$/i.test(classValue)) classValue = "XII";
  else if (/^xi$/i.test(classValue)) classValue = "XI";
  else if (/^(nursery|lkg|ukg)$/i.test(classValue)) {
    classValue =
      classValue.charAt(0).toUpperCase() + classValue.slice(1).toLowerCase();
    if (classValue.toLowerCase() === "lkg") classValue = "LKG";
    if (classValue.toLowerCase() === "ukg") classValue = "UKG";
  }

  return {
    class: classValue,
    section: sectionValue ? sectionValue.toUpperCase() : "",
  };
};

const sanitizeStudent = (student = {}) => {
  const { class: classValue, section } = parseUdiseClassSection(
    student.class,
    student.section
  );

  const aadhaarDisplay = formatAadhaarDisplay(student.aadhaar_no);

  return {
    ...student,
    is_cwsn: student.is_cwsn?.trim() ? student.is_cwsn : "No",
    previous_year_note: student.previous_year_note?.trim()
      ? student.previous_year_note
      : "",
    admission_date: normalizeAdmissionDateValue(student.admission_date),
    // Frontend-only default for UDISE preview/PDF when Aadhaar is missing
    aadhaar_no: aadhaarDisplay || getDefaultUdiseAadhaarDisplay(),
    class: classValue,
    section,
  };
};

const openPdfBlob = async (response, fileName = "udise_form.pdf") => {
  if (response?.code) {
    toast.error(response?.message || "Failed to generate UDISE PDF");
    return false;
  }

  const blob = response?.data;
  if (!(blob instanceof Blob)) {
    toast.error("Failed to generate UDISE PDF");
    return false;
  }

  if (blob.type?.includes("application/json")) {
    const text = await blob.text();
    try {
      const errorData = JSON.parse(text);
      toast.error(errorData?.message || "Failed to generate UDISE PDF");
    } catch {
      toast.error("Failed to generate UDISE PDF");
    }
    return false;
  }

  // Force application/pdf so Chrome treats it as a real PDF file
  const pdfBlob =
    blob.type === "application/pdf"
      ? blob
      : new Blob([blob], { type: "application/pdf" });
  const pdfUrl = window.URL.createObjectURL(pdfBlob);

  // Chrome PDF viewer "Download" often fails on blob: URLs ("Check internet connection").
  // Trigger a real file download with a filename, then open for preview.
  const link = document.createElement("a");
  link.href = pdfUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.open(pdfUrl, "_blank", "noopener,noreferrer");

  // Keep blob alive long enough for preview tab + download to finish
  setTimeout(() => window.URL.revokeObjectURL(pdfUrl), 60_000);
  return true;
};

export default function UdisePreviewModal({
  open,
  onClose,
  previewData,
  rollNos,
  ayId,
  onFieldsSaved,
  formatVersion = "v1",
}) {
  const isV2 = formatVersion === "v2";
  const defaultFormMeta = isV2 ? DEFAULT_FORM_META_V2 : DEFAULT_FORM_META;
  const [formMeta, setFormMeta] = useState(defaultFormMeta);
  const [footer, setFooter] = useState(DEFAULT_FOOTER);
  const [students, setStudents] = useState([]);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const originalValuesByStIdRef = useRef({});

  useEffect(() => {
    if (!open) {
      setStudents([]);
      setFormMeta(defaultFormMeta);
      setFooter(DEFAULT_FOOTER);
      originalValuesByStIdRef.current = {};
      return;
    }

    if (!previewData) return;

    setFormMeta({ ...defaultFormMeta });
    setFooter({ ...DEFAULT_FOOTER });

    const sourceStudents = Array.isArray(previewData?.students)
      ? previewData.students
      : [];

    const originalMap = {};
    sourceStudents.forEach((student) => {
      const stId = Number(student?.st_id);
      if (!stId) return;
      originalMap[stId] = {
        admission_date: normalizeAdmissionDateValue(student?.admission_date),
        // Keep real DB value (empty if missing) — do not treat preview default as original
        aadhaar_no: getAadhaarDigits(student?.aadhaar_no),
      };
    });
    originalValuesByStIdRef.current = originalMap;

    setStudents(sourceStudents.map(sanitizeStudent));
  }, [open, previewData]);

  const handleFormMetaChange = (field, value) => {
    setFormMeta((prev) => ({ ...prev, [field]: value }));
  };

  const handleFooterChange = (field, value) => {
    setFooter((prev) => ({ ...prev, [field]: value }));
  };

  const handleStudentChange = (index, field, value) => {
    setStudents((prev) =>
      prev.map((student, studentIndex) =>
        studentIndex === index ? { ...student, [field]: value } : student
      )
    );
  };

  const syncChangedStudentFields = async () => {
    const updates = [];
    const originalMap = originalValuesByStIdRef.current;

    students.forEach((student) => {
      const stId = Number(student?.st_id);
      if (!stId) return;

      const original = originalMap[stId] || {
        admission_date: "",
        aadhaar_no: "",
      };

      const admissionDate = String(student?.admission_date ?? "").trim();
      if (
        admissionDate &&
        isValidAdmissionDate(admissionDate) &&
        admissionDate !== original.admission_date
      ) {
        updates.push({
          st_id: stId,
          field_name: "st_date_of_admission",
          field_value: admissionDate,
        });
      }

      const aadhaarDigits = getAadhaarDigits(student?.aadhaar_no);
      // Do not persist the UDISE preview placeholder to student master
      if (
        aadhaarDigits.length === 12 &&
        aadhaarDigits !== DEFAULT_UDISE_AADHAAR_DIGITS &&
        aadhaarDigits !== original.aadhaar_no
      ) {
        updates.push({
          st_id: stId,
          field_name: "aadhaar_no",
          field_value: aadhaarDigits,
        });
      }
    });

    if (!updates.length) return true;

    const results = await Promise.all(
      updates.map((body) => updateStudentDetail(body))
    );

    const failed = results.find((res) => res?.code !== 200);
    if (failed) {
      toast.error(
        failed?.message ||
          "Failed to save admission date / Aadhaar to student record."
      );
      return false;
    }

    toast.success("Admission date / Aadhaar updated on student record.");
    onFieldsSaved?.();
    return true;
  };

  const handleConfirm = async () => {
    const invalidAdmission = students.find(
      (student) => !isValidAdmissionDate(student?.admission_date)
    );

    if (invalidAdmission) {
      toast.error(
        "Admission Date must be dd-mm-yyyy (e.g. 13-09-2005). Please correct it."
      );
      return;
    }

    const incompleteAadhaar = students.find((student) => {
      const digits = getAadhaarDigits(student?.aadhaar_no);
      return digits.length > 0 && digits.length < 12;
    });

    if (incompleteAadhaar) {
      toast.error("Aadhaar number must be 12 digits.");
      return;
    }

    setIsConfirmLoading(true);

    const synced = await syncChangedStudentFields();
    if (!synced) {
      setIsConfirmLoading(false);
      return;
    }

    const studentsForPdf = students.map((student) => {
      const aadhaarDigits = getAadhaarDigits(student?.aadhaar_no);
      return {
        ...student,
        aadhaar_no:
          aadhaarDigits.length === 12
            ? formatAadhaarDisplay(aadhaarDigits)
            : getDefaultUdiseAadhaarDisplay(),
      };
    });

    const response = isV2
      ? await previewUdisePdfV2({
          roll_nos: rollNos,
          ay_id: ayId,
          form_meta: formMeta,
          footer,
          students: studentsForPdf,
        })
      : await previewUdisePdf({
          roll_nos: rollNos,
          ay_id: ayId,
          form_meta: formMeta,
          footer,
          students: studentsForPdf,
        });
    setIsConfirmLoading(false);

    const success = await openPdfBlob(
      response,
      isV2 ? "udise_form_s02_v2.pdf" : "udise_form.pdf"
    );
    if (success) {
      onClose();
    }
  };

  const renderMetaField = (label, field, flex = "1 1 160px") => (
    <TextField
      size="small"
      label={label}
      value={formMeta[field]}
      onChange={(e) => handleFormMetaChange(field, e.target.value)}
      sx={{ flex, minWidth: 140 }}
    />
  );

  const renderStudentFields = (index, fields) =>
    fields.map((field) => {
      const isAdmissionDate = field.key === "admission_date";
      const isAadhaar = field.key === "aadhaar_no";
      const value = students[index]?.[field.key] || "";
      const showError =
        isAdmissionDate && value && !isValidAdmissionDate(value);

      const commonProps = {
        fullWidth: true,
        size: "small",
        label:
          isV2 && field.key === "previous_year_note"
            ? "Reason (1–5)"
            : field.label,
        value,
        multiline: field.multiline,
        minRows: field.multiline ? 5 : undefined,
        placeholder: isAdmissionDate
          ? "dd-mm-yyyy"
          : isAadhaar
            ? "XXXX-XXXX-XXXX"
            : isV2 && field.key === "previous_year_note"
              ? "e.g. 3"
              : undefined,
        error: showError,
        helperText: showError ? "Use dd-mm-yyyy" : undefined,
        sx: inputSx,
        inputProps: isAdmissionDate
          ? { inputMode: "numeric", maxLength: 10 }
          : isAadhaar
            ? { inputMode: "numeric", maxLength: 14 }
            : undefined,
      };

      if (isAdmissionDate) {
        return (
          <SegmentDashField
            key={field.key}
            {...commonProps}
            formatFn={formatAdmissionDateInput}
            onChange={(nextValue) =>
              handleStudentChange(index, field.key, nextValue)
            }
          />
        );
      }

      if (isAadhaar) {
        return (
          <SegmentDashField
            key={field.key}
            {...commonProps}
            formatFn={formatAadhaarInput}
            onChange={(nextValue) =>
              handleStudentChange(index, field.key, nextValue)
            }
          />
        );
      }

      return (
        <TextField
          key={field.key}
          {...commonProps}
          onChange={(e) =>
            handleStudentChange(index, field.key, e.target.value)
          }
        />
      );
    });

  return (
    <Dialog
      open={open}
      onClose={isConfirmLoading ? undefined : onClose}
      fullWidth
      maxWidth="xl"
      PaperProps={{ sx: { height: "92vh", display: "flex", flexDirection: "column" } }}
    >
      <DialogTitle sx={{ py: 1.5 }}>
        {isV2 ? "UDISE Form Preview V2 (S02+)" : "UDISE Form Preview"}
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          p: 2,
          flex: 1,
          overflowY: "auto",
        }}
      >
        {/* Header — same fields as PDF (Submitted By is label-only) */}
        <Box sx={{ mb: 2, flexShrink: 0 }}>
          <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 500 }}>
            {isV2 ? (
              <>SUBMITTED BY</>
            ) : (
              <>
                <u>Submitted By</u> (Current/Present School)
              </>
            )}
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1.5} sx={{ mb: 1.5 }}>
            {renderMetaField(
              isV2 ? "Current Academic Year" : "Academic Year",
              "academic_year",
              "0 1 130px"
            )}
            {renderMetaField(
              isV2 ? "State" : "UDISE State",
              "udise_state",
              "0 1 150px"
            )}
            {renderMetaField("District", "district", "1 1 160px")}
            {renderMetaField("Block", "block", "1 1 160px")}
          </Stack>
          <Stack direction="row" flexWrap="wrap" gap={1.5}>
            {renderMetaField("UDISE Code", "udise_code", "0 1 160px")}
            {renderMetaField("School Name", "school_name", "2 1 280px")}
            {renderMetaField(
              isV2 ? "HoS Contact Details" : "School Contact Number",
              "school_contact",
              "1 1 180px"
            )}
          </Stack>
        </Box>

        {/* Students table — scrollable */}
        <Typography variant="subtitle2" sx={{ mb: 1, flexShrink: 0 }}>
          Students ({students.length})
        </Typography>

        <TableContainer
          sx={{
            maxHeight: "38vh",
            mb: 2,
            border: "1px solid #ccc",
            overflow: "auto",
          }}
        >
          <Table stickyHeader size="small" sx={{ tableLayout: "fixed", minWidth: 1050 }}>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{ ...TABLE_HEAD_CELL, width: 42, minWidth: 42 }}
                >
                  S.No
                </TableCell>
                  {STUDENT_GROUPS.map((group) => (
                  <TableCell
                    key={group.key}
                    sx={{
                      ...TABLE_HEAD_CELL,
                      width: group.width,
                      minWidth: group.minWidth,
                    }}
                  >
                    {isV2 && group.key === "note"
                      ? "Reason of non-creation of Student profile in UDISE+ till date"
                      : group.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((student, index) => (
                <TableRow key={`udise-student-${index}`}>
                  <TableCell sx={{ ...TABLE_BODY_CELL, textAlign: "center" }}>
                    {index + 1}
                  </TableCell>
                  {STUDENT_GROUPS.map((group) => (
                    <TableCell key={group.key} sx={TABLE_BODY_CELL}>
                      {renderStudentFields(index, group.fields)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}

              {!students.length ? (
                <TableRow>
                  <TableCell colSpan={7} sx={TABLE_BODY_CELL}>
                    <Typography align="center" color="text.secondary">
                      No students selected
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Footer — V1: 2 columns; V2: 3 columns (HoS / Block / District) */}
        <Grid container spacing={2} sx={{ pb: 1 }}>
          <Grid item xs={12} md={isV2 ? 4 : 6}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Head of the School Details
            </Typography>
            <Stack spacing={1}>
              {[
                ["head_signature", "Signature"],
                ["head_name", "Name"],
                ["head_designation", "Designation"],
                ["head_date", "Date"],
                ["head_seal", "Seal"],
              ].map(([field, label]) => (
                <TextField
                  key={field}
                  fullWidth
                  size="small"
                  label={label}
                  value={footer[field]}
                  onChange={(e) => handleFooterChange(field, e.target.value)}
                />
              ))}
            </Stack>
          </Grid>

          {isV2 ? (
            <>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Block Education Officer or Equivalent
                </Typography>
                <Stack spacing={1}>
                  {[
                    ["block_signature", "Signature"],
                    ["block_name", "Name"],
                    ["block_designation", "Designation"],
                    ["block_date", "Date"],
                    ["block_seal", "Seal"],
                  ].map(([field, label]) => (
                    <TextField
                      key={field}
                      fullWidth
                      size="small"
                      label={label}
                      value={footer[field]}
                      onChange={(e) => handleFooterChange(field, e.target.value)}
                    />
                  ))}
                </Stack>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  District Education Officer or Equivalent
                </Typography>
                <Stack spacing={1}>
                  {[
                    ["district_signature", "Signature"],
                    ["district_name", "Name"],
                    ["district_designation", "Designation"],
                    ["district_date", "Date"],
                    ["district_seal", "Seal"],
                  ].map(([field, label]) => (
                    <TextField
                      key={field}
                      fullWidth
                      size="small"
                      label={label}
                      value={footer[field]}
                      onChange={(e) => handleFooterChange(field, e.target.value)}
                    />
                  ))}
                </Stack>
              </Grid>
            </>
          ) : (
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                State/District/Block level Education Officer or Equivalent Details
              </Typography>
              <Stack spacing={1}>
                {[
                  ["officer_signature", "Signature"],
                  ["officer_name", "Name"],
                  ["officer_designation", "Designation"],
                  ["officer_date", "Date"],
                  ["officer_seal", "Seal"],
                ].map(([field, label]) => (
                  <TextField
                    key={field}
                    fullWidth
                    size="small"
                    label={label}
                    value={footer[field]}
                    onChange={(e) => handleFooterChange(field, e.target.value)}
                  />
                ))}
              </Stack>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} disabled={isConfirmLoading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={isConfirmLoading || !students.length}
        >
          {isConfirmLoading ? (
            <CircularProgress size={22} color="inherit" />
          ) : isV2 ? (
            "Confirm & Generate V2 PDF"
          ) : (
            "Confirm & Generate PDF"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

UdisePreviewModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  previewData: PropTypes.shape({
    form_meta: PropTypes.object,
    footer: PropTypes.object,
    students: PropTypes.array,
  }),
  rollNos: PropTypes.string,
  ayId: PropTypes.number,
  onFieldsSaved: PropTypes.func,
  formatVersion: PropTypes.oneOf(["v1", "v2"]),
};
