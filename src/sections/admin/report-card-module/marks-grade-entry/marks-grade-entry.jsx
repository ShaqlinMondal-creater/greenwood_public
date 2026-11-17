import { useEffect, useState, useCallback } from "react";

import Card from "@mui/material/Card";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import Typography from "@mui/material/Typography";
import TableContainer from "@mui/material/TableContainer";

import {
  getAllAcademicYears,
  getClasses,
  marksGradeStatusChange,
} from "../../../../services/admin/students-management.service";
import useAuth from "../../../../hooks/useAuth";
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
} from "@mui/material";
import { useGetApi } from "../../../../hooks/useGetApi";
import Loader from "../../../../components/loader/loader";
import MessageBox from "../../../../components/error/message-box";
import {
  addMarks,
  addTotalAttendance,
  getMarksDetails,
  getTerms,
  saveStudentRemarks,
} from "../../../../services/admin/report-card-module.service";
import { toast } from "react-toastify";
import { useLocation } from "react-router-dom";
import Iconify from "../../../../components/iconify/iconify";
import AddAggregateColumnModal from "./modals/add-aggregate-column-modal";
import AddSubjectModal from "./modals/add-subject-modal";
import RemarksSelectModal from "./modals/remarks-select-modal";
import { Helmet } from "react-helmet-async";
import ConfirmationDialog from "../../../../components/confirmation-dialog/confirmation-dialog";
import { BASE_URL } from "../../../../services/api.request";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import MarksGradeEntryTableRow from "./marks-grade-entry-table-row";
// ----------------------------------------------------------------------

const HEAD_LABEL = [
  { id: "SN", label: "SN", align: "left" },
  { id: "roll_no", label: "Roll No", align: "left" },
  { id: "name", label: "Name", align: "left" },
];

