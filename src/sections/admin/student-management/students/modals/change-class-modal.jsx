import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import {
  changeStudentClass,
  getChangeClassOptions,
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

const ChangeClassModal = ({
  open,
  onClose,
  selectedRows,
  setSelectedRows,
  refetch,
}) => {
  const { logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isOptionsLoading, setIsOptionsLoading] = useState(false);
  const [classOption, setClassOption] = useState(null);
  const [options, setOptions] = useState([]);
  const [currentClass, setCurrentClass] = useState(null);

  useEffect(() => {
    if (!open) {
      setClassOption(null);
      setOptions([]);
      setCurrentClass(null);
      return;
    }

    if (!selectedRows?.length) {
      return;
    }

    // Options are based on the first selected student; backend validates each student.
    const loadOptions = async () => {
      setIsOptionsLoading(true);
      const response = await getChangeClassOptions({
        st_id: selectedRows[0],
      });
      setIsOptionsLoading(false);

      if (response?.code === 200) {
        setCurrentClass(response?.data?.current || null);
        setOptions(response?.data?.options || []);
      } else if (response?.code === 401) {
        logout(response);
      } else {
        setCurrentClass(response?.data?.current || null);
        setOptions([]);
        toast.error(response?.message || "Unable to load section options.");
      }
    };

    loadOptions();
  }, [open, selectedRows, logout]);

  const handleChangeClass = async () => {
    if (!classOption?.id) {
      toast.info("Select a target section");
      return;
    }

    setIsLoading(true);
    const response = await changeStudentClass({
      st_id: selectedRows,
      cg_id: classOption.id,
    });
    setIsLoading(false);

    if (response?.code === 200) {
      onClose();
      refetch();
      setClassOption(null);
      setSelectedRows([]);
      toast.success(response?.message || "Class group updated successfully");
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Some error occurred.");
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
        Change Class (Nursery – Class 12)
      </Box>

      <DialogContent>
        <Typography sx={{ color: "text.secondary", mb: 1 }}>
          Change section within the same class only (e.g. 1-D → 1-C, or 9-B →
          9-D). Same-year fees (paid + unpaid) will also update to the new
          section.
        </Typography>

        {currentClass?.cg_name && (
          <Typography sx={{ mb: 2, fontWeight: 600 }}>
            Current: {currentClass.cg_name}
          </Typography>
        )}

        {isOptionsLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <Autocomplete
            options={options || []}
            getOptionLabel={(option) => option?.cg_name || ""}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Section"
                size="small"
                fullWidth
              />
            )}
            value={classOption || null}
            onChange={(_, newValue) => setClassOption(newValue)}
            disabled={!options?.length}
          />
        )}

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
            onClick={handleChangeClass}
            disabled={isLoading || isOptionsLoading || !classOption?.id}
          >
            {isLoading ? <CircularProgress size={24} /> : "Change Class"}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

ChangeClassModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  selectedRows: PropTypes.array,
  refetch: PropTypes.func,
  setSelectedRows: PropTypes.func,
};

export default ChangeClassModal;
