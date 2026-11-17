import PropTypes from "prop-types";
import { Box, Typography, Tooltip, Chip } from "@mui/material";
import Iconify from "../../../../../components/iconify/iconify";

const BASE_STEPS = [
  {
    key: "Pending",
    label: "Form Fee",
    icon: "mdi:cash-multiple",
    side: "Parent",
    sideNote: "Parent must pay the form / application fee",
    parentGets: "Application / form fee payment link",
  },
  {
    key: "Applied",
    label: "Form Fee Paid",
    icon: "mdi:file-document-check-outline",
    side: "School",
    sideNote: "School sets / schedules interview",
    parentGets: "Form submitted; waiting for interview",
  },
  {
    key: "Interview",
    label: "Interview",
    icon: "mdi:calendar-account",
    side: "School",
    sideNote: "School conducts interview and marks result",
    parentGets: "Interview date & time WhatsApp",
  },
  {
    key: "Selected",
    label: "Selected",
    icon: "mdi:account-check-outline",
    side: "Parent",
    sideNote: "Parent must pay the admission fee",
    parentGets: "Admission fee payment link",
  },
  {
    key: "Documents",
    label: "Adm. Fee Paid",
    icon: "mdi:form-select",
    side: "Parent",
    sideNote: "Parent fills Complete Form and prepares documents",
    parentGets: "Complete Form / Documents WhatsApp",
  },
  {
    key: "Submitted",
    label: "Docs Done",
    icon: "mdi:folder-check-outline",
    side: "School",
    sideNote: "Parent submitted docs; school reviews / marks completed",
    parentGets: "Documents in progress / submitted",
  },
  {
    key: "Admitted",
    label: "Admitted",
    icon: "mdi:school-outline",
    side: "School",
    sideNote: "School adds student to school",
    parentGets: "Student added to school",
  },
];

const WRITTEN_TEST_STEP = {
  key: "WrittenTest",
  label: "Written Test",
  icon: "mdi:file-document-edit-outline",
  side: "School",
  sideNote: "School schedules written test (Class 2–9 & 11)",
  parentGets: "Written test date & time WhatsApp",
};

const WRITTEN_TEST_CLASSES = [
  "class_2",
  "class_3",
  "class_4",
  "class_5",
  "class_6",
  "class_7",
  "class_8",
  "class_9",
  "class_11",
];

const buildSteps = (needsWrittenTest) => {
  if (!needsWrittenTest) {
    return BASE_STEPS;
  }
  const steps = [...BASE_STEPS];
  const appliedIdx = steps.findIndex((s) => s.key === "Applied");
  const withNote = {
    ...steps[appliedIdx],
    sideNote: "School schedules written test",
    parentGets: "Form submitted; waiting for written test",
  };
  steps[appliedIdx] = withNote;
  steps.splice(appliedIdx + 1, 0, WRITTEN_TEST_STEP);
  return steps;
};

const buildStatusIndex = (steps) => {
  const index = {};
  steps.forEach((step, i) => {
    index[step.key] = i;
  });
  // Completed shares Docs Done index
  if (index.Submitted != null) {
    index.Completed = index.Submitted;
  }
  // Rejected / NotInterested map to Interview step when present
  if (index.Interview != null) {
    index.Rejected = index.Interview;
    index.NotInterested = index.Interview;
  }
  return index;
};

