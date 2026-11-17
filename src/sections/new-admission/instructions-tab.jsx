import PropTypes from "prop-types";
import {
  Autocomplete,
  Box,
  Checkbox,
  FormControlLabel,
  TextField,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import { memo, useEffect, useState } from "react";
import { getAdmissionInstructions } from "../../services/new-admission.service";
import { useGetApi } from "../../hooks/useGetApi";

const InstructionsTab = ({ props }) => {
  const {
    termsAccepted,
    handleCheckboxChange,
    acceptTermsRef,
    formData,
    handleChange,
    admissionClassList = [],
  } = props;

  const { allResponse, isLoading, isError, errorMessage } = useGetApi({
    apiFunction: getAdmissionInstructions,
  });

  const [instructionsContent, setInstructionsContent] = useState([]);

  useEffect(() => {
    // Show data if class is empty/undefined/null OR if class status is true
    if (!formData?.class || formData?.class?.status === true) {
      setInstructionsContent(allResponse?.data || []);
    }
    // Show data2 if class exists AND status is false
    else if (formData?.class && formData?.class?.status === false) {
      setInstructionsContent(allResponse?.data2 || []);
    }
  }, [formData?.class, allResponse]);

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading instructions...
        </Typography>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ mb: 2 }}>
        <Alert
          severity="error"
          sx={{
            mb: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          {errorMessage || "Some error occurred"}
        </Alert>
        {/* Fallback to static content if API fails */}
        <Typography variant="h6" sx={{ textAlign: "center" }}>
          Please contact the school administration for detailed admission
          instructions.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Dynamic Instructions Content */}
      {instructionsContent ? (
        <Box
          sx={{ mb: 3 }}
          dangerouslySetInnerHTML={{ __html: instructionsContent }}
        />
      ) : (
        <Typography variant="body1" sx={{ mb: 3, textAlign: "center" }}>
          Instructions content will be displayed here once loaded from the
          server.
        </Typography>
      )}

      {/* Class Selection */}
      <Autocomplete
        options={admissionClassList || []}
        getOptionLabel={(option) => option?.cg_name || ""}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Class"
            required
            fullWidth
            size="small"
          />
        )}
        name="class"
        value={formData?.class || null}
        onChange={(_, newValue) =>
          handleChange({ target: { name: "class", value: newValue } })
        }
        sx={{ width: "150px", mb: 1 }}
      />

      {/* Terms Checkbox */}
      {formData?.class?.status && (
        <FormControlLabel
          ref={acceptTermsRef}
          required
          control={
            <Checkbox
              checked={termsAccepted || false}
              onChange={handleCheckboxChange}
              color="primary"
            />
          }
          label="I understand and accept the above TERMS"
        />
      )}
    </Box>
  );
};

InstructionsTab.propTypes = {
  props: PropTypes.object,
  termsAccepted: PropTypes.object,
  handleCheckboxChange: PropTypes.func,
  acceptTermsRef: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.oneOf([null]),
  ]),
  formData: PropTypes.object,
  handleChange: PropTypes.func,
  admissionClassList: PropTypes.array,
};

export default memo(InstructionsTab);
