import PropTypes from "prop-types";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Divider,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import EditableField from "../../../../../components/editable-field/editable-field";
import { useInlineFieldEdit } from "../../../../../hooks/useInlineFieldEdit";
import useAuth from "../../../../../hooks/useAuth";

const STUDENT_TYPE_OPTIONS = [
  { id: "0", label: "Internal" },
  { id: "1", label: "External" },
];

const getStudentTypeOption = (value) => {
  const id = value === 1 || value === "1" ? "1" : "0";
  return STUDENT_TYPE_OPTIONS.find((option) => option.id === id);
};

const formatAadhaarDisplay = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  const parts = [];
  for (let i = 0; i < digits.length && i < 12; i += 4) {
    parts.push(digits.slice(i, i + 4));
  }
  return parts.join("-");
};

const LEFT_FIELDS = {
  cisce_no: {
    label: "CISCE :",
    getValue: (detail) => detail?.cisce_no || "",
    allowEmpty: true,
  },
  stream: {
    label: "Stream :",
    getValue: (detail) => detail?.stream || "",
    show: (detail) => !!detail?.stream,
    allowEmpty: true,
  },
  st_gender: {
    label: "Gender :",
    getValue: (detail) => detail?.st_gender || "",
  },
  st_external: {
    label: "Student Type :",
    type: "object",
    labelWidth: "130px",
    getValue: (detail) => getStudentTypeOption(detail?.st_external),
    display: (detail) => getStudentTypeOption(detail?.st_external)?.label || "Internal",
    formatSubmit: (value) => String(value?.id ?? "0"),
    renderInput: ({ value, onChange, disabled }) => (
      <Select
        size="small"
        value={value?.id || "0"}
        onChange={(e) =>
          onChange(
            "st_external",
            getStudentTypeOption(e.target.value),
            "object"
          )
        }
        disabled={disabled}
        sx={{
          minWidth: 150,
          width: 150,
          flexShrink: 0,
          "& .MuiSelect-select": {
            py: 0.75,
            overflow: "visible",
            textOverflow: "clip",
            whiteSpace: "nowrap",
          },
        }}
      >
        {STUDENT_TYPE_OPTIONS.map((option) => (
          <MenuItem key={option.id} value={option.id}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    ),
  },
  st_dob: {
    label: "D.O.B :",
    getValue: (detail) => (detail?.st_dob ? dayjs(detail.st_dob) : null),
    type: "date",
    display: (detail) =>
      detail?.st_dob ? dayjs(detail.st_dob).format("DD-MM-YYYY") : "N/A",
  },
  st_gmail_address: {
    label: "Email :",
    getValue: (detail) => detail?.st_gmail_address || "",
    allowEmpty: true,
  },
  city: {
    label: "City :",
    getValue: (detail) => detail?.details?.city || "",
    allowEmpty: true,
  },
  state: {
    label: "State :",
    getValue: (detail) => detail?.details?.state || "",
    allowEmpty: true,
  },
  country: {
    label: "Country :",
    getValue: (detail) => detail?.details?.country || "",
    allowEmpty: true,
  },
  pincode: {
    label: "Pincode :",
    getValue: (detail) => detail?.details?.pincode || "",
    allowEmpty: true,
  },
  st_blood_group: {
    label: "Blood Group :",
    getValue: (detail) => detail?.st_blood_group || "",
    allowEmpty: true,
  },
  aadhaar_no: {
    label: "Aadhaar No :",
    getValue: (detail) => detail?.details?.aadhaar_no || "",
    display: (detail) =>
      formatAadhaarDisplay(detail?.details?.aadhaar_no) || "N/A",
    formatSubmit: (value) => String(value || "").replace(/\D/g, "").slice(0, 12),
    allowEmpty: true,
  },
  st_its_id: {
    label: "ITS :",
    getValue: (detail) => detail?.st_its_id || "",
    allowEmpty: true,
  },
};

const RIGHT_FIELDS = {
  f_name: {
    label: "Name :",
    getValue: (detail) => detail?.details?.f_name || "",
    allowEmpty: true,
  },
  f_contact: {
    label: "Mobile :",
    getValue: (detail) => detail?.details?.f_contact || "",
    allowEmpty: true,
  },
  f_email: {
    label: "Email :",
    getValue: (detail) => detail?.details?.f_email || "",
    allowEmpty: true,
  },
  f_occupation: {
    label: "Occupation :",
    getValue: (detail) => detail?.details?.f_occupation || "",
    allowEmpty: true,
  },
  m_name: {
    label: "Name :",
    getValue: (detail) => detail?.details?.m_name || "",
    allowEmpty: true,
  },
  m_contact: {
    label: "Mobile :",
    getValue: (detail) => detail?.details?.m_contact || "",
    allowEmpty: true,
  },
  m_email: {
    label: "Email :",
    getValue: (detail) => detail?.details?.m_email || "",
    allowEmpty: true,
  },
  m_occupation: {
    label: "Occupation :",
    getValue: (detail) => detail?.details?.m_occupation || "",
    allowEmpty: true,
  },
  g_name: {
    label: "Name :",
    getValue: (detail) => detail?.details?.g_name || "",
    allowEmpty: true,
  },
  g_relation: {
    label: "Relation :",
    getValue: (detail) => detail?.details?.g_relation || "",
    allowEmpty: true,
  },
  g_contact: {
    label: "Mobile :",
    getValue: (detail) => detail?.details?.g_contact || "",
    allowEmpty: true,
  },
  g_email: {
    label: "Email :",
    getValue: (detail) => detail?.details?.g_email || "",
    allowEmpty: true,
  },
  g_occupation: {
    label: "Occupation :",
    getValue: (detail) => detail?.details?.g_occupation || "",
    allowEmpty: true,
  },
  residential_address1: {
    label: "",
    getValue: (detail) => detail?.details?.residential_address1 || "",
    allowMultiline: true,
    inputWidth: "320px",
    allowEmpty: true,
  },
};

const ALL_FIELDS = { ...LEFT_FIELDS, ...RIGHT_FIELDS };

const OtherDetailsTab = ({ detail, studentDetailRefetch }) => {
  const { logout } = useAuth();

  const {
    formData,
    loadingState,
    editingState,
    hoverKey,
    handleChange,
    handleEditingState,
    handleHoverState,
    handleUpdateStudentData,
  } = useInlineFieldEdit({
    detail,
    fieldConfigs: ALL_FIELDS,
    stId: detail?.id,
    onSuccess: studentDetailRefetch,
    logout,
  });

  const renderField = (fieldKey, config, options = {}) => {
    if (config.show && !config.show(detail)) {
      return null;
    }

    const displayValue = config.display
      ? config.display(detail)
      : config.getValue(detail) || "N/A";

    return (
      <EditableField
        key={fieldKey}
        fieldKey={fieldKey}
        label={config.label}
        labelWidth={config.labelWidth || options.labelWidth}
        displayValue={displayValue}
        formValue={formData[fieldKey]}
        isEditing={editingState[fieldKey]}
        isLoading={loadingState[fieldKey]}
        isHovered={hoverKey === fieldKey}
        onMouseEnter={() => handleHoverState(fieldKey, true)}
        onMouseLeave={() => handleHoverState(fieldKey, false)}
        onStartEdit={() => handleEditingState(fieldKey)}
        onCancel={() => handleEditingState(fieldKey, false)}
        onSave={() => handleUpdateStudentData(fieldKey)}
        onChange={handleChange}
        type={config.type}
        inputWidth={config.inputWidth}
        allowMultiline={config.allowMultiline}
        renderInput={config.renderInput}
        sx={options.sx}
      />
    );
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "stretch",
        justifyContent: "center",
        gap: 4,
      }}
    >
      <Card
        sx={{
          background: "transparent",
          border: "1px solid #b1b1b1",
          minHeight: "900px",
          width: "480px",
          overflow: "visible",
        }}
      >
        <CardContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            color: "primary.main",
            height: "100%",
          }}
        >
          {Object.entries(LEFT_FIELDS).map(([fieldKey, config]) =>
            renderField(fieldKey, config),
          )}

          <Divider sx={{ mt: 1 }} />

          <Typography sx={{ fontWeight: 600 }}>Address :</Typography>
          {renderField(
            "residential_address1",
            RIGHT_FIELDS.residential_address1,
          )}
        </CardContent>
      </Card>

      <Card
        sx={{
          background: "transparent",
          border: "1px solid #b1b1b1",
          minHeight: "900px",
          width: "480px",
          overflow: "visible",
        }}
      >
        <CardContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            color: "primary.main",
          }}
        >
          <Typography sx={{ fontWeight: 600 }}>Father Details</Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              alt={detail?.details?.f_name || "Father"}
              src={detail?.details?.f_photo_url}
            />
            {renderField("f_name", RIGHT_FIELDS.f_name)}
          </Box>
          {renderField("f_contact", RIGHT_FIELDS.f_contact)}
          {renderField("f_email", RIGHT_FIELDS.f_email)}
          {renderField("f_occupation", RIGHT_FIELDS.f_occupation)}

          <Divider />

          <Typography sx={{ fontWeight: 600 }}>Mother Details</Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              alt={detail?.details?.m_name || "Mother"}
              src={detail?.details?.m_photo_url}
            />
            {renderField("m_name", RIGHT_FIELDS.m_name)}
          </Box>
          {renderField("m_contact", RIGHT_FIELDS.m_contact)}
          {renderField("m_email", RIGHT_FIELDS.m_email)}
          {renderField("m_occupation", RIGHT_FIELDS.m_occupation)}

          <Divider />

          <Typography sx={{ fontWeight: 600 }}>Guardian Details</Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar alt={detail?.details?.g_name || "Guardian"} />
            {renderField("g_name", RIGHT_FIELDS.g_name)}
          </Box>
          {renderField("g_relation", RIGHT_FIELDS.g_relation)}
          {renderField("g_contact", RIGHT_FIELDS.g_contact)}
          {renderField("g_email", RIGHT_FIELDS.g_email)}
          {renderField("g_occupation", RIGHT_FIELDS.g_occupation)}
        </CardContent>
      </Card>
    </Box>
  );
};

OtherDetailsTab.propTypes = {
  detail: PropTypes.object,
  studentDetailRefetch: PropTypes.func,
};

export default OtherDetailsTab;
