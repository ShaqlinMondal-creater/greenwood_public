import PropTypes from "prop-types";
import { PrintOutlined } from "@mui/icons-material";
import {
  Box,
  Button,
  IconButton,
  Input,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { memo } from "react";

const isOffRollStudent = (student) => String(student?.st_on_roll ?? "1") !== "1";
const isExternalStudent = (student) =>
  String(student?.st_external ?? "0") === "1";

const AGGREGATE_COMPONENT_NAMES = {
  "english aggregate": [
    "English Language",
    "English Literature",
    "English I",
    "English II",
  ],
  "english average": [
    "English Language",
    "English Literature",
    "English I",
    "English II",
  ],
  "science aggregate": ["Physics", "Chemistry", "Biology", "Science"],
  "social studies aggregate": [
    "History",
    "Geography",
    "Civics",
    "Social Studies",
  ],
};

const toNumericMark = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const text = String(value).trim();
  if (!/^\d+$/.test(text)) return null;
  return Number(text);
};

const resolveMarkValue = ({
  stId,
  subjectId,
  reportList,
  editedMarks,
  formData,
}) => {
  const cellKey = `${stId}-${formData?.cg_id?.id}-${formData?.term?.term}-${subjectId}`;
  if (
    Object.prototype.hasOwnProperty.call(editedMarks || {}, cellKey) &&
    editedMarks[cellKey] !== undefined
  ) {
    return editedMarks[cellKey];
  }

  const subjectMark = (reportList?.marks || []).find((mark) => {
    const parts = String(mark?.id || "").split("-");
    const studentId = parts[0];
    const subjectIdRaw = parts[parts.length - 1] || "";
    const m = String(subjectIdRaw).match(/^(\d+)(\D*)$/) || [];
    const num = m[1] || "";
    const suffix = m[2] || "";
    return (
      String(studentId) === String(stId) &&
      num &&
      Number(num) === Number(subjectId) &&
      !suffix
    );
  });

  return subjectMark?.marks ?? "";
};

const computeAggregateDisplay = ({
  student,
  headCell,
  reportList,
  editedMarks,
  formData,
}) => {
  if (headCell?.type !== "A") return null;

  const subjects = reportList?.subjects || [];
  const aggSubject =
    subjects.find(
      (item) => String(item?.subject_id) === String(headCell?.id),
    ) || null;
  if (!aggSubject) return null;

  let componentIds = [];
  const init = String(aggSubject?.subj_init || "").trim();
  if (init) {
    componentIds = init
      .split(",")
      .map((id) => Number(String(id).trim()))
      .filter((id) => id > 0);
  }

  if (!componentIds.length) {
    const aggName = String(aggSubject?.subject_name || "")
      .trim()
      .toLowerCase();
    let componentNames = AGGREGATE_COMPONENT_NAMES[aggName] || [];
    if (!componentNames.length) {
      const match = String(aggSubject?.subject_name || "").match(
        /^(.*)\s+(aggregate|average)$/i,
      );
      if (match?.[1]) {
        const prefix = match[1].trim();
        componentNames = subjects
          .filter((item) => item?.type !== "A")
          .map((item) => String(item?.subject_name || "").trim())
          .filter(
            (name) => name === prefix || name.startsWith(`${prefix} `),
          );
      }
    }
    componentIds = subjects
      .filter((item) => item?.type !== "A" && item?.type === "M")
      .filter((item) =>
        componentNames.includes(String(item?.subject_name || "").trim()),
      )
      .map((item) => Number(item?.subject_id))
      .filter((id) => id > 0);
  }

  componentIds = [...new Set(componentIds)];
  if (!componentIds.length) return null;

  let sum = 0;
  let hasAny = false;
  componentIds.forEach((subjectId) => {
    const value = resolveMarkValue({
      stId: student?.st_id,
      subjectId,
      reportList,
      editedMarks,
      formData,
    });
    const numeric = toNumericMark(value);
    if (numeric !== null) {
      sum += numeric;
      hasAny = true;
    }
  });

  return hasAny ? sum : "";
};

