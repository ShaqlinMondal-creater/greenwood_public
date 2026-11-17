import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogContent,
  FormControlLabel,
  FormGroup,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import { toast } from "react-toastify";
import useAuth from "../../../../../hooks/useAuth";
import { CancelOutlined } from "@mui/icons-material";

import dayjs from "dayjs";
import {
  createTeacher,
  getTeacherById,
  updateTeacher,
} from "../../../../../services/admin/teacher.service";
import { DatePicker } from "@mui/x-date-pickers";
import ImageCropper from "../../../../../components/image-cropper/ImageCropper";
import { useGetApi } from "../../../../../hooks/useGetApi";
import { getAcademicYear } from "../../../../../services/admin/settings.service";
import { getClassGroupsByYear } from "../../../../../services/admin/classes.service";

const ROLE_OPTIONS = [
  { key: "is_class_teacher", label: "Class Teacher" },
  { key: "is_co_class_teacher", label: "Co-Class Teacher" },
  { key: "is_coordinator", label: "Coordinator" },
  { key: "is_academic_head", label: "Academic Head" },
  { key: "is_hod", label: "Head of Department" },
  { key: "is_subject_teacher", label: "Subject Teacher" },
  { key: "is_admin_staff", label: "Admin Staff" },
  { key: "is_other_staff", label: "Other Staff" },
];

const ROLE_DEFAULTS = ROLE_OPTIONS.reduce((acc, role) => {
  acc[role.key] = "0";
  return acc;
}, {});

