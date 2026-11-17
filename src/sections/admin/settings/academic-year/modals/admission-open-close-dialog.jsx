import PropTypes from "prop-types";
import { memo, useEffect, useState } from "react";
import {
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { toast } from "react-toastify";
import useAuth from "../../../../../hooks/useAuth";
import {
  getAdmissionClasses,
  updateAdmissionClassStatus,
} from "../../../../../services/new-admission.service";

const AdmissionOpenCloseDialog = ({ open, onClose, academicYear }) => {
  const { logout } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchClasses = async () => {
    setLoading(true);
    const response = await getAdmissionClasses();
    setLoading(false);

    if (response?.code === 200) {
      const list = Array.isArray(response?.data) ? response.data : [];
      setRows(list);
    } else if (response?.code === 401) {
      logout(response);
    } else {
      setRows([]);
      toast.error(response?.message || "Failed to load admission classes.");
    }
  };

  useEffect(() => {
    if (!open) return;
    fetchClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleToggle = async (row) => {
    if (!row?.id || updatingId) return;

    const nextStatus = !(
      row?.status === true ||
      row?.status === 1 ||
      row?.status === "1"
    );

    setUpdatingId(row.id);
    const response = await updateAdmissionClassStatus(row.id, {
      status: nextStatus,
    });
    setUpdatingId(null);

    if (response?.code === 200) {
      setRows((prev) =>
        prev.map((item) =>
          item.id === row.id ? { ...item, status: nextStatus } : item,
        ),
      );
      toast.success(
        nextStatus
          ? `${row?.cg_name || "Class"} opened for admission.`
          : `${row?.cg_name || "Class"} closed for admission.`,
      );
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Failed to update status.");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <Box>
            <Typography variant="h6">Open / Close Admissions</Typography>
            {academicYear?.ay_name && (
              <Typography variant="body2" color="text.secondary">
                Academic Year: {academicYear.ay_name}
              </Typography>
            )}
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box sx={{ display: "grid", placeItems: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 480 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>SN</TableCell>
                  <TableCell>Class</TableCell>
                  <TableCell align="center">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length > 0 ? (
                  rows.map((row, index) => {
                    const isOpen =
                      row?.status === true ||
                      row?.status === 1 ||
                      row?.status === "1";

                    return (
                      <TableRow key={row?.id || index} hover>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{row?.cg_name || "-"}</TableCell>
                        <TableCell align="center">
                          <Box
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Typography
                              variant="body2"
                              color={isOpen ? "success.main" : "text.secondary"}
                            >
                              {isOpen ? "Open" : "Closed"}
                            </Typography>
                            {updatingId === row?.id ? (
                              <CircularProgress size={18} />
                            ) : (
                              <Switch
                                checked={isOpen}
                                onChange={() => handleToggle(row)}
                                color="primary"
                              />
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      No admission classes found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
    </Dialog>
  );
};

AdmissionOpenCloseDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  academicYear: PropTypes.object,
};

export default memo(AdmissionOpenCloseDialog);
