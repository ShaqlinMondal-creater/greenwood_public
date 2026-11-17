import PropTypes from "prop-types";
import { memo, useState } from "react";

import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  Grid,
  TextField,
} from "@mui/material";
import { toast } from "react-toastify";
import { CancelOutlined } from "@mui/icons-material";
import useAuth from "../../../../../hooks/useAuth";
import { createBulkCharacterCertificate } from "../../../../../services/admin/report-card-module.service";
import { DatePicker } from "@mui/x-date-pickers";
import { getClasses } from "../../../../../services/admin/students-management.service";
import { useGetApi } from "../../../../../hooks/useGetApi";
import dayjs from "dayjs";

const CreateBulkCCModal = ({ open, onClose, refetch }) => {
  const { logout, userInfo } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const initialState = {
    leaving_date: dayjs(),
    stream: null,
    date_from: "",
    cg_id: null,
  };

  const [formData, setFormData] = useState(initialState);

  // api to get classList

  const { dataList: classList } = useGetApi({
    apiFunction: getClasses,
    body: {
      ay_id: Number(userInfo?.ay_id) - 1,
    },
  });

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const parsedValue =
      type === "date"
        ? value
          ? dayjs(value).format("YYYY-MM-DD")
          : null
        : value;
    setFormData((preValue) => ({
      ...preValue,
      [name]: parsedValue,
    }));
  };

  const handleClose = () => {
    onClose();
    setFormData(initialState);
  };

  const handleCreateBulkCharacterCertificate = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const payload = {
      ...formData,
      leaving_date: formData?.leaving_date
        ? dayjs(formData?.leaving_date).format("YYYY-MM-DD")
        : dayjs().format("YYYY-MM-DD"),
    };

    const response = await createBulkCharacterCertificate({
      ...payload,
      cg_id: payload?.cg_id?.id,
    });

    setIsLoading(false);

    if (response?.code === 200) {
      handleClose();
      refetch();
      toast.success(
        response?.message || `Bulk character certificate created successfully`,
      );
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Some error occurred.");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={!isLoading ? handleClose : null}
      PaperProps={{
        sx: {
          minWidth: { xs: "90%", md: "800px", lg: "1000px" },
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
        onClick={!isLoading ? handleClose : null}
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
        Add New Bulk Character Certificate
      </Box>

      <DialogContent>
        <Box component="form" onSubmit={handleCreateBulkCharacterCertificate}>
          <Grid container spacing={4}>
            {/* Class */}
            <Grid item xs={12} sm={6} md={4}>
              <Autocomplete
                options={classList || []}
                getOptionLabel={(option) => option?.cg_name || ""}
                renderInput={(params) => (
                  <TextField {...params} label="Class" fullWidth />
                )}
                value={formData?.cg_id || null}
                onChange={(_, newValue) =>
                  handleChange({
                    target: { name: "cg_id", value: newValue },
                  })
                }
              />
            </Grid>

            {/* Leaving Date */}
            <Grid item xs={12} sm={6} md={4}>
              <DatePicker
                name="leaving_date"
                label="Leaving Date"
                value={formData?.leaving_date || null}
                onChange={(newValue) =>
                  handleChange({
                    target: { name: "leaving_date", value: newValue },
                  })
                }
                slotProps={{
                  textField: {
                    required: true,
                    fullWidth: true,
                  },
                }}
                disableFuture
              />
            </Grid>

            {/* Stream */}
            <Grid item xs={12} sm={6} md={4}>
              <Autocomplete
                options={["ISC", "ICSE"]}
                value={formData?.stream || null}
                onChange={(event, newValue) =>
                  handleChange({
                    target: { name: "stream", value: newValue },
                  })
                }
                renderInput={(params) => (
                  <TextField {...params} label="Stream" required fullWidth />
                )}
              />
            </Grid>

            {/* Date From */}
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                name="date_from"
                label="Date From"
                required
                fullWidth
                value={formData?.date_from || ""}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
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
            <Button
              variant="outlined"
              onClick={handleClose}
              disabled={isLoading}
            >
              Close
            </Button>
            <Button variant="contained" type="submit" disabled={isLoading}>
              {isLoading ? <CircularProgress size={24} /> : `Create CC`}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

CreateBulkCCModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  refetch: PropTypes.func,
};

export default memo(CreateBulkCCModal);
