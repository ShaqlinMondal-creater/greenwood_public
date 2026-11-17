import PropTypes from "prop-types";
import { memo, useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
} from "@mui/material";
import { CancelOutlined } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import useAuth from "../../../../../../hooks/useAuth";
import {
  DEFAULT_BULK_FEE_PLAN_NAMES,
} from "../../../../../../utils/constants";
import { createFeePlan } from "../../../../../../services/admin/fee-plan.service";
import Iconify from "../../../../../../components/iconify/iconify";

const createRow = (fpName = "", type) => ({
  key: `${Date.now()}-${Math.random()}`,
  fp_name: fpName,
  late_fee: 0,
  type,
  amount: 0,
  due_date: null,
});

const needsAmountFields = (typeValue) =>
  typeValue === "admission" || typeValue === "one_time";

const BulkAddFeePlanModal = ({
  open,
  onClose,
  academicYear,
  refetch,
  type,
}) => {
  const { logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [rows, setRows] = useState([]);

  const resetRows = () => {
    const names = DEFAULT_BULK_FEE_PLAN_NAMES?.[type?.value] || [""];
    setRows(names.map((name) => createRow(name, type)));
  };

  useEffect(() => {
    if (open) {
      resetRows();
    }
  }, [open, type?.value]);

  const handleRowChange = (index, name, value) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [name]: value };
      return next;
    });
  };

  const handleAddRow = () => {
    setRows((prev) => [...prev, createRow("", type)]);
  };

  const handleRemoveRow = (index) => {
    setRows((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const validRows = rows.filter((row) => String(row?.fp_name || "").trim());
    if (!validRows.length) {
      toast.error("Please add at least one fee plan with a name.");
      return;
    }

    if (needsAmountFields(type?.value)) {
      const incomplete = validRows.find(
        (row) =>
          row?.amount === "" ||
          row?.amount === null ||
          row?.amount === undefined ||
          !row?.due_date,
      );
      if (incomplete) {
        toast.error("Amount and Due Date are required for each named row.");
        return;
      }
    }

    setIsLoading(true);
    let successCount = 0;
    let failCount = 0;
    const errors = [];

    for (const row of validRows) {
      const payload = {
        ay_id: Number(academicYear?.ay_id),
        fp_name: String(row.fp_name).trim(),
        type: type?.value,
        late_fee: Number(row.late_fee || 0),
      };

      if (needsAmountFields(type?.value)) {
        payload.amount = Number(row.amount || 0);
        payload.due_date = row.due_date;
      }

      const response = await createFeePlan(payload);

      if (response?.code === 200) {
        successCount += 1;
      } else if (response?.code === 401) {
        setIsLoading(false);
        logout(response);
        return;
      } else {
        failCount += 1;
        errors.push(
          `${payload.fp_name}: ${response?.message || "Failed to create"}`,
        );
      }
    }

    setIsLoading(false);

    if (successCount > 0) {
      toast.success(
        `${successCount} fee plan${successCount > 1 ? "s" : ""} created successfully`,
      );
      refetch?.();
    }

    if (failCount > 0) {
      toast.error(
        errors.slice(0, 3).join(" | ") ||
          `${failCount} fee plan${failCount > 1 ? "s" : ""} failed`,
      );
    }

    if (failCount === 0 && successCount > 0) {
      onClose();
    }
  };

  const showAmountCols = needsAmountFields(type?.value);

  return (
    <Dialog
      open={open}
      onClose={!isLoading ? onClose : null}
      PaperProps={{
        sx: {
          width: { xs: "95vw", sm: "1120px" },
          maxWidth: "95vw",
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
          cursor: isLoading ? "not-allowed" : "pointer",
          zIndex: 1,
        }}
        onClick={!isLoading ? onClose : null}
      />
      <Box
        sx={{
          px: 2,
          py: 1,
          bgcolor: "primary.main",
          color: "primary.contrastText",
          textAlign: "center",
          fontWeight: 600,
        }}
      >
        Bulk Add Fee Plans
      </Box>

      <DialogContent>
        <Box component="form" onSubmit={handleSave}>
          <TableContainer sx={{ maxHeight: 420, mb: 2 }}>
            <Table stickyHeader size="small" sx={{ tableLayout: "fixed" }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: "32%" }}>Name</TableCell>
                  <TableCell sx={{ width: 95 }}>Late Fee</TableCell>
                  <TableCell sx={{ width: 150 }}>Type</TableCell>
                  {showAmountCols && (
                    <>
                      <TableCell sx={{ width: 120 }}>Amount</TableCell>
                      <TableCell sx={{ width: 210 }}>Due Date</TableCell>
                    </>
                  )}
                  <TableCell align="center" sx={{ width: 60 }}>
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow key={row.key}>
                    <TableCell sx={{ py: 1 }}>
                      <TextField
                        size="small"
                        fullWidth
                        required
                        name="fp_name"
                        value={row.fp_name || ""}
                        onChange={(e) =>
                          handleRowChange(index, "fp_name", e.target.value)
                        }
                        disabled={isLoading}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <TextField
                        size="small"
                        fullWidth
                        type="number"
                        name="late_fee"
                        value={row.late_fee ?? ""}
                        onChange={(e) =>
                          handleRowChange(index, "late_fee", e.target.value)
                        }
                        onFocus={() => {
                          if (
                            row.late_fee === 0 ||
                            row.late_fee === "0" ||
                            row.late_fee === ""
                          ) {
                            handleRowChange(index, "late_fee", "");
                          }
                        }}
                        onBlur={() => {
                          if (
                            row.late_fee === "" ||
                            row.late_fee === null ||
                            row.late_fee === undefined
                          ) {
                            handleRowChange(index, "late_fee", 0);
                          }
                        }}
                        disabled={isLoading}
                        inputProps={{ style: { paddingRight: 4 } }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <Box
                        sx={{
                          px: 1,
                          py: 1,
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 1,
                          fontSize: "0.875rem",
                          whiteSpace: "nowrap",
                          bgcolor: "action.hover",
                        }}
                      >
                        {type?.label || "-"}
                      </Box>
                    </TableCell>
                    {showAmountCols && (
                      <>
                        <TableCell sx={{ py: 1 }}>
                          <TextField
                            size="small"
                            fullWidth
                            type="number"
                            name="amount"
                            value={row.amount ?? ""}
                            onChange={(e) =>
                              handleRowChange(index, "amount", e.target.value)
                            }
                            onFocus={() => {
                              if (
                                row.amount === 0 ||
                                row.amount === "0" ||
                                row.amount === ""
                              ) {
                                handleRowChange(index, "amount", "");
                              }
                            }}
                            onBlur={() => {
                              if (
                                row.amount === "" ||
                                row.amount === null ||
                                row.amount === undefined
                              ) {
                                handleRowChange(index, "amount", 0);
                              }
                            }}
                            disabled={isLoading}
                            inputProps={{ style: { paddingRight: 4 } }}
                          />
                        </TableCell>
                        <TableCell sx={{ py: 1 }}>
                          <DatePicker
                            format="DD-MM-YYYY"
                            slotProps={{
                              textField: {
                                size: "small",
                                fullWidth: true,
                                sx: {
                                  minWidth: 190,
                                  "& .MuiInputBase-input": {
                                    fontSize: "0.875rem",
                                  },
                                },
                              },
                            }}
                            value={row.due_date ? dayjs(row.due_date) : null}
                            onChange={(newValue) =>
                              handleRowChange(
                                index,
                                "due_date",
                                newValue
                                  ? dayjs(newValue).format("YYYY-MM-DD")
                                  : null,
                              )
                            }
                            disabled={isLoading}
                          />
                        </TableCell>
                      </>
                    )}
                    <TableCell align="center" sx={{ py: 1 }}>
                      <Tooltip title="Remove">
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            disabled={isLoading || rows.length <= 1}
                            onClick={() => handleRemoveRow(index)}
                          >
                            <Iconify
                              icon="material-symbols:delete-outline-rounded"
                              width={18}
                            />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            <Button
              variant="outlined"
              onClick={handleAddRow}
              disabled={isLoading}
            >
              + Add New
            </Button>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                onClick={onClose}
                disabled={isLoading}
              >
                Close
              </Button>
              <Button type="submit" variant="contained" disabled={isLoading}>
                {isLoading ? <CircularProgress size={24} /> : "Save"}
              </Button>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

BulkAddFeePlanModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  refetch: PropTypes.func,
  academicYear: PropTypes.object,
  type: PropTypes.object,
};

export default memo(BulkAddFeePlanModal);
