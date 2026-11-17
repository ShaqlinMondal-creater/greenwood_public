import { useState } from "react";
import { Helmet } from "react-helmet-async";
import dayjs from "dayjs";
import { toast } from "react-toastify";

import {
  Autocomplete,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";

import Loader from "../../components/loader/loader";
import MessageBox from "../../components/error/message-box";
import Iconify from "../../components/iconify/iconify";
import useAuth from "../../hooks/useAuth";
import { useGetApi } from "../../hooks/useGetApi";
import {
  getStudentProfile,
  updateStudentProfile,
} from "../../services/student/profile.service";
import { invalidateStudentProfileCache } from "../../utils/student-profile";

const CONTACT_SCHOOL_TEXT =
  "For wrong data filled, please contact the school.";

const BLOOD_GROUP_OPTIONS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
  "Rare",
];

const PROFILE_FIELDS = [
  { key: "mobile", label: "Mobile" },
  {
    key: "email",
    label: "Email",
    editable: true,
    placeholder: "Gmail, Yahoo, Outlook, or school email",
  },
  { key: "dob", label: "Date of Birth" },
  {
    key: "aadhaar_no",
    label: "Student Aadhaar",
    editable: true,
    placeholder: "XXXX-XXXX-XXXX",
  },
  {
    key: "blood_group",
    label: "Blood Group",
    editable: true,
    placeholder: "Select blood group",
  },
];

