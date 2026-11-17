import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { toast } from "react-toastify";

import {
  Autocomplete,
  Avatar,
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

const FATHER_OCCUPATION_OPTIONS = [
  { label: "Employed", value: "employed" },
  { label: "Self Employed", value: "self-employed" },
  { label: "None", value: "none" },
];

const MOTHER_OCCUPATION_OPTIONS = [
  { label: "Employed", value: "employed" },
  { label: "Self Employed", value: "self-employed" },
  { label: "Home Maker", value: "home-maker" },
];

const GUARDIAN_OCCUPATION_OPTIONS = [
  { label: "Employed", value: "employed" },
  { label: "Self Employed", value: "self-employed" },
  { label: "None", value: "none" },
  { label: "Home Maker", value: "home-maker" },
];

const RELATION_OPTIONS = [
  "Father & Mother",
  "Brother",
  "Grand Father",
  "Uncle",
  "Other",
];

const PRESET_GUARDIAN_RELATIONS = ["Brother", "Grand Father", "Uncle"];

const ADDRESS_FIELDS = [
  {
    key: "address",
    label: "Address",
    editable: true,
    placeholder: "Enter address",
  },
  { key: "city", label: "City", editable: true, placeholder: "Enter city" },
  { key: "state", label: "State", editable: true, placeholder: "Enter state" },
  {
    key: "country",
    label: "Country",
    editable: true,
    placeholder: "Enter country",
  },
  {
    key: "pincode",
    label: "Pincode",
    editable: true,
    placeholder: "Enter pincode",
  },
];

const FATHER_FIELDS = [
  {
    key: "f_contact",
    label: "Mobile",
    editable: true,
    placeholder: "Enter father mobile",
  },
  {
    key: "f_email",
    label: "Email",
    editable: true,
    placeholder: "Enter father email",
  },
  {
    key: "f_occupation",
    label: "Occupation",
    editable: true,
    placeholder: "Select occupation",
    options: FATHER_OCCUPATION_OPTIONS,
  },
];

const MOTHER_FIELDS = [
  {
    key: "m_contact",
    label: "Mobile",
    editable: true,
    placeholder: "Enter mother mobile",
  },
  {
    key: "m_email",
    label: "Email",
    editable: true,
    placeholder: "Enter mother email",
  },
  {
    key: "m_occupation",
    label: "Occupation",
    editable: true,
    placeholder: "Select occupation",
    options: MOTHER_OCCUPATION_OPTIONS,
  },
];

const GUARDIAN_DETAIL_FIELDS = [
  {
    key: "g_name",
    label: "Name",
    editable: true,
    placeholder: "Enter guardian name",
  },
  {
    key: "g_contact",
    label: "Mobile",
    editable: true,
    placeholder: "Enter guardian mobile",
  },
  {
    key: "g_email",
    label: "Email",
    editable: true,
    placeholder: "Enter guardian email",
  },
  {
    key: "g_occupation",
    label: "Occupation",
    editable: true,
    placeholder: "Select occupation",
    options: GUARDIAN_OCCUPATION_OPTIONS,
  },
];

const hasProfileValue = (value) => {
  if (value === null || value === undefined) return false;
  return String(value).trim() !== "";
};

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i;

const occupationLabel = (value, options = []) => {
  const match = options.find((option) => option.value === value);
  return match?.label || value || "—";
};

const normalizeRelationKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

const resolveRelationChoice = (gRelation) => {
  const value = String(gRelation || "").trim();
  if (!value) return null;

  const normalized = normalizeRelationKey(value);
  if (normalized === "brother") return "Brother";
  if (normalized === "grand father" || normalized === "grandfather") {
    return "Grand Father";
  }
  if (normalized === "uncle") return "Uncle";
  if (normalized === "father & mother" || normalized === "father and mother") {
    return "Father & Mother";
  }
  return "Other";
};

const formatValue = (key, value, options = []) => {
  if (!hasProfileValue(value)) return "—";
  if (
    key === "f_occupation" ||
    key === "m_occupation" ||
    key === "g_occupation"
  ) {
    return occupationLabel(value, options);
  }
  return value;
};

const validateField = (key, value) => {
  const trimmed = String(value || "").trim();

  if (
    [
      "address",
      "city",
      "state",
      "country",
      "pincode",
      "f_name",
      "m_name",
      "g_name",
      "g_relation",
    ].includes(key)
  ) {
    if (!trimmed) {
      const labels = {
        address: "Address",
        city: "City",
        state: "State",
        country: "Country",
        pincode: "Pincode",
        f_name: "Father name",
        m_name: "Mother name",
        g_name: "Name",
        g_relation: "Relation",
      };
      return `${labels[key] || "Field"} is required.`;
    }
  }

  if (key === "pincode" && trimmed && !/^\d{4,10}$/.test(trimmed)) {
    return "Enter a valid pincode.";
  }

  if (key === "f_contact" || key === "m_contact" || key === "g_contact") {
    if (!trimmed) return "Mobile is required.";
    if (!/^\d{10}$/.test(trimmed.replace(/\D/g, ""))) {
      return "Mobile must be 10 digits.";
    }
  }

  if (key === "f_email" || key === "m_email" || key === "g_email") {
    if (!trimmed) return "Email is required.";
    if (!EMAIL_PATTERN.test(trimmed)) return "Please enter a valid email.";
  }

  if (key === "f_occupation") {
    if (!FATHER_OCCUPATION_OPTIONS.some((option) => option.value === trimmed)) {
      return "Please select a valid occupation.";
    }
  }

  if (key === "m_occupation") {
    if (!MOTHER_OCCUPATION_OPTIONS.some((option) => option.value === trimmed)) {
      return "Please select a valid occupation.";
    }
  }

  if (key === "g_occupation") {
    if (
      !GUARDIAN_OCCUPATION_OPTIONS.some((option) => option.value === trimmed)
    ) {
      return "Please select a valid occupation.";
    }
  }

  return null;
};

const buildUpdatePayload = (key, value, stId) => {
  const payload = { st_id: stId };

  if (key === "f_contact" || key === "m_contact" || key === "g_contact") {
    payload[key] = value.replace(/\D/g, "").slice(0, 10);
  } else if (key === "f_email" || key === "m_email" || key === "g_email") {
    payload[key] = value.trim().toLowerCase();
  } else {
    payload[key] = String(value || "").trim();
  }

  return payload;
};

export default function ParentDetails() {
  const { userInfo, logout } = useAuth();
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [relationChoice, setRelationChoice] = useState(null);

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

  // If any father/mother name or contact already exists → show parents directly
  const hasExistingParentPeople = useMemo(
    () =>
      hasProfileValue(profile?.f_name) ||
      hasProfileValue(profile?.f_contact) ||
      hasProfileValue(profile?.m_name) ||
      hasProfileValue(profile?.m_contact),
    [profile?.f_name, profile?.f_contact, profile?.m_name, profile?.m_contact]
  );

  const showRelationSelector = !hasExistingParentPeople;

  useEffect(() => {
    if (!showRelationSelector) {
      setRelationChoice(null);
      return;
    }
    setRelationChoice(resolveRelationChoice(profile?.g_relation));
  }, [showRelationSelector, profile?.g_relation]);

  const handleStartEdit = (key) => {
    setEditingField(key);
    setEditValue(profile?.[key] || "");
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

    const payload = buildUpdatePayload(key, editValue, userInfo?.st_id);

    setIsSaving(true);
    const response = await updateStudentProfile(payload);
    setIsSaving(false);

    if (response?.code === 200) {
      toast.success(response?.message || "Parent details updated successfully.");
      invalidateStudentProfileCache(userInfo?.st_id);
      handleCancelEdit();
      refetch();
      return;
    }

    if (response?.code === 401) {
      logout(response);
      return;
    }

    toast.error(response?.message || "Failed to update parent details.");
  };

  const handleRelationChoiceChange = async (value) => {
    setRelationChoice(value || null);
    handleCancelEdit();

    if (!value || value === "Father & Mother" || value === "Other") return;

    // Brother / Grand Father / Uncle → auto-save relation if blank
    if (
      PRESET_GUARDIAN_RELATIONS.includes(value) &&
      !hasProfileValue(profile?.g_relation)
    ) {
      setIsSaving(true);
      const response = await updateStudentProfile({
        st_id: userInfo?.st_id,
        g_relation: value,
      });
      setIsSaving(false);

      if (response?.code === 200) {
        invalidateStudentProfileCache(userInfo?.st_id);
        refetch();
        return;
      }

      if (response?.code === 401) {
        logout(response);
        return;
      }

      toast.error(response?.message || "Failed to save relation.");
      setRelationChoice(resolveRelationChoice(profile?.g_relation));
    }
  };

  const renderFieldValue = (field) => {
    const { key, label, editable, placeholder, options } = field;
    const fieldValue = profile?.[key];
    const isLocked = editable ? hasProfileValue(fieldValue) : false;
    const isEditing = editingField === key;
    const isDropdown =
      key === "f_occupation" ||
      key === "m_occupation" ||
      key === "g_occupation";

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
            {isDropdown ? (
              <Autocomplete
                size="small"
                fullWidth
                options={(options || []).map((option) => option.value)}
                getOptionLabel={(option) =>
                  (options || []).find((item) => item.value === option)
                    ?.label || option
                }
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
                  if (
                    key === "f_contact" ||
                    key === "m_contact" ||
                    key === "g_contact"
                  ) {
                    setEditValue(e.target.value.replace(/\D/g, "").slice(0, 10));
                    return;
                  }
                  if (key === "pincode") {
                    setEditValue(e.target.value.replace(/\D/g, "").slice(0, 10));
                    return;
                  }
                  setEditValue(e.target.value);
                }}
                disabled={isSaving}
                multiline={key === "address"}
                minRows={key === "address" ? 2 : undefined}
                type={
                  key === "f_email" || key === "m_email" || key === "g_email"
                    ? "email"
                    : "text"
                }
                inputProps={
                  key === "f_contact" ||
                  key === "m_contact" ||
                  key === "g_contact"
                    ? { maxLength: 10, inputMode: "numeric" }
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
              {formatValue(key, profile?.[key], options)}
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

  const renderParentBlock = (title, nameKey, photo, fields) => {
    const name = profile?.[nameKey];
    const nameLocked = hasProfileValue(name);
    const isEditingName = editingField === nameKey;

    return (
      <Box sx={{ mt: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
          <Avatar
            alt={name || title}
            src={photo || undefined}
            sx={{ width: 48, height: 48 }}
          >
            {(name || title || "?").charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>

            {isEditingName ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mt: 0.5,
                  maxWidth: 420,
                }}
              >
                <TextField
                  size="small"
                  fullWidth
                  value={editValue}
                  placeholder={`Enter ${title.toLowerCase().includes("father") ? "father" : "mother"} name`}
                  onChange={(e) => setEditValue(e.target.value)}
                  disabled={isSaving}
                />
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
                      onClick={() => handleSave(nameKey)}
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
                  gap: 1,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {nameLocked ? name : "Name not available"}
                </Typography>
                {!nameLocked && (
                  <IconButton
                    size="small"
                    sx={{ color: "primary.main" }}
                    onClick={() => handleStartEdit(nameKey)}
                    aria-label={`Edit ${title} name`}
                  >
                    <Iconify icon="lucide:edit" width={18} />
                  </IconButton>
                )}
              </Box>
            )}

            {nameLocked && !isEditingName && (
              <Typography
                variant="caption"
                sx={{ color: "error.main", display: "block", mt: 0.5 }}
              >
                {CONTACT_SCHOOL_TEXT}
              </Typography>
            )}
          </Box>
        </Box>
        <Grid container spacing={2}>
          {fields.map((field) => (
            <Grid item xs={12} sm={6} key={field.key}>
              {renderFieldValue(field)}
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  const relationLocked = hasProfileValue(profile?.g_relation);
  const showParentsFromSelector = relationChoice === "Father & Mother";
  const showGuardian =
    relationChoice === "Brother" ||
    relationChoice === "Grand Father" ||
    relationChoice === "Uncle" ||
    relationChoice === "Other";
  const showCustomRelationField = relationChoice === "Other";

  return (
    <>
      <Helmet>
        <title>Parent Details | GREENWOOD</title>
      </Helmet>

      <Typography variant="h4" sx={{ mb: 2, color: "primary.main" }}>
        Parent Details
      </Typography>

      {isLoading ? (
        <Loader />
      ) : isError ? (
        <MessageBox errorMessage={errorMessage} />
      ) : (
        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600 }}>
              Address
            </Typography>
            <Grid container spacing={2}>
              {ADDRESS_FIELDS.map((field) => (
                <Grid
                  item
                  xs={12}
                  sm={field.key === "address" ? 12 : 6}
                  key={field.key}
                >
                  {renderFieldValue(field)}
                </Grid>
              ))}
            </Grid>

            {!showRelationSelector ? (
              <>
                {renderParentBlock(
                  "Father Details",
                  "f_name",
                  profile?.f_photo,
                  FATHER_FIELDS
                )}

                {renderParentBlock(
                  "Mother Details",
                  "m_name",
                  profile?.m_photo,
                  MOTHER_FIELDS
                )}
              </>
            ) : (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600 }}>
                  Relation
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
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
                        Relation with student
                      </Typography>
                      <Autocomplete
                        size="small"
                        fullWidth
                        options={RELATION_OPTIONS}
                        value={relationChoice}
                        disabled={isSaving || relationLocked}
                        onChange={(_, newValue) =>
                          handleRelationChoiceChange(newValue)
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Select relation"
                            disabled={isSaving || relationLocked}
                          />
                        )}
                      />
                      {relationLocked && (
                        <Typography
                          variant="caption"
                          sx={{ color: "error.main", display: "block", mt: 1 }}
                        >
                          {CONTACT_SCHOOL_TEXT}
                        </Typography>
                      )}
                    </Box>
                  </Grid>

                  {showCustomRelationField && (
                    <Grid item xs={12} sm={6}>
                      {renderFieldValue({
                        key: "g_relation",
                        label: "Relation with student",
                        editable: true,
                        placeholder: "Type relation (e.g. Aunt, Grandmother)",
                      })}
                    </Grid>
                  )}
                </Grid>

                {showParentsFromSelector && (
                  <>
                    {renderParentBlock(
                      "Father Details",
                      "f_name",
                      profile?.f_photo,
                      FATHER_FIELDS
                    )}

                    {renderParentBlock(
                      "Mother Details",
                      "m_name",
                      profile?.m_photo,
                      MOTHER_FIELDS
                    )}
                  </>
                )}

                {showGuardian && (
                  <Box sx={{ mt: 3 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ mb: 1.5, fontWeight: 600 }}
                    >
                      Guardian Details
                    </Typography>

                    <Grid container spacing={2}>
                      {GUARDIAN_DETAIL_FIELDS.map((field) => (
                        <Grid item xs={12} sm={6} key={field.key}>
                          {renderFieldValue(field)}
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
