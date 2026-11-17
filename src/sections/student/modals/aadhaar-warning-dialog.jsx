import PropTypes from "prop-types";
import { CancelOutlined } from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const AadhaarWarningDialog = ({
  open,
  onClose,
  onGoToProfile,
  onGoToParentDetails,
}) => {
  const navigate = useNavigate();

  const handleGoToProfile = () => {
    if (onGoToProfile) {
      onGoToProfile();
      return;
    }
    onClose();
    navigate("/my-profile");
  };

  const handleGoToParentDetails = () => {
    if (onGoToParentDetails) {
      onGoToParentDetails();
      return;
    }
    onClose();
    navigate("/parent-details");
  };

  return (
    <Dialog
      open={open}
      aria-labelledby="aadhaar-warning-dialog-title"
      PaperProps={{
        sx: {
          minWidth: { xs: "95vw", sm: "480px", md: "560px" },
          position: "relative",
        },
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1,
          bgcolor: "warning.main",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "18px",
          fontWeight: 600,
          color: "primary.darker",
          position: "relative",
        }}
      >
        Warning
        <IconButton onClick={onClose} sx={{ position: "absolute", right: 8 }}>
          <CancelOutlined />
        </IconButton>
      </Box>

      <DialogContent>
        <Typography>
          <strong>Email</strong>, <strong>Student Aadhaar</strong> and{" "}
          <strong>Parent / Guardian Details</strong> are mandatory. Please
          update them from <strong>My Profile</strong> and{" "}
          <strong>Parent Details</strong>.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1, flexWrap: "wrap" }}>
        <Button onClick={handleGoToProfile} variant="outlined">
          Go to My Profile
        </Button>
        <Button onClick={handleGoToParentDetails} variant="contained">
          Go to Parent Details
        </Button>
      </DialogActions>
    </Dialog>
  );
};

AadhaarWarningDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onGoToProfile: PropTypes.func,
  onGoToParentDetails: PropTypes.func,
};

export default AadhaarWarningDialog;
