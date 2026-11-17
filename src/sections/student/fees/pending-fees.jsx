import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableContainer from "@mui/material/TableContainer";

import {
  Box,
  Button,
  Card,
  CardContent,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useGetApi } from "../../../hooks/useGetApi";
import MessageBox from "../../../components/error/message-box";
import Loader from "../../../components/loader/loader";
import PendingFeesTableRow from "./pending-fees-table-row";
import PendingPaymentBanner, {
  isPendingPaymentLocked,
} from "../../../components/pending-payment-banner/pending-payment-banner";
import useAuth from "../../../hooks/useAuth";
import {
  getPendingFees,
  payFees,
} from "../../../services/student/fees.service";
import { Helmet } from "react-helmet-async";
import { toast } from "react-toastify";
import DisclaimerDialog from "../modals/disclaimer-dialog";
import AadhaarWarningDialog from "../modals/aadhaar-warning-dialog";
import { STUDENT_AADHAAR_WARN_PAYMENT } from "../../../utils/constants";
import { checkStudentMissingProfileFields } from "../../../utils/student-profile";
import { idsToUnselectInGroup } from "./pending-fee-sequence";
// ----------------------------------------------------------------------

const HEAD_LABEL = [
  { id: "fpp_name", label: "Fee" },
  { id: "fpp_amount", label: "Fee Amount" },
  { id: "fpp_due_date", label: "Due Date" },
  { id: "total_amount", label: "Total Amount" },
];

