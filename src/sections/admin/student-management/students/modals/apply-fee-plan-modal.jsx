import PropTypes from "prop-types";
import { useState } from "react";
import {
  applyFeePlan,
  getFeePlan,
} from "../../../../../services/admin/students-management.service";
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  TextField,
  Typography,
} from "@mui/material";
import { toast } from "react-toastify";
import useAuth from "../../../../../hooks/useAuth";
import { CancelOutlined } from "@mui/icons-material";
import { useGetApi } from "../../../../../hooks/useGetApi";

const ApplyFeePlanModal = ({
  open,
  onClose,
  selectedRows,
  setSelectedRows,
  refetch,
}) => {
  const { userInfo, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [feePlanOption, setFeePlanOption] = useState(null);

  // api to get feelPlanList
  const { dataList: feelPlanList } = useGetApi({
    apiFunction: getFeePlan,
    body: {
      ay_id: userInfo?.ay_id,
    },
  });

  const handleFeePlan = async () => {
    if (!feePlanOption?.id) {
      toast.info("Select a fee plan");
      return;
    }
    if (!selectedRows?.length) {
      toast.info("Select the students to apply fee plan");
      return;
    }

    setIsLoading(true);

    const BATCH_SIZE = 100;
    const batches = [];
    for (let i = 0; i < selectedRows.length; i += BATCH_SIZE) {
      batches.push(selectedRows.slice(i, i + BATCH_SIZE));
    }

    let totalProcessed = 0;
    let failedBatches = 0;

    for (let i = 0; i < batches.length; i += 1) {
      const response = await applyFeePlan({
        st_id: batches[i],
        fp_id: feePlanOption.id,
      });

      if (response?.code === 200) {
        const match = String(response?.message || "").match(/(\d+)\s+records/);
        totalProcessed += match ? Number(match[1]) : batches[i].length;
      } else if (response?.code === 401) {
        setIsLoading(false);
        logout(response);
        return;
      } else {
        failedBatches += 1;
      }
    }

    setIsLoading(false);

    if (failedBatches === 0) {
      onClose();
      refetch();
      setFeePlanOption(null);
      setSelectedRows([]);
      toast.success(
        `Fee plan applied successfully! ${totalProcessed} records processed.`
      );
    } else if (failedBatches < batches.length) {
      toast.warning(
        `Partially applied. ${totalProcessed} records processed. ${failedBatches} batch(es) failed — select remaining students and try again.`
      );
      refetch();
    } else {
      toast.error("Some error occurred. Please try again with fewer students.");
    }
  };
  return (
    <Dialog
      open={open}
      onClose={!isLoading ? onClose : null}
      PaperProps={{
        sx: {
          minWidth: { xs: "95vw", sm: "600px" },
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
          cursor: "pointer",
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
        Apply Fee Plan
      </Box>

      <DialogContent>
        <Typography sx={{ color: "text.secondary", mb: 2 }}>
          Apply fee plan to all students filtered.
        </Typography>
        <Autocomplete
          options={feelPlanList || []}
          getOptionLabel={(option) => option?.fp_name || ""} // it is necessary for searching the options
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select Fee Plan"
              size="small"
              fullWidth
            />
          )}
          value={feePlanOption || null}
          onChange={(_, newValue) => setFeePlanOption(newValue)}
        />
        <Box
          sx={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 1,
            justifyContent: "flex-end",
            mt: 2,
          }}
        >
          <Button variant="outlined" onClick={onClose} disabled={isLoading}>
            Close
          </Button>
          <Button
            variant="contained"
            onClick={handleFeePlan}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : `Apply`}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

ApplyFeePlanModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  selectedRows: PropTypes.array,
  refetch: PropTypes.func,
  setSelectedRows: PropTypes.func,
};

export default ApplyFeePlanModal;
