import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  Popover,
  Radio,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { Close, MoreVert } from "@mui/icons-material";
import dayjs from "dayjs";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DatePicker } from "@mui/x-date-pickers";
import {
  BANK_LIST,
  CAPITALIZE,
  FORMAT_INDIAN_CURRENCY,
  ROWS_PER_PAGE_OPTIONS,
} from "../../../../utils/constants";
import {
  addToSchoolApi,
  getAdmissionPaymentDetailsApi,
  recordOfflineAdmissionPaymentApi,
  setInterviewStatusApi,
} from "../../../../services/admin/students-management.service";
import { toast } from "react-toastify";
import useAuth from "../../../../hooks/useAuth";
import Iconify from "../../../../components/iconify/iconify";
import Loader from "../../../../components/loader/loader";
import MessageBox from "../../../../components/error/message-box";

const PAYMENT_MODE_LIST = [
  { label: "Cash", value: "cash" },
  { label: "Draft", value: "draft" },
  { label: "Cheque", value: "cheque" },
  { label: "NEFT", value: "neft" },
];

const PAYMENT_STATUS_FILTER = [
  { label: "Success", value: "success" },
  { label: "Failed", value: "failed" },
  { label: "Pending", value: "pending" },
];

const PAYMENT_TYPE_FILTER = [
  { label: "Online", value: "online" },
  { label: "Offline", value: "offline" },
];

