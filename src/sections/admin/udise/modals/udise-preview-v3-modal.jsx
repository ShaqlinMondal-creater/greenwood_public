import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
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
import { exportUdiseV3 } from "../../../../services/admin/udise.service";

const GENDERS = ["1-Male", "2-Female", "3-Transgender"];
const CWSN = ["1-Yes", "2-No"];
const CLASSES = ["II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
const SECTIONS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P"];
const REASONS = [
  "Student Rejoining After Dropping Out",
  "Student Admitted from unrecognized/Open School",
  "Profile Not Created by Current School in Previous Year",
  "Profile Not Created by Previous School in Previous Year",
  "Student from Other Country",
];

const CLASS_MAP = {
  2: "II",
  3: "III",
  4: "IV",
  5: "V",
  6: "VI",
  7: "VII",
  8: "VIII",
  9: "IX",
  10: "X",
  11: "XI",
  12: "XII",
  II: "II",
  III: "III",
  IV: "IV",
  V: "V",
  VI: "VI",
  VII: "VII",
  VIII: "VIII",
  IX: "IX",
  X: "X",
  XI: "XI",
  XII: "XII",
};

const withCurrent = (options, value) => {
  const current = String(value || "").trim();
  if (!current || options.includes(current)) return options;
  return [current, ...options];
};

const genderLabel = (value) => {
  const text = String(value || "").trim().toUpperCase();
  if (["M", "MALE", "1", "1-MALE"].includes(text)) return "1-Male";
  if (["F", "FEMALE", "2", "2-FEMALE"].includes(text)) return "2-Female";
  if (["T", "TRANSGENDER", "3", "3-TRANSGENDER"].includes(text)) return "3-Transgender";
  return String(value || "").trim();
};

const cwsnLabel = (value) => {
  const text = String(value || "").trim().toUpperCase();
  if (["Y", "YES", "1", "1-YES"].includes(text)) return "1-Yes";
  return "2-No";
};

const classLabel = (value) => {
  const text = String(value || "").trim().toUpperCase();
  return CLASS_MAP[text] || String(value || "").trim();
};

const splitDate = (value) => {
  const match = String(value || "").trim().match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (!match) return { dd: "", mm: "", yyyy: "" };
  return {
    dd: match[1].padStart(2, "0"),
    mm: match[2].padStart(2, "0"),
    yyyy: match[3],
  };
};

const joinDate = (dd, mm, yyyy) => {
  if (!dd && !mm && !yyyy) return "";
  return `${dd}/${mm}/${yyyy}`;
};

const headCell = {
  bgcolor: "#fff59d",
  fontWeight: 700,
  fontSize: 10,
  lineHeight: 1.2,
  whiteSpace: "nowrap",
  border: "1px solid #ccc",
  py: 0.5,
  px: 0.75,
};

const bodyCell = {
  fontSize: 11,
  py: 0.35,
  px: 0.5,
  border: "1px solid #eee",
};

const fieldSx = {
  "& .MuiInputBase-input": { fontSize: 11, py: 0.45 },
  "& .MuiSelect-select": { fontSize: 11, py: 0.45 },
};

export default function UdisePreviewV3Modal({
  open,
  onClose,
  previewData,
  rollNos,
  ayId,
}) {
  const [students, setStudents] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [applySameReason, setApplySameReason] = useState(false);
  const [sharedReason, setSharedReason] = useState("");
  const [rollSearch, setRollSearch] = useState("");

  useEffect(() => {
    if (!open) {
      setStudents([]);
      setApplySameReason(false);
      setSharedReason("");
      setRollSearch("");
      return;
    }
    const source = Array.isArray(previewData?.students) ? previewData.students : [];
    setStudents(
      source.map((student) => {
        const dob = splitDate(student?.dob);
        const admission = splitDate(student?.admission_date);
        const aadhaarDigits = String(student?.aadhaar_no || "").replace(/\D/g, "");
        const aadhaarMissing = !aadhaarDigits || aadhaarDigits === "0" || aadhaarDigits === "999999999999";
        return {
          ...student,
          st_roll_no: String(student?.st_roll_no || student?.roll_no || "").trim(),
          class: classLabel(student?.class),
          section: String(student?.section || "").trim().toUpperCase(),
          gender: genderLabel(student?.gender),
          is_cwsn: cwsnLabel(student?.is_cwsn),
          previous_year_note: student?.previous_year_note || "",
          mother_name: student?.mother_name || "",
          father_name: student?.father_name || "",
          guardian_name: student?.guardian_name || "",
          mobile: student?.mobile || "",
          alternate_mobile: student?.alternate_mobile || "",
          aadhaar_no: aadhaarMissing ? "999999999999" : aadhaarDigits.slice(0, 12),
          aadhaar_name: aadhaarMissing ? "" : student?.aadhaar_name || student?.name || "",
          dob_dd: dob.dd,
          dob_mm: dob.mm,
          dob_yyyy: dob.yyyy,
          adm_dd: admission.dd,
          adm_mm: admission.mm,
          adm_yyyy: admission.yyyy,
        };
      })
    );
  }, [open, previewData]);

  const filteredStudents = useMemo(() => {
    const query = rollSearch.trim().toLowerCase();
    const rows = students.map((student, index) => ({ student, index }));
    if (!query) return rows;
    return rows.filter(({ student }) =>
      String(student?.st_roll_no || "")
        .toLowerCase()
        .includes(query)
    );
  }, [students, rollSearch]);

  const applyReasonToAll = (reason) => {
    setSharedReason(reason);
    setStudents((prev) =>
      prev.map((student) => ({ ...student, previous_year_note: reason }))
    );
  };

  const handleSameReasonCheck = (checked) => {
    setApplySameReason(checked);
    if (!checked) return;
    const current =
      sharedReason ||
      students.find((student) => student.previous_year_note)?.previous_year_note ||
      "";
    applyReasonToAll(current);
  };

  const updateStudent = (index, field, value) => {
    if (applySameReason && field === "previous_year_note") {
      applyReasonToAll(value);
      return;
    }
    setStudents((prev) =>
      prev.map((student, studentIndex) =>
        studentIndex === index ? { ...student, [field]: value } : student
      )
    );
  };

  const downloadBlob = async (response) => {
    if (response?.code) {
      toast.error(response?.message || "Failed to export UDISE V3");
      return false;
    }
    const blob = response?.data;
    if (!(blob instanceof Blob) || blob.type?.includes("application/json")) {
      toast.error("Failed to export UDISE V3");
      return false;
    }
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "udise_export_v3.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return true;
  };

  const handleExport = async () => {
    setIsExporting(true);
    const response = await exportUdiseV3({
      roll_nos: rollNos,
      ay_id: ayId,
      form_meta: previewData?.form_meta || {},
      students: students.map((student) => ({
        ...student,
        dob: joinDate(student.dob_dd, student.dob_mm, student.dob_yyyy),
        admission_date: joinDate(student.adm_dd, student.adm_mm, student.adm_yyyy),
      })),
    });
    setIsExporting(false);
    const ok = await downloadBlob(response);
    if (ok) {
      toast.success("UDISE Excel V3 downloaded");
      onClose?.();
    }
  };

  const selectField = (index, field, value, options, width = 100) => (
    <TextField
      select
      size="small"
      value={value || ""}
      onChange={(e) => updateStudent(index, field, e.target.value)}
      SelectProps={{ displayEmpty: true }}
      sx={{ width, ...fieldSx }}
    >
      <MenuItem value="">
        <em>Select</em>
      </MenuItem>
      {withCurrent(options, value).map((option) => (
        <MenuItem key={option} value={option}>
          {option}
        </MenuItem>
      ))}
    </TextField>
  );

  const textField = (index, field, value, width = 110) => (
    <TextField
      size="small"
      value={value || ""}
      onChange={(e) => updateStudent(index, field, e.target.value)}
      sx={{ width, ...fieldSx }}
    />
  );

  const udiseCode = previewData?.form_meta?.udise_code || "19170106413";

  return (
    <Dialog
      open={open}
      onClose={isExporting ? undefined : onClose}
      fullWidth
      maxWidth="xl"
      PaperProps={{ sx: { height: "92vh" } }}
    >
      <DialogTitle sx={{ py: 1.25, fontSize: 16, pb: 0.5 }}>
        UDISE Preview V3
      </DialogTitle>
      <DialogContent dividers sx={{ fontSize: 12, pt: 1.5 }}>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            mb: 1.5,
          }}
        >
          <Typography
            variant="body2"
            sx={{ fontSize: 12, flex: 1, minWidth: 220 }}
          >
            Same columns as the Excel file. Tick the Reason box to use one
            reason for every student. Roll No is only for reference (not
            exported).
          </Typography>
          <TextField
            size="medium"
            label="Search Roll No"
            value={rollSearch}
            onChange={(e) => setRollSearch(e.target.value)}
            placeholder="Type roll no..."
            InputLabelProps={{ shrink: true }}
            sx={{
              width: { xs: "100%", sm: 320 },
              minWidth: 280,
              bgcolor: "background.paper",
              "& .MuiInputBase-input": { fontSize: 14, py: 1.1 },
              "& .MuiInputLabel-root": { fontSize: 14 },
            }}
          />
        </Box>
        <TableContainer sx={{ maxHeight: "68vh", border: "1px solid #ccc" }}>
          <Table stickyHeader size="small" sx={{ width: "max-content" }}>
            <TableHead>
              <TableRow>
                {[
                  ["Sl No", 46],
                  ["UDISE CODE", 108],
                  ["CLASS", 72],
                  ["SECTION", 68],
                  ["Name of Student", 156],
                  ["Gender", 108],
                  ["DOB DD", 52],
                  ["DOB MM", 52],
                  ["DOB YYYY", 64],
                  ["Mother's Name", 128],
                  ["Father's Name", 128],
                  ["Guardian's Name", 128],
                  ["Aadhaar Number", 118],
                  ["Name as per Aadhaar", 140],
                  ["Adm DD", 52],
                  ["Adm MM", 52],
                  ["Adm YYYY", 64],
                  ["Mobile Number", 108],
                  ["Alternate Mobile", 108],
                  ["Is_CWSN", 84],
                  ["Roll No", 96],
                ].map(([label, width]) => (
                  <TableCell key={label} sx={{ ...headCell, width }}>
                    {label}
                  </TableCell>
                ))}
                <TableCell sx={{ ...headCell, width: 220 }}>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                    <span>Reason</span>
                    <FormControlLabel
                      sx={{ m: 0, "& .MuiFormControlLabel-label": { fontSize: 10 } }}
                      control={
                        <Checkbox
                          size="small"
                          checked={applySameReason}
                          onChange={(e) => handleSameReasonCheck(e.target.checked)}
                          sx={{ p: 0.25 }}
                        />
                      }
                      label="Same for all"
                    />
                    {applySameReason ? (
                      <TextField
                        select
                        size="small"
                        value={sharedReason}
                        onChange={(e) => applyReasonToAll(e.target.value)}
                        SelectProps={{ displayEmpty: true }}
                        sx={fieldSx}
                      >
                        <MenuItem value="">
                          <em>Select</em>
                        </MenuItem>
                        {REASONS.map((option) => (
                          <MenuItem key={option} value={option} sx={{ fontSize: 12 }}>
                            {option}
                          </MenuItem>
                        ))}
                      </TextField>
                    ) : null}
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStudents.map(({ student, index }, rowIndex) => (
                <TableRow key={student?.st_id || student?.st_roll_no || index}>
                  <TableCell sx={bodyCell}>{rowIndex + 1}</TableCell>
                  <TableCell sx={{ ...bodyCell, whiteSpace: "nowrap" }}>{udiseCode}</TableCell>
                  <TableCell sx={{ ...bodyCell, width: 72 }}>
                    {selectField(index, "class", student.class, CLASSES, 64)}
                  </TableCell>
                  <TableCell sx={{ ...bodyCell, width: 68 }}>
                    {selectField(index, "section", student.section, SECTIONS, 58)}
                  </TableCell>
                  <TableCell sx={{ ...bodyCell, width: 156 }}>
                    {textField(index, "name", student.name, 148)}
                  </TableCell>
                  <TableCell sx={{ ...bodyCell, width: 108 }}>
                    {selectField(index, "gender", student.gender, GENDERS, 100)}
                  </TableCell>
                  <TableCell sx={bodyCell}>{textField(index, "dob_dd", student.dob_dd, 44)}</TableCell>
                  <TableCell sx={bodyCell}>{textField(index, "dob_mm", student.dob_mm, 44)}</TableCell>
                  <TableCell sx={bodyCell}>{textField(index, "dob_yyyy", student.dob_yyyy, 56)}</TableCell>
                  <TableCell sx={bodyCell}>{textField(index, "mother_name", student.mother_name, 120)}</TableCell>
                  <TableCell sx={bodyCell}>{textField(index, "father_name", student.father_name, 120)}</TableCell>
                  <TableCell sx={bodyCell}>{textField(index, "guardian_name", student.guardian_name, 120)}</TableCell>
                  <TableCell sx={bodyCell}>{textField(index, "aadhaar_no", student.aadhaar_no, 110)}</TableCell>
                  <TableCell sx={bodyCell}>{textField(index, "aadhaar_name", student.aadhaar_name, 132)}</TableCell>
                  <TableCell sx={bodyCell}>{textField(index, "adm_dd", student.adm_dd, 44)}</TableCell>
                  <TableCell sx={bodyCell}>{textField(index, "adm_mm", student.adm_mm, 44)}</TableCell>
                  <TableCell sx={bodyCell}>{textField(index, "adm_yyyy", student.adm_yyyy, 56)}</TableCell>
                  <TableCell sx={bodyCell}>{textField(index, "mobile", student.mobile, 100)}</TableCell>
                  <TableCell sx={bodyCell}>{textField(index, "alternate_mobile", student.alternate_mobile, 100)}</TableCell>
                  <TableCell sx={{ ...bodyCell, width: 84 }}>
                    {selectField(index, "is_cwsn", student.is_cwsn, CWSN, 76)}
                  </TableCell>
                  <TableCell
                    sx={{
                      ...bodyCell,
                      width: 96,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {student.st_roll_no || "—"}
                  </TableCell>
                  <TableCell sx={{ ...bodyCell, width: 220 }}>
                    {selectField(index, "previous_year_note", student.previous_year_note, REASONS, 210)}
                  </TableCell>
                </TableRow>
              ))}
              {!filteredStudents.length ? (
                <TableRow>
                  <TableCell colSpan={22}>
                    <Typography align="center" color="text.secondary">
                      {students.length
                        ? "No student matched this roll no"
                        : "No students selected"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Showing {filteredStudents.length} of {students.length} student
            {students.length === 1 ? "" : "s"}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isExporting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleExport}
          disabled={isExporting || !students.length}
        >
          {isExporting ? <CircularProgress size={22} color="inherit" /> : "Export Excel"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

UdisePreviewV3Modal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  previewData: PropTypes.object,
  rollNos: PropTypes.string,
  ayId: PropTypes.number,
};