export default function MarksGradeEntry() {
  const { userInfo, logout } = useAuth();
  const { state } = useLocation();

  const initialState = {
    ay_id: null,
    cg_id: null,
    class_teacher_name: "",
  };

  const [formData, setFormData] = useState(initialState);
  const [headLabel, setHeadLabel] = useState(HEAD_LABEL);
  const [modalOpen, setModalOpen] = useState(false);
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [editedMarks, setEditedMarks] = useState({}); // Stores edited marks
  const [originalMarks, setOriginalMarks] = useState({}); // Store original DB values
  const [lockStatusLoading, setLockStatusLoading] = useState(false);
  const [verifiedStatusLoading, setVerifiedStatusLoading] = useState(false);
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [totalAttendance, setTotalAttendance] = useState(0);
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);
  const [reportDate, setReportDate] = useState(null);
  const [studentRemarks, setStudentRemarks] = useState({});
  const [remarksModal, setRemarksModal] = useState(null);
  const [remarksSaving, setRemarksSaving] = useState(false);

  const handleModalOpen = () => {
    setModalOpen(true);
  };
  const handleModalClose = () => {
    setModalOpen(false);
  };

  const handleSubjectModalOpen = () => {
    if (!formData?.cg_id?.id) {
      toast.info("Select a class first");
      return;
    }
    setSubjectModalOpen(true);
  };

  const handleSubjectModalClose = () => {
    setSubjectModalOpen(false);
  };

  const handleConfirmationModalOpen = () => {
    setConfirmationModalOpen(true);
  };

  const handleConfirmationModalClose = () => {
    setConfirmationModalOpen(false);
  };

  // api to get academicYearList
  const { dataList: academicYearList } = useGetApi({
    apiFunction: getAllAcademicYears,
  });

  // api to get classList
  const { dataList: classList } = useGetApi({
    apiFunction: getClasses,
    body: {
      ay_id: Number(formData?.ay_id?.ay_id) || userInfo?.ay_id,
    },
    dependencies: [formData?.ay_id],
  });

  // api to get terms
  const { dataList: termsList } = useGetApi({
    apiFunction: formData?.cg_id ? getTerms : null,
    body: {
      cg_id: formData?.cg_id?.id,
    },
    dependencies: [formData?.cg_id],
  });

  // api to get marks list
  const {
    dataList: reportList,
    isLoading,
    isError,
    refetch,
    errorMessage,
  } = useGetApi({
    apiFunction: formData?.term && formData?.cg_id ? getMarksDetails : null,
    body: {
      offset: 0,
      limit: 300,
      ay_id: Number(formData?.ay_id?.ay_id) || userInfo?.ay_id,
      term: formData?.term?.term,
      cg_id: formData?.cg_id?.id,
    },
    dependencies: [formData?.term, formData?.cg_id, formData?.ay_id],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "ay_id") {
      setFormData((preValue) => ({
        ...preValue,
        ay_id: value,
        cg_id: null, // Reset class group when academic year changes
        term: null, // Reset term when academic year changes
      }));
      return;
    } else if (name === "cg_id") {
      setFormData((preValue) => ({
        ...preValue,
        cg_id: value,
        term: null, // Reset term when class changes
      }));
      return;
    }
    setFormData((preValue) => ({ ...preValue, [name]: value }));
  };

  const handleTotalAttendanceChange = (e) => {
    const value = e.target.value;
    if (isNaN(value) || value < 0) {
      return;
    }
    setTotalAttendance(Number(value));
  };

  const handleMarksChange = useCallback(
    (st_id, subject_Id, subject_type, event) => {
      const student = reportList?.students?.find(
        (item) => String(item?.st_id) === String(st_id),
      );
      if (
        String(student?.st_external ?? "0") === "1" ||
        String(student?.st_on_roll ?? "1") !== "1"
      ) {
        return;
      }
      const { value } = event.target;
      const custom_key = `${st_id}-${formData?.cg_id?.id}-${formData?.term?.term}-${subject_Id}`;
      let processed = value;

      if (subject_type === "M") {
        const upperVal = String(value).toUpperCase();

        if (upperVal === "") {
          processed = ""; // allow empty
        } else if (/^A$|^B$|^AB$/i.test(upperVal)) {
          processed = upperVal; // only allow Ab
        } else if (/^\d{0,3}$/.test(upperVal)) {
          // allow user to type digits
          const numericValue = Number(upperVal);
          if ((numericValue >= 0 && numericValue <= 100) || subject_Id === 0) {
            processed = upperVal; // keep numeric
          } else {
            return; // reject >100
          }
        } else {
          return; // reject anything else
        }
      } else {
        processed =
          typeof value === "string"
            ? value.toUpperCase() === "AB"
              ? "Ab"
              : value
            : value;
      }

      // Update state for real-time UI change
      setEditedMarks((prev) => ({
        ...prev,
        [custom_key]: processed,
      }));
    },
    [formData, reportList?.students],
  );

  const handleMarksBlur = async (st_id, subject_Id, subject_type, event) => {
    const student = reportList?.students?.find(
      (item) => String(item?.st_id) === String(st_id),
    );
    if (
      String(student?.st_external ?? "0") === "1" ||
      String(student?.st_on_roll ?? "1") !== "1"
    ) {
      return;
    }
    const value = event.target.value;
    const key = `${st_id}-${formData?.cg_id?.id}-${formData?.term?.term}-${subject_Id}`;
    const numericValue = Number(value);

    // Check if the value has changed
    if (value === originalMarks[key]) {
      return; // No change, no API call
    }

    // Validation
    if (subject_type === "M") {
      if (value?.toUpperCase() === "AB") {
        // Allow Ab
        setEditedMarks((prev) => ({
          ...prev,
          [key]: "Ab",
        }));
      } else if (
        (isNaN(numericValue) || numericValue < 0 || numericValue > 100) &&
        subject_Id !== 0
      ) {
        setEditedMarks((prev) => ({
          ...prev,
          [key]: originalMarks[key] ?? "",
        }));
        toast.error("Marks must be a number between 0 and 100, or 'Ab'");
        return;
      }
    } else {
      const validGrades = [
        "",
        "AB",
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "O",
        "R",
        "A+",
      ];
      if (!validGrades?.includes(value?.toUpperCase())) {
        setEditedMarks((prev) => ({
          ...prev,
          [key]: originalMarks[key] ?? "",
        }));
        toast.error("Grades must be A, B, C, D, E, F, O, R, Ab or A+");
        return;
      }
    }

    // Call API on blur (only if changed)
    const response = await addMarks({
      marks_id: key,
      marks:
        !isNaN(Number(value)) && value !== ""
          ? Number(value)
          : value?.toUpperCase() === "AB"
            ? "Ab"
            : value?.toUpperCase(),
    });
    if (response?.code === 200) {
      // Update originalMarks on successful API call
      setOriginalMarks((prev) => ({
        ...prev,
        [key]:
          !isNaN(Number(value)) && value !== ""
            ? Number(value)
            : value?.toUpperCase() === "AB"
              ? "Ab"
              : value?.toUpperCase(),
      }));
    } else if (response?.code === 401) {
      logout(response);
    } else {
      setEditedMarks((prev) => ({
        ...prev,
        [key]: originalMarks[key] ?? "",
      }));
      toast.error(response?.message || "Some error occurred");
    }
  };

  const handleLockStatusChange = async (lockStatus) => {
    setLockStatusLoading(true);
    const response = await marksGradeStatusChange(
      {
        cg_id: formData?.cg_id?.id,
        term: formData?.term?.term?.toString(),
        status: lockStatus,
      },
      formData?.term?.term_name,
    );
    setLockStatusLoading(false);
    if (response?.code === 200) {
      refetch();
      toast.success(response?.message);
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Some error occurred");
    }
  };
  const handleVerifiedStatusChange = async () => {
    setVerifiedStatusLoading(true);
    const response = await marksGradeStatusChange({
      cg_id: formData?.cg_id?.id,
      term: formData?.term?.term?.toString(),
      status: "verified",
    });
    setVerifiedStatusLoading(false);
    if (response?.code === 200) {
      refetch();
      toast.success(response?.message);
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Some error occurred");
    }
  };

  // Handle Tab navigation: move focus vertically (top -> bottom) within the same column
  const handleInputTab = useCallback(
    (e, studentId, subjectId) => {
      const key = e.key;
      const subjectCols = (headLabel || []).slice(3); // subjects start after first 3 fixed cols
      const students = reportList?.students || [];

      // Helper to get element by studentId & subjectId
      const getEl = (stId, subjId) =>
        document.querySelector(
          `input[data-student='${stId}'][data-subject='${subjId}']`,
        );

      // find indices for current position
      const colIndex = subjectCols.findIndex(
        (c) => String(c?.id) === String(subjectId),
      );
      const rowIndex = students.findIndex(
        (s) => String(s?.st_id) === String(studentId),
      );
      const currentEl = getEl(studentId, subjectId);
      if (!currentEl) return;

      // If Tab pressed, keep previous behavior (column-major linear movement)
      if (key === "Tab") {
        e.preventDefault();
        const inputs = [];
        subjectCols.forEach((col) => {
          students.forEach((st) => {
            const el = getEl(st?.st_id, col?.id);
            if (el && !el.disabled) inputs.push(el);
          });
        });
        const curIndex = inputs.indexOf(currentEl);
        if (curIndex === -1) return;
        const direction = e.shiftKey ? -1 : 1;
        const nextIndex = curIndex + direction;
        if (nextIndex >= 0 && nextIndex < inputs.length) {
          const next = inputs[nextIndex];
          next.focus();
          try {
            next.select && next.select();
          } catch {
            // ignore
          }
        }
        return;
      }

      // Arrow keys navigation
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)) {
        e.preventDefault();
        let targetEl = null;

        if (key === "ArrowUp") {
          // same column, previous row
          const prevRow = rowIndex - 1;
          if (prevRow >= 0)
            targetEl = getEl(
              students[prevRow]?.st_id,
              subjectCols[colIndex]?.id,
            );
        } else if (key === "ArrowDown") {
          const nextRow = rowIndex + 1;
          if (nextRow < students.length)
            targetEl = getEl(
              students[nextRow]?.st_id,
              subjectCols[colIndex]?.id,
            );
        } else if (key === "ArrowLeft") {
          // same row, previous column
          const prevCol = colIndex - 1;
          if (prevCol >= 0)
            targetEl = getEl(studentId, subjectCols[prevCol]?.id);
        } else if (key === "ArrowRight") {
          const nextCol = colIndex + 1;
          if (nextCol < subjectCols.length)
            targetEl = getEl(studentId, subjectCols[nextCol]?.id);
        }

        // If target is disabled or not present, try to skip until a valid cell or stop
        if (targetEl && targetEl.disabled) {
          // attempt simple skip: keep moving in same direction up to bounds
          let attempts = 0;
          while (targetEl && targetEl.disabled && attempts < 50) {
            attempts += 1;
            if (key === "ArrowUp") {
              const prevRow = rowIndex - attempts;
              if (prevRow >= 0)
                targetEl = getEl(
                  students[prevRow]?.st_id,
                  subjectCols[colIndex]?.id,
                );
              else break;
            } else if (key === "ArrowDown") {
              const nextRow = rowIndex + attempts;
              if (nextRow < students.length)
                targetEl = getEl(
                  students[nextRow]?.st_id,
                  subjectCols[colIndex]?.id,
                );
              else break;
            } else if (key === "ArrowLeft") {
              const prevCol = colIndex - attempts;
              if (prevCol >= 0)
                targetEl = getEl(studentId, subjectCols[prevCol]?.id);
              else break;
            } else if (key === "ArrowRight") {
              const nextCol = colIndex + attempts;
              if (nextCol < subjectCols.length)
                targetEl = getEl(studentId, subjectCols[nextCol]?.id);
              else break;
            }
          }
        }

        if (targetEl) {
          targetEl.focus();
          try {
            targetEl.select && targetEl.select();
          } catch {
            // ignore
          }
        }
      }
    },
    [headLabel, reportList],
  );

  const handlePrint = async (st_id) => {
    if (!formData.term) {
      toast.error("Please select a term to print the report card.");
      return;
    }
    if (!formData.cg_id) {
      toast.error("Please select a class to print the report card.");
      return;
    }

    const termLabel = String(formData?.term?.term_name || "").trim();
    const term_name =
      termLabel === "Half Yearly" || termLabel === "Selection"
        ? "half-yearly"
        : termLabel === "Final Term" || termLabel === "Pre Board"
          ? "final-term"
          : null;

    if (!term_name) {
      toast.error("Please select a valid term to print the report card.");
      return;
    }

    window.open(
      `${BASE_URL}/reports/${term_name}/${formData?.cg_id?.id}/${st_id}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const handleSampleReport = () => {
    if (!formData.term) {
      toast.error("Please select a term to print the sample report.");
      return;
    }
    if (!formData.cg_id) {
      toast.error("Please select a class to print the sample report.");
      return;
    }

    const termLabel = String(formData?.term?.term_name || "").trim();
    const term_name =
      termLabel === "Half Yearly" || termLabel === "Selection"
        ? "half-yearly"
        : termLabel === "Final Term" || termLabel === "Pre Board"
          ? "final-term"
          : null;

    if (!term_name) {
      toast.error(
        "Sample report is available for Half Yearly / Selection and Final Term / Pre Board.",
      );
      return;
    }

    window.open(
      `${BASE_URL}/reports/${term_name}/${formData?.cg_id?.id}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const handleSaveTotalAttendance = async () => {
    setIsAttendanceLoading(true);
    const response = await addTotalAttendance({
      cg_id: formData?.cg_id?.id,
      term_id: formData?.term?.term,
      total_attendance: Number(totalAttendance) || 0,
      report_date: reportDate ? dayjs(reportDate).format("YYYY-MM-DD") : null,
    });
    setIsAttendanceLoading(false);
    if (response?.code === 200) {
      toast.success(response?.message || "Total attendance sent successfully!");
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Some error occurred.");
    }
  };

  const isRemarksReadOnly =
    reportList?.term_status !== "pending" ||
    lockStatusLoading ||
    verifiedStatusLoading;

  const handleOpenRemarks = (student) => {
    setRemarksModal(student);
  };

  const handleCloseRemarks = () => {
    if (!remarksSaving) {
      setRemarksModal(null);
    }
  };

  const handleSaveRemarks = async (remarkIds) => {
    if (!remarksModal?.st_id || !formData?.cg_id?.id || !formData?.term?.term) {
      toast.error("Select class and term first.");
      return;
    }
    if (String(remarksModal?.st_external ?? "0") === "1") {
      toast.error("Remarks cannot be entered for external students.");
      return;
    }
    if (String(remarksModal?.st_on_roll ?? "1") !== "1") {
      toast.error("Remarks cannot be entered for off-roll students.");
      return;
    }
    setRemarksSaving(true);
    const response = await saveStudentRemarks({
      st_id: remarksModal.st_id,
      cg_id: formData.cg_id.id,
      term: formData.term.term,
      remark_ids: remarkIds,
    });
    setRemarksSaving(false);

    if (response?.code === 200) {
      const stKey = String(remarksModal.st_id);
      setStudentRemarks((prev) => ({
        ...prev,
        [stKey]: {
          remark_ids: response?.data?.remark_ids || remarkIds,
          remark_text: response?.data?.remark_text || "",
        },
      }));
      toast.success(response?.message || "Remarks saved");
      setRemarksModal(null);
    } else if (response?.code === 401) {
      logout(response);
      toast.error(response?.message || "Unauthorized");
    } else {
      toast.error(response?.message || "Failed to save remarks.");
    }
  };

  useEffect(() => {
    if (!reportList?.subjects) return;

    // Extract subject labels
    let newHeadLabels = reportList?.subjects?.map((subject) => {
      console.log(subject?.subject_id, "subject_id checking---");
      return {
        id: subject?.subject_id,
        label: subject?.subject_name,
        type: subject?.type,
      };
    });

    if (reportList?.remark_bank?.groups?.length) {
      newHeadLabels = [
        ...newHeadLabels,
        {
          id: "remarks",
          label: "Remarks",
          type: "R",
          minWidth: 140,
        },
      ];
    }

    setHeadLabel(() => [...HEAD_LABEL, ...newHeadLabels]);
    setTotalAttendance(reportList?.total_attendance || 0);
    setReportDate(
      reportList?.report_date ? dayjs(reportList.report_date) : null,
    );
    setStudentRemarks(reportList?.student_remarks || {});
  }, [reportList]);

  useEffect(() => {
    if (academicYearList?.length > 0) {
      setFormData((preValue) => ({
        ...preValue,
        ay_id: academicYearList?.find(
          (option) => Number(option?.ay_id) === Number(state?.ay_id),
        ) || {
          ay_id: userInfo?.ay_id,
          ay_name: userInfo?.ay_name,
        },
        cg_id: state?.cg_id
          ? { id: state?.cg_id, cg_name: state?.cg_name }
          : null,
        term: state?.terms?.[0],
        class_teacher_name: state?.class_teacher_name || "",
      }));
    }
  }, [academicYearList, state]);

  useEffect(() => {
    if (reportList?.marks) {
      const initialMarks = {};
      reportList?.marks.forEach((mark) => {
        const key = `${mark?.id}`;
        initialMarks[key] = mark?.marks ?? "-"; // Store original DB value
      });
      setOriginalMarks(initialMarks);
    }
  }, [reportList?.marks]); // Update when reportList changes

  useEffect(() => {
    const onKeyDownCapture = (e) => {
      if (e.key === "F1") {
        e.preventDefault();
        // optional: trigger in-app behavior when F1 pressed while focused on an input
        const active = document.activeElement;
        if (active && active.tagName === "INPUT") {
          const stId = active.getAttribute("data-student");
          const subjectId = active.getAttribute("data-subject");
          const subjectType = active.getAttribute("data-type") || "M";
          if (stId && subjectId) {
            // call your existing handler (adjust args as needed)
            handleMarksChange(stId, subjectId, subjectType, {
              target: { value: "Ab" },
            });
          }
        }
      }
    };

    window.addEventListener("keydown", onKeyDownCapture, true); // capture phase
    return () => window.removeEventListener("keydown", onKeyDownCapture, true);
  }, [handleMarksChange]);

  return (
    <>
      <Helmet>
        <title>Marks | GREENWOOD</title>
      </Helmet>
      {/* Search and Filters */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 2,
          my: 2,
        }}
      >
        <Autocomplete
          options={academicYearList || []}
          getOptionLabel={(option) => option?.ay_name || ""}
          renderInput={(params) => (
            <TextField {...params} label="Select Year" size="small" required />
          )}
          value={formData?.ay_id || null}
          onChange={(_, newValue) =>
            handleChange({ target: { name: "ay_id", value: newValue } })
          }
          sx={{ width: "200px", bgcolor: "white" }}
        />

        <Autocomplete
          options={classList || []}
          getOptionLabel={(option) => option?.cg_name || ""}
          renderInput={(params) => (
            <TextField {...params} label="Select Class" size="small" required />
          )}
          value={formData?.cg_id || []}
          onChange={(_, newValue) =>
            handleChange({ target: { name: "cg_id", value: newValue } })
          }
          sx={{ width: "200px", bgcolor: "white" }}
        />

        {formData?.cg_id && (
          <Autocomplete
            options={termsList || []}
            getOptionLabel={(option) => option?.term_name || ""}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Term"
                size="small"
                required
              />
            )}
            value={formData?.term || []}
            onChange={(_, newValue) =>
              handleChange({ target: { name: "term", value: newValue } })
            }
            sx={{ width: "200px", bgcolor: "white" }}
          />
        )}
        <TextField
          label="Total Attendance"
          value={totalAttendance || ""}
          onChange={handleTotalAttendanceChange}
          size="small"
          required
          disabled={
            !formData?.cg_id ||
            !formData?.term ||
            reportList?.term_status !== "pending" ||
            isAttendanceLoading
          }
          sx={{ width: "200px", bgcolor: "white" }}
        />
        <DatePicker
          name="reportDate"
          label="Report Date"
          value={reportDate ? dayjs(reportDate) : null}
          onChange={(newValue) =>
            setReportDate(
              newValue ? dayjs(newValue).format("YYYY-MM-DD") : null,
            )
          }
          disabled={
            !formData?.cg_id ||
            !formData?.term ||
            reportList?.term_status !== "pending" ||
            isAttendanceLoading
          }
          slotProps={{ textField: { size: "small" } }}
          sx={{ width: "200px", bgcolor: "white" }}
        />
        <Button
          variant="contained"
          disabled={
            !formData?.cg_id ||
            !formData?.term ||
            reportList?.term_status !== "pending" ||
            isAttendanceLoading ||
            !totalAttendance
          }
          onClick={handleSaveTotalAttendance}
        >
          {isAttendanceLoading ? <CircularProgress size={24} /> : "Save"}
        </Button>
        <Button
          variant="outlined"
          disabled={!formData?.cg_id || !formData?.term}
          onClick={handleSampleReport}
        >
          Sample Report
        </Button>
      </Box>

      <Card
        sx={{
          p: 2,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          height: "100vh", // Full viewport height
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 4 }}>
          {formData?.ay_id && (
            <Typography
              sx={{
                fontSize: "18px",
                fontWeight: 500,
                color: "primary.main",
              }}
            >
              Academic Year:{" "}
              <Box component="span" sx={{ color: "text.secondary" }}>
                {formData?.ay_id?.ay_name || ""}
              </Box>
            </Typography>
          )}
          {formData?.ay_id && formData?.cg_id && (
            <Divider
              orientation="vertical"
              sx={{ bgcolor: "primary.main", width: "2px", height: "20px" }}
            />
          )}
          {formData?.cg_id && (
            <Typography
              sx={{
                fontSize: "18px",
                fontWeight: 500,
                color: "primary.main",
              }}
            >
              Class:{" "}
              <Box component="span" sx={{ color: "text.secondary" }}>
                {formData?.cg_id?.cg_name || ""}
              </Box>
            </Typography>
          )}
          {formData?.cg_id && formData?.term && (
            <Divider
              orientation="vertical"
              sx={{ bgcolor: "primary.main", width: "2px", height: "20px" }}
            />
          )}
          {formData?.term && (
            <Typography
              sx={{
                fontSize: "18px",
                fontWeight: 500,
                color: "primary.main",
              }}
            >
              Term:{" "}
              <Box component="span" sx={{ color: "text.secondary" }}>
                {formData?.term?.term_name || ""}
              </Box>
            </Typography>
          )}
          {formData?.term && formData?.class_teacher_name && (
            <Divider
              orientation="vertical"
              sx={{ bgcolor: "primary.main", width: "2px", height: "20px" }}
            />
          )}
          {formData?.class_teacher_name && (
            <Typography
              sx={{
                fontSize: "18px",
                fontWeight: 500,
                color: "primary.main",
              }}
            >
              Class Teacher:{" "}
              <Box component="span" sx={{ color: "text.secondary" }}>
                {formData?.class_teacher_name || ""}
              </Box>
            </Typography>
          )}
        </Box>

        {isLoading ? (
          <Loader />
        ) : isError ? (
          <MessageBox errorMessage={errorMessage} />
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              flex: 1, // Take remaining space
              overflow: "hidden", // Prevent overflow issues
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                mb: 1,
              }}
            >
              {reportList?.term_status === "pending" && (
                <Tooltip title="Add aggregate column (combined subjects)">
                  <IconButton onClick={handleModalOpen}>
                    <Iconify icon="oui:aggregate" width={40} color="grey" />
                  </IconButton>
                </Tooltip>
              )}

              {reportList?.term_status &&
                reportList?.term_status !== "verified" && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      ml: "auto",
                    }}
                  >
                    {reportList?.term_status === "pending" && (
                      <Button
                        variant="contained"
                        sx={{ width: "150px" }}
                        onClick={handleSubjectModalOpen}
                      >
                        Add Subject
                      </Button>
                    )}
                    {reportList?.term_status === "pending" ? (
                      <Button
                        variant="contained"
                        sx={{ width: "150px" }}
                        onClick={() => handleLockStatusChange("locked")}
                        disabled={lockStatusLoading}
                      >
                        {lockStatusLoading ? (
                          <CircularProgress size={24} />
                        ) : (
                          `Lock Data`
                        )}
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        sx={{ width: "150px" }}
                        onClick={() => handleLockStatusChange("pending")}
                        disabled={lockStatusLoading || verifiedStatusLoading}
                      >
                        {lockStatusLoading ? (
                          <CircularProgress size={24} />
                        ) : (
                          `Unlock Data`
                        )}
                      </Button>
                    )}
                    <Button
                      variant="contained"
                      sx={{ width: "200px" }}
                      onClick={handleConfirmationModalOpen}
                      disabled={lockStatusLoading || verifiedStatusLoading}
                    >
                      Verify & Confirm
                    </Button>
                  </Box>
                )}
            </Box>

            <TableContainer
              sx={{
                flex: 1, // Take remaining space
                overflowY: "auto", // Enable scrolling
              }}
            >
              <Table
                sx={{
                  minWidth: 800,
                  tableLayout: "auto",
                }}
                stickyHeader
              >
                <TableHead>
                  <TableRow>
                    {headLabel?.map((headCell, index) => {
                      const isRemarks = headCell?.id === "remarks";
                      const vertical = index > 2 && !isRemarks;
                      return (
                      <TableCell
                        key={headCell?.id + index}
                        align={headCell?.align || "center"}
                        sx={{
                          width: headCell?.width,
                          minWidth:
                            headCell?.minWidth || (index < 3 ? 60 : 100), // Default minWidth for fixed/scrollable
                          maxHeight: "200px",
                          whiteSpace: "nowrap",
                          writingMode: vertical ? "vertical-lr" : "initial",
                          transform: vertical ? "rotate(180deg)" : "none",
                          bgcolor: "primary.light",
                          border: "2px solid #B9B9B9",
                          color: headCell?.type === "A" ? "#2E7D32" : "inherit",
                          zIndex: 2,
                          ...(index < 3 && {
                            position: "sticky",
                            left: index === 0 ? 0 : index === 1 ? 60 : 160, // Adjust based on column widths
                            zIndex: 3, // Higher zIndex than body cells
                          }),
                        }}
                      >
                        <Tooltip title={index > 2 ? headCell?.label : ""} arrow>
                          <Typography noWrap>{headCell?.label}</Typography>
                        </Tooltip>
                      </TableCell>
                      );
                    })}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {reportList?.students?.map((student, rowIndex) => (
                    <MarksGradeEntryTableRow
                      key={student?.st_id + rowIndex}
                      student={student}
                      rowIndex={rowIndex}
                      headLabel={headLabel}
                      reportList={reportList}
                      handlePrint={handlePrint}
                      formData={formData}
                      editedMarks={editedMarks}
                      handleMarksChange={handleMarksChange}
                      handleMarksBlur={handleMarksBlur}
                      handleInputTab={handleInputTab}
                      lockStatusLoading={lockStatusLoading}
                      verifiedStatusLoading={verifiedStatusLoading}
                      studentRemarks={studentRemarks}
                      onOpenRemarks={handleOpenRemarks}
                    />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <AddSubjectModal
              open={subjectModalOpen}
              onClose={handleSubjectModalClose}
              refetch={refetch}
              detail={formData}
            />

            <AddAggregateColumnModal
              open={modalOpen}
              onClose={handleModalClose}
              refetch={refetch}
              detail={formData}
            />

            <RemarksSelectModal
              open={Boolean(remarksModal)}
              onClose={handleCloseRemarks}
              student={remarksModal}
              className={formData?.cg_id?.cg_name || ""}
              bankLabel={reportList?.remark_bank?.label || ""}
              groups={reportList?.remark_bank?.groups || []}
              selectedIds={
                studentRemarks?.[String(remarksModal?.st_id)]?.remark_ids || []
              }
              readOnly={
                isRemarksReadOnly ||
                String(remarksModal?.st_external ?? "0") === "1" ||
                String(remarksModal?.st_on_roll ?? "1") !== "1"
              }
              saving={remarksSaving}
              onSave={handleSaveRemarks}
            />

            <ConfirmationDialog
              open={confirmationModalOpen}
              onCancel={handleConfirmationModalClose}
              onConfirm={handleVerifiedStatusChange}
              isLoading={verifiedStatusLoading}
              cancelButtonText="No, Review Again"
              confirmButtonText="Yes, Confirm"
              title="Please confirm: Have you carefully verified the marks?"
              content="Once you proceed, bulk editing of marks for this class will no longer be possible."
            />
          </Box>
        )}
      </Card>
    </>
  );
}
