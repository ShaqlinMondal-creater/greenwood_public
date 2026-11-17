import { memo, useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Popover,
  TextField,
  Typography,
} from "@mui/material";
import { PrintOutlined } from "@mui/icons-material";
import Iconify from "../../../../../components/iconify/iconify";
import {
  printNewAdmissionPdf,
  sendPaymentLinkApi,
  setMarkCompleted,
  setDocumentDateApi,
  setInterviewDateApi,
  setWrittenTestDateApi,
  setWrittenTestStatusApi,
  setInterviewStatusApi,
  setPrinted,
  getRollNoApi, // kept in case you re-introduce it later
} from "../../../../../services/admin/students-management.service";
import useAuth from "../../../../../hooks/useAuth";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { DatePicker, TimePicker } from "@mui/x-date-pickers";
import { CLASS_LIST } from "../../../../../utils/constants";
import { useGetApi } from "../../../../../hooks/useGetApi";

const ActionSection = ({ selectedId, refetch, detail }) => {
  const { logout } = useAuth();

  // Next roll by AY + class/stream/gender (nursery–9 numeric, class 11 prefixed)
  const rollClass = detail?.accepted_class || detail?.class || "";
  const { allResponse, isLoading: defaultRollNoLoading } = useGetApi({
    apiFunction: detail?.ay_id ? getRollNoApi : null,
    body: {
      ay_id: detail?.ay_id,
      class: rollClass,
      gender: detail?.gender || "",
      stream: detail?.stream || "",
      new_admission_id: detail?.id || selectedId || "",
    },
    dependencies: [
      detail?.ay_id,
      detail?.id,
      selectedId,
      rollClass,
      detail?.gender,
      detail?.stream,
    ],
    skip: !detail?.ay_id,
  });

  const [printLoading, setPrintLoading] = useState(false);
  const [markAsPrintedLoading, setMarkAsPrintedLoading] = useState(false); // New state for Mark as Printed
  // const [markAsNotPrintedLoading, setMarkAsNotPrintedLoading] = useState(false);
  const [interviewStatusLoading, setInterviewStatusLoading] = useState(false);
  const [interviewDateLoading, setInterviewDateLoading] = useState(false);
  const [interviewDate, setInterviewDate] = useState(null);
  const [interviewTime, setInterviewTime] = useState(null);
  const [writtenTestDateLoading, setWrittenTestDateLoading] = useState(false);
  const [writtenTestDate, setWrittenTestDate] = useState(null);
  const [writtenTestTime, setWrittenTestTime] = useState(null);
  const [writtenTestAnchorEl, setWrittenTestAnchorEl] = useState(null);
  const [writtenTestStatusLoading, setWrittenTestStatusLoading] = useState(false);
  const [writtenTestStatus, setWrittenTestStatus] = useState("");
  const [writtenTestFailReason, setWrittenTestFailReason] = useState("");
  const [writtenTestStatusAnchorEl, setWrittenTestStatusAnchorEl] =
    useState(null);
  const [dueDate, setDueDate] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [documentsAnchorEl, setDocumentsAnchorEl] = useState(null);
  const [documentDate, setDocumentDate] = useState(null);
  // const [documentTime, setDocumentTime] = useState(null);
  const [documentDateLoading, setDocumentDateLoading] = useState(false);
  // Reschedule document states
  const [rescheduleDate, setRescheduleDate] = useState(null);
  const [rescheduleTime, setRescheduleTime] = useState(null);
  const [rejectionComments, setRejectionComments] = useState("");
  const [interviewStatus, setInterviewStatus] = useState("");
  const [selectedClass, setSelectedClass] = useState(null);

  // New code // payment link popovers + fields
  const [payAnchorEl, setPayAnchorEl] = useState(null);
  const [resendAnchorEl, setResendAnchorEl] = useState(null);
  const [sendAnchorEl, setSendAnchorEl] = useState(null);
  const [paymentPhone, setPaymentPhone] = useState("");
  const [interviewStatusAnchorEl, setInterviewStatusAnchorEl] = useState(null);
  const [markCompletedAnchorEl, setMarkCompletedAnchorEl] = useState(null);

  const [phoneNumbers, setPhoneNumbers] = useState(""); // Store phone number(s)
  const [rollNo, setRollNo] = useState(""); // Store roll number(s)
  const [admittedClassAndSection, setAdmittedClassAndSection] = useState("");
  const [resendLoading, setResendLoading] = useState(false); // To handle loading state
  const [sendLoading, setSendLoading] = useState(false); // To handle loading state for send payment link
  const [paymentLinkLoading, setPaymentLinkLoading] = useState(false); // To handle payment link sending to whatsapp
  const [markCompletedLoading, setMarkCompletedLoading] = useState(false);

  // open/close helpers for payment link popovers
  const handlePayAnchorOpen = (e) => setPayAnchorEl(e.currentTarget);
  const handlePayAnchorClose = () => setPayAnchorEl(null);
  const handleResendAnchorOpen = (e) => setResendAnchorEl(e.currentTarget);
  const handleResendAnchorClose = () => {
    setResendAnchorEl(null);
    setPhoneNumbers("");
    setDueDate("");
  };
  const handleSendAnchorOpen = (e) => setSendAnchorEl(e.currentTarget);
  const handleSendAnchorClose = () => setSendAnchorEl(null);
  const handleMarkCompletedAnchorClose = () => {
    setMarkCompletedAnchorEl(null);
  };
  const handleMarkCompletedAnchorOpen = (e) =>
    setMarkCompletedAnchorEl(e.currentTarget);

  const handleInterviewStatusPopoverOpen = (e) => {
    setInterviewStatusAnchorEl(e.currentTarget);
  };

  const handleInterviewStatusPopoverClose = () => {
    if (interviewStatusLoading) return; // prevent closing while loading
    setInterviewStatusAnchorEl(null);
    setInterviewStatus("");
    setSelectedClass(null);
    setRejectionComments("");
    setDueDate(null);
  };

  // simple WA sender (no backend dependency)
  const handleSendPaymentLinkToWhatsapp = async (phone) => {
    if (!phone) {
      toast.error("Phone number is required");
      return;
    }

    setPaymentLinkLoading(true);
    const response = await sendPaymentLinkApi({
      admission_id: selectedId, // Ensure selectedId is the admission ID
      fee_type: "application_fee",
      phone_numbers: phone, // Comma-separated phone numbers
    });
    setPaymentLinkLoading(false);
    if (response?.code === 200) {
      toast.success(response?.message || "Payment link sent successfully!");
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Some error occurred.");
      return;
    }
    handlePayAnchorClose();
  };

  const handlePrint = async () => {
    setPrintLoading(true);
    const response = await printNewAdmissionPdf({ id: selectedId });
    setPrintLoading(false);

    if (response?.code === 200) {
      const link = document.createElement("a");
      link.href = response?.data?.file_url || "";
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      // Append the link to the document and trigger the download
      document.body.appendChild(link);
      link.click();

      // Remove the link after triggering the download
      document.body.removeChild(link);
      refetch();
      toast.success(response?.message || "File downloaded successfully!");
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Some error occurred.");
    }
  };

  // const handleMarkAsNotPrinted = async (printed) => {
  //   setMarkAsNotPrintedLoading(true);
  //   const response = await setPrinted({ id: selectedId, printed });
  //   setMarkAsNotPrintedLoading(false);

  //   if (response?.code === 200) {
  //     refetch();
  //     toast.success(response?.message || "Print status updated successfully");
  //   } else if (response?.code === 401) {
  //     logout(response);
  //   } else {
  //     toast.error(response?.message || "Some error occurred.");
  //   }
  // };

  // New code for Mark as Printed
  const handleMarkAsPrinted = async () => {
    setMarkAsPrintedLoading(true); // Set loading state

    const response = await setPrinted({ id: selectedId, printed: "1" }); // Mark as Printed

    setMarkAsPrintedLoading(false); // Reset loading state

    if (response?.code === 200) {
      refetch(); // Refetch data to get updated status
      toast.success(response?.message || "Marked as Printed.");
    } else if (response?.code === 401) {
      logout(response); // Handle unauthorized response
    } else {
      toast.error(response?.message || "Some error occurred.");
    }
  };

  const handleInterviewStatus = async () => {
    if (interviewStatus === "Selected") {
      if (!detail?.interview_date) {
        toast.error("Please set Interview Date before marking Selected.");
        return;
      }
      if (!selectedClass?.cg_id) {
        toast.error("Please select a class.");
        return;
      }
    }
    if (
      (interviewStatus === "Rejected" ||
        interviewStatus === "Not Interested") &&
      !(rejectionComments || "").trim()
    ) {
      toast.error("Please enter a reason.");
      return;
    }

    setInterviewStatusLoading(true);
    const response = await setInterviewStatusApi(selectedId, {
      interview_status:
        interviewStatus === "Selected"
          ? "1"
          : interviewStatus === "Rejected"
          ? "2"
          : interviewStatus === "Not Interested"
          ? "3"
          : "",
      ...(interviewStatus === "Selected"
        ? {
            class: selectedClass.cg_id,
            afee_due_date: dueDate ? dayjs(dueDate).format("YYYY-MM-DD") : null,
          }
        : { comments: rejectionComments || "" }),
    });
    setInterviewStatusLoading(false);

    if (response?.code === 200) {
      refetch();
      handleInterviewStatusPopoverClose();
      toast.success(response?.message || "Interview status updated.");
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Some error occurred.");
    }
  };

  const handleAddedToSchool = async () => {
    const trimmedRoll = (rollNo ?? "").toString().trim();
    const trimmedClass = (admittedClassAndSection ?? "").toString().trim();

    if (!trimmedRoll || !trimmedClass) {
      toast.error("Please fill all the fields");
      return;
    }

    setMarkCompletedLoading(true);
    const response = await setMarkCompleted(selectedId, {
      roll_no: trimmedRoll,
      admitted_class: trimmedClass,
      added_to_school: "1",
    });
    setMarkCompletedLoading(false);

    if (response?.code === 200) {
      refetch();
      setRollNo("");
      setAdmittedClassAndSection("");
      handleMarkCompletedAnchorClose();
      toast.success(response?.message || "Student added to school.");
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Some error occurred.");
    }
  };

  const handleSetInterviewDate = async () => {
    // Ensure both date and time are provided
    if (!interviewDate) {
      toast.error("Interview Date is required");
      return;
    }
    if (!interviewTime) {
      toast.error("Interview Time is required");
      return;
    }
    setInterviewDateLoading(true);

    // Call the API to set the interview date and time
    const response = await setInterviewDateApi({
      id: selectedId,
      interview_date:
        interviewDate && interviewTime
          ? dayjs(interviewDate).format("YYYY-MM-DD") +
            " " +
            interviewTime.format("HH:mm:ss") // Combine date and time
          : null,
    });

    setInterviewDateLoading(false);

    if (response?.code === 200) {
      refetch();
      setInterviewDate(null); // Clear date after successful save
      setInterviewTime(null); // Clear time after successful save
      setAnchorEl(null);
      toast.success(response?.message || "Interview schedule saved.");
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Some error occurred.");
    }
  };

  const handleSetWrittenTestDate = async () => {
    if (!writtenTestDate) {
      toast.error("Written Test Date is required");
      return;
    }
    if (!writtenTestTime) {
      toast.error("Written Test Time is required");
      return;
    }
    setWrittenTestDateLoading(true);

    const response = await setWrittenTestDateApi({
      id: selectedId,
      written_test_date:
        dayjs(writtenTestDate).format("YYYY-MM-DD") +
        " " +
        writtenTestTime.format("HH:mm:ss"),
    });

    setWrittenTestDateLoading(false);

    if (response?.code === 200) {
      refetch();
      setWrittenTestDate(null);
      setWrittenTestTime(null);
      setWrittenTestAnchorEl(null);
      toast.success(response?.message || "Written test schedule saved.");
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Some error occurred.");
    }
  };

  const handleWrittenTestStatusPopoverOpen = (e) => {
    setWrittenTestStatusAnchorEl(e.currentTarget);
  };

  const handleWrittenTestStatusPopoverClose = () => {
    if (writtenTestStatusLoading) return;
    setWrittenTestStatusAnchorEl(null);
    setWrittenTestStatus("");
    setWrittenTestFailReason("");
  };

  const handleSetWrittenTestStatus = async () => {
    if (!writtenTestStatus) {
      toast.error("Please select Pass or Fail");
      return;
    }
    if (writtenTestStatus === "Fail" && !writtenTestFailReason?.trim()) {
      toast.error("Reason is required for Fail");
      return;
    }

    setWrittenTestStatusLoading(true);
    const response = await setWrittenTestStatusApi(selectedId, {
      written_test_status: writtenTestStatus === "Pass" ? "1" : "2",
      comments:
        writtenTestStatus === "Fail" ? writtenTestFailReason.trim() : null,
    });
    setWrittenTestStatusLoading(false);

    if (response?.code === 200) {
      refetch();
      handleWrittenTestStatusPopoverClose();
      toast.success(response?.message || "Written test status updated.");
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Some error occurred.");
    }
  };

  const handleSetDocumentDate = async () => {
    // Ensure both date and time are provided
    if (!documentDate) {
      toast.error("Document Date is required");
      return;
    }
    // if (!documentTime) {
    //   toast.error("Document Time is required");
    //   return;
    // }
    setDocumentDateLoading(true);

    // Call the API to set the document date and time
    const response = await setDocumentDateApi({
      id: selectedId,
      // document_date:
      //   documentDate && documentTime
      //     ? dayjs(documentDate).format("YYYY-MM-DD") +
      //       " " +
      //       documentTime.format("HH:mm:ss") // Combine date and time
      //     : null,
      document_date: documentDate
        ? dayjs(documentDate).format("YYYY-MM-DD")
        : null,
    });

    setDocumentDateLoading(false);

    if (response?.code === 200) {
      refetch();
      setDocumentDate(null); // Clear date after successful save
      // setDocumentTime(null); // Clear time after successful save
      setDocumentsAnchorEl(null);
      toast.success(response?.message || "Document schedule saved.");
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Some error occurred.");
    }
  };

  const handleRescheduleInterviewDate = async () => {
    // Ensure both date and time are provided
    if (!rescheduleDate) {
      toast.error("Interview Date is required");
      return;
    }
    if (!rescheduleTime) {
      toast.error("Interview Time is required");
      return;
    }

    setInterviewDateLoading(true);

    // Combine the reschedule date and time into the required format
    const combinedDateTime =
      rescheduleDate && rescheduleTime
        ? dayjs(rescheduleDate).format("YYYY-MM-DD") +
          " " +
          rescheduleTime.format("HH:mm:ss") // Combine date and time
        : null;

    // Call the API to reschedule the interview date and time
    const response = await setInterviewDateApi({
      id: selectedId,
      interview_date: combinedDateTime,
    });

    setInterviewDateLoading(false);

    if (response?.code === 200) {
      refetch();
      setRescheduleDate(null); // Clear date after successful save
      setRescheduleTime(null); // Clear time after successful save
      setAnchorEl(null);
      toast.success(response?.message || "Interview rescheduled successfully.");
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Some error occurred.");
    }
  };

  const handleResendPaymentLink = async () => {
    const trimedPhone = (phoneNumbers ?? "").toString().trim();
    // Validate phone number input
    if (!trimedPhone || !dueDate) {
      toast.error("All fields are required.");
      return;
    }

    // Prepare the data for API call
    const data = {
      admission_id: selectedId, // Ensure selectedId is the admission ID
      fee_type: "admission_fee",
      phone_numbers: trimedPhone,
      afee_due_date: dueDate ? dayjs(dueDate).format("YYYY-MM-DD") : null,
    };

    setResendLoading(true);
    const response = await sendPaymentLinkApi(data);
    setResendLoading(false);

    if (response.code === 200) {
      toast.success("Payment link sent successfully!");
      handleResendAnchorClose(); // Close the popover on success
    } else if (response.code === 401) {
      logout(response);
    } else {
      toast.error(response.message || "Something went wrong!");
    }
  };
  const handleSendPaymentLink = async () => {
    // Validate phone number input
    if (!phoneNumbers) {
      toast.error("Phone number is required.");
      return;
    }

    // Prepare the data for API call
    const data = {
      admission_id: selectedId, // Ensure selectedId is the admission ID
      fee_type: "documents",
      phone_numbers: phoneNumbers, // Comma-separated phone numbers
    };

    setSendLoading(true);
    const response = await sendPaymentLinkApi(data);
    setSendLoading(false);

    if (response.code === 200) {
      toast.success("Link sent successfully!");
      handleSendAnchorClose(); // Close the popover on success
    } else if (response.code === 401) {
      logout(response);
    } else {
      toast.error(response.message || "Something went wrong!");
    }
  };

  const handleAnchorElOpen = (e) => {
    setAnchorEl(e.currentTarget);
  };

  const handleAnchorElClose = () => {
    if (interviewDateLoading) {
      return;
    }
    setAnchorEl(null);
  };

  const handleWrittenTestAnchorOpen = (e) => {
    setWrittenTestAnchorEl(e.currentTarget);
  };

  const handleWrittenTestAnchorClose = () => {
    if (writtenTestDateLoading) {
      return;
    }
    setWrittenTestAnchorEl(null);
  };

  const handleDocumentsAnchorElOpen = (e) => {
    setDocumentsAnchorEl(e.currentTarget);
  };

  const handleDocumentsAnchorElClose = () => {
    if (documentDateLoading) {
      return;
    }
    setDocumentsAnchorEl(null);
  };

  // ---------- status-driven visibility (exact as you specified) ----------
  const raw = (detail?.status || "").trim();
  const normalized = raw.replace(/^form\s*status\s*:\s*/i, "").trim();
  const statusKey = normalized;

  // Class 2–9 & 11: Written Test. Not: Nursery, LKG, UKG, 1, 10, 12.
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
  const admissionClass = String(
    detail?.accepted_class || detail?.class || "",
  )
    .trim()
    .toLowerCase();
  const needsWrittenTest = WRITTEN_TEST_CLASSES.includes(admissionClass);

  const showSendPayment = statusKey === "Pending";
  const showMarkAsPrinted = [
    "Applied",
    "WrittenTest",
    "Interview",
    "Rejected",
    "NotInterested",
    "Selected",
    "Documents",
    "Submitted",
    "Completed",
    "Admitted",
  ].includes(statusKey);
  const showPrint = [
    "Pending",
    "Applied",
    "WrittenTest",
    "Interview",
    "Rejected",
    "NotInterested",
    "Selected",
    "Documents",
    "Submitted",
    "Completed",
    "Admitted",
  ].includes(statusKey);

  const writtenTestResult = String(detail?.written_test_status ?? "");
  const writtenTestPassed = writtenTestResult === "1";
  const writtenTestPending =
    writtenTestResult === "0" || writtenTestResult === "";

  const showSetWrittenTestDate =
    needsWrittenTest &&
    ["Applied", "WrittenTest"].includes(statusKey) &&
    !writtenTestPassed;
  const showWrittenTestStatus =
    needsWrittenTest &&
    statusKey === "WrittenTest" &&
    !!detail?.written_test_date &&
    writtenTestPending;
  // Existing flag (Nursery–3 Applied/Interview). Class 4–11 use WrittenTest gate below.
  const showSetInterviewDate = needsWrittenTest
    ? ["WrittenTest", "Interview"].includes(statusKey)
    : ["Applied", "Interview"].includes(statusKey);
  // Class 4–11: Set Interview only after Written Test Pass
  const showSetInterviewDateStandalone =
    (needsWrittenTest &&
      statusKey === "WrittenTest" &&
      writtenTestPassed) ||
    (showSetInterviewDate &&
      !["Applied", "Selected", "Interview", "Rejected", "NotInterested"].includes(
        statusKey,
      ));
  const showSetDocumentDate = ["Submitted", "Documents"].includes(statusKey);
  // Unchanged set — do not add WrittenTest (interview result only after Interview)
  const showInterviewCompletedRejected = [
    "Applied",
    "Selected",
    "Interview",
    "Rejected",
    "NotInterested",
  ].includes(statusKey);
  const showResendPayment = ["Selected"].includes(statusKey);
  const showAddToSchool = ["Documents", "Submitted"].includes(statusKey);
  const showCompletedText = statusKey === "Admitted";
  const showSendLink = ["Documents", "Submitted"].includes(statusKey);

  // helper to render a vertical divider when the previous visible block existed
  const VDiv = () => (
    <Divider
      flexItem
      orientation="vertical"
      sx={{ bgcolor: "white", width: "2px" }}
    />
  );

  useEffect(() => {
    setRollNo(allResponse?.new_roll_no || "");
  }, [allResponse]);

  return (
    <>
      <Box
        sx={{
          bgcolor: "primary.main",
          height: "80px",
          my: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          color: "white",
          px: 5,
        }}
      >
        {/* 1) Send Payment Link */}
        {showSendPayment && (
          <>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconButton
                sx={{ display: "flex", flexDirection: "column" }}
                onClick={handlePayAnchorOpen}
              >
                <Iconify icon="mdi:link-variant" width={30} />
              </IconButton>
              <Typography sx={{ fontSize: "12px" }}>
                Send Payment Link
              </Typography>

              <Popover
                open={!!payAnchorEl}
                anchorEl={payAnchorEl}
                onClose={handlePayAnchorClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                transformOrigin={{ vertical: "top", horizontal: "center" }}
              >
                <Box
                  sx={{ p: 2, display: "flex", gap: 2, alignItems: "center" }}
                >
                  <TextField
                    size="small"
                    label="Phone (e.g. 933...)"
                    value={paymentPhone}
                    onChange={(e) => setPaymentPhone(e.target.value)}
                    sx={{ width: 200 }}
                  />
                  <Button
                    variant="contained"
                    onClick={() =>
                      handleSendPaymentLinkToWhatsapp(paymentPhone)
                    }
                    disabled={paymentLinkLoading}
                  >
                    {paymentLinkLoading ? (
                      <CircularProgress size={20} />
                    ) : (
                      "Send"
                    )}
                  </Button>
                </Box>
              </Popover>
            </Box>
          </>
        )}

        {/* 2) Print */}
        {showPrint && (
          <>
            {showSendPayment && <VDiv />}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconButton
                sx={{ display: "flex", flexDirection: "column" }}
                disabled={printLoading}
                onClick={() => handlePrint("1")}
              >
                {printLoading ? (
                  <CircularProgress size={30} color="white" />
                ) : (
                  <PrintOutlined sx={{ fontSize: "30px" }} />
                )}
              </IconButton>
              <Typography sx={{ fontSize: "12px" }}>Print</Typography>
            </Box>
          </>
        )}
        <Divider
          flexItem
          orientation="vertical"
          sx={{ bgcolor: "white", width: "2px" }}
        />
        {/* 3) Mark as Printed */}
        {showMarkAsPrinted && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconButton
              sx={{ display: "flex", flexDirection: "column" }}
              disabled={markAsPrintedLoading}
              onClick={handleMarkAsPrinted}
            >
              {markAsPrintedLoading ? (
                <CircularProgress size={30} color="white" />
              ) : (
                <Iconify icon="iconoir:bookmark-solid" width={30} />
              )}
            </IconButton>
            <Typography sx={{ fontSize: "12px", textAlign: "center" }}>
              Mark as Printed
            </Typography>
          </Box>
        )}

        {/* 3a) Set Written Test Date (Class 4–11 only) */}
        {showSetWrittenTestDate && (
          <>
            {(showPrint || showSendPayment) && <VDiv />}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconButton
                sx={{ display: "flex", flexDirection: "column" }}
                onClick={handleWrittenTestAnchorOpen}
              >
                <Iconify icon="mdi:file-document-edit-outline" width={30} />
              </IconButton>
              <Typography sx={{ fontSize: "12px", textAlign: "center" }}>
                Set Written Test
              </Typography>

              <Popover
                open={!!writtenTestAnchorEl}
                anchorEl={writtenTestAnchorEl}
                onClose={handleWrittenTestAnchorClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                transformOrigin={{ vertical: "top", horizontal: "center" }}
              >
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 2, p: 2 }}
                >
                  <DatePicker
                    label="Written Test Date"
                    renderInput={(params) => <TextField {...params} />}
                    value={writtenTestDate ? dayjs(writtenTestDate) : null}
                    onChange={(newValue) => setWrittenTestDate(newValue)}
                    disablePast
                    slotProps={{
                      textField: { size: "small", required: true },
                    }}
                    sx={{ width: "180px" }}
                  />

                  <TimePicker
                    label="Written Test Time"
                    renderInput={(params) => <TextField {...params} />}
                    ampm={false}
                    value={writtenTestTime ? dayjs(writtenTestTime) : null}
                    onChange={(newValue) => setWrittenTestTime(newValue)}
                    slotProps={{
                      textField: { size: "small", required: true },
                    }}
                    sx={{ width: "180px" }}
                  />

                  <Button
                    variant="contained"
                    onClick={handleSetWrittenTestDate}
                    disabled={writtenTestDateLoading}
                  >
                    {writtenTestDateLoading ? (
                      <CircularProgress size={20} />
                    ) : (
                      `Save`
                    )}
                  </Button>
                </Box>
              </Popover>
            </Box>
          </>
        )}

        {/* 3b) Written Test Pass / Fail (Class 4–11) */}
        {showWrittenTestStatus && (
          <>
            {(showPrint || showSendPayment || showSetWrittenTestDate) && (
              <VDiv />
            )}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconButton onClick={handleWrittenTestStatusPopoverOpen}>
                <Iconify icon="mdi:clipboard-check-outline" width={30} />
              </IconButton>
              <Typography sx={{ fontSize: "12px", textAlign: "center" }}>
                Written Test Status
              </Typography>

              <Popover
                open={!!writtenTestStatusAnchorEl}
                anchorEl={writtenTestStatusAnchorEl}
                onClose={handleWrittenTestStatusPopoverClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                transformOrigin={{ vertical: "top", horizontal: "center" }}
              >
                <Box
                  sx={{
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                    minWidth: 220,
                  }}
                >
                  <Autocomplete
                    options={["Pass", "Fail"]}
                    value={writtenTestStatus || null}
                    onChange={(_, newValue) => {
                      setWrittenTestStatus(newValue || "");
                      setWrittenTestFailReason("");
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Written Test Status"
                        size="small"
                        fullWidth
                      />
                    )}
                    disabled={writtenTestStatusLoading}
                  />
                  {writtenTestStatus === "Fail" && (
                    <TextField
                      label="Reason"
                      size="small"
                      fullWidth
                      multiline
                      minRows={2}
                      value={writtenTestFailReason}
                      onChange={(e) => setWrittenTestFailReason(e.target.value)}
                      disabled={writtenTestStatusLoading}
                    />
                  )}
                  <Button
                    variant="contained"
                    onClick={handleSetWrittenTestStatus}
                    disabled={writtenTestStatusLoading}
                  >
                    {writtenTestStatusLoading ? (
                      <CircularProgress size={20} />
                    ) : (
                      "Save"
                    )}
                  </Button>
                </Box>
              </Popover>
            </Box>
          </>
        )}

        {/* 3) Set Interview Date (Class 4–11 after Written Test Pass; nursery dead-path kept) */}
        {showSetInterviewDateStandalone && (
          <>
            {(showPrint || showSendPayment || showSetWrittenTestDate) && (
              <VDiv />
            )}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconButton
                sx={{ display: "flex", flexDirection: "column" }}
                onClick={handleAnchorElOpen}
              >
                <Iconify icon="solar:calendar-date-line-duotone" width={30} />
              </IconButton>
              <Typography sx={{ fontSize: "12px" }}>
                Set Interview Date
              </Typography>

              <Popover
                open={!!anchorEl}
                anchorEl={anchorEl}
                onClose={handleAnchorElClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                transformOrigin={{ vertical: "top", horizontal: "center" }}
              >
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 2, p: 2 }}
                >
                  <DatePicker
                    label="Interview Date"
                    renderInput={(params) => <TextField {...params} />}
                    value={interviewDate ? dayjs(interviewDate) : null}
                    onChange={(newValue) => setInterviewDate(newValue)}
                    disablePast
                    slotProps={{
                      textField: { size: "small", required: true },
                    }}
                    sx={{ width: "180px" }}
                  />

                  <TimePicker
                    label="Interview Time"
                    renderInput={(params) => <TextField {...params} />}
                    ampm={false}
                    value={interviewTime ? dayjs(interviewTime) : null}
                    onChange={(newValue) => setInterviewTime(newValue)}
                    // disablePast
                    slotProps={{
                      textField: { size: "small", required: true },
                    }}
                    sx={{ width: "180px" }}
                  />

                  <Button
                    variant="contained"
                    onClick={handleSetInterviewDate}
                    disabled={interviewDateLoading}
                  >
                    {interviewDateLoading ? (
                      <CircularProgress size={20} />
                    ) : (
                      `Save`
                    )}
                  </Button>
                </Box>
              </Popover>
            </Box>
          </>
        )}

        {/* 4) Interview Status */}
        {showInterviewCompletedRejected && (
          <>
            {(showPrint ||
              showSetInterviewDateStandalone ||
              showSetWrittenTestDate ||
              showSendPayment) && <VDiv />}
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              {/* ===================================Reject Reason Start============================= */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconButton onClick={handleInterviewStatusPopoverOpen}>
                  <Iconify icon="tdesign:task-checked" width={30} />
                </IconButton>
                <Typography sx={{ fontSize: "12px", textAlign: "center" }}>
                  Interview Status
                </Typography>

                {/* Interview Status popover */}
                <Popover
                  open={!!interviewStatusAnchorEl}
                  anchorEl={interviewStatusAnchorEl}
                  onClose={handleInterviewStatusPopoverClose}
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  transformOrigin={{ vertical: "top", horizontal: "right" }}
                >
                  <Box
                    sx={{
                      p: 2,
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                    }}
                  >
                    <Autocomplete
                      options={["Selected", "Rejected", "Not Interested"]}
                      value={interviewStatus || null}
                      onChange={(_, newValue) => {
                        setInterviewStatus(newValue);
                        setSelectedClass("");
                        setRejectionComments("");
                        setDueDate(null);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Interview Status"
                          size="small"
                          fullWidth
                        />
                      )}
                      disabled={interviewStatusLoading}
                      sx={{ width: "200px" }}
                    />
                    {interviewStatus === "Selected" && (
                      <>
                        <Autocomplete
                          options={CLASS_LIST || []}
                          getOptionLabel={(option) => option.cg_name || ""}
                          value={selectedClass || null}
                          onChange={(_, newValue) => setSelectedClass(newValue)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Class"
                              size="small"
                              fullWidth
                            />
                          )}
                          disabled={interviewStatusLoading}
                          sx={{ width: "200px" }}
                        />
                        <DatePicker
                          label="Due Date"
                          renderInput={(params) => <TextField {...params} />}
                          value={dueDate ? dayjs(dueDate) : null}
                          onChange={(newValue) => setDueDate(newValue)}
                          disablePast
                          disabled={interviewStatusLoading}
                          slotProps={{
                            textField: { size: "small" },
                          }}
                          sx={{ width: "200px" }}
                        />
                      </>
                    )}
                    {(interviewStatus === "Rejected" ||
                      interviewStatus === "Not Interested") && (
                      <TextField
                        autoFocus
                        label={
                          interviewStatus === "Rejected"
                            ? "Rejection Reason"
                            : "Not Interested Reason"
                        }
                        value={rejectionComments || ""}
                        onChange={(e) => setRejectionComments(e.target.value)}
                        size="small"
                        disabled={interviewStatusLoading}
                        sx={{ width: "200px" }}
                      />
                    )}

                    <Button
                      variant="contained"
                      fullWidth
                      disabled={!interviewStatus || interviewStatusLoading}
                      onClick={handleInterviewStatus}
                    >
                      {interviewStatusLoading ? (
                        <CircularProgress size={24} />
                      ) : (
                        `Save`
                      )}
                    </Button>
                  </Box>
                </Popover>
              </Box>

              {/* =====================================Reject Reason End==================================== */}
              {/* Class 4–11 on Form Fee Paid: use Set Written Test first (not interview reschedule) */}
              {!(needsWrittenTest && statusKey === "Applied") && (
              <>
              <Divider
                flexItem
                orientation="vertical"
                sx={{ bgcolor: "white", width: "2px" }}
              />
              {/* 6.c) Reschedule Interview */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconButton
                  sx={{ display: "flex", flexDirection: "column" }}
                  onClick={handleAnchorElOpen}
                >
                  <Iconify icon="mdi:calendar-refresh" width={30} />
                </IconButton>
                <Typography sx={{ fontSize: "12px", textAlign: "center" }}>
                  Reschedule Interview
                </Typography>

                {/* Popover for Reschedule Interview Date */}
                <Popover
                  open={!!anchorEl}
                  anchorEl={anchorEl}
                  onClose={handleAnchorElClose}
                  anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                  transformOrigin={{ vertical: "top", horizontal: "center" }}
                >
                  <Box
                    sx={{ display: "flex", alignItems: "center", gap: 2, p: 2 }}
                  >
                    <DatePicker
                      label="Reschedule Date"
                      renderInput={(params) => <TextField {...params} />}
                      value={rescheduleDate ? dayjs(rescheduleDate) : null}
                      onChange={(newValue) =>
                        setRescheduleDate(newValue ? dayjs(newValue) : null)
                      }
                      disablePast
                      slotProps={{
                        textField: { size: "small", required: true },
                      }}
                      sx={{ width: "180px" }}
                    />

                    <TimePicker
                      label="Reschedule Time"
                      renderInput={(params) => <TextField {...params} />}
                      ampm={false}
                      value={rescheduleTime ? dayjs(rescheduleTime) : null}
                      onChange={(newValue) =>
                        setRescheduleTime(newValue ? dayjs(newValue) : null)
                      }
                      slotProps={{
                        textField: { size: "small", required: true },
                      }}
                      sx={{ width: "180px" }}
                    />

                    <Button
                      variant="contained"
                      onClick={handleRescheduleInterviewDate}
                      disabled={interviewDateLoading}
                    >
                      {interviewDateLoading ? (
                        <CircularProgress size={20} />
                      ) : (
                        `Save`
                      )}
                    </Button>
                  </Box>
                </Popover>
              </Box>
              </>
              )}
            </Box>
          </>
        )}

        {/* 5) Resend Payment Link */}
        {showResendPayment && (
          <>
            <VDiv />
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconButton
                sx={{ display: "flex", flexDirection: "column" }}
                onClick={handleResendAnchorOpen}
              >
                <Iconify icon="mdi:link-variant-plus" width={30} />
              </IconButton>
              <Typography sx={{ fontSize: "12px" }}>
                Resend Payment Link
              </Typography>

              {/* Render the phone number field */}
              <Popover
                open={!!resendAnchorEl}
                anchorEl={resendAnchorEl}
                onClose={handleResendAnchorClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
              >
                <Box
                  sx={{
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                  }}
                >
                  <TextField
                    label="Phone (e.g. 91933...)"
                    placeholder="Enter phone number(s)"
                    value={phoneNumbers || ""}
                    onChange={(e) => setPhoneNumbers(e.target.value)}
                    size="small"
                    disabled={resendLoading}
                    required
                    sx={{ width: 200 }}
                  />
                  <DatePicker
                    label="Due Date"
                    renderInput={(params) => <TextField {...params} />}
                    value={dueDate ? dayjs(dueDate) : null}
                    onChange={(newValue) => setDueDate(newValue)}
                    disablePast
                    disabled={resendLoading}
                    slotProps={{
                      textField: { size: "small", required: true },
                    }}
                    sx={{ width: "200px" }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleResendPaymentLink}
                    disabled={resendLoading || !phoneNumbers || !dueDate}
                    fullWidth
                  >
                    {resendLoading ? (
                      <CircularProgress size={20} />
                    ) : (
                      "Send Payment Link"
                    )}
                  </Button>
                </Box>
              </Popover>
            </Box>
          </>
        )}

        {/* 5) Send Link */}

        {showSendLink && (
          <>
            <VDiv />
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconButton
                sx={{ display: "flex", flexDirection: "column" }}
                onClick={handleSendAnchorOpen}
              >
                <Iconify icon="mdi:link-variant-plus" width={30} />
              </IconButton>
              <Typography sx={{ fontSize: "12px", textAlign: "center" }}>
                Send Complete Form Link
              </Typography>

              {/* Render the phone number field */}
              <Popover
                open={!!sendAnchorEl}
                anchorEl={sendAnchorEl}
                onClose={handleSendAnchorClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                transformOrigin={{ vertical: "top", horizontal: "center" }}
              >
                <Box
                  sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1 }}
                >
                  <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                    Sends Complete Form / Documents WhatsApp
                  </Typography>
                  <Box
                    sx={{ display: "flex", gap: 2, alignItems: "center" }}
                  >
                    <TextField
                      size="small"
                      label="Phone (e.g. 91933...)"
                      value={phoneNumbers}
                      onChange={(e) => setPhoneNumbers(e.target.value)}
                      sx={{ width: 200 }}
                      placeholder="Enter phone number(s)"
                    />
                    <Button
                      variant="contained"
                      onClick={handleSendPaymentLink}
                      disabled={sendLoading}
                    >
                      {sendLoading ? (
                        <CircularProgress size={20} />
                      ) : (
                        "Send Complete Form Link"
                      )}
                    </Button>
                  </Box>
                </Box>
              </Popover>
            </Box>
          </>
        )}

        {/* 3) Set Document Date */}
        {showSetDocumentDate && (
          <>
            {(showPrint || showSendPayment) && <VDiv />}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconButton
                sx={{ display: "flex", flexDirection: "column" }}
                onClick={handleDocumentsAnchorElOpen}
              >
                <Iconify icon="solar:calendar-date-line-duotone" width={30} />
              </IconButton>
              <Typography sx={{ fontSize: "12px", textAlign: "center" }}>
                Set Document Date
              </Typography>

              <Popover
                open={!!documentsAnchorEl}
                anchorEl={documentsAnchorEl}
                onClose={handleDocumentsAnchorElClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                transformOrigin={{ vertical: "top", horizontal: "center" }}
              >
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 2, p: 2 }}
                >
                  <DatePicker
                    label="Document Date"
                    renderInput={(params) => <TextField {...params} />}
                    value={documentDate ? dayjs(documentDate) : null}
                    onChange={(newValue) => setDocumentDate(newValue)}
                    disablePast
                    slotProps={{
                      textField: { size: "small", required: true },
                    }}
                    sx={{ width: "180px" }}
                  />

                  {/* <TimePicker
                    label="Document Time"
                    renderInput={(params) => <TextField {...params} />}
                    ampm={false}
                    value={documentTime ? dayjs(documentTime) : null}
                    onChange={(newValue) => setDocumentTime(newValue)}
                    // disablePast
                    slotProps={{
                      textField: { size: "small", required: true },
                    }}
                    sx={{ width: "180px" }}
                  /> */}

                  <Button
                    variant="contained"
                    onClick={handleSetDocumentDate}
                    disabled={documentDateLoading}
                  >
                    {documentDateLoading ? (
                      <CircularProgress size={20} />
                    ) : (
                      `Save`
                    )}
                  </Button>
                </Box>
              </Popover>
            </Box>
          </>
        )}

        {/* 6) Mark Completed */}
        {showAddToSchool && (
          <>
            {(showPrint ||
              showSetInterviewDate ||
              showSendPayment ||
              showInterviewCompletedRejected ||
              showResendPayment) && <VDiv />}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconButton onClick={handleMarkCompletedAnchorOpen}>
                <Iconify icon="basil:add-solid" width={30} />
              </IconButton>
              <Typography sx={{ fontSize: "12px", textAlign: "center" }}>
                Mark Completed
              </Typography>

              {/* Render the roll number field */}
              <Popover
                open={!!markCompletedAnchorEl}
                anchorEl={markCompletedAnchorEl}
                onClose={handleMarkCompletedAnchorClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
              >
                <Box
                  sx={{
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                  }}
                >
                  <TextField
                    size="small"
                    label="Roll No."
                    value={rollNo || ""}
                    onChange={(e) => setRollNo(e.target.value)}
                    sx={{ width: 200 }}
                    placeholder={
                      defaultRollNoLoading
                        ? "Roll no. Loading..."
                        : "Enter roll number"
                    }
                    required
                    disabled={markCompletedLoading || defaultRollNoLoading}
                  />
                  <TextField
                    size="small"
                    label="Class & Section"
                    value={admittedClassAndSection || ""}
                    onChange={(e) => setAdmittedClassAndSection(e.target.value)}
                    sx={{ width: 200 }}
                    placeholder="Enter class & section"
                    required
                    disabled={markCompletedLoading}
                  />
                  <Button
                    variant="contained"
                    onClick={handleAddedToSchool}
                    fullWidth
                    disabled={
                      markCompletedLoading ||
                      defaultRollNoLoading ||
                      !rollNo ||
                      !admittedClassAndSection
                    }
                  >
                    {markCompletedLoading ? (
                      <CircularProgress size={20} />
                    ) : (
                      "Save"
                    )}
                  </Button>
                </Box>
              </Popover>
            </Box>
          </>
        )}

        {/* Completed text for Admitted */}
        {showCompletedText && (
          <>
            {(showAddToSchool || showPrint) && <VDiv />}
            <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
              Completed
            </Typography>
          </>
        )}
      </Box>
    </>
  );
};

ActionSection.propTypes = {
  selectedId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  refetch: PropTypes.func.isRequired,
  setSelectedId: PropTypes.func, // optional (kept for compatibility)
  detail: PropTypes.shape({
    // --- commonly used fields in your pages; extend freely ---
    status: PropTypes.string,
    application_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    application_no: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    first_name: PropTypes.string,
    last_name: PropTypes.string,
    gender: PropTypes.string, // 'm' | 'f' | others
    dob: PropTypes.string, // ISO string
    created_at: PropTypes.string, // ISO string
    ad_paid: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    receipt_api_url: PropTypes.string,
    photo_url: PropTypes.string,
    class: PropTypes.string,
    interview_status: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
};

export default memo(ActionSection);