export default function PendingFees() {
  const { userInfo, logout } = useAuth();
  const navigate = useNavigate();

  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [aadhaarPaymentWarnOpen, setAadhaarPaymentWarnOpen] = useState(false);
  const [paymentWaitOver, setPaymentWaitOver] = useState(false);

  // api to get pending fees list
  const {
    dataList: pendingFeesList,
    allResponse,
    isLoading,
    isError,
    refetch,
    errorMessage,
  } = useGetApi({
    apiFunction: getPendingFees,
    body: {
      st_id: userInfo?.st_id,
      offset: 0,
      limit: 300,
    },
  });

  useEffect(() => {
    // If wait already finished (or no pending), unlock pay UI immediately
    setPaymentWaitOver(!isPendingPaymentLocked(allResponse));
  }, [allResponse]);

  const feesUiResponse = useMemo(() => {
    if (!allResponse) return allResponse;
    const locked = allResponse.last_payment_status === "pending" && !paymentWaitOver;
    return {
      ...allResponse,
      // After wait, treat as not-pending so checkboxes / pay show again
      last_payment_status: locked ? "pending" : "ready",
    };
  }, [allResponse, paymentWaitOver]);

  const selectedFees = selectedRows?.reduce((total, row) => {
    return (
      total +
      Number(row?.fpp_amount || 0) +
      Number(row?.f_late_fee_applicable === "1" ? row?.fpp_late_fee : 0) -
      Number(row?.f_concession || 0)
    );
  }, 0);

  const furtherToPay =
    selectedFees >= allResponse?.student_wallet
      ? selectedFees - Number(allResponse?.student_wallet || 0)
      : 0;

  const handleModalOpen = async () => {
    if (!userInfo?.st_id) return;

    const warnKey = `${STUDENT_AADHAAR_WARN_PAYMENT}_${userInfo.st_id}`;
    if (!sessionStorage.getItem(warnKey)) {
      const missingProfileFields = await checkStudentMissingProfileFields(
        userInfo.st_id
      );
      if (missingProfileFields) {
        setAadhaarPaymentWarnOpen(true);
        return;
      }
    }

    setModalOpen(true);
  };

  const handleDismissPaymentAadhaarWarn = () => {
    if (userInfo?.st_id) {
      sessionStorage.setItem(
        `${STUDENT_AADHAAR_WARN_PAYMENT}_${userInfo.st_id}`,
        "1"
      );
    }
    setAadhaarPaymentWarnOpen(false);
    setModalOpen(true);
  };

  const handleGoToProfileFromPayment = () => {
    if (userInfo?.st_id) {
      sessionStorage.setItem(
        `${STUDENT_AADHAAR_WARN_PAYMENT}_${userInfo.st_id}`,
        "1"
      );
    }
    setAadhaarPaymentWarnOpen(false);
    navigate("/my-profile");
  };

  const handleGoToParentDetailsFromPayment = () => {
    if (userInfo?.st_id) {
      sessionStorage.setItem(
        `${STUDENT_AADHAAR_WARN_PAYMENT}_${userInfo.st_id}`,
        "1"
      );
    }
    setAadhaarPaymentWarnOpen(false);
    navigate("/parent-details");
  };

  const handleModalClose = () => {
    setModalOpen(false);
  };

  const handleClick = (selectedRowData) => {
    const selectedIndex = selectedRowIds.indexOf(selectedRowData?.id);

    if (selectedIndex === -1) {
      // Row is being selected
      setSelectedRows((prevSelectedRows) => [
        ...prevSelectedRows,
        selectedRowData,
      ]);
      setSelectedRowIds((prevSelectedRowIds) => [
        ...prevSelectedRowIds,
        selectedRowData?.id,
      ]);
    } else {
      const idsToUnselect = idsToUnselectInGroup(
        selectedRowData,
        pendingFeesList,
      );
      setSelectedRows(
        selectedRows.filter((row) => !idsToUnselect.includes(row.id)),
      );
      setSelectedRowIds(
        selectedRowIds.filter((id) => !idsToUnselect.includes(id)),
      );
    }
  };

  const handlePayFees = async () => {
    setLoading(true);
    const response = await payFees({
      st_id: userInfo?.st_id,
      fpp_ids: selectedRows?.map((row) => row?.fpp_id)?.join(","),
    });
    setLoading(false);

    if (response?.code === 200) {
      handleModalClose();
      setSelectedRows([]);
      setSelectedRowIds([]);
      refetch();
      if (response?.url) {
        const decodedUrl = response.url;
        if (decodedUrl.startsWith("http")) {
          // Better mobile browser handling for payment gateway
          const isMobile =
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
              navigator.userAgent,
            );

          if (isMobile) {
            // For mobile browsers, use window.location.href for better compatibility
            setTimeout(() => {
              window.location.href = decodedUrl;
            }, 100);
          } else {
            // For desktop browsers
            window.open(decodedUrl, "_self", "noopener,noreferrer");
          }
        } else {
          toast.error("Invalid redirect URL");
        }
      }
      toast.success(response?.message || "Fees paid successfully");
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Some error occurred.");
    }
  };

  return (
    <>
      <Helmet>
        <title>Pending Fees | GREENWOOD</title>
      </Helmet>

      {/* Table */}
      {isLoading ? (
        <Loader />
      ) : isError ? (
        <MessageBox errorMessage={errorMessage} />
      ) : (
        <Card sx={{ width: "100%", mt: 2 }}>
          <CardContent>
            <Box sx={{ mb: 2, fontSize: "20px" }}>
              Pending Fees - {userInfo?.name || ""}
            </Box>
            {allResponse?.last_payment_status === "pending" &&
              !paymentWaitOver && (
              <PendingPaymentBanner
                message={allResponse?.last_payment_details || ""}
                pendingPayment={allResponse?.pending_payment}
                onWaitEnd={() => setPaymentWaitOver(true)}
              />
            )}
            <TableContainer sx={{ overflowY: "unset" }}>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    {feesUiResponse?.last_payment_status !== "pending" && (
                      <TableCell padding="checkbox"></TableCell>
                    )}
                    {HEAD_LABEL?.map((headCell) => (
                      <TableCell
                        key={headCell?.id}
                        align={headCell?.align || "left"}
                        sx={{
                          width: headCell?.width,
                          minWidth: headCell?.minWidth,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {headCell?.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {pendingFeesList?.map((row) => {
                    const isRowSelected =
                      selectedRowIds?.indexOf(row?.id) !== -1;
                    return (
                      <PendingFeesTableRow
                        key={row?.id}
                        row={row}
                        isRowSelected={isRowSelected}
                        handleClick={handleClick}
                        selectedRowIds={selectedRowIds} // Pass the selected rows array
                        rows={pendingFeesList} // Pass the full list of rows
                        allResponse={feesUiResponse}
                        refetch={refetch}
                      />
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {selectedRowIds?.length > 0 && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 2,
                  mt: 2,
                  width: "100%",
                }}
              >
                <Box sx={{ width: "300px" }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 2,
                    }}
                  >
                    <Typography sx={{ fontWeight: 600 }}>
                      Adjusted From Wallet
                    </Typography>
                    <Typography sx={{ color: "primary.main" }}>
                      ₹{" "}
                      {furtherToPay > 0
                        ? allResponse?.student_wallet || "0"
                        : selectedFees}
                      /-
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 2,
                    }}
                  >
                    <Typography sx={{ fontWeight: 600 }}>
                      Further to Pay
                    </Typography>
                    <Typography sx={{ color: "primary.main" }}>
                      ₹{furtherToPay || "0"}
                      /-
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Button
                    variant="contained"
                    onClick={handleModalOpen}
                    sx={{ minWidth: "120px" }}
                  >
                    {furtherToPay > 0 ? `Pay Fees` : "Adjust Fees"}
                  </Button>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
      <AadhaarWarningDialog
        open={aadhaarPaymentWarnOpen}
        onClose={handleDismissPaymentAadhaarWarn}
        onGoToProfile={handleGoToProfileFromPayment}
        onGoToParentDetails={handleGoToParentDetailsFromPayment}
      />
      <DisclaimerDialog
        open={modalOpen}
        onCancel={handleModalClose}
        isLoading={loading}
        onConfirm={handlePayFees}
        furtherToPay={furtherToPay}
      />
    </>
  );
}

PendingFees.propTypes = {
  detail: PropTypes.object,
  academicYear: PropTypes.object,
};
