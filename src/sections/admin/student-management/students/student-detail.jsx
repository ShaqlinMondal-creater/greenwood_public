import PropTypes from "prop-types";
import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  IconButton,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Iconify from "../../../../components/iconify/iconify";
import EditableField from "../../../../components/editable-field/editable-field";
import OtherDetailsTab from "./detail-tabs/other-details-tab";
import PendingFeesTab from "./detail-tabs/pending-fees-tab";
import PaidFeesTab from "./detail-tabs/paid-fees-tab";
import StudentTxnTab from "./detail-tabs/student-txn-tab";
import AttachmentsTab from "./detail-tabs/attachments-tab";
import ReportCardTab from "./detail-tabs/report-card-tab";
import {
  getAllAcademicYears,
  getStudentById,
  offRollStudent,
  retryReconcileStudent,
  uploadStudentImage,
} from "../../../../services/admin/students-management.service";
import { toast } from "react-toastify";
import WalletModal from "./modals/wallet-modal";
import ApplyConcessionModal from "./modals/apply-concession-modal";
import useAuth from "../../../../hooks/useAuth";
import { useGetApi } from "../../../../hooks/useGetApi";
import { useInlineFieldEdit } from "../../../../hooks/useInlineFieldEdit";
import Loader from "../../../../components/loader/loader";
import MessageBox from "../../../../components/error/message-box";
import { Helmet } from "react-helmet-async";
import TransferMoneyModal from "./modals/transfer-money-modal";
import ConfirmationDialog from "../../../../components/confirmation-dialog/confirmation-dialog";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

