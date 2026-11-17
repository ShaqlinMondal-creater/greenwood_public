import { memo } from "react";

import PropTypes from "prop-types";
import { Launch } from "@mui/icons-material";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Divider,
  IconButton,
  Typography,
  TextField, // ✅ add this
  CircularProgress,
  Autocomplete, // ✅ also add this if you use it
} from "@mui/material";
import { useState } from "react";
import Iconify from "../../../../../components/iconify/iconify";
import useAuth from "../../../../../hooks/useAuth";
// "../../../../hooks/useAuth"
import dayjs from "dayjs";
import { editStudentDetail } from "../../../../../services/admin/students-management.service";
import { toast } from "react-toastify";
import { DatePicker } from "@mui/x-date-pickers";

const GENDER_OPTIONS = [
  { label: "Male", value: "m" },
  { label: "Female", value: "f" },
];

// end new edit
const LeftSideCard = ({
  detail,
  handleImageClick,
  refetch,
  leftSideLayoutRefetch,
}) => {
  const { logout } = useAuth();

  const initialState = {
    class: detail?.class || "",
    roll_no: detail?.roll_no || "",
    gender:
      detail?.gender === "m"
        ? GENDER_OPTIONS[0]
        : detail?.gender === "f"
        ? GENDER_OPTIONS[1]
        : null,
    dob: detail?.dob ? dayjs(detail?.dob) : null,
    birth_place: detail?.birth_place || "",
    religion: detail?.religion || "",
    mother_tongue: detail?.mother_tongue || "",
    home_town: detail?.home_town || "",
    nationality: detail?.nationality || "",
    email: detail?.email || "",
    address_1: detail?.address_1 || detail?.address || "",
    last_school: detail?.last_school || "",
    last_school_address: detail?.last_school_address || "",
    city: detail?.city || "",
    state: detail?.state || "",
    country: detail?.country || "",
    pincode: detail?.pincode || "",
    aadhaar_no: detail?.aadhaar_no || "",
    blood_group: detail?.blood_group || "",
    remarks: detail?.remarks || "",
  };

  // -------------------- STATES --------------------
  const [formData, setFormData] = useState(initialState);

  const [loadingState, setLoadingState] = useState(
    Object.keys(initialState).reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {})
  );

  const [editingState, setEditingState] = useState(
    Object.keys(initialState).reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {})
  );

  // track currently hovered field key (single string) to avoid stale per-key flags
  const [hoverKey, setHoverKey] = useState(null);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const parsedValue =
      type === "date" ? dayjs(value).format("YYYY-MM-DD") : value;
    setFormData({
      ...formData,
      [name]: parsedValue,
    });
  };

  const handleEditingState = (key, value = true) => {
    if (value === false) {
      // revert to initial value when editing is cancelled
      setFormData({ ...formData, [key]: initialState[key] });
      // also clear hover state so the edit icon doesn't remain visible
      setHoverKey(null);
    }

    setEditingState({ ...editingState, [key]: value });
  };

  const handleHoverState = (key, value = true) => {
    // pass the hovered key and optional boolean value.
    // If value is false, clear hoverKey; otherwise set to the key.
    setHoverKey(value ? key : null);
  };

  const handleLoadingState = (key, value) => {
    setLoadingState({ ...loadingState, [key]: value });
  };

  const handleUpdateStudentData = async (key) => {
    if (formData[key] === initialState[key]) {
      handleEditingState(key, false);
      return;
    }
    if (formData[key] === null || formData[key] === undefined) {
      toast.error("Value cannot be empty");
      return;
    }
    handleLoadingState(key, true);
    const response = await editStudentDetail(detail?.id, {
      [key]: formData[key]?.value || formData[key],
    });
    handleLoadingState(key, false);
    handleEditingState(key, false);
    if (response?.code === 200) {
      toast.success(response?.message || "Student details updated");
      refetch();
      leftSideLayoutRefetch();
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Failed to update student details");
    }
  };

  return (
    <Card
      sx={{
        background: "transparent",
        border: "1px solid #b1b1b1",
        mx: "auto",
        maxWidth: "500px",
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
        {/* Class */}
        {detail?.class && (
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
            onMouseEnter={() => handleHoverState("class", true)}
            onMouseLeave={() => handleHoverState("class", false)}
          >
            <Typography sx={{ width: "130px", fontWeight: 600 }}>
              Class :{" "}
            </Typography>
            <Box
              sx={{ display: "flex", alignItems: "center", flex: 1, gap: 1 }}
            >
              {editingState.class ? (
                <>
                  <TextField
                    name="class"
                    value={formData?.class || ""}
                    onChange={handleChange}
                    size="small"
                    disabled={loadingState.class}
                    sx={{ maxWidth: "220px" }}
                  />
                  {loadingState.class ? (
                    <CircularProgress size={18} />
                  ) : (
                    <>
                      <IconButton
                        sx={{ color: "error.main" }}
                        onClick={() => handleEditingState("class", false)}
                      >
                        <Iconify icon="carbon:close-filled" />
                      </IconButton>
                      <IconButton
                        sx={{ color: "success.main" }}
                        onClick={() => handleUpdateStudentData("class")}
                      >
                        <Iconify icon="charm:circle-tick" />
                      </IconButton>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Typography>{detail?.class || "-"}</Typography>
                  <IconButton
                    onClick={() => handleEditingState("class")}
                    sx={{
                      color: "primary.main",
                      transition: "opacity 0.3s, visibility 0.3s",
                      opacity: hoverKey === "class" ? 1 : 0,
                      visibility: hoverKey === "class" ? "visible" : "hidden",
                    }}
                  >
                    <Iconify icon="lucide:edit" />
                  </IconButton>
                </>
              )}
            </Box>
          </Box>
        )}

        {/* roll_no */}
        {detail?.roll_no && (
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
            onMouseEnter={() => handleHoverState("roll_no", true)}
            onMouseLeave={() => handleHoverState("roll_no", false)}
          >
            <Typography sx={{ width: "130px", fontWeight: 600 }}>
              Roll No :{" "}
            </Typography>
            <Box
              sx={{ display: "flex", alignItems: "center", flex: 1, gap: 1 }}
            >
              {editingState.roll_no ? (
                <>
                  <TextField
                    name="roll_no"
                    value={formData?.roll_no || ""}
                    onChange={handleChange}
                    size="small"
                    disabled={loadingState.roll_no}
                    sx={{ maxWidth: "220px" }}
                  />
                  {loadingState.roll_no ? (
                    <CircularProgress size={18} />
                  ) : (
                    <>
                      <IconButton
                        sx={{ color: "error.main" }}
                        onClick={() => handleEditingState("roll_no", false)}
                      >
                        <Iconify icon="carbon:close-filled" />
                      </IconButton>
                      <IconButton
                        sx={{ color: "success.main" }}
                        onClick={() => handleUpdateStudentData("roll_no")}
                      >
                        <Iconify icon="charm:circle-tick" />
                      </IconButton>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Typography>{detail?.roll_no || "-"}</Typography>
                  <IconButton
                    onClick={() => handleEditingState("roll_no")}
                    sx={{
                      color: "primary.main",
                      transition: "opacity 0.3s, visibility 0.3s",
                      opacity: hoverKey === "roll_no" ? 1 : 0,
                      visibility: hoverKey === "roll_no" ? "visible" : "hidden",
                    }}
                  >
                    <Iconify icon="lucide:edit" />
                  </IconButton>
                </>
              )}
            </Box>
          </Box>
        )}

        {/* Gender */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1,
          }}
          onMouseEnter={() => handleHoverState("gender", true)}
          onMouseLeave={() => handleHoverState("gender", false)}
        >
          <Typography sx={{ width: "130px", fontWeight: 600 }}>
            Gender :{" "}
          </Typography>
          {editingState.gender ? (
            <Box
              sx={{ flex: 1, display: "flex", alignItems: "center", gap: 0.5 }}
            >
              <Autocomplete
                options={GENDER_OPTIONS || []}
                getOptionLabel={(option) => option.label || ""}
                value={formData.gender || null}
                onChange={(_, newValue) =>
                  handleChange({
                    target: {
                      name: "gender",
                      value: newValue,
                    },
                  })
                }
                renderInput={(params) => <TextField {...params} required />}
                disabled={loadingState.gender}
                sx={{ flex: 1, maxWidth: "220px" }}
              />
              {loadingState.gender ? (
                <CircularProgress size={18} />
              ) : (
                <>
                  <IconButton
                    sx={{ color: "error.main" }}
                    onClick={() => handleEditingState("gender", false)}
                  >
                    <Iconify icon="carbon:close-filled" />
                  </IconButton>
                  <IconButton
                    sx={{ color: "success.main" }}
                    onClick={() => handleUpdateStudentData("gender")}
                  >
                    <Iconify icon="charm:circle-tick" />
                  </IconButton>
                </>
              )}
            </Box>
          ) : (
            <>
              <Typography>
                {detail?.gender === "m"
                  ? "Male"
                  : detail?.gender === "f"
                  ? "Female"
                  : "-"}
              </Typography>{" "}
              <IconButton
                onClick={() => handleEditingState("gender")}
                sx={{
                  color: "primary.main",
                  transition: "opacity 0.3s, visibility 0.3s",
                  opacity: hoverKey === "gender" ? 1 : 0,
                  visibility: hoverKey === "gender" ? "visible" : "hidden",
                }}
              >
                <Iconify icon="lucide:edit" />
              </IconButton>
            </>
          )}
        </Box>

        {/* Date of Birth */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1,
          }}
          onMouseEnter={() => handleHoverState("dob", true)}
          onMouseLeave={() => handleHoverState("dob", false)}
        >
          <Typography sx={{ width: "130px", fontWeight: 600 }}>
            D.O.B :{" "}
          </Typography>
          {editingState.dob ? (
            <>
              <DatePicker
                name="dob"
                value={formData?.dob ? dayjs(formData.dob) : null}
                onChange={(newValue) =>
                  handleChange({
                    target: { name: "dob", type: "date", value: newValue },
                  })
                }
                renderInput={(params) => <TextField {...params} required />}
                disabled={loadingState.dob}
                sx={{ maxWidth: "220px" }}
              />
              {loadingState.dob ? (
                <CircularProgress size={18} />
              ) : (
                <>
                  <IconButton
                    sx={{ color: "error.main" }}
                    onClick={() => handleEditingState("dob", false)}
                  >
                    <Iconify icon="carbon:close-filled" />
                  </IconButton>
                  <IconButton
                    sx={{ color: "success.main" }}
                    onClick={() => handleUpdateStudentData("dob")}
                  >
                    <Iconify icon="charm:circle-tick" />
                  </IconButton>
                </>
              )}
            </>
          ) : (
            <>
              <Typography>
                {detail?.dob ? dayjs(detail?.dob).format("DD-MM-YYYY") : "-"}
              </Typography>
              <IconButton
                onClick={() => handleEditingState("dob")}
                sx={{
                  color: "primary.main",
                  transition: "opacity 0.3s, visibility 0.3s",
                  opacity: hoverKey === "dob" ? 1 : 0,
                  visibility: hoverKey === "dob" ? "visible" : "hidden",
                }}
              >
                <Iconify icon="lucide:edit" />
              </IconButton>
            </>
          )}
        </Box>

        {/* Place of Birth */}
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
          onMouseEnter={() => handleHoverState("birth_place", true)}
          onMouseLeave={() => handleHoverState("birth_place", false)}
        >
          <Typography sx={{ width: "130px", fontWeight: 600 }}>
            Place of Birth :{" "}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", flex: 1, gap: 1 }}>
            {editingState.birth_place ? (
              <>
                <TextField
                  name="birth_place"
                  value={formData?.birth_place || ""}
                  onChange={handleChange}
                  size="small"
                  disabled={loadingState.birth_place}
                  sx={{ maxWidth: "220px" }}
                />
                {loadingState.birth_place ? (
                  <CircularProgress size={18} />
                ) : (
                  <>
                    <IconButton
                      sx={{ color: "error.main" }}
                      onClick={() => handleEditingState("birth_place", false)}
                    >
                      <Iconify icon="carbon:close-filled" />
                    </IconButton>
                    <IconButton
                      sx={{ color: "success.main" }}
                      onClick={() => handleUpdateStudentData("birth_place")}
                    >
                      <Iconify icon="charm:circle-tick" />
                    </IconButton>
                  </>
                )}
              </>
            ) : (
              <>
                <Typography>{detail?.birth_place || "-"}</Typography>
                <IconButton
                  onClick={() => handleEditingState("birth_place")}
                  sx={{
                    color: "primary.main",
                    transition: "opacity 0.3s, visibility 0.3s",
                    opacity: hoverKey === "birth_place" ? 1 : 0,
                    visibility:
                      hoverKey === "birth_place" ? "visible" : "hidden",
                  }}
                >
                  <Iconify icon="lucide:edit" />
                </IconButton>
              </>
            )}
          </Box>
        </Box>

        {/* Religion */}
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
          onMouseEnter={() => handleHoverState("religion", true)}
          onMouseLeave={() => handleHoverState("religion", false)}
        >
          <Typography sx={{ width: "130px", fontWeight: 600 }}>
            Religion :{" "}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", flex: 1, gap: 1 }}>
            {editingState.religion ? (
              <>
                <TextField
                  name="religion"
                  value={formData?.religion || ""}
                  onChange={handleChange}
                  size="small"
                  disabled={loadingState.religion}
                  sx={{ maxWidth: "220px" }}
                />
                {loadingState.religion ? (
                  <CircularProgress size={18} />
                ) : (
                  <>
                    <IconButton
                      sx={{ color: "error.main" }}
                      onClick={() => handleEditingState("religion", false)}
                    >
                      <Iconify icon="carbon:close-filled" />
                    </IconButton>
                    <IconButton
                      sx={{ color: "success.main" }}
                      onClick={() => handleUpdateStudentData("religion")}
                    >
                      <Iconify icon="charm:circle-tick" />
                    </IconButton>
                  </>
                )}
              </>
            ) : (
              <>
                <Typography>{detail?.religion || "-"}</Typography>
                <IconButton
                  onClick={() => handleEditingState("religion")}
                  sx={{
                    color: "primary.main",
                    transition: "opacity 0.3s, visibility 0.3s",
                    opacity: hoverKey === "religion" ? 1 : 0,
                    visibility: hoverKey === "religion" ? "visible" : "hidden",
                  }}
                >
                  <Iconify icon="lucide:edit" />
                </IconButton>
              </>
            )}
          </Box>
        </Box>

        {/* Mother Tongue */}
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
          onMouseEnter={() => handleHoverState("mother_tongue", true)}
          onMouseLeave={() => handleHoverState("mother_tongue", false)}
        >
          <Typography sx={{ width: "130px", fontWeight: 600 }}>
            Mother Tongue :{" "}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", flex: 1, gap: 1 }}>
            {editingState.mother_tongue ? (
              <>
                <TextField
                  name="mother_tongue"
                  value={formData?.mother_tongue || ""}
                  onChange={handleChange}
                  size="small"
                  disabled={loadingState.mother_tongue}
                  sx={{ maxWidth: "220px" }}
                />
                {loadingState.mother_tongue ? (
                  <CircularProgress size={18} />
                ) : (
                  <>
                    <IconButton
                      sx={{ color: "error.main" }}
                      onClick={() => handleEditingState("mother_tongue", false)}
                    >
                      <Iconify icon="carbon:close-filled" />
                    </IconButton>
                    <IconButton
                      sx={{ color: "success.main" }}
                      onClick={() => handleUpdateStudentData("mother_tongue")}
                    >
                      <Iconify icon="charm:circle-tick" />
                    </IconButton>
                  </>
                )}
              </>
            ) : (
              <>
                <Typography>{detail?.mother_tongue || "-"}</Typography>
                <IconButton
                  onClick={() => handleEditingState("mother_tongue")}
                  sx={{
                    color: "primary.main",
                    transition: "opacity 0.3s, visibility 0.3s",
                    opacity: hoverKey === "mother_tongue" ? 1 : 0,
                    visibility:
                      hoverKey === "mother_tongue" ? "visible" : "hidden",
                  }}
                >
                  <Iconify icon="lucide:edit" />
                </IconButton>
              </>
            )}
          </Box>
        </Box>

        {/* Home Town */}
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
          onMouseEnter={() => handleHoverState("home_town", true)}
          onMouseLeave={() => handleHoverState("home_town", false)}
        >
          <Typography sx={{ width: "130px", fontWeight: 600 }}>
            Home Town :{" "}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", flex: 1, gap: 1 }}>
            {editingState.home_town ? (
              <>
                <TextField
                  name="home_town"
                  value={formData?.home_town || ""}
                  onChange={handleChange}
                  size="small"
                  disabled={loadingState.home_town}
                  sx={{ maxWidth: "220px" }}
                />
                {loadingState.home_town ? (
                  <CircularProgress size={18} />
                ) : (
                  <>
                    <IconButton
                      sx={{ color: "error.main" }}
                      onClick={() => handleEditingState("home_town", false)}
                    >
                      <Iconify icon="carbon:close-filled" />
                    </IconButton>
                    <IconButton
                      sx={{ color: "success.main" }}
                      onClick={() => handleUpdateStudentData("home_town")}
                    >
                      <Iconify icon="charm:circle-tick" />
                    </IconButton>
                  </>
                )}
              </>
            ) : (
              <>
                <Typography>{detail?.home_town || "-"}</Typography>
                <IconButton
                  onClick={() => handleEditingState("home_town")}
                  sx={{
                    color: "primary.main",
                    transition: "opacity 0.3s, visibility 0.3s",
                    opacity: hoverKey === "home_town" ? 1 : 0,
                    visibility: hoverKey === "home_town" ? "visible" : "hidden",
                  }}
                >
                  <Iconify icon="lucide:edit" />
                </IconButton>
              </>
            )}
          </Box>
        </Box>

        {/* Nationality */}
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
          onMouseEnter={() => handleHoverState("nationality", true)}
          onMouseLeave={() => handleHoverState("nationality", false)}
        >
          <Typography sx={{ width: "130px", fontWeight: 600 }}>
            Nationality :{" "}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", flex: 1, gap: 1 }}>
            {editingState.nationality ? (
              <>
                <TextField
                  name="nationality"
                  value={formData?.nationality || ""}
                  onChange={handleChange}
                  size="small"
                  disabled={loadingState.nationality}
                  sx={{ maxWidth: "220px" }}
                />
                {loadingState.nationality ? (
                  <CircularProgress size={18} />
                ) : (
                  <>
                    <IconButton
                      sx={{ color: "error.main" }}
                      onClick={() => handleEditingState("nationality", false)}
                    >
                      <Iconify icon="carbon:close-filled" />
                    </IconButton>
                    <IconButton
                      sx={{ color: "success.main" }}
                      onClick={() => handleUpdateStudentData("nationality")}
                    >
                      <Iconify icon="charm:circle-tick" />
                    </IconButton>
                  </>
                )}
              </>
            ) : (
              <>
                <Typography>{detail?.nationality || "-"}</Typography>
                <IconButton
                  onClick={() => handleEditingState("nationality")}
                  sx={{
                    color: "primary.main",
                    transition: "opacity 0.3s, visibility 0.3s",
                    opacity: hoverKey === "nationality" ? 1 : 0,
                    visibility:
                      hoverKey === "nationality" ? "visible" : "hidden",
                  }}
                >
                  <Iconify icon="lucide:edit" />
                </IconButton>
              </>
            )}
          </Box>
        </Box>

        {/* Email*/}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1,
          }}
          onMouseEnter={() => handleHoverState("email", true)}
          onMouseLeave={() => handleHoverState("email", false)}
        >
          <Typography sx={{ width: "130px", fontWeight: 600 }}>
            Email :{" "}
          </Typography>
          {editingState.email ? (
            <>
              <TextField
                name="email"
                value={formData?.email || ""}
                onChange={handleChange}
                size="small"
                disabled={loadingState.email}
                sx={{ maxWidth: "220px" }}
              />
              {loadingState.email ? (
                <CircularProgress size={18} />
              ) : (
                <>
                  <IconButton
                    sx={{ color: "error.main" }}
                    onClick={() => handleEditingState("email", false)}
                  >
                    <Iconify icon="carbon:close-filled" />
                  </IconButton>
                  <IconButton
                    sx={{ color: "success.main" }}
                    onClick={() => handleUpdateStudentData("email")}
                  >
                    <Iconify icon="charm:circle-tick" />
                  </IconButton>
                </>
              )}
            </>
          ) : (
            <>
              <Typography>{detail?.email || "-"}</Typography>
              <IconButton
                onClick={() => handleEditingState("email")}
                sx={{
                  color: "primary.main",
                  transition: "opacity 0.3s, visibility 0.3s",
                  opacity: hoverKey === "email" ? 1 : 0,
                  visibility: hoverKey === "email" ? "visible" : "hidden",
                }}
              >
                <Iconify icon="lucide:edit" />
              </IconButton>
            </>
          )}
        </Box>

        {/* Address */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1,
          }}
          onMouseEnter={() => handleHoverState("address_1", true)}
          onMouseLeave={() => handleHoverState("address_1", false)}
        >
          <Typography sx={{ width: "140px", fontWeight: 600 }}>
            Address :{" "}
          </Typography>
          {editingState.address_1 ? (
            <>
              <TextField
                name="address_1"
                value={formData?.address_1 || ""}
                onChange={handleChange}
                size="small"
                multiline
                minRows={2}
                disabled={loadingState.address_1}
                sx={{ maxWidth: "260px", flex: 1 }}
              />
              {loadingState.address_1 ? (
                <CircularProgress size={18} />
              ) : (
                <>
                  <IconButton
                    sx={{ color: "error.main" }}
                    onClick={() => handleEditingState("address_1", false)}
                  >
                    <Iconify icon="carbon:close-filled" />
                  </IconButton>
                  <IconButton
                    sx={{ color: "success.main" }}
                    onClick={() => handleUpdateStudentData("address_1")}
                  >
                    <Iconify icon="charm:circle-tick" />
                  </IconButton>
                </>
              )}
            </>
          ) : (
            <>
              <Typography sx={{ flex: 1 }}>
                {(detail?.address_1 || detail?.address || "").toString().trim() ||
                  "-"}
              </Typography>
              <IconButton
                onClick={() => handleEditingState("address_1")}
                sx={{
                  color: "primary.main",
                  transition: "opacity 0.3s, visibility 0.3s",
                  opacity: hoverKey === "address_1" ? 1 : 0,
                  visibility: hoverKey === "address_1" ? "visible" : "hidden",
                }}
              >
                <Iconify icon="lucide:edit" />
              </IconButton>
            </>
          )}
        </Box>

        {/* Previous School */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1,
          }}
          onMouseEnter={() => handleHoverState("last_school", true)}
          onMouseLeave={() => handleHoverState("last_school", false)}
        >
          <Typography sx={{ width: "140px", fontWeight: 600 }}>
            Prev School :{" "}
          </Typography>
          {editingState.last_school ? (
            <>
              <TextField
                name="last_school"
                value={formData?.last_school || ""}
                onChange={handleChange}
                size="small"
                disabled={loadingState.last_school}
                sx={{ maxWidth: "260px", flex: 1 }}
              />
              {loadingState.last_school ? (
                <CircularProgress size={18} />
              ) : (
                <>
                  <IconButton
                    sx={{ color: "error.main" }}
                    onClick={() => handleEditingState("last_school", false)}
                  >
                    <Iconify icon="carbon:close-filled" />
                  </IconButton>
                  <IconButton
                    sx={{ color: "success.main" }}
                    onClick={() => handleUpdateStudentData("last_school")}
                  >
                    <Iconify icon="charm:circle-tick" />
                  </IconButton>
                </>
              )}
            </>
          ) : (
            <>
              <Typography sx={{ flex: 1 }}>
                {(detail?.last_school || "").toString().trim() || "-"}
              </Typography>
              <IconButton
                onClick={() => handleEditingState("last_school")}
                sx={{
                  color: "primary.main",
                  transition: "opacity 0.3s, visibility 0.3s",
                  opacity: hoverKey === "last_school" ? 1 : 0,
                  visibility:
                    hoverKey === "last_school" ? "visible" : "hidden",
                }}
              >
                <Iconify icon="lucide:edit" />
              </IconButton>
            </>
          )}
        </Box>

        {/* School Address */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1,
          }}
          onMouseEnter={() => handleHoverState("last_school_address", true)}
          onMouseLeave={() => handleHoverState("last_school_address", false)}
        >
          <Typography sx={{ width: "140px", fontWeight: 600 }}>
            School Address :{" "}
          </Typography>
          {editingState.last_school_address ? (
            <>
              <TextField
                name="last_school_address"
                value={formData?.last_school_address || ""}
                onChange={handleChange}
                size="small"
                multiline
                minRows={2}
                disabled={loadingState.last_school_address}
                sx={{ maxWidth: "260px", flex: 1 }}
              />
              {loadingState.last_school_address ? (
                <CircularProgress size={18} />
              ) : (
                <>
                  <IconButton
                    sx={{ color: "error.main" }}
                    onClick={() =>
                      handleEditingState("last_school_address", false)
                    }
                  >
                    <Iconify icon="carbon:close-filled" />
                  </IconButton>
                  <IconButton
                    sx={{ color: "success.main" }}
                    onClick={() =>
                      handleUpdateStudentData("last_school_address")
                    }
                  >
                    <Iconify icon="charm:circle-tick" />
                  </IconButton>
                </>
              )}
            </>
          ) : (
            <>
              <Typography sx={{ flex: 1 }}>
                {(detail?.last_school_address || "").toString().trim() || "-"}
              </Typography>
              <IconButton
                onClick={() => handleEditingState("last_school_address")}
                sx={{
                  color: "primary.main",
                  transition: "opacity 0.3s, visibility 0.3s",
                  opacity: hoverKey === "last_school_address" ? 1 : 0,
                  visibility:
                    hoverKey === "last_school_address" ? "visible" : "hidden",
                }}
              >
                <Iconify icon="lucide:edit" />
              </IconButton>
            </>
          )}
        </Box>

        {/* City */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1,
          }}
          onMouseEnter={() => handleHoverState("city", true)}
          onMouseLeave={() => handleHoverState("city", false)}
        >
          <Typography sx={{ width: "130px", fontWeight: 600 }}>
            City :{" "}
          </Typography>

          {editingState.city ? (
            <>
              <TextField
                name="city"
                value={formData?.city || ""}
                onChange={handleChange}
                size="small"
                disabled={loadingState.city}
                sx={{ maxWidth: "220px" }}
              />
              {loadingState.city ? (
                <CircularProgress size={18} />
              ) : (
                <>
                  <IconButton
                    sx={{ color: "error.main" }}
                    onClick={() => handleEditingState("city", false)}
                  >
                    <Iconify icon="carbon:close-filled" />
                  </IconButton>
                  <IconButton
                    sx={{ color: "success.main" }}
                    onClick={() => handleUpdateStudentData("city")}
                  >
                    <Iconify icon="charm:circle-tick" />
                  </IconButton>
                </>
              )}
            </>
          ) : (
            <>
              <Typography>{detail?.city || "-"}</Typography>
              <IconButton
                onClick={() => handleEditingState("city")}
                sx={{
                  color: "primary.main",
                  transition: "opacity 0.3s, visibility 0.3s",
                  opacity: hoverKey === "city" ? 1 : 0,
                  visibility: hoverKey === "city" ? "visible" : "hidden",
                }}
              >
                <Iconify icon="lucide:edit" />
              </IconButton>
            </>
          )}
        </Box>

        {/* State */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1,
          }}
          onMouseEnter={() => handleHoverState("state", true)}
          onMouseLeave={() => handleHoverState("state", false)}
        >
          <Typography sx={{ width: "130px", fontWeight: 600 }}>
            State :{" "}
          </Typography>
          {editingState.state ? (
            <>
              <TextField
                name="state"
                value={formData?.state || ""}
                onChange={handleChange}
                size="small"
                disabled={loadingState.state}
                sx={{ maxWidth: "220px" }}
              />
              {loadingState.state ? (
                <CircularProgress size={18} />
              ) : (
                <>
                  <IconButton
                    sx={{ color: "error.main" }}
                    onClick={() => handleEditingState("state", false)}
                  >
                    <Iconify icon="carbon:close-filled" />
                  </IconButton>
                  <IconButton
                    sx={{ color: "success.main" }}
                    onClick={() => handleUpdateStudentData("state")}
                  >
                    <Iconify icon="charm:circle-tick" />
                  </IconButton>
                </>
              )}
            </>
          ) : (
            <>
              <Typography>{detail?.state || "-"}</Typography>
              <IconButton
                onClick={() => handleEditingState("state")}
                sx={{
                  color: "primary.main",
                  transition: "opacity 0.3s, visibility 0.3s",
                  opacity: hoverKey === "state" ? 1 : 0,
                  visibility: hoverKey === "state" ? "visible" : "hidden",
                }}
              >
                <Iconify icon="lucide:edit" />
              </IconButton>
            </>
          )}
        </Box>

        {/* Country  */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1,
          }}
          onMouseEnter={() => handleHoverState("country", true)}
          onMouseLeave={() => handleHoverState("country", false)}
        >
          <Typography sx={{ width: "130px", fontWeight: 600 }}>
            Country :{" "}
          </Typography>
          {editingState.country ? (
            <>
              <TextField
                name="country"
                value={formData?.country || ""}
                onChange={handleChange}
                size="small"
                disabled={loadingState.country}
                sx={{ maxWidth: "220px" }}
              />
              {loadingState.country ? (
                <CircularProgress size={18} />
              ) : (
                <>
                  <IconButton
                    sx={{ color: "error.main" }}
                    onClick={() => handleEditingState("country", false)}
                  >
                    <Iconify icon="carbon:close-filled" />
                  </IconButton>
                  <IconButton
                    sx={{ color: "success.main" }}
                    onClick={() => handleUpdateStudentData("country")}
                  >
                    <Iconify icon="charm:circle-tick" />
                  </IconButton>
                </>
              )}
            </>
          ) : (
            <>
              <Typography>{detail?.country || "-"}</Typography>
              <IconButton
                onClick={() => handleEditingState("country")}
                sx={{
                  color: "primary.main",
                  transition: "opacity 0.3s, visibility 0.3s",
                  opacity: hoverKey === "country" ? 1 : 0,
                  visibility: hoverKey === "country" ? "visible" : "hidden",
                }}
              >
                <Iconify icon="lucide:edit" />
              </IconButton>
            </>
          )}
        </Box>

        {/* Pincode */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1,
          }}
          onMouseEnter={() => handleHoverState("pincode", true)}
          onMouseLeave={() => handleHoverState("pincode", false)}
        >
          <Typography sx={{ width: "130px", fontWeight: 600 }}>
            Pincode :{" "}
          </Typography>
          <Typography>{detail?.pincode || "-"}</Typography>
          {editingState.pincode ? (
            <>
              <TextField
                name="pincode"
                value={formData?.pincode || ""}
                onChange={handleChange}
                size="small"
                disabled={loadingState.pincode}
                sx={{ maxWidth: "220px" }}
              />
              {loadingState.pincode ? (
                <CircularProgress size={18} />
              ) : (
                <>
                  <IconButton
                    sx={{ color: "error.main" }}
                    onClick={() => handleEditingState("pincode", false)}
                  >
                    <Iconify icon="carbon:close-filled" />
                  </IconButton>
                  <IconButton
                    sx={{ color: "success.main" }}
                    onClick={() => handleUpdateStudentData("pincode")}
                  >
                    <Iconify icon="charm:circle-tick" />
                  </IconButton>
                </>
              )}
            </>
          ) : (
            <>
              <IconButton
                onClick={() => handleEditingState("pincode")}
                sx={{
                  color: "primary.main",
                  transition: "opacity 0.3s, visibility 0.3s",
                  opacity: hoverKey === "pincode" ? 1 : 0,
                  visibility: hoverKey === "pincode" ? "visible" : "hidden",
                }}
              >
                <Iconify icon="lucide:edit" />
              </IconButton>
            </>
          )}
        </Box>

        {/* Blood Group */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1,
          }}
          onMouseEnter={() => handleHoverState("blood_group", true)}
          onMouseLeave={() => handleHoverState("blood_group", false)}
        >
          <Typography sx={{ width: "130px", fontWeight: 600 }}>
            Blood Group :{" "}
          </Typography>
          {editingState.blood_group ? (
            <>
              <TextField
                name="blood_group"
                value={formData?.blood_group || ""}
                onChange={handleChange}
                size="small"
                disabled={loadingState.blood_group}
                sx={{ maxWidth: "220px" }}
              />
              {loadingState.blood_group ? (
                <CircularProgress size={18} />
              ) : (
                <>
                  <IconButton
                    sx={{ color: "error.main" }}
                    onClick={() => handleEditingState("blood_group", false)}
                  >
                    <Iconify icon="carbon:close-filled" />
                  </IconButton>
                  <IconButton
                    sx={{ color: "success.main" }}
                    onClick={() => handleUpdateStudentData("blood_group")}
                  >
                    <Iconify icon="charm:circle-tick" />
                  </IconButton>
                </>
              )}
            </>
          ) : (
            <>
              <Typography>{detail?.blood_group || "-"}</Typography>
              <IconButton
                onClick={() => handleEditingState("blood_group")}
                sx={{
                  color: "primary.main",
                  transition: "opacity 0.3s, visibility 0.3s",
                  opacity: hoverKey === "blood_group" ? 1 : 0,
                  visibility: hoverKey === "blood_group" ? "visible" : "hidden",
                }}
              >
                <Iconify icon="lucide:edit" />
              </IconButton>
            </>
          )}
        </Box>

        {/* Aadhaar No */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1,
          }}
          onMouseEnter={() => handleHoverState("aadhaar_no", true)}
          onMouseLeave={() => handleHoverState("aadhaar_no", false)}
        >
          <Typography sx={{ width: "130px", fontWeight: 600 }}>
            Aadhaar No :{" "}
          </Typography>
          {editingState.aadhaar_no ? (
            <>
              <TextField
                name="aadhaar_no"
                value={formData?.aadhaar_no || ""}
                onChange={handleChange}
                size="small"
                disabled={loadingState.aadhaar_no}
                sx={{ maxWidth: "220px" }}
              />
              {loadingState.aadhaar_no ? (
                <CircularProgress size={18} />
              ) : (
                <>
                  <IconButton
                    sx={{ color: "error.main" }}
                    onClick={() => handleEditingState("aadhaar_no", false)}
                  >
                    <Iconify icon="carbon:close-filled" />
                  </IconButton>
                  <IconButton
                    sx={{ color: "success.main" }}
                    onClick={() => handleUpdateStudentData("aadhaar_no")}
                  >
                    <Iconify icon="charm:circle-tick" />
                  </IconButton>
                </>
              )}
            </>
          ) : (
            <>
              <Typography>{detail?.aadhaar_no || "-"}</Typography>
              <IconButton
                onClick={() => handleEditingState("aadhaar_no")}
                sx={{
                  color: "primary.main",
                  transition: "opacity 0.3s, visibility 0.3s",
                  opacity: hoverKey === "aadhaar_no" ? 1 : 0,
                  visibility: hoverKey === "aadhaar_no" ? "visible" : "hidden",
                }}
              >
                <Iconify icon="lucide:edit" />
              </IconButton>
            </>
          )}
        </Box>

        {/* ITS  */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Typography sx={{ width: "130px", fontWeight: 600 }}>
            ITS :{" "}
          </Typography>
          <Typography>{detail?.st_its_id || "-"}</Typography>
        </Box>

        {/* Remarks */}
        {detail?.remarks && (
          <Box
            // sx={{ display: "flex", alignItems: "center", gap: 1 }}
            onMouseEnter={() => handleHoverState("remarks", true)}
            onMouseLeave={() => handleHoverState("remarks", false)}
          >
            <Typography sx={{ width: "130px", fontWeight: 600 }}>
              Remarks :{" "}
            </Typography>
            <Box
              sx={{ display: "flex", alignItems: "center", flex: 1, gap: 1 }}
            >
              {editingState.remarks ? (
                <>
                  <TextField
                    multiline
                    rows={3}
                    name="remarks"
                    value={formData?.remarks || ""}
                    onChange={handleChange}
                    size="small"
                    disabled={loadingState.remarks}
                    // sx={{ maxWidth: "220px" }}
                  />
                  {loadingState.remarks ? (
                    <CircularProgress size={18} />
                  ) : (
                    <>
                      <IconButton
                        sx={{ color: "error.main" }}
                        onClick={() => handleEditingState("remarks", false)}
                      >
                        <Iconify icon="carbon:close-filled" />
                      </IconButton>
                      <IconButton
                        sx={{ color: "success.main" }}
                        onClick={() => handleUpdateStudentData("remarks")}
                      >
                        <Iconify icon="charm:circle-tick" />
                      </IconButton>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Typography>{detail?.remarks || "-"}</Typography>
                  <IconButton
                    onClick={() => handleEditingState("remarks")}
                    sx={{
                      color: "primary.main",
                      transition: "opacity 0.3s, visibility 0.3s",
                      opacity: hoverKey === "remarks" ? 1 : 0,
                      visibility: hoverKey === "remarks" ? "visible" : "hidden",
                    }}
                  >
                    <Iconify icon="lucide:edit" />
                  </IconButton>
                </>
              )}
            </Box>
          </Box>
        )}

        {/* Divider for new sections */}
        <Divider />

        {/* Family Photo Section */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            // justifyContent: "space-between",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Typography sx={{ width: "170px", fontWeight: 600 }}>
            Family Photo :{" "}
          </Typography>
          {detail?.family_photo_url ? (
            <Avatar
              src={detail?.family_photo_url}
              alt="Family Photo"
              sx={{
                width: 40,
                height: 40,
                cursor: "pointer",
                "& img": {
                  // Target the image element within the Avatar
                  objectFit: "cover", // Ensures the image covers the avatar area
                  objectPosition: "top center", // Adjust vertical and horizontal position within the avatar
                },
              }}
              onClick={() => {
                handleImageClick(detail?.family_photo_url, "Family Photo");
              }}
            />
          ) : (
            <Typography>-</Typography>
          )}
        </Box>

        {/* Previous Report Card Section */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            // justifyContent: "space-between",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Typography sx={{ width: "170px", fontWeight: 600 }}>
            Previous Report :{" "}
          </Typography>
          {detail?.previous_report_url ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {detail?.previous_report_url?.toLowerCase().includes(".pdf") ? (
                <IconButton
                  size="small"
                  onClick={() => {
                    window.open(
                      detail?.previous_report_url,
                      "_blank",
                      "noopener,noreferrer"
                    );
                  }}
                  sx={{
                    color: "primary.main",
                    "&:hover": {
                      bgcolor: "primary.light",
                      color: "primary.contrastText",
                    },
                  }}
                  title="View PDF"
                >
                  <Launch />
                </IconButton>
              ) : (
                <Avatar
                  src={detail?.previous_report_url}
                  alt="Previous Report Card"
                  sx={{
                    width: 40,
                    height: 40,
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    handleImageClick(
                      detail?.previous_report_url,
                      "Previous Report Card"
                    );
                  }}
                />
              )}
            </Box>
          ) : (
            <Typography>-</Typography>
          )}
        </Box>

        {/* Birth Certificate Section */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            // justifyContent: "space-between",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Typography sx={{ width: "170px", fontWeight: 600 }}>
            Birth Certificate :{" "}
          </Typography>
          {detail?.birth_certificate_url ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              {detail?.birth_certificate_url?.toLowerCase().includes(".pdf") ? (
                <IconButton
                  size="small"
                  onClick={() => {
                    window.open(
                      detail?.birth_certificate_url,
                      "_blank",
                      "noopener,noreferrer"
                    );
                  }}
                  sx={{
                    color: "primary.main",
                  }}
                  title="View PDF"
                >
                  <Launch />
                </IconButton>
              ) : (
                <Avatar
                  src={detail?.birth_certificate_url}
                  alt="Birth Certificate"
                  sx={{
                    width: 40,
                    height: 40,
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    handleImageClick(
                      detail?.birth_certificate_url,
                      "Birth Certificate"
                    );
                  }}
                />
              )}
            </Box>
          ) : (
            <Typography>-</Typography>
          )}
        </Box>

        {[
          {
            label: "Father Aadhaar",
            url: detail?.father_aadhar_url,
          },
          {
            label: "Mother Aadhaar",
            url: detail?.mother_aadhar_url,
          },
          {
            label: "Guardian Aadhaar",
            url: detail?.guardian_aadhar_url,
          },
        ].map((doc) => (
          <Box
            key={doc.label}
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Typography sx={{ width: "170px", fontWeight: 600 }}>
              {doc.label} :{" "}
            </Typography>
            {doc.url ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {String(doc.url).toLowerCase().includes(".pdf") ? (
                  <IconButton
                    size="small"
                    onClick={() => {
                      window.open(doc.url, "_blank", "noopener,noreferrer");
                    }}
                    sx={{ color: "primary.main" }}
                    title="View PDF"
                  >
                    <Launch />
                  </IconButton>
                ) : (
                  <Avatar
                    src={doc.url}
                    alt={doc.label}
                    sx={{ width: 40, height: 40, cursor: "pointer" }}
                    onClick={() => handleImageClick(doc.url, doc.label)}
                  />
                )}
              </Box>
            ) : (
              <Typography>-</Typography>
            )}
          </Box>
        ))}
      </CardContent>
    </Card>
  );
};

LeftSideCard.propTypes = {
  detail: PropTypes.object.isRequired,
  handleImageClick: PropTypes.func.isRequired,
  refetch: PropTypes.func.isRequired,
  leftSideLayoutRefetch: PropTypes.func.isRequired,
};

export default memo(LeftSideCard);