const NewAdmissionsTableRow = ({
  row,
  dataSendToBackend,
  classList,
  academicYearList,
  selectedAcademicYear,
  refetch,
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { logout, userInfo } = useAuth();

  const isAdmissionDone = row?.added_to_school === "1";
  const isSchoolStudent = row?.source === "school";

  const [anchorEl, setAnchorEl] = useState(null);
  const [rollNo, setRollNo] = useState(row?.roll_no || "");
  const [selectedClass, setSelectedClass] = useState(null);
  const [addToSchoolLoading, setAddToSchoolLoading] = useState(false);

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState(null);
  const [paymentDetailsOpen, setPaymentDetailsOpen] = useState(false);
  const [paymentDetailsLoading, setPaymentDetailsLoading] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState([]);
  const [paymentDetailsCount, setPaymentDetailsCount] = useState(0);
  const [paymentDetailsError, setPaymentDetailsError] = useState("");
  const [paymentDetailsPage, setPaymentDetailsPage] = useState(0);
  const [paymentDetailsRowsPerPage, setPaymentDetailsRowsPerPage] = useState(5);
  const [paymentDetailsFilter, setPaymentDetailsFilter] = useState({
    year: null,
    status: null,
    type: null,
  });
  const [paymentForm, setPaymentForm] = useState({
    payment_mode: null,
    payment_date: dayjs().format("YYYY-MM-DD"),
    amount: "",
    comments: "",
    bank_name: "",
    draft_no: "",
    draft_date: "",
    transaction_id: "",
    transaction_date: "",
  });

  const showOfflinePayment = row?.afee_paid !== "1";
  const showNotInterested =
    !isSchoolStudent &&
    ["Pending", "Applied", "WrittenTest", "Interview", "Selected", "Rejected"].includes(
      String(row?.status || ""),
    ) &&
    String(row?.afee_paid) !== "1" &&
    String(row?.added_to_school) !== "1";

  const [notInterestedOpen, setNotInterestedOpen] = useState(false);
  const [notInterestedReason, setNotInterestedReason] = useState("");
  const [notInterestedLoading, setNotInterestedLoading] = useState(false);

  const getDefaultAcademicYear = () => {
    const list = academicYearList || [];

    // Prefer AY selected on New Admission list filter
    if (selectedAcademicYear?.ay_id) {
      const fromFilter = list.find(
        (y) => Number(y?.ay_id) === Number(selectedAcademicYear.ay_id),
      );
      return fromFilter || selectedAcademicYear;
    }

    const current = list.find((y) => String(y?.ay_current) === "1");
    if (current) return current;
    const byUser = list.find(
      (y) => Number(y?.ay_id) === Number(userInfo?.ay_id),
    );
    if (byUser) return byUser;
    const byName = list.find((y) =>
      String(y?.ay_name || "").includes("2025-26"),
    );
    return byName || null;
  };

  const handleActionMenuOpen = (e) => {
    e.stopPropagation();
    setActionMenuAnchorEl(e.currentTarget);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchorEl(null);
  };

  const resetPaymentForm = () => {
    setPaymentForm({
      payment_mode: null,
      payment_date: dayjs().format("YYYY-MM-DD"),
      amount: "",
      comments: "",
      bank_name: "",
      draft_no: "",
      draft_date: "",
      transaction_id: "",
      transaction_date: "",
    });
  };

  const handleOfflinePaymentOpen = () => {
    handleActionMenuClose();
    setPaymentDialogOpen(true);
  };

  const handleNotInterestedOpen = () => {
    handleActionMenuClose();
    setNotInterestedReason("");
    setNotInterestedOpen(true);
  };

  const handleNotInterestedClose = () => {
    if (notInterestedLoading) return;
    setNotInterestedOpen(false);
    setNotInterestedReason("");
  };

  const handleNotInterestedSave = async () => {
    const reason = (notInterestedReason || "").trim();
    if (!reason) {
      toast.error("Please enter a reason.");
      return;
    }
    if (!row?.id) {
      toast.error("Admission id not found.");
      return;
    }

    setNotInterestedLoading(true);
    const response = await setInterviewStatusApi(row.id, {
      interview_status: "3",
      comments: reason,
    });
    setNotInterestedLoading(false);

    if (response?.code === 200) {
      toast.success(response?.message || "Marked as Not Interested.");
      handleNotInterestedClose();
      refetch?.();
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Failed to mark Not Interested.");
    }
  };

  const handlePaymentDialogClose = () => {
    if (paymentLoading) return;
    setPaymentDialogOpen(false);
    resetPaymentForm();
  };

  const fetchPaymentDetails = async ({
    year,
    status,
    type,
    page,
    rowsPerPage,
  }) => {
    setPaymentDetailsLoading(true);
    setPaymentDetailsError("");

    const response = await getAdmissionPaymentDetailsApi(row?.id, {
      ay_id: year?.ay_id || "",
      status: status?.value || "",
      type: type?.value || "",
      limit: rowsPerPage,
      offset: page * rowsPerPage,
    });

    setPaymentDetailsLoading(false);

    if (response?.code === 200) {
      setPaymentDetails(response?.data || []);
      setPaymentDetailsCount(Number(response?.count) || 0);
    } else if (response?.code === 401) {
      logout(response);
    } else {
      setPaymentDetailsError(
        response?.message || "Failed to fetch payment details.",
      );
      setPaymentDetails([]);
      setPaymentDetailsCount(0);
    }
  };

  const handlePaymentDetailsOpen = () => {
    handleActionMenuClose();
    const defaultYear = getDefaultAcademicYear();
    setPaymentDetailsFilter({
      year: defaultYear,
      status: null,
      type: null,
    });
    setPaymentDetailsPage(0);
    setPaymentDetailsRowsPerPage(5);
    setPaymentDetailsOpen(true);
  };

  const handlePaymentDetailsClose = () => {
    setPaymentDetailsOpen(false);
    setPaymentDetails([]);
    setPaymentDetailsCount(0);
    setPaymentDetailsError("");
    setPaymentDetailsFilter({
      year: null,
      status: null,
      type: null,
    });
  };

  useEffect(() => {
    if (!paymentDetailsOpen) return;
    if (!paymentDetailsFilter.year && (academicYearList || []).length > 0) {
      const defaultYear = getDefaultAcademicYear();
      if (defaultYear) {
        setPaymentDetailsFilter((prev) => ({ ...prev, year: defaultYear }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentDetailsOpen, academicYearList]);

  useEffect(() => {
    if (!paymentDetailsOpen) return;
    if (!paymentDetailsFilter.year) return;
    fetchPaymentDetails({
      ...paymentDetailsFilter,
      page: paymentDetailsPage,
      rowsPerPage: paymentDetailsRowsPerPage,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    paymentDetailsOpen,
    paymentDetailsFilter,
    paymentDetailsPage,
    paymentDetailsRowsPerPage,
  ]);

  const handlePaymentDetailsFilterChange = (name, value) => {
    setPaymentDetailsPage(0);
    setPaymentDetailsFilter((prev) => ({ ...prev, [name]: value }));
  };

  const handlePaymentFieldChange = (name, value) => {
    setPaymentForm((prev) => ({ ...prev, [name]: value }));
  };

  const isPaymentFormValid = () => {
    const mode = paymentForm.payment_mode?.value;
    if (!mode || !paymentForm.payment_date) return false;

    if (mode === "draft") {
      return (
        paymentForm.bank_name.trim() &&
        paymentForm.draft_no.trim() &&
        paymentForm.draft_date
      );
    }

    if (mode === "cheque") {
      return (
        paymentForm.bank_name.trim() &&
        paymentForm.draft_no.trim() &&
        paymentForm.draft_date
      );
    }

    if (mode === "neft") {
      return (
        paymentForm.bank_name.trim() &&
        paymentForm.transaction_id.trim() &&
        paymentForm.transaction_date
      );
    }

    return true;
  };

  const handleRecordPayment = async () => {
    const mode = paymentForm.payment_mode?.value;
    if (!isPaymentFormValid()) {
      toast.error("Please fill all required payment fields.");
      return;
    }

    const payload = {
      admission_id: row?.id,
      payment_mode: mode,
      payment_date: paymentForm.payment_date,
      comments: paymentForm.comments || null,
    };

    // Total amount received; backend stores any extra above admission fee in wallet.
    if (String(paymentForm.amount).trim() !== "") {
      payload.amount = Number(paymentForm.amount);
    }

    if (mode === "draft") {
      payload.bank_name = paymentForm.bank_name;
      payload.draft_no = paymentForm.draft_no;
      payload.draft_date = paymentForm.draft_date;
    } else if (mode === "cheque") {
      payload.bank_name = paymentForm.bank_name;
      payload.cheque_no = paymentForm.draft_no;
      payload.cheque_date = paymentForm.draft_date;
    } else if (mode === "neft") {
      payload.bank_name = paymentForm.bank_name;
      payload.transaction_id = paymentForm.transaction_id;
      payload.transaction_date = paymentForm.transaction_date;
    }

    setPaymentLoading(true);
    const response = await recordOfflineAdmissionPaymentApi(payload);
    setPaymentLoading(false);

    if (response?.code === 200) {
      handlePaymentDialogClose();
      refetch();
      toast.success(
        response?.message || "Admission fee recorded successfully.",
      );
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Some error occurred.");
    }
  };

  const handleAnchorElOpen = (e) => {
    setAnchorEl(e.currentTarget);
  };

  const handleAnchorElClose = () => {
    if (addToSchoolLoading) {
      return;
    }
    setAnchorEl(null);
    setSelectedClass(null);
    setRollNo(row?.roll_no);
  };

  const handleClick = (row) => {
    if (row?.source === "school") {
      return;
    }
    navigate("/new-admissions/new-admission-detail", {
      state: { row: row, dataSendToBackend },
    });
  };

  const handleAddToSchool = async () => {
    const payload = {
      new_admission_id: row?.id || "",
      cg_id: selectedClass?.id || "",
      roll_no: rollNo || "",
    };
    setAddToSchoolLoading(true);
    const response = await addToSchoolApi(payload);
    setAddToSchoolLoading(false);

    if (response?.code === 200) {
      refetch();
      toast.success(
        response?.message || "Student added to school successfully",
      );
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Some error occurred.");
    }
  };
  return (
    <TableRow hover tabIndex={-1}>
      <TableCell>{row?.sn || ""}</TableCell>
      <TableCell>
        <Typography
          sx={{
            cursor: isSchoolStudent ? "default" : "pointer",
            color: isSchoolStudent ? "text.primary" : "primary.main",
            fontWeight: 500,
          }}
          onClick={() => handleClick(row)}
        >
          {isSchoolStudent
            ? row?.roll_no || row?.application_no || ""
            : row?.application_no || ""}
        </Typography>
        {isSchoolStudent && (
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            School student
          </Typography>
        )}
        {!isSchoolStudent && row?.status === "Completed" && (
          <>
            <Button
              variant="contained"
              size="small"
              onClick={handleAnchorElOpen}
              sx={{ mt: 1 }}
            >
              Add to School
            </Button>
            {/* Popover for Reschedule Interview Date */}
            <Popover
              open={!!anchorEl}
              anchorEl={anchorEl}
              onClose={handleAnchorElClose}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "center",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "center",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  p: 2,
                }}
              >
                <TextField
                  label="Roll No"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  size="small"
                  required
                  sx={{ width: "150px" }}
                />
                <Autocomplete
                  options={classList || []}
                  getOptionLabel={(option) => option.cg_name || ""}
                  value={selectedClass || null}
                  onChange={(_, newValue) => setSelectedClass(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Class"
                      size="small"
                      fullWidth
                      required
                    />
                  )}
                  sx={{ width: "200px" }}
                />

                <Button
                  variant="contained"
                  onClick={handleAddToSchool}
                  disabled={
                    addToSchoolLoading || !rollNo.trim() || !selectedClass
                  }
                >
                  {addToSchoolLoading ? <CircularProgress size={20} /> : `Save`}
                </Button>
              </Box>
            </Popover>
          </>
        )}
      </TableCell>

      <TableCell>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Avatar
            src={row?.photo_url}
            alt="Child Pic"
            sx={{
              height: "70px",
              width: "70px",
              "& img": {
                // Target the image element within the Avatar
                objectFit: "cover", // Ensures the image covers the avatar area
                objectPosition: "top center", // Adjust vertical and horizontal position within the avatar
              },
            }}
          />
          <Box sx={{ whiteSpace: "nowrap" }}>
            <Typography variant="subtitle2">{row?.name || ""}</Typography>
            <Typography>Gender: {CAPITALIZE(row?.gender) || ""}</Typography>
            <Typography>Roll No: {row?.roll_no || ""}</Typography>
            <Typography>
              DOB: {row?.dob ? dayjs(row?.dob).format("DD-MM-YYYY") : null}
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Typography>
                Class: {row?.admitted_class || row?.class || "N/A"}
              </Typography>
              <Box
                sx={{
                  py: "2px",
                  px: 0.3,
                  borderRadius: "5px",
                  border: `2px solid ${
                    isAdmissionDone
                      ? theme.palette.success.main
                      : theme.palette.error.main
                  }`,
                  color: isAdmissionDone
                    ? theme.palette.success.main
                    : theme.palette.error.main,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                <Radio
                  checked
                  color={isAdmissionDone ? "success" : "error"}
                  size="small"
                  sx={{ padding: 0 }}
                />
                <Typography sx={{ fontSize: "10px" }}>
                  Admission: {`${isAdmissionDone ? "Done" : "Pending"}`}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </TableCell>

      <TableCell>
        <Box
          sx={{
            borderRadius: "15px",
            px: 1,
            py: 0.5,
            textAlign: "center",
            background:
              row?.ad_paid === "1"
                ? theme.palette.success.main
                : theme.palette.error.main,
            color: "white",
            maxWidth: "80px",
          }}
        >
          {row?.ad_paid === "1" ? "Paid" : "Unpaid"}
        </Box>
      </TableCell>

      <TableCell>
        <Box
          sx={{
            borderRadius: "15px",
            px: 1,
            py: 0.5,
            textAlign: "center",
            background:
              row?.afee_paid === "1"
                ? theme.palette.success.main
                : theme.palette.error.main,
            color: "white",
            maxWidth: "80px",
          }}
        >
          {row?.afee_paid === "1" ? "Paid" : "Unpaid"}
        </Box>
      </TableCell>

      <TableCell>
        <Box
          sx={{
            borderRadius: "15px",
            px: 1,
            py: 0.5,
            textAlign: "center",
            background:
              row?.april_fee_paid === "1"
                ? theme.palette.success.main
                : theme.palette.error.main,
            color: "white",
            maxWidth: "80px",
          }}
        >
          {row?.april_fee_paid === "1" ? "Paid" : "Unpaid"}
        </Box>
      </TableCell>

      <TableCell align="center">
        <Typography>
          {row?.interview_date
            ? dayjs(row?.interview_date).format("DD-MM-YYYY hh:mm A")
            : ""}
        </Typography>
      </TableCell>

      <TableCell align="center">
        {!isSchoolStudent && (
          <IconButton onClick={handleActionMenuOpen}>
            <MoreVert />
          </IconButton>
        )}
        {isSchoolStudent && (
          <Typography variant="caption" color="text.secondary">
            —
          </Typography>
        )}

        <Menu
          anchorEl={actionMenuAnchorEl}
          open={Boolean(actionMenuAnchorEl)}
          onClose={handleActionMenuClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          sx={{ color: "primary.main" }}
        >
          {showOfflinePayment && (
            <MenuItem
              onClick={handleOfflinePaymentOpen}
              sx={{ color: "primary.main" }}
            >
              <Iconify icon="mdi:cash-multiple" sx={{ mr: 1 }} />
              Offline Payment
            </MenuItem>
          )}
          <MenuItem
            onClick={handlePaymentDetailsOpen}
            sx={{ color: "primary.main" }}
          >
            <Iconify icon="mdi:receipt-text-outline" sx={{ mr: 1 }} />
            Payment Details
          </MenuItem>
          {showNotInterested && (
            <MenuItem
              onClick={handleNotInterestedOpen}
              sx={{ color: "error.main" }}
            >
              <Iconify icon="mdi:account-cancel-outline" sx={{ mr: 1 }} />
              Not Interested
            </MenuItem>
          )}
        </Menu>

        <Dialog
          open={notInterestedOpen}
          onClose={handleNotInterestedClose}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="h6">Mark Not Interested</Typography>
              <IconButton
                onClick={handleNotInterestedClose}
                disabled={notInterestedLoading}
                size="small"
              >
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {row?.st_first_name || ""} {row?.st_last_name || ""} (
              {row?.application_no || "-"})
            </Typography>
            <TextField
              autoFocus
              fullWidth
              size="small"
              label="Reason"
              placeholder="e.g. Admitted in another school"
              value={notInterestedReason}
              onChange={(e) => setNotInterestedReason(e.target.value)}
              disabled={notInterestedLoading}
              multiline
              minRows={2}
            />
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 1,
                mt: 2,
              }}
            >
              <Button
                variant="outlined"
                onClick={handleNotInterestedClose}
                disabled={notInterestedLoading}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleNotInterestedSave}
                disabled={notInterestedLoading || !notInterestedReason.trim()}
                startIcon={
                  notInterestedLoading ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : null
                }
              >
                Save
              </Button>
            </Box>
          </DialogContent>
        </Dialog>

        <Dialog
          open={paymentDialogOpen}
          onClose={handlePaymentDialogClose}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="h6">Offline Payment</Typography>
              <IconButton
                onClick={handlePaymentDialogClose}
                disabled={paymentLoading}
                size="small"
              >
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>

          <DialogContent>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                pt: 0.5,
              }}
            >
              <Autocomplete
                options={PAYMENT_MODE_LIST}
                getOptionLabel={(option) => option.label || ""}
                value={paymentForm.payment_mode}
                onChange={(_, newValue) =>
                  handlePaymentFieldChange("payment_mode", newValue)
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Payment Mode"
                    size="small"
                    required
                    fullWidth
                  />
                )}
              />

              <DatePicker
                label="Payment Date"
                value={
                  paymentForm.payment_date
                    ? dayjs(paymentForm.payment_date)
                    : null
                }
                onChange={(newValue) =>
                  handlePaymentFieldChange(
                    "payment_date",
                    newValue ? dayjs(newValue).format("YYYY-MM-DD") : "",
                  )
                }
                slotProps={{
                  textField: {
                    size: "small",
                    required: true,
                    fullWidth: true,
                  },
                }}
              />

              <TextField
                label="Amount Received"
                size="small"
                type="number"
                value={paymentForm.amount}
                onChange={(e) =>
                  handlePaymentFieldChange("amount", e.target.value)
                }
                fullWidth
                helperText="Total amount received. Any extra above the admission fee will be added to wallet."
                inputProps={{ min: 0 }}
              />

              {["draft", "cheque", "neft"].includes(
                paymentForm.payment_mode?.value,
              ) && (
                <Autocomplete
                  options={BANK_LIST}
                  freeSolo
                  value={paymentForm.bank_name || null}
                  onChange={(_, newValue) =>
                    handlePaymentFieldChange(
                      "bank_name",
                      typeof newValue === "string" ? newValue : newValue || "",
                    )
                  }
                  onInputChange={(_, newInputValue) =>
                    handlePaymentFieldChange("bank_name", newInputValue || "")
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Bank Name"
                      size="small"
                      required
                      fullWidth
                      placeholder="Select or search bank"
                    />
                  )}
                />
              )}

              {["draft", "cheque"].includes(
                paymentForm.payment_mode?.value,
              ) && (
                <>
                  <TextField
                    label="Draft No"
                    size="small"
                    value={paymentForm.draft_no}
                    onChange={(e) =>
                      handlePaymentFieldChange("draft_no", e.target.value)
                    }
                    required
                    fullWidth
                  />
                  <DatePicker
                    label="Draft Date"
                    value={
                      paymentForm.draft_date
                        ? dayjs(paymentForm.draft_date)
                        : null
                    }
                    onChange={(newValue) =>
                      handlePaymentFieldChange(
                        "draft_date",
                        newValue
                          ? dayjs(newValue).format("YYYY-MM-DD")
                          : "",
                      )
                    }
                    slotProps={{
                      textField: {
                        size: "small",
                        required: true,
                        fullWidth: true,
                      },
                    }}
                  />
                </>
              )}

              {paymentForm.payment_mode?.value === "neft" && (
                <>
                  <TextField
                    label="Reference No"
                    size="small"
                    value={paymentForm.transaction_id}
                    onChange={(e) =>
                      handlePaymentFieldChange(
                        "transaction_id",
                        e.target.value,
                      )
                    }
                    required
                    fullWidth
                  />
                  <DatePicker
                    label="Transaction Date"
                    value={
                      paymentForm.transaction_date
                        ? dayjs(paymentForm.transaction_date)
                        : null
                    }
                    onChange={(newValue) =>
                      handlePaymentFieldChange(
                        "transaction_date",
                        newValue
                          ? dayjs(newValue).format("YYYY-MM-DD")
                          : "",
                      )
                    }
                    slotProps={{
                      textField: {
                        size: "small",
                        required: true,
                        fullWidth: true,
                      },
                    }}
                  />
                </>
              )}

              <TextField
                label="Comments"
                size="small"
                value={paymentForm.comments}
                onChange={(e) =>
                  handlePaymentFieldChange("comments", e.target.value)
                }
                fullWidth
                multiline
                minRows={2}
              />

              <Button
                variant="contained"
                onClick={handleRecordPayment}
                disabled={paymentLoading || !isPaymentFormValid()}
                fullWidth
              >
                {paymentLoading ? <CircularProgress size={20} /> : "Save"}
              </Button>
            </Box>
          </DialogContent>
        </Dialog>

        <Dialog
          open={paymentDetailsOpen}
          onClose={handlePaymentDetailsClose}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Box sx={{ minWidth: 180 }}>
                <Typography variant="h6">Payment Details</Typography>
                <Typography variant="body2" color="text.secondary">
                  {row?.name || ""}
                  {row?.application_no ? ` (${row.application_no})` : ""}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <Autocomplete
                  options={academicYearList || []}
                  getOptionLabel={(option) => option?.ay_name || ""}
                  isOptionEqualToValue={(option, value) =>
                    Number(option?.ay_id) === Number(value?.ay_id)
                  }
                  value={paymentDetailsFilter.year}
                  onChange={(_, newValue) =>
                    handlePaymentDetailsFilterChange("year", newValue)
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Academic Year"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                  sx={{ width: 170 }}
                />
                <Autocomplete
                  options={PAYMENT_STATUS_FILTER}
                  getOptionLabel={(option) => option?.label || ""}
                  isOptionEqualToValue={(option, value) =>
                    option?.value === value?.value
                  }
                  value={paymentDetailsFilter.status}
                  onChange={(_, newValue) =>
                    handlePaymentDetailsFilterChange("status", newValue)
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Status"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                  sx={{ width: 140 }}
                />
                <Autocomplete
                  options={PAYMENT_TYPE_FILTER}
                  getOptionLabel={(option) => option?.label || ""}
                  isOptionEqualToValue={(option, value) =>
                    option?.value === value?.value
                  }
                  value={paymentDetailsFilter.type}
                  onChange={(_, newValue) =>
                    handlePaymentDetailsFilterChange("type", newValue)
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Type"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                  sx={{ width: 140 }}
                />
              </Box>

              <IconButton onClick={handlePaymentDetailsClose} size="small">
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ pt: 1 }}>
            {paymentDetailsLoading ? (
              <Loader />
            ) : paymentDetailsError ? (
              <MessageBox errorMessage={paymentDetailsError} />
            ) : (
              <>
                <TableContainer sx={{ maxHeight: 420 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>SN</TableCell>
                        <TableCell>Application No</TableCell>
                        <TableCell>Roll No</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Mode</TableCell>
                        <TableCell>Reference No</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Remarks</TableCell>
                        <TableCell>Created At</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paymentDetails?.length > 0 ? (
                        paymentDetails.map((item, index) => (
                          <TableRow
                            key={`${item?.reference_no || "row"}-${index}`}
                            hover
                          >
                            <TableCell>
                              {paymentDetailsPage * paymentDetailsRowsPerPage +
                                index +
                                1}
                            </TableCell>
                            <TableCell>
                              {item?.application_no || "-"}
                            </TableCell>
                            <TableCell>{item?.roll_no || "-"}</TableCell>
                            <TableCell sx={{ whiteSpace: "nowrap" }}>
                              {item?.date
                                ? dayjs(item.date).isValid()
                                  ? dayjs(item.date).format("DD-MM-YYYY")
                                  : item.date
                                : "-"}
                            </TableCell>
                            <TableCell>{item?.type || "-"}</TableCell>
                            <TableCell>{item?.mode || "-"}</TableCell>
                            <TableCell>{item?.reference_no || "-"}</TableCell>
                            <TableCell sx={{ whiteSpace: "nowrap" }}>
                              ₹ {FORMAT_INDIAN_CURRENCY(item?.amount) || "0"}
                            </TableCell>
                            <TableCell>
                              <Box
                                sx={{
                                  color:
                                    item?.status === "Success"
                                      ? "success.main"
                                      : item?.status === "Failed"
                                        ? "error.main"
                                        : "warning.main",
                                  fontWeight: 600,
                                }}
                              >
                                {item?.status || "-"}
                              </Box>
                            </TableCell>
                            <TableCell>{item?.remarks || "-"}</TableCell>
                            <TableCell
                              sx={{
                                whiteSpace: "nowrap",
                                color: "text.disabled",
                              }}
                            >
                              {item?.created_at
                                ? dayjs(item.created_at).isValid()
                                  ? dayjs(item.created_at).format(
                                      "DD-MM-YYYY HH:mm",
                                    )
                                  : item.created_at
                                : "-"}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={11} align="center">
                            No payment details found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TablePagination
                  page={paymentDetailsPage}
                  component="div"
                  count={paymentDetailsCount}
                  rowsPerPage={paymentDetailsRowsPerPage}
                  onPageChange={(_, newPage) => setPaymentDetailsPage(newPage)}
                  rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
                  onRowsPerPageChange={(event) => {
                    setPaymentDetailsPage(0);
                    setPaymentDetailsRowsPerPage(
                      parseInt(event.target.value, 10),
                    );
                  }}
                />
              </>
            )}
          </DialogContent>
        </Dialog>
      </TableCell>
    </TableRow>
  );
};

NewAdmissionsTableRow.propTypes = {
  row: PropTypes.object.isRequired,
  dataSendToBackend: PropTypes.object,
  classList: PropTypes.array,
  academicYearList: PropTypes.array,
  selectedAcademicYear: PropTypes.object,
  refetch: PropTypes.func,
};

export default NewAdmissionsTableRow;