const AdmissionStatusBar = ({ status, studentClass }) => {
  const cls = String(studentClass || "")
    .trim()
    .toLowerCase();
  const needsWrittenTest = WRITTEN_TEST_CLASSES.includes(cls);
  const STEPS = buildSteps(needsWrittenTest);
  const STATUS_INDEX = buildStatusIndex(STEPS);

  const raw = String(status || "").replace(/^form\s*status\s*:\s*/i, "").trim();
  const activeIndex = STATUS_INDEX[raw] ?? 0;
  const isRejected = raw === "Rejected";
  const isNotInterested = raw === "NotInterested";
  const currentStep = STEPS[Math.min(activeIndex, STEPS.length - 1)];

  const currentSide = isRejected || isNotInterested ? "School" : currentStep?.side;
  const currentSideNote = isRejected
    ? "School marked rejected"
    : isNotInterested
      ? "School marked not interested"
      : currentStep?.sideNote;

  return (
    <Box
      sx={{
        width: "100%",
        mb: 2,
        px: { xs: 1, md: 2 },
        py: 1.5,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: { xs: 0.5, sm: 1 },
          overflowX: "auto",
          pb: 0.5,
        }}
      >
        {STEPS.map((step, index) => {
          const done = index < activeIndex && !isRejected && !isNotInterested;
          const active = index === activeIndex;
          const muted = index > activeIndex;
          const isParentSide = step.side === "Parent";

          let circleBg = "grey.200";
          let circleColor = "text.secondary";
          let labelColor = "text.secondary";

          if (done) {
            circleBg = "success.main";
            circleColor = "common.white";
            labelColor = "success.dark";
          } else if (active) {
            if (isRejected) {
              circleBg = "error.main";
              circleColor = "common.white";
              labelColor = "error.main";
            } else if (isNotInterested) {
              circleBg = "warning.main";
              circleColor = "common.white";
              labelColor = "warning.dark";
            } else {
              circleBg = "primary.main";
              circleColor = "common.white";
              labelColor = "primary.main";
            }
          } else if (muted) {
            circleBg = "grey.100";
            circleColor = "grey.400";
            labelColor = "grey.400";
          }

          return (
            <Box
              key={step.key}
              sx={{
                flex: 1,
                minWidth: { xs: 68, sm: 84 },
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                position: "relative",
              }}
            >
              {index < STEPS.length - 1 && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 18,
                    left: "50%",
                    width: "100%",
                    height: 3,
                    bgcolor:
                      index < activeIndex && !isRejected && !isNotInterested
                        ? "success.main"
                        : "grey.200",
                    zIndex: 0,
                  }}
                />
              )}

              <Tooltip
                title={`${step.label} · ${step.side} side — ${step.sideNote}`}
                arrow
                placement="top"
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    bgcolor: circleBg,
                    color: circleColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1,
                    border: active ? "2px solid" : "2px solid transparent",
                    borderColor: active ? circleBg : "transparent",
                    boxShadow: active ? 2 : 0,
                  }}
                >
                  <Iconify
                    icon={
                      done
                        ? "mdi:check-bold"
                        : isRejected && active
                          ? "mdi:close-thick"
                          : step.icon
                    }
                    width={20}
                  />
                </Box>
              </Tooltip>

              <Typography
                sx={{
                  mt: 0.75,
                  fontSize: { xs: 10, sm: 11 },
                  fontWeight: active ? 700 : 500,
                  color: labelColor,
                  textAlign: "center",
                  lineHeight: 1.2,
                  px: 0.25,
                }}
              >
                {step.label}
              </Typography>

              <Typography
                sx={{
                  mt: 0.35,
                  fontSize: 9,
                  fontWeight: active ? 700 : 500,
                  color: muted
                    ? "grey.400"
                    : isParentSide
                      ? "info.dark"
                      : "secondary.dark",
                  textAlign: "center",
                  lineHeight: 1,
                }}
              >
                {step.side}
              </Typography>
            </Box>
          );
        })}
      </Box>

      <Box
        sx={{
          mt: 1.25,
          px: 1.25,
          py: 1,
          borderRadius: 1,
          bgcolor: isRejected
            ? "error.lighter"
            : isNotInterested
              ? "warning.lighter"
              : "primary.lighter",
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 700,
              color: isRejected
                ? "error.dark"
                : isNotInterested
                  ? "warning.dark"
                  : "primary.dark",
            }}
          >
            Now:{" "}
            {isRejected
              ? "Rejected"
              : isNotInterested
                ? "Not Interested"
                : currentStep?.label}
          </Typography>

          <Chip
            size="small"
            label={
              currentSide === "Parent" ? "Parent side" : "School side"
            }
            color={currentSide === "Parent" ? "info" : "secondary"}
            sx={{ height: 22, fontWeight: 700, fontSize: 11 }}
          />
        </Box>

        <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
          At this stage →{" "}
          <Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
            {currentSideNote}
          </Box>
        </Typography>

        <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
          Parent WhatsApp →{" "}
          <Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
            {isRejected
              ? "No progress WhatsApp"
              : isNotInterested
                ? "Marked not interested"
                : currentStep?.parentGets}
          </Box>
        </Typography>
      </Box>
    </Box>
  );
};

AdmissionStatusBar.propTypes = {
  status: PropTypes.string,
  studentClass: PropTypes.string,
};

export default AdmissionStatusBar;