const StatusChip = ({ label }) => (
  <Typography
    component="span"
    sx={{
      fontSize: "0.65rem",
      fontWeight: 700,
      color: "text.secondary",
      border: "1px solid #bdbdbd",
      borderRadius: 0.5,
      px: 0.5,
      py: 0.1,
      whiteSpace: "nowrap",
    }}
  >
    {label}
  </Typography>
);

const MarksGradeEntryTableRow = ({
  student,
  rowIndex,
  headLabel,
  reportList,
  handlePrint,
  formData,
  editedMarks,
  handleMarksChange,
  handleMarksBlur,
  handleInputTab,
  lockStatusLoading,
  verifiedStatusLoading,
  studentRemarks,
  onOpenRemarks,
}) => {
  const isExternal = isExternalStudent(student);
  const isOffRoll = isOffRollStudent(student);
  const isDisabledRow = isExternal || isOffRoll;
  const rowLocked =
    isDisabledRow ||
    reportList?.term_status !== "pending" ||
    lockStatusLoading ||
    verifiedStatusLoading;

  return (
    <TableRow
      sx={{
        bgcolor: isDisabledRow ? "#f0f0f0" : "inherit",
        opacity: isDisabledRow ? 0.75 : 1,
      }}
    >
      {headLabel?.map((headCell, colIndex) => {
        if (colIndex < 3) {
          return (
            <TableCell
              key={headCell?.id + colIndex}
              align="left"
              sx={{
                border: "2px solid #B9B9B9",
                position: "sticky",
                left: colIndex === 0 ? 0 : colIndex === 1 ? 60 : 160, // Adjust based on column widths
                zIndex: 1,
                background: isDisabledRow ? "#ececec" : "#f5f5f5", // Prevent overlap transparency
                minWidth: colIndex === 0 ? 60 : 100, // Set min-width for fixed columns
                color: isDisabledRow ? "text.secondary" : "inherit",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                {colIndex === 0 ? rowIndex + 1 : student?.[headCell?.id]}
                {isOffRoll && colIndex === 2 && <StatusChip label="Off Roll" />}
                {isExternal && colIndex === 2 && <StatusChip label="External" />}
                {reportList?.term_status === "verified" && colIndex === 2 && (
                  <IconButton
                    onClick={() => handlePrint(student?.st_id, rowIndex)}
                  >
                    <PrintOutlined size="small" color="primary" />
                    {/* )} */}
                  </IconButton>
                )}
              </Box>
            </TableCell>
          );
        }

        if (headCell?.id === "remarks") {
          const remark = studentRemarks?.[String(student?.st_id)] || {};
          const count = Array.isArray(remark.remark_ids)
            ? remark.remark_ids.length
            : 0;
          const preview = remark.remark_text || "";
          const locked = rowLocked;

          return (
            <TableCell
              key={headCell?.id + colIndex}
              align="center"
              sx={{
                border: "2px solid #B9B9B9",
                padding: "4px",
                bgcolor: locked ? "#f5f5f5" : "white",
                minWidth: 140,
              }}
            >
              <Tooltip title={preview || "Select remarks"} arrow>
                <Button
                  size="small"
                  variant={count ? "contained" : "outlined"}
                  color={count ? "primary" : "inherit"}
                  onClick={() => !isDisabledRow && onOpenRemarks?.(student)}
                  disabled={isDisabledRow}
                  sx={{
                    minWidth: 112,
                    px: 1,
                    py: 0.25,
                    fontSize: "0.75rem",
                    textTransform: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  {count ? `${count} selected` : locked ? "View" : "Select"}
                </Button>
              </Tooltip>
            </TableCell>
          );
        }

        const subjectMark = (reportList?.marks || []).find((mark) => {
          const parts = String(mark?.id || "").split("-");
          const studentId = parts[0];
          const subjectIdRaw = parts[parts.length - 1] || "";

          const parseParts = (id) => {
            const m = String(id).match(/^(\d+)(\D*)$/) || [];
            return { num: m[1] || "", suffix: m[2] || "" };
          };

          const a = parseParts(subjectIdRaw);
          const b = parseParts(headCell?.id);

          const sameStudent = String(studentId) === String(student?.st_id);
          const sameNumber =
            a.num && b.num && Number(a.num) === Number(b.num);
          // if headCell has a suffix (e.g., "P"), require suffix match;
          // otherwise allow matching any suffix for the same numeric subject.
          const suffixMatches = b.suffix ? a.suffix === b.suffix : true;

          return sameStudent && sameNumber && suffixMatches;
        });

        const cellKey = `${student?.st_id}-${formData?.cg_id?.id}-${formData?.term?.term}-${headCell?.id}`;
        const aggregateValue = computeAggregateDisplay({
          student,
          headCell,
          reportList,
          editedMarks,
          formData,
        });
        const markValue =
          aggregateValue !== null
            ? aggregateValue
            : editedMarks[cellKey] ?? subjectMark?.marks ?? "";

        return (
          <TableCell
            key={headCell?.id + colIndex}
            align="center"
            sx={{
              border: "2px solid #B9B9B9",
              padding: "0px",
              bgcolor: rowLocked ? "#f5f5f5" : "white",
            }}
          >
            {rowLocked ? (
              <Typography>{markValue || ""}</Typography>
            ) : (
              <Input
                disableUnderline
                // type={
                //   headCell?.type === "M" ? "number" : "text"
                // }
                disabled={headCell?.type === "A"}
                value={
                  markValue === null || markValue === undefined
                    ? ""
                    : String(markValue)
                }
                onFocus={(e) => {
                  try {
                    e.target.select && e.target.select();
                  } catch {
                    // ignore
                  }
                }}
                onChange={(e) =>
                  handleMarksChange(
                    student?.st_id,
                    headCell?.id,
                    headCell?.type,
                    e
                  )
                }
                onBlur={(e) =>
                  handleMarksBlur(
                    student?.st_id,
                    headCell?.id,
                    headCell?.type,
                    e
                  )
                }
                inputProps={{
                  "data-student": student?.st_id,
                  "data-subject": headCell?.id,
                  "data-type": headCell?.type,
                  onKeyDown: (e) =>
                    handleInputTab(
                      e,
                      student?.st_id,
                      headCell?.id,
                      headCell.type
                    ),
                }}
                sx={{
                  width: "100%",
                  textAlign: "center",
                  "& .MuiInputBase-input": {
                    textAlign: "center",
                  },
                  "& .MuiInputBase-input.Mui-disabled": {
                    color: "#2E7D32",
                    opacity: 1, // override MUI's default 0.38 opacity
                    WebkitTextFillColor: "#2E7D32", // fix for WebKit browsers like Chrome/Safari
                  },
                }}
              />
            )}
          </TableCell>
        );
      })}
    </TableRow>
  );
};

MarksGradeEntryTableRow.propTypes = {
  student: PropTypes.object,
  headCells: PropTypes.array,
  headLabel: PropTypes.array,
  rowIndex: PropTypes.number,
  handlePrint: PropTypes.func,
  handleInputTab: PropTypes.func,
  handleMarksChange: PropTypes.func,
  handleMarksBlur: PropTypes.func,
  editedMarks: PropTypes.object,
  reportList: PropTypes.object,
  formData: PropTypes.object,
  lockStatusLoading: PropTypes.bool,
  verifiedStatusLoading: PropTypes.bool,
  studentRemarks: PropTypes.object,
  onOpenRemarks: PropTypes.func,
};

export default memo(MarksGradeEntryTableRow);
