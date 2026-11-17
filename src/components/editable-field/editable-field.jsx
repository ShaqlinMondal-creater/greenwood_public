import PropTypes from "prop-types";
import {
  Box,
  CircularProgress,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import Iconify from "../iconify/iconify";

const EditableField = ({
  fieldKey,
  label,
  labelWidth = "130px",
  displayValue,
  formValue,
  isEditing,
  isLoading,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onStartEdit,
  onCancel,
  onSave,
  onChange,
  type = "text",
  inputWidth = "220px",
  allowMultiline = false,
  renderInput,
  sx,
}) => {
  const renderEditor = () => {
    if (renderInput) {
      return renderInput({
        value: formValue,
        onChange,
        disabled: isLoading,
      });
    }

    if (type === "date") {
      return (
        <DatePicker
          value={formValue ? dayjs(formValue) : null}
          onChange={(newValue) => onChange(fieldKey, newValue, "date")}
          disabled={isLoading}
          disableFuture
          slotProps={{
            textField: {
              size: "small",
              sx: { maxWidth: inputWidth },
            },
          }}
        />
      );
    }

    return (
      <TextField
        name={fieldKey}
        value={formValue ?? ""}
        onChange={(e) => onChange(fieldKey, e.target.value)}
        size="small"
        disabled={isLoading}
        multiline={allowMultiline}
        rows={allowMultiline ? 2 : 1}
        sx={{ maxWidth: inputWidth }}
      />
    );
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 1,
        ...sx,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {label ? (
        <Typography sx={{ width: labelWidth, fontWeight: 600 }}>
          {label}
        </Typography>
      ) : null}

      <Box sx={{ display: "flex", alignItems: "center", flex: 1, gap: 1 }}>
        {isEditing ? (
          <>
            {renderEditor()}
            {isLoading ? (
              <CircularProgress size={18} />
            ) : (
              <>
                <IconButton sx={{ color: "error.main" }} onClick={onCancel}>
                  <Iconify icon="carbon:close-filled" />
                </IconButton>
                <IconButton sx={{ color: "success.main" }} onClick={onSave}>
                  <Iconify icon="charm:circle-tick" />
                </IconButton>
              </>
            )}
          </>
        ) : (
          <>
            <Typography>{displayValue ?? "N/A"}</Typography>
            <IconButton
              onClick={onStartEdit}
              sx={{
                color: "primary.main",
                transition: "opacity 0.3s, visibility 0.3s",
                opacity: isHovered ? 1 : 0,
                visibility: isHovered ? "visible" : "hidden",
              }}
            >
              <Iconify icon="lucide:edit" />
            </IconButton>
          </>
        )}
      </Box>
    </Box>
  );
};

EditableField.propTypes = {
  fieldKey: PropTypes.string.isRequired,
  label: PropTypes.string,
  labelWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  displayValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  formValue: PropTypes.any,
  isEditing: PropTypes.bool,
  isLoading: PropTypes.bool,
  isHovered: PropTypes.bool,
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func,
  onStartEdit: PropTypes.func,
  onCancel: PropTypes.func,
  onSave: PropTypes.func,
  onChange: PropTypes.func,
  type: PropTypes.string,
  inputWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  allowMultiline: PropTypes.bool,
  renderInput: PropTypes.func,
  sx: PropTypes.object,
};

export default EditableField;
