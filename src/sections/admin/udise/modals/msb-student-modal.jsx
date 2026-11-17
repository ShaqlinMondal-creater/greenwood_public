import PropTypes from "prop-types";
import { useEffect, useState } from "react";
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
  fetchMsbCsvStudents,
  previewMsbPdf,
} from "../../../../services/admin/msb-student.service";

const DEFAULT_FORM_META = {
  submitted_by: "",
  academic_year: "2026-27",
  udise_state: "WEST BENGAL",
  district: "KOLKATA",
  block: "KMC",
  udise_code: "19170106413",
  school_name: "GREENWOOD PUBLIC SCHOOL",
  school_contact: "9330286477",
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
    fields: [
      { key: "previous_year_note", label: "Previous Year Note", multiline: true },
    ],
  },
];

const sanitizeStudent = (student = {}) => ({
  ...student,
  is_cwsn: student.is_cwsn?.trim() ? student.is_cwsn : "No",
  previous_year_note: student.previous_year_note?.trim()
    ? student.previous_year_note
    : "DATA MISSING FROM UDISE SYSTEM",
});

const openPdfBlob = async (response) => {
  if (response?.code) {
    toast.error(response?.message || "Failed to generate MSB PDF");
    return false;
  }

  const blob = response?.data;
  if (!(blob instanceof Blob)) {
    toast.error("Failed to generate MSB PDF");
    return false;
  }

  if (blob.type?.includes("application/json")) {
    const text = await blob.text();
    try {
      const errorData = JSON.parse(text);
      toast.error(errorData?.message || "Failed to generate MSB PDF");
    } catch {
      toast.error("Failed to generate MSB PDF");
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
  link.download = "msb_udise_form.pdf";
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.open(pdfUrl, "_blank", "noopener,noreferrer");

  // Keep blob alive long enough for preview tab + download to finish
  setTimeout(() => window.URL.revokeObjectURL(pdfUrl), 60_000);
  return true;
};

export default function MsbStudentModal({ open, onClose }) {
  const [csvUrl, setCsvUrl] = useState("");
  const [formMeta, setFormMeta] = useState(DEFAULT_FORM_META);
  const [footer, setFooter] = useState(DEFAULT_FOOTER);
  const [students, setStudents] = useState([]);
  const [isFetchLoading, setIsFetchLoading] = useState(false);
  const [isPrintLoading, setIsPrintLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setCsvUrl("");
      setStudents([]);
      setFormMeta(DEFAULT_FORM_META);
      setFooter(DEFAULT_FOOTER);
      setIsFetchLoading(false);
      setIsPrintLoading(false);
    }
  }, [open]);

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

  const handleFetch = async () => {
    const url = csvUrl.trim();
    if (!url) {
      toast.info("Please paste the CSV URL");
      return;
    }

    setIsFetchLoading(true);
    const response = await fetchMsbCsvStudents({ csv_url: url });
    setIsFetchLoading(false);

    if (response?.code !== 200) {
      toast.error(response?.message || "Failed to fetch CSV students");
      return;
    }

    const sourceStudents = Array.isArray(response?.data?.students)
      ? response.data.students
      : [];

    if (!sourceStudents.length) {
      toast.error("No students found in CSV");
      return;
    }

    setFormMeta({
      ...DEFAULT_FORM_META,
      ...(response?.data?.form_meta || {}),
    });
    setFooter({
      ...DEFAULT_FOOTER,
      ...(response?.data?.footer || {}),
    });
    setStudents(sourceStudents.map(sanitizeStudent));
    toast.success(`Fetched ${sourceStudents.length} student(s) from CSV`);
  };

  const handlePrint = async () => {
    if (!students.length) {
      toast.info("Fetch CSV students first");
      return;
    }

    setIsPrintLoading(true);
    const response = await previewMsbPdf({
      form_meta: formMeta,
      footer,
      students,
    });
    setIsPrintLoading(false);

    await openPdfBlob(response);
  };

  const busy = isFetchLoading || isPrintLoading;

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
    fields.map((field) => (
      <TextField
        key={field.key}
        fullWidth
        size="small"
        label={field.label}
        value={students[index]?.[field.key] || ""}
        multiline={field.multiline}
        minRows={field.multiline ? 5 : undefined}
        sx={inputSx}
        onChange={(e) =>
          handleStudentChange(index, field.key, e.target.value)
        }
      />
    ));

  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : onClose}
      fullWidth
      maxWidth="xl"
      PaperProps={{
        sx: { height: "92vh", display: "flex", flexDirection: "column" },
      }}
    >
      <DialogTitle sx={{ py: 1.5 }}>MSB Students (CSV)</DialogTitle>

      <DialogContent
        dividers
        sx={{ p: 2, flex: 1, overflowY: "auto" }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ mb: 2 }}
          alignItems={{ sm: "center" }}
        >
          <TextField
            fullWidth
            size="small"
            label="CSV URL"
            placeholder="Paste public CSV / Google Sheet / Drive link"
            value={csvUrl}
            onChange={(e) => setCsvUrl(e.target.value)}
            disabled={busy}
          />
          <Button
            variant="contained"
            onClick={handleFetch}
            disabled={busy || !csvUrl.trim()}
            sx={{ minWidth: 110, whiteSpace: "nowrap" }}
          >
            {isFetchLoading ? (
              <CircularProgress size={22} color="inherit" />
            ) : (
              "Fetch"
            )}
          </Button>
        </Stack>

        <Box sx={{ mb: 2, flexShrink: 0 }}>
          <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 500 }}>
            <u>Submitted By</u> (Current/Present School)
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1.5} sx={{ mb: 1.5 }}>
            {renderMetaField("Academic Year", "academic_year", "0 1 130px")}
            {renderMetaField("UDISE State", "udise_state", "0 1 150px")}
            {renderMetaField("District", "district", "1 1 160px")}
            {renderMetaField("Block", "block", "1 1 160px")}
          </Stack>
          <Stack direction="row" flexWrap="wrap" gap={1.5}>
            {renderMetaField("UDISE Code", "udise_code", "0 1 160px")}
            {renderMetaField("School Name", "school_name", "2 1 280px")}
            {renderMetaField(
              "School Contact Number",
              "school_contact",
              "1 1 180px"
            )}
          </Stack>
        </Box>

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
          <Table
            stickyHeader
            size="small"
            sx={{ tableLayout: "fixed", minWidth: 1050 }}
          >
            <TableHead>
              <TableRow>
                <TableCell sx={{ ...TABLE_HEAD_CELL, width: 42, minWidth: 42 }}>
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
                    {group.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((student, index) => (
                <TableRow key={`msb-student-${index}`}>
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
                      Paste CSV URL and click Fetch
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>

        <Grid container spacing={2} sx={{ pb: 1 }}>
          <Grid item xs={12} md={6}>
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
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handlePrint}
          disabled={busy || !students.length}
        >
          {isPrintLoading ? (
            <CircularProgress size={22} color="inherit" />
          ) : (
            "Print PDF"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

MsbStudentModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
};
