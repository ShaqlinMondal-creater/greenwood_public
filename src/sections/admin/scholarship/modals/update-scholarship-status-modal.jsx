import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { CancelOutlined } from "@mui/icons-material";
import useAuth from "../../../../hooks/useAuth";
import { updateScholarshipStatus } from "../scholarship.service";
import {
  STATUS_OPTIONS,
  normalizeScholarshipStatus,
} from "../scholarship-utils";

const UpdateScholarshipStatusModal = ({ open, onClose, row, onUpdated }) => {
  const { logout } = useAuth();
  const [status, setStatus] = useState("Pending");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setStatus(normalizeScholarshipStatus(row?.application_status));
    }
  }, [open, row]);

  const handleSave = async () => {
    if (!row?.timestamp || !row?.student_full_name) {
      toast.error("This row is missing timestamp or student name.");
      return;
    }

    setIsLoading(true);
    const response = await updateScholarshipStatus({
      timestamp: row.timestamp,
      student_full_name: row.student_full_name,
      mobile: row.mobile || "",
      status,
    });
    setIsLoading(false);

    if (response?.code === 200) {
      toast.success(response?.message || "Status updated on sheet.");
      onUpdated?.(
        response?.data?.application_status || status
      );
      onClose?.();
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Failed to update status on the sheet.");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onClose}
      PaperProps={{
        sx: {
          minWidth: { xs: "92vw", sm: 420 },
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
          fontSize: "22px",
          cursor: isLoading ? "default" : "pointer",
          zIndex: 1,
        }}
        onClick={isLoading ? undefined : onClose}
      />
      <Box
        sx={{
          px: 2,
          py: 1,
          bgcolor: "primary.main",
          color: "primary.contrastText",
          fontWeight: 600,
        }}
      >
        Update Status
      </Box>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600 }}>
          {row?.student_full_name || "-"}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
          {row?.mobile || "-"}
          {row?.class_roll_no_section ? `  |  ${row.class_roll_no_section}` : ""}
        </Typography>

        <TextField
          select
          fullWidth
          size="small"
          label="Status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          disabled={isLoading}
        >
          {STATUS_OPTIONS.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2.5 }}>
          <Button variant="outlined" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : null}
          >
            Save
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

UpdateScholarshipStatusModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  row: PropTypes.object,
  onUpdated: PropTypes.func,
};

export default UpdateScholarshipStatusModal;