const AddNewTeacherModal = ({
  open,
  onClose,
  refetch,
  teacherId,
  genderList,
  bloodGroupList,
}) => {
  const { logout } = useAuth();

  const initialState = useMemo(
    () => ({
      name: "",
      address: "",
      email: "",
      mobile: "",
      gender: "",
      dob: null,
      blood_group: "",
      degree: "",
      photo_url: "",
      class_teacher_classes: [],
      co_class_teacher_classes: [],
      ...ROLE_DEFAULTS,
    }),
    []
  );

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [formData, setFormData] = useState(initialState);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [imageSrc, setImageSrc] = useState(null);
  const [imageForCrop, setImageForCrop] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [currentAyId, setCurrentAyId] = useState(null);

  const isUpdateMode = Boolean(teacherId);
  const showClassTeacherClasses = formData?.is_class_teacher === "1";
  const showCoClassTeacherClasses = formData?.is_co_class_teacher === "1";

  const { dataList: academicYears } = useGetApi({
    apiFunction: getAcademicYear,
    skip: !open,
    dependencies: [open],
  });

  useEffect(() => {
    if (!Array.isArray(academicYears)) return;
    const current = academicYears.find(
      (y) => String(y?.ay_current) === "1" || y?.ay_current === 1
    );
    setCurrentAyId(Number(current?.ay_id || academicYears?.[0]?.ay_id || 0) || null);
  }, [academicYears]);

  const { dataList: classGroups } = useGetApi({
    apiFunction: getClassGroupsByYear,
    body: { ay_id: currentAyId },
    skip: !open || !currentAyId,
    dependencies: [open, currentAyId],
  });

  const classOptions = useMemo(() => {
    if (!Array.isArray(classGroups)) return [];
    return classGroups.map((cg) => ({
      id: Number(cg?.cg_id || cg?.id),
      cg_name: cg?.cg_name || "",
    }));
  }, [classGroups]);

  const resetCropperState = () => {
    setImageSrc(null);
    setImageForCrop(null);
    setShowCropper(false);
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const parsedValue =
      type === "date" ? dayjs(value).format("YYYY-MM-DD") : value;
    setFormData((preValue) => ({ ...preValue, [name]: parsedValue }));
  };

  const handleRoleToggle = (key) => {
    setFormData((preValue) => {
      const nextValue = preValue?.[key] === "1" ? "0" : "1";
      const next = { ...preValue, [key]: nextValue };
      if (key === "is_class_teacher" && nextValue === "0") {
        next.class_teacher_classes = [];
      }
      if (key === "is_co_class_teacher" && nextValue === "0") {
        next.co_class_teacher_classes = [];
      }
      return next;
    });
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type?.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo must be 5MB or smaller.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setImageSrc(reader.result);
      setImageForCrop(file);
      setShowCropper(true);
    });
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleCropApply = (file) => {
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    resetCropperState();
  };

  const handleCropClose = () => {
    resetCropperState();
  };

  const buildFormDataPayload = () => {
    const payload = new FormData();

    payload.append("name", formData?.name || "");
    payload.append("address", formData?.address || "");
    payload.append("email", formData?.email || "");
    payload.append("mobile", formData?.mobile || "");
    payload.append("gender", formData?.gender || "");
    payload.append(
      "dob",
      formData?.dob ? dayjs(formData.dob).format("YYYY-MM-DD") : ""
    );
    payload.append("blood_group", formData?.blood_group || "");
    payload.append("degree", formData?.degree || "");

    ROLE_OPTIONS.forEach((role) => {
      payload.append(role.key, formData?.[role.key] === "1" ? "1" : "0");
    });

    payload.append(
      "classes_id",
      (formData?.class_teacher_classes || []).map((cg) => Number(cg.id)).join(",")
    );
    payload.append(
      "co_classes_id",
      (formData?.co_class_teacher_classes || []).map((cg) => Number(cg.id)).join(",")
    );

    if (formData?.id) {
      payload.append("id", String(formData.id));
    }

    if (photoFile) {
      payload.append("photo_pic", photoFile);
    }

    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let response;

    const payload = buildFormDataPayload();

    setIsLoading(true);
    if (formData?.id) {
      response = await updateTeacher(payload);
    } else {
      response = await createTeacher(payload);
    }
    setIsLoading(false);

    if (response?.code === 200 || response?.code === 201) {
      onClose();
      refetch();
      toast.success(
        response?.message ||
          `Teacher ${formData?.id ? "updated" : "added"} successfully`
      );
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Some error occurred.");
    }
  };

  useEffect(() => {
    if (!open) {
      setFormData(initialState);
      setPhotoFile(null);
      setPhotoPreview("");
      resetCropperState();
      return;
    }

    if (!teacherId) {
      setFormData(initialState);
      setPhotoFile(null);
      setPhotoPreview("");
      resetCropperState();
      return;
    }

    let isActive = true;

    const fetchTeacher = async () => {
      setIsFetching(true);
      const response = await getTeacherById(teacherId);

      if (!isActive) return;

      setIsFetching(false);

      if (response?.code === 200) {
        const data = response?.data || {};
        const roleValues = ROLE_OPTIONS.reduce((acc, role) => {
          acc[role.key] =
            data?.[role.key] === "1" || data?.[role.key] === 1 ? "1" : "0";
          return acc;
        }, {});

        setFormData({
          ...initialState,
          id: data?.id,
          name: data?.name || "",
          address: data?.address || "",
          email: data?.email || "",
          mobile: data?.mobile || "",
          gender: data?.gender || "",
          dob: data?.dob ? dayjs(data.dob) : null,
          blood_group: data?.blood_group || "",
          degree: data?.degree || "",
          photo_url: data?.photo_url || "",
          class_teacher_classes: (data?.class_teacher_classes || []).map(
            (cg) => ({
              id: Number(cg.id),
              cg_name: cg.cg_name || "",
            })
          ),
          co_class_teacher_classes: (data?.co_class_teacher_classes || []).map(
            (cg) => ({
              id: Number(cg.id),
              cg_name: cg.cg_name || "",
            })
          ),
          ...roleValues,
        });
        setPhotoFile(null);
        setPhotoPreview(data?.photo_url || "");
      } else if (response?.code === 401) {
        logout(response);
      } else {
        toast.error(response?.message || "Failed to fetch teacher details.");
      }
    };

    fetchTeacher();

    return () => {
      isActive = false;
    };
  }, [open, teacherId, logout, initialState]);

  return (
    <Dialog
      open={open}
      onClose={!isLoading && !isFetching ? onClose : null}
      PaperProps={{
        sx: {
          minWidth: { xs: "95vw", sm: "550px", md: "800px", lg: "1100px" },
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
        onClick={!isLoading && !isFetching ? onClose : null}
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
        {isUpdateMode ? "Update Teacher" : "Add New Teacher"}
      </Box>

      <DialogContent>
        {isFetching ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    flexWrap: "wrap",
                  }}
                >
                  <Avatar
                    src={photoPreview || ""}
                    alt={formData?.name || "Teacher"}
                    sx={{ width: 72, height: 72 }}
                  />
                  <Box>
                    <Button variant="outlined" component="label" size="small">
                      Upload Photo
                      <input
                        hidden
                        accept="image/*"
                        type="file"
                        onChange={handlePhotoChange}
                      />
                    </Button>
                    <Typography
                      variant="caption"
                      display="block"
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      JPG/PNG/WEBP, max 5MB
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Name"
                  name="name"
                  fullWidth
                  required
                  value={formData?.name || ""}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Mobile No"
                  name="mobile"
                  fullWidth
                  value={formData?.mobile || ""}
                  onChange={handleChange}
                  inputProps={{ maxLength: 20 }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  type="email"
                  label="Email"
                  name="email"
                  fullWidth
                  value={formData?.email || ""}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Address"
                  name="address"
                  fullWidth
                  value={formData?.address || ""}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Autocomplete
                  options={genderList || []}
                  getOptionLabel={(option) =>
                    option === "M" ? "Male" : "Female"
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Gender" name="gender" />
                  )}
                  value={formData?.gender || null}
                  onChange={(_, newValue) =>
                    handleChange({
                      target: { name: "gender", value: newValue },
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <DatePicker
                  name="dob"
                  label="Date of Birth"
                  value={formData?.dob ? dayjs(formData?.dob) : null}
                  onChange={(newValue) =>
                    handleChange({
                      type: "date",
                      target: { name: "dob", value: newValue },
                    })
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                  disableFuture
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Autocomplete
                  options={bloodGroupList || []}
                  getOptionLabel={(option) => option}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Blood Group"
                      name="blood_group"
                    />
                  )}
                  value={formData?.blood_group || null}
                  onChange={(_, newValue) =>
                    handleChange({
                      target: { name: "blood_group", value: newValue },
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Degree"
                  name="degree"
                  fullWidth
                  value={formData?.degree || ""}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Roles :
                </Typography>
                <FormGroup row>
                  {ROLE_OPTIONS.map((role) => (
                    <FormControlLabel
                      key={role.key}
                      control={
                        <Checkbox
                          checked={formData?.[role.key] === "1"}
                          onChange={() => handleRoleToggle(role.key)}
                        />
                      }
                      label={role.label}
                    />
                  ))}
                </FormGroup>
              </Grid>

              {showClassTeacherClasses && (
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    multiple
                    options={classOptions}
                    getOptionLabel={(option) => option?.cg_name || ""}
                    isOptionEqualToValue={(option, value) =>
                      Number(option?.id) === Number(value?.id)
                    }
                    value={formData?.class_teacher_classes || []}
                    onChange={(_, newValue) =>
                      setFormData((prev) => ({
                        ...prev,
                        class_teacher_classes: newValue || [],
                      }))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Class Teacher Classes (optional)"
                        placeholder="Select class(es)"
                      />
                    )}
                  />
                </Grid>
              )}

              {showCoClassTeacherClasses && (
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    multiple
                    options={classOptions}
                    getOptionLabel={(option) => option?.cg_name || ""}
                    isOptionEqualToValue={(option, value) =>
                      Number(option?.id) === Number(value?.id)
                    }
                    value={formData?.co_class_teacher_classes || []}
                    onChange={(_, newValue) =>
                      setFormData((prev) => ({
                        ...prev,
                        co_class_teacher_classes: newValue || [],
                      }))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Co-Class Teacher Classes (optional)"
                        placeholder="Select class(es)"
                      />
                    )}
                  />
                </Grid>
              )}
            </Grid>
            <Box
              sx={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 1,
                mt: 2,
              }}
            >
              <Button
                variant="outlined"
                onClick={onClose}
                disabled={isLoading || isFetching}
              >
                Close
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isLoading || isFetching}
              >
                {isLoading ? (
                  <CircularProgress size={24} />
                ) : isUpdateMode ? (
                  "Update"
                ) : (
                  "Save"
                )}
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>

      <ImageCropper
        open={!!imageSrc && showCropper}
        src={imageSrc}
        fileName={imageForCrop?.name}
        isFixedAspectRatio
        onApply={handleCropApply}
        onClose={handleCropClose}
      />
    </Dialog>
  );
};

AddNewTeacherModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  refetch: PropTypes.func,
  teacherId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  genderList: PropTypes.array,
  bloodGroupList: PropTypes.array,
};

export default AddNewTeacherModal;
