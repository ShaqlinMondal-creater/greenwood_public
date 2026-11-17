import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableContainer from "@mui/material/TableContainer";

import {
  Box,
  Button,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useGetApi } from "../../../../../hooks/useGetApi";
import MessageBox from "../../../../../components/error/message-box";
import Loader from "../../../../../components/loader/loader";
import PendingFeesTableRow from "./pending-fees-table-row";
import PendingPaymentBanner, {
  isPendingPaymentLocked,
} from "../../../../../components/pending-payment-banner/pending-payment-banner";
import { getAllPendingFees } from "../../../../../services/admin/students-management.service";
import useAuth from "../../../../../hooks/useAuth";
import { payFees } from "../../../../../services/student/fees.service";
import { toast } from "react-toastify";
import DisclaimerDialog from "../../../../student/modals/disclaimer-dialog";
// ----------------------------------------------------------------------

const HEAD_LABEL = [
  { id: "fpp_name", label: "Fee" },
  { id: "fpp_amount", label: "Fee Amount" },
  { id: "fpp_due_date", label: "Due Date" },
  { id: "f_concession", label: "Concession", width: "110px" },
  { id: "fpp_late_fee", label: "Late Fee", width: "110px" },
  { id: "total_amount", label: "Total Amount" },
  { id: "actions", label: "Actions" },
];

export default function PendingFees({
  detail,
  academicYear,
  studentDetailRefetch,
  refreshKey,
}) {
  const { logout } = useAuth();

  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [paymentWaitOver, setPaymentWaitOver] = useState(false);

  // api to get students list

  const {
    dataList: transferCertificateList,
    allResponse,
    isLoading,
    isError,
    refetch,
    errorMessage,
  } = useGetApi({
    apiFunction: getAllPendingFees,
    body: {
      st_id: detail?.id,
      offset: 0,
      limit: 300,
      ay_id: Number(academicYear?.ay_id),
    },
    dependencies: [academicYear, refreshKey],
  });

  useEffect(() => {
    setPaymentWaitOver(!isPendingPaymentLocked(allResponse));
  }, [allResponse]);

  const feesUiResponse = useMemo(() => {
    if (!allResponse) return allResponse;
    const locked =
      allResponse.last_payment_status === "pending" && !paymentWaitOver;
    return {
      ...allResponse,
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
    selectedFees >= detail?.st_wallet
      ? selectedFees - Number(detail?.st_wallet || 0)
      : 0;

  const handleModalOpen = () => {
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
  };

  const handleClick = (selectedRowData) => {
    const selectedIndex = selectedRowIds.indexOf(selectedRowData?.id);

    if (selectedIndex === -1) {
      setSelectedRows((prevSelectedRows) => [
        ...prevSelectedRows,
        selectedRowData,
      ]);
      setSelectedRowIds((prevSelectedRowIds) => [
        ...prevSelectedRowIds,
        selectedRowData?.id,
      ]);
      return;
    }

    // Unselect this row only (no compulsory sequence restriction on admin)
    setSelectedRows((prev) => prev.filter((row) => row.id !== selectedRowData?.id));
    setSelectedRowIds((prev) => prev.filter((id) => id !== selectedRowData?.id));
  };

  const handlePayFees = async () => {
    setLoading(true);
    const response = await payFees({
      st_id: detail?.id,
      fpp_ids: selectedRows?.map((row) => row?.fpp_id)?.join(","),
    });
    setLoading(false);

    if (response?.code === 200) {
      handleModalClose();
      setSelectedRows([]);
      setSelectedRowIds([]);
      studentDetailRefetch();
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
      {/* Table */}

      {isLoading ? (
        <Loader />
      ) : isError ? (
        <MessageBox errorMessage={errorMessage} />
      ) : (
        <Box sx={{ width: "100%", mt: 2 }}>
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
                {transferCertificateList?.map((row) => {
                  const isRowSelected = selectedRowIds?.indexOf(row?.id) !== -1;

                  return (
                    <PendingFeesTableRow
                      key={row?.id}
                      row={row}
                      isRowSelected={isRowSelected}
                      handleClick={handleClick}
                      allResponse={feesUiResponse}
                      refetch={refetch}
                      detail={detail}
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
                    {furtherToPay > 0 ? detail?.st_wallet || "0" : selectedFees}
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
                {furtherToPay > 0 ? (
                  <Typography variant="h6" color="primary.main">
                    Please add ₹{furtherToPay} to wallet to adjust fees.
                  </Typography>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleModalOpen}
                    sx={{ minWidth: "120px" }}
                  >
                    Adjust Fees
                  </Button>
                )}
              </Box>
            </Box>
          )}
        </Box>
      )}
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
  studentDetailRefetch: PropTypes.func.isRequired,
  refreshKey: PropTypes.number,
};
