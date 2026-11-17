import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { CancelOutlined } from "@mui/icons-material";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import useAuth from "../../../../../hooks/useAuth";
import { useGetApi } from "../../../../../hooks/useGetApi";
import Loader from "../../../../../components/loader/loader";
import MessageBox from "../../../../../components/error/message-box";
import {
  FORMAT_INDIAN_CURRENCY,
  handleNumericInput,
} from "../../../../../utils/constants";
import {
  applyConcession,
  getAllPendingFees,
} from "../../../../../services/admin/students-management.service";

const ApplyConcessionModal = ({
  open,
  onClose,
  detail,
  academicYear,
  onSuccess,
}) => {
  const { logout } = useAuth();
  const [amount, setAmount] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const {
    dataList: feesList,
    isLoading,
    isError,
    errorMessage,
    refetch,
  } = useGetApi({
    apiFunction: open ? getAllPendingFees : null,
    body: {
      st_id: detail?.id,
      offset: 0,
      limit: 300,
      ay_id: Number(academicYear?.ay_id),
    },
    dependencies: [open, detail?.id, academicYear?.ay_id],
    skip: !open || !detail?.id || !academicYear?.ay_id,
  });

  const fees = useMemo(
    () => (Array.isArray(feesList) ? feesList : []),
    [feesList],
  );

  useEffect(() => {
    if (!open) {
      setAmount("");
      setSelectedIds([]);
      setIsSaving(false);
    }
  }, [open]);

  const allSelected =
    fees.length > 0 && selectedIds.length === fees.length;

  const handleToggleAll = () => {
    if (allSelected) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(fees.map((fee) => fee.id));
  };

  const handleToggleRow = (feeId) => {
    setSelectedIds((prev) =>
      prev.includes(feeId)
        ? prev.filter((id) => id !== feeId)
        : [...prev, feeId],
    );
  };

  const handleSave = async () => {
    const concessionAmount = Number(amount);
    if (!amount || Number.isNaN(concessionAmount) || concessionAmount < 0) {
      toast.error("Enter a valid concession amount / month.");
      return;
    }
    if (!selectedIds.length) {
      toast.error("Select at least one fee / month.");
      return;
    }

    const selectedFees = fees.filter((fee) => selectedIds.includes(fee.id));
    const overLimit = selectedFees.find(
      (fee) => concessionAmount > Number(fee?.fpp_amount || 0),
    );
    if (overLimit) {
      toast.error(
        `Concession cannot be more than fee amount for ${
          overLimit?.fpp_name || "selected fee"
        }.`,
      );
      return;
    }

    setIsSaving(true);
    let successCount = 0;
    let failCount = 0;
    let firstError = "";

    for (const fee of selectedFees) {
      const response = await applyConcession({
        fpp_id: Number(fee?.fpp_id),
        st_id: detail?.id,
        concession_amount: concessionAmount,
      });

      if (response?.code === 200) {
        successCount += 1;
      } else if (response?.code === 401) {
        setIsSaving(false);
        logout(response);
        return;
      } else {
        failCount += 1;
        if (!firstError) {
          firstError = response?.message || "Some error occurred.";
        }
      }
    }

    setIsSaving(false);

    if (failCount === 0) {
      toast.success(
        `Concession of ₹ ${FORMAT_INDIAN_CURRENCY(
          concessionAmount,
        )} / month applied on ${successCount} fee(s).`,
      );
      onSuccess?.();
      onClose();
      return;
    }

    if (successCount > 0) {
      toast.warning(
        `Applied on ${successCount} fee(s). Failed on ${failCount}. ${firstError}`,
      );
      refetch();
      onSuccess?.();
      return;
    }

    toast.error(firstError || "Failed to apply concession.");
  };

  return (
    <Dialog
      open={open}
      onClose={!isSaving ? onClose : null}
      PaperProps={{
        sx: {
          minWidth: { xs: "95vw", sm: "720px" },
          position: "relative",
        },
      }}
    >
      <CancelOutlined
        sx={{
          position: "absolute",
          right: 8,
          top: 8,
          color: "primary.contrastText",
          fontSize: "24px",
          cursor: isSaving ? "default" : "pointer",
        }}
        onClick={!isSaving ? onClose : null}
      />
      <Box
        sx={{
          bgcolor: "primary.main",
          color: "primary.contrastText",
          p: 2,
          pr: 5,
        }}
      >
        <Typography variant="h6">Apply Concession</Typography>
        <Typography variant="body2">
          {detail?.st_first_name || ""} {detail?.st_last_name || ""}
          {detail?.st_roll_no ? ` · ${detail.st_roll_no}` : ""}
          {academicYear?.ay_name ? ` · ${academicYear.ay_name}` : ""}
        </Typography>
      </Box>

      <DialogContent sx={{ pt: 2 }}>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 2,
            mb: 2,
          }}
        >
          <TextField
            label="Apply Concession Amount / Month"
            size="small"
            value={amount}
            onChange={(e) => setAmount(handleNumericInput(e.target.value))}
            sx={{ width: 280 }}
            disabled={isSaving}
          />
          <Typography variant="body2" color="text.secondary">
            Same amount will be set on each selected fee.
          </Typography>
        </Box>

        {isLoading ? (
          <Loader />
        ) : isError ? (
          <MessageBox errorMessage={errorMessage} />
        ) : (
          <TableContainer sx={{ maxHeight: 420 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={allSelected}
                      indeterminate={
                        selectedIds.length > 0 &&
                        selectedIds.length < fees.length
                      }
                      onChange={handleToggleAll}
                      disabled={!fees.length || isSaving}
                    />
                  </TableCell>
                  <TableCell>Fee / Month</TableCell>
                  <TableCell align="right">Fee Amount</TableCell>
                  <TableCell align="right">Current Concession</TableCell>
                  <TableCell>Due Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      No pending fees found for this year.
                    </TableCell>
                  </TableRow>
                ) : (
                  fees.map((fee) => {
                    const checked = selectedIds.includes(fee.id);
                    return (
                      <TableRow key={fee.id} hover selected={checked}>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={checked}
                            onChange={() => handleToggleRow(fee.id)}
                            disabled={isSaving}
                          />
                        </TableCell>
                        <TableCell>{fee.fpp_name || "-"}</TableCell>
                        <TableCell align="right">
                          ₹ {FORMAT_INDIAN_CURRENCY(fee.fpp_amount) || "0"}
                        </TableCell>
                        <TableCell align="right">
                          ₹ {FORMAT_INDIAN_CURRENCY(fee.f_concession) || "0"}
                        </TableCell>
                        <TableCell>
                          {fee.fpp_due_date
                            ? dayjs(fee.fpp_due_date).format("DD-MM-YYYY")
                            : "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 1,
            mt: 2,
          }}
        >
          <Button variant="outlined" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={isSaving || isLoading || !fees.length}
            startIcon={
              isSaving ? <CircularProgress size={16} color="inherit" /> : null
            }
          >
            Save
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

ApplyConcessionModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  detail: PropTypes.object,
  academicYear: PropTypes.object,
  onSuccess: PropTypes.func,
};

export default ApplyConcessionModal;