const formatAdmissionDateDisplay = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "NA";
  if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) return raw;
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 8) return "NA";
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 8)}`;
};

const parseAdmissionDateValue = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) {
    const parsed = dayjs(raw, "DD-MM-YYYY", true);
    return parsed.isValid() ? parsed : null;
  }
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 8) return null;
  const parsed = dayjs(
    `${digits.slice(4, 8)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`,
    "YYYY-MM-DD",
    true
  );
  return parsed.isValid() ? parsed : null;
};

const HEADER_FIELDS = {
  st_first_name: {
    getValue: (detail) => detail?.st_first_name || "",
  },
  st_last_name: {
    getValue: (detail) => detail?.st_last_name || "",
  },
  st_mobile: {
    getValue: (detail) => detail?.st_mobile || "",
  },
  st_date_of_admission: {
    type: "date",
    allowEmpty: true,
    getValue: (detail) => parseAdmissionDateValue(detail?.st_date_of_admission),
    formatSubmit: (value) =>
      value ? dayjs(value).format("DD-MM-YYYY") : null,
  },
};

const StudentDetail = () => {
  const { logout, userInfo } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const studentId = location?.state?.id || null;

  const {
    dataList: detail,
    isLoading,
    isError,
    errorMessage,
    refetch: studentDetailRefetch,
  } = useGetApi({
    apiFunction: getStudentById,
    body: { id: studentId },
  });

  const [previewImage, setPreviewImage] = useState(detail?.photo || "");
  const [activeTab, setActiveTab] = useState(0);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [transferMoneyModalOpen, setTransferMoneyModalOpen] = useState(false);
  const [academicYear, setAcademicYear] = useState({
    ay_id: userInfo?.ay_id,
    ay_name: userInfo?.ay_name,
  });
  const [offRollLoading, setOffRollLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [feesRefreshKey, setFeesRefreshKey] = useState(0);
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [applyConcessionOpen, setApplyConcessionOpen] = useState(false);

  const { dataList: academicYearList } = useGetApi({
    apiFunction: getAllAcademicYears,
  });

  const headerFieldConfigs = useMemo(() => HEADER_FIELDS, []);

  const {
    formData: headerFormData,
    loadingState: headerLoadingState,
    editingState: headerEditingState,
    hoverKey: headerHoverKey,
    handleChange: handleHeaderChange,
    handleEditingState: handleHeaderEditingState,
    handleHoverState: handleHeaderHoverState,
    handleUpdateStudentData: handleHeaderUpdate,
    handleUpdateMultipleFields: handleHeaderUpdateMultiple,
  } = useInlineFieldEdit({
    detail,
    fieldConfigs: headerFieldConfigs,
    stId: detail?.id,
    onSuccess: studentDetailRefetch,
    logout,
  });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const response = await uploadStudentImage({
        st_roll_no: detail?.st_roll_no,
        st_id: detail?.id,
        file: [file],
        file_type: ["photo"],
        file_name: [file?.name],
      });
      if (response?.code === 200) {
        const reader = new FileReader();
        reader.onload = () => {
          setPreviewImage(reader?.result);
        };
        reader.readAsDataURL(file);
        toast.success(response?.message || "Image uploaded successfully");
      } else if (response?.code === 401) {
        logout(response);
      } else {
        toast.error(response?.message || "Some error occurred.");
      }
    }
    e.target.value = "";
  };

  const handleWalletModalClose = () => {
    setWalletModalOpen(false);
  };

  const handleWalletClick = () => {
    setWalletModalOpen(true);
  };

  const handleSyncPayments = async () => {
    const rollNo = detail?.st_roll_no;
    if (!rollNo) {
      toast.error("Roll no not found for this student.");
      return;
    }

    setSyncLoading(true);
    const response = await retryReconcileStudent(rollNo);
    setSyncLoading(false);

    if (response?.code === 401) {
      logout(response);
      return;
    }

    if (response?.code !== 200) {
      toast.error(response?.message || "Reconciliation failed.");
      return;
    }

    const items = Array.isArray(response?.data?.items)
      ? response.data.items
      : [];

    const lastTxn = items[items.length - 1];
    const sameFeeItems = items.filter((item) => item?.f_id === lastTxn?.f_id);
    const latestSameFee = sameFeeItems[sameFeeItems.length - 1] || lastTxn;
    const orderStatus = String(latestSameFee?.order_status || "");
    const isShipped = items.length > 0 && /shipped/i.test(orderStatus);

    if (isShipped) {
      toast.success("sync done, Payment updated");
      setFeesRefreshKey((prev) => prev + 1);
      studentDetailRefetch();
      return;
    }

    toast.success("sync done");
  };

  const handleTransferMoneyModalClose = () => {
    setTransferMoneyModalOpen(false);
  };

  const handleTransferMoneyClick = () => {
    setTransferMoneyModalOpen(true);
  };

  const handleConfirmationModalOpen = () => {
    setConfirmationModalOpen(true);
  };
  const handleConfirmationModalClose = () => {
    setConfirmationModalOpen(false);
  };

  const handleEdit = () => {
    navigate("/students/edit-student", { state: detail });
  };

  const handleOffRoll = async () => {
    setOffRollLoading(true);
    const response = await offRollStudent({ st_id: studentId });
    setOffRollLoading(false);

    if (response?.code === 200) {
      toast.success(response?.message || "Student off-rolled successfully!");
      studentDetailRefetch();
      handleConfirmationModalClose();
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Some error occurred.");
    }
  };

  const handleLoginAsStudent = () => {
    if (detail?.st_roll_no) {
      const queryString = new URLSearchParams({
        st_roll_no: detail.st_roll_no,
        bearerToken: userInfo?.token || "",
      }).toString();
      const url = `/login?${queryString}`;
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  useEffect(() => {
    if (!studentId) {
      navigate(-1);
    }
  }, [studentId]);

  useEffect(() => {
    setPreviewImage(detail?.photo_url || "");
  }, [detail]);

  const renderHeaderInlineField = (fieldKey, label, displayValue, type = "text") => (
    <EditableField
      fieldKey={fieldKey}
      label={label}
      labelWidth="auto"
      displayValue={displayValue}
      formValue={headerFormData[fieldKey]}
      isEditing={headerEditingState[fieldKey]}
      isLoading={headerLoadingState[fieldKey]}
      isHovered={headerHoverKey === fieldKey}
      onMouseEnter={() => handleHeaderHoverState(fieldKey, true)}
      onMouseLeave={() => handleHeaderHoverState(fieldKey, false)}
      onStartEdit={() => handleHeaderEditingState(fieldKey)}
      onCancel={() => handleHeaderEditingState(fieldKey, false)}
      onSave={() => handleHeaderUpdate(fieldKey)}
      onChange={handleHeaderChange}
      type={type}
      inputWidth="160px"
      sx={{ display: "inline-flex", width: "auto" }}
    />
  );

  return (
    <>
      <Helmet>
        <title>Student Detail | GREENWOOD</title>
      </Helmet>

      {isLoading ? (
        <Loader />
      ) : isError ? (
        <MessageBox errorMessage={errorMessage} />
      ) : (
        <Card>
          <CardContent sx={{ position: "relative", px: 5 }}>
            <Box sx={{ display: "flex", justifyContent: "end", mb: 1 }}>
              <Button variant="contained" onClick={handleLoginAsStudent}>
                Login as Student
              </Button>
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
              }}
            >
              <Box
                sx={{
                  width: "150px",
                  height: "150px",
                  borderRadius: "50%",
                  position: "relative",
                  "&:hover": {
                    ".overlay-image": {
                      visibility: "visible",
                      opacity: 1,
                      cursor: "pointer",
                    },
                  },
                }}
              >
                <Avatar
                  alt="Preview"
                  src={previewImage}
                  sx={{ width: "100%", height: "100%" }}
                />
                <Box
                  className="overlay-image"
                  component="label"
                  sx={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    background: "rgba(0,0,0,0.4)",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    display: "grid",
                    placeItems: "center",
                    visibility: "hidden",
                    opacity: 0,
                    transition: "all 0.4s ease",
                  }}
                >
                  <Iconify
                    icon="eva:edit-fill"
                    width={30}
                    sx={{ color: "white" }}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleImageUpload}
                  />
                </Box>
              </Box>
            </Box>

            <Box
              sx={{ textAlign: "center", color: "primary.main", mt: 2 }}
              onMouseEnter={() => handleHeaderHoverState("student_name", true)}
              onMouseLeave={() => handleHeaderHoverState("student_name", false)}
            >
              {headerEditingState.st_first_name ||
              headerEditingState.st_last_name ? (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                    flexWrap: "wrap",
                  }}
                >
                  <TextField
                    value={headerFormData.st_first_name || ""}
                    onChange={(e) =>
                      handleHeaderChange("st_first_name", e.target.value)
                    }
                    size="small"
                    placeholder="First name"
                    disabled={
                      headerLoadingState.st_first_name ||
                      headerLoadingState.st_last_name
                    }
                  />
                  <TextField
                    value={headerFormData.st_last_name || ""}
                    onChange={(e) =>
                      handleHeaderChange("st_last_name", e.target.value)
                    }
                    size="small"
                    placeholder="Last name"
                    disabled={
                      headerLoadingState.st_first_name ||
                      headerLoadingState.st_last_name
                    }
                  />
                  {headerLoadingState.st_first_name ||
                  headerLoadingState.st_last_name ? (
                    <CircularProgress size={18} />
                  ) : (
                    <>
                      <IconButton
                        sx={{ color: "error.main" }}
                        onClick={() => {
                          handleHeaderEditingState("st_first_name", false);
                          handleHeaderEditingState("st_last_name", false);
                        }}
                      >
                        <Iconify icon="carbon:close-filled" />
                      </IconButton>
                      <IconButton
                        sx={{ color: "success.main" }}
                        onClick={() =>
                          handleHeaderUpdateMultiple([
                            "st_first_name",
                            "st_last_name",
                          ])
                        }
                      >
                        <Iconify icon="charm:circle-tick" />
                      </IconButton>
                    </>
                  )}
                </Box>
              ) : (
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Typography variant="h4">{`${detail?.st_first_name || ""} ${
                    detail?.st_last_name || ""
                  }`}</Typography>
                  <IconButton
                    onClick={() => {
                      handleHeaderEditingState("st_first_name");
                      handleHeaderEditingState("st_last_name");
                    }}
                    sx={{
                      color: "primary.main",
                      transition: "opacity 0.3s, visibility 0.3s",
                      opacity: headerHoverKey === "student_name" ? 1 : 0,
                      visibility:
                        headerHoverKey === "student_name"
                          ? "visible"
                          : "hidden",
                    }}
                  >
                    <Iconify icon="lucide:edit" />
                  </IconButton>
                </Box>
              )}
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                color: "primary.main",
                mt: 2,
                mb: 1,
                flexWrap: "wrap",
              }}
            >
              {renderHeaderInlineField(
                "st_mobile",
                "Mobile:",
                detail?.st_mobile || "N/A",
              )}
              <Divider
                sx={{ bgcolor: "primary.main", height: "20px", width: "2px" }}
              />
              <Typography>
                <Box component="span" sx={{ fontWeight: "bold" }}>
                  Class:{" "}
                </Box>
                {detail?.cg_name || ""}
              </Typography>
              <Divider
                sx={{ bgcolor: "primary.main", height: "20px", width: "2px" }}
              />
              <Typography>
                <Box component="span" sx={{ fontWeight: "bold" }}>
                  Roll No:{" "}
                </Box>
                {detail?.st_roll_no || ""}
              </Typography>
              <Divider
                sx={{ bgcolor: "primary.main", height: "20px", width: "2px" }}
              />
              {renderHeaderInlineField(
                "st_date_of_admission",
                "Admission Date:",
                formatAdmissionDateDisplay(detail?.st_date_of_admission),
                "date"
              )}
            </Box>
            <Divider
              sx={{ bgcolor: "#b1b1b1", height: "1px", width: "100%", mb: 2 }}
            />

            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="Other Details" />
              <Tab label="Pending Fees" />
              <Tab label="Paid Fees" />
              <Tab label="TXN" />
              <Tab label="Report Card" />
              <Tab label="Attachments" />
            </Tabs>

            <Divider sx={{ mb: 2 }} />

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "end",
                gap: 1,
                mb: 2,
              }}
            >
              {(activeTab === 1 || activeTab === 2) && (
                <Autocomplete
                  options={academicYearList || []}
                  getOptionLabel={(option) => option?.ay_name || ""}
                  renderInput={(params) => (
                    <TextField {...params} label="Select Year" size="small" />
                  )}
                  value={academicYear || null}
                  onChange={(_, newValue) => setAcademicYear(newValue)}
                  sx={{
                    minWidth: "150px",
                  }}
                />
              )}
              <Button
                variant="standard"
                sx={{ bgcolor: "primary.main", color: "primary.contrastText" }}
                onClick={handleConfirmationModalOpen}
              >
                {detail?.st_on_roll === "1" ? "Off Roll" : "On Roll"}
              </Button>
              <Button
                variant="standard"
                sx={{ bgcolor: "primary.main", color: "primary.contrastText" }}
                onClick={handleTransferMoneyClick}
              >
                Transfer Money
              </Button>
              <Button
                variant="standard"
                sx={{ bgcolor: "primary.main", color: "primary.contrastText" }}
                onClick={handleWalletClick}
              >
                +Wallet: ₹{detail?.st_wallet || 0}/-
              </Button>
              <Button
                variant="standard"
                disabled={syncLoading}
                onClick={handleSyncPayments}
                startIcon={
                  syncLoading ? (
                    <CircularProgress size={16} sx={{ color: "inherit" }} />
                  ) : (
                    <Iconify icon="lucide:refresh-cw" width={18} />
                  )
                }
                sx={{
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  "&.Mui-disabled": {
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    opacity: 0.7,
                  },
                }}
              >
                Sync Payment
              </Button>
              <Button
                variant="standard"
                sx={{ bgcolor: "primary.main", color: "primary.contrastText" }}
                onClick={() => setApplyConcessionOpen(true)}
                disabled={!academicYear?.ay_id}
              >
                Apply Concession
              </Button>
              <IconButton
                sx={{
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  borderRadius: "5px",
                  p: "2px",
                  height: "35px",
                  width: "35px",
                  "&:hover": {
                    bgcolor: "primary.dark",
                  },
                }}
                onClick={handleEdit}
              >
                <Iconify icon="lucide:edit" />
              </IconButton>
            </Box>

            {activeTab === 0 && (
              <OtherDetailsTab
                detail={detail}
                studentDetailRefetch={studentDetailRefetch}
              />
            )}
            {activeTab === 1 && (
              <PendingFeesTab
                detail={detail}
                academicYear={academicYear}
                studentDetailRefetch={studentDetailRefetch}
                refreshKey={feesRefreshKey}
              />
            )}
            {activeTab === 2 && (
              <PaidFeesTab
                detail={detail}
                academicYear={academicYear}
                studentDetailRefetch={studentDetailRefetch}
                refreshKey={feesRefreshKey}
              />
            )}
            {activeTab === 3 && (
              <StudentTxnTab detail={detail} refreshKey={feesRefreshKey} />
            )}
            {activeTab === 4 && <ReportCardTab detail={detail} />}
            {activeTab === 5 && <AttachmentsTab detail={detail} />}

            <WalletModal
              open={walletModalOpen}
              onClose={handleWalletModalClose}
              detail={detail}
              studentDetailRefetch={studentDetailRefetch}
            />
            <TransferMoneyModal
              open={transferMoneyModalOpen}
              onClose={handleTransferMoneyModalClose}
              detail={detail}
              studentDetailRefetch={studentDetailRefetch}
            />
            <ApplyConcessionModal
              open={applyConcessionOpen}
              onClose={() => setApplyConcessionOpen(false)}
              detail={detail}
              academicYear={academicYear}
              onSuccess={() => {
                setFeesRefreshKey((prev) => prev + 1);
                studentDetailRefetch();
              }}
            />
          </CardContent>
        </Card>
      )}

      <ConfirmationDialog
        open={confirmationModalOpen}
        onCancel={handleConfirmationModalClose}
        onConfirm={handleOffRoll}
        isLoading={offRollLoading}
        title={`Are you sure you want to ${
          detail?.st_on_roll === "1" ? "Off Roll" : "On Roll"
        } this student?`}
      />
    </>
  );
};

export default StudentDetail;