const hasProfileValue = (value) => {
  if (value === null || value === undefined) return false;
  return String(value).trim() !== "";
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+$/;

const AADHAAR_HELP_TEXT =
  "If the student does not have an Aadhaar card, enter 12 nines (9999-9999-9999) or 12 zeros (0000-0000-0000).";

const stripAadhaar = (value) =>
  String(value || "")
    .replace(/\D/g, "")
    .slice(0, 12);

const formatAadhaarDisplay = (value) => {
  const digits = stripAadhaar(value);
  if (!digits) return "";
  return digits.match(/.{1,4}/g)?.join("-") || digits;
};

const formatValue = (key, value) => {
  if (!value) return "—";
  if (key === "dob") {
    return dayjs(value).isValid() ? dayjs(value).format("DD-MM-YYYY") : value;
  }
  if (key === "aadhaar_no") {
    return formatAadhaarDisplay(value);
  }
  return value;
};

const validateField = (key, value) => {
  const trimmed = String(value || "").trim();

  if (key === "email") {
    if (!trimmed) return "Email is required.";
    if (!EMAIL_PATTERN.test(trimmed)) {
      return "Enter a valid email (Gmail, Yahoo, Outlook, school, or any email with @).";
    }
  }

  if (key === "aadhaar_no") {
    const digits = stripAadhaar(trimmed);
    if (!digits) return "Student Aadhaar is required.";
    if (digits.length !== 12) return "Aadhaar must be exactly 12 digits.";
  }

  if (key === "blood_group") {
    if (!trimmed) return "Blood group is required.";
    if (!BLOOD_GROUP_OPTIONS.includes(trimmed)) {
      return "Please select a valid blood group.";
    }
  }

  return null;
};

export default function MyProfile() {
  const { userInfo, logout } = useAuth();
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const {
    dataList: profile,
    isLoading,
    isError,
    errorMessage,
    refetch,
  } = useGetApi({
    apiFunction: getStudentProfile,
    body: {
      st_id: userInfo?.st_id,
    },
  });

  const handleStartEdit = (key) => {
    setEditingField(key);
    if (key === "aadhaar_no") {
      setEditValue(formatAadhaarDisplay(profile?.[key] || ""));
    } else {
      setEditValue(profile?.[key] || "");
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const handleSave = async (key) => {
    const validationError = validateField(key, editValue);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const payload = {
      st_id: userInfo?.st_id,
      ...(key === "email" ? { email: editValue.trim().toLowerCase() } : {}),
      ...(key === "aadhaar_no" ? { aadhaar_no: stripAadhaar(editValue) } : {}),
      ...(key === "blood_group" ? { blood_group: editValue.trim() } : {}),
    };

    setIsSaving(true);
    const response = await updateStudentProfile(payload);
    setIsSaving(false);

    if (response?.code === 200) {
      toast.success(response?.message || "Profile updated successfully.");
      if (key === "aadhaar_no" || key === "email" || key === "blood_group") {
        invalidateStudentProfileCache(userInfo?.st_id);
      }
      handleCancelEdit();
      refetch();
      return;
    }

    if (response?.code === 401) {
      logout(response);
      return;
    }

    toast.error(response?.message || "Failed to update profile.");
  };

  const renderFieldValue = (field) => {
    const { key, label, editable, placeholder } = field;
    const fieldValue = profile?.[key];
    const isLocked = editable ? hasProfileValue(fieldValue) : false;
    const isEditing = editingField === key;

    return (
      <Box
        sx={{
          p: 2,
          borderRadius: 1,
          bgcolor: "background.neutral",
          height: "100%",
        }}
      >
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", mb: 0.5 }}
        >
          {label}
        </Typography>

        {isEditing ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
            {key === "blood_group" ? (
              <Autocomplete
                size="small"
                fullWidth
                options={BLOOD_GROUP_OPTIONS}
                value={editValue || null}
                onChange={(_, newValue) => setEditValue(newValue || "")}
                disabled={isSaving}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={placeholder}
                    disabled={isSaving}
                  />
                )}
              />
            ) : (
              <TextField
                size="small"
                fullWidth
                value={editValue}
                placeholder={placeholder}
                onChange={(e) => {
                  if (key === "aadhaar_no") {
                    setEditValue(formatAadhaarDisplay(e.target.value));
                    return;
                  }
                  setEditValue(e.target.value);
                }}
                disabled={isSaving}
                type="text"
                inputProps={
                  key === "aadhaar_no"
                    ? { maxLength: 14, inputMode: "numeric" }
                    : undefined
                }
              />
            )}
            {isSaving ? (
              <CircularProgress size={20} />
            ) : (
              <>
                <IconButton
                  size="small"
                  sx={{ color: "error.main" }}
                  onClick={handleCancelEdit}
                >
                  <Iconify icon="carbon:close-filled" width={18} />
                </IconButton>
                <IconButton
                  size="small"
                  sx={{ color: "success.main" }}
                  onClick={() => handleSave(key)}
                >
                  <Iconify icon="charm:circle-tick" width={18} />
                </IconButton>
              </>
            )}
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
            }}
          >
            <Typography variant="subtitle1">
              {formatValue(key, profile?.[key])}
            </Typography>

            {editable && !isLocked && (
              <IconButton
                size="small"
                sx={{ color: "primary.main" }}
                onClick={() => handleStartEdit(key)}
                aria-label={`Edit ${label}`}
              >
                <Iconify icon="lucide:edit" width={18} />
              </IconButton>
            )}
          </Box>
        )}

        {key === "aadhaar_no" && (!isLocked || isEditing) && (
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", display: "block", mt: 1, lineHeight: 1.4 }}
          >
            {AADHAAR_HELP_TEXT}
          </Typography>
        )}

        {editable && isLocked && !isEditing && (
          <Typography
            variant="caption"
            sx={{ color: "error.main", display: "block", mt: 1 }}
          >
            {CONTACT_SCHOOL_TEXT}
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <>
      <Helmet>
        <title>My Profile | GREENWOOD</title>
      </Helmet>

      <Typography variant="h4" sx={{ mb: 2, color: "primary.main" }}>
        My Profile
      </Typography>

      {isLoading ? (
        <Loader />
      ) : isError ? (
        <MessageBox errorMessage={errorMessage} />
      ) : (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Basic Details
            </Typography>
            <Grid container spacing={2}>
              {PROFILE_FIELDS.map((field) => (
                <Grid item xs={12} sm={6} key={field.key}>
                  {renderFieldValue(field)}
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}
    </>
  );
}
