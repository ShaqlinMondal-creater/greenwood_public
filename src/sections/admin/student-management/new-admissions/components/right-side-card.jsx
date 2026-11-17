import { memo, useState } from "react";
import PropTypes from "prop-types";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  IconButton,
  CircularProgress,
} from "@mui/material";
import Iconify from "../../../../../components/iconify/iconify";
import useAuth from "../../../../../hooks/useAuth";
import { toast } from "react-toastify";
import { editStudentDetail } from "../../../../../services/admin/students-management.service";
import { splitNameToFirstAndLast } from "../../../../../utils/constants";

const RightSideCard = ({ detail, handleImageClick, refetch }) => {
  const { logout } = useAuth();

  const initialState = {
    father_name: detail?.father_name || "",
    father_aadhar: detail?.father_aadhar || "",
    father_age: detail?.father_age || "",
    mother_aadhar: detail?.mother_aadhar || "",
    mother_age: detail?.mother_age || "",
    father_mobile: detail?.father_mobile || "",
    father_email: detail?.father_email || "",
    father_qualification: detail?.father_qualification || "",
    father_business_name: detail?.father_business_name || "",
    father_business_nature: detail?.father_business_nature || "",
    father_monthly_income: detail?.father_monthly_income || "",
    father_employer_name: detail?.father_employer_name || "",
    father_designation: detail?.father_designation || "",
    mother_name: detail?.mother_name || "",
    mother_mobile: detail?.mother_mobile || "",
    mother_email: detail?.mother_email || "",
    mother_qualification: detail?.mother_qualification || "",
    mother_business_name: detail?.mother_business_name || "",
    mother_business_nature: detail?.mother_business_nature || "",
    mother_monthly_income: detail?.mother_monthly_income || "",
    mother_employer_name: detail?.mother_employer_name || "",
    mother_designation: detail?.mother_designation || "",
  };

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
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
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
    let response;

    if (key === "father_name" || key === "mother_name") {
      const { firstName, lastName } = splitNameToFirstAndLast(formData[key]);
      response = await editStudentDetail(detail?.id, {
        [`${key.split("_")[0]}_first_name`]: firstName,
        [`${key.split("_")[0]}_last_name`]: lastName,
      });
    } else {
      response = await editStudentDetail(detail?.id, {
        [key]: formData[key]?.value || formData[key],
      });
    }

    handleLoadingState(key, false);
    handleEditingState(key, false);
    if (response?.code === 200) {
      toast.success(response?.message || "Parent details updated");
      refetch();
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Failed to update parent details");
    }
  };

  return (
    <Card
      sx={{
        background: "transparent",
        border: "1px solid #b1b1b1",
        mx: "auto",
        maxWidth: "500px",
        // height: "500px",
        // overflow: "auto",
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar
            alt={detail?.father_name || "N/A"}
            src={detail?.father_photo_url}
            sx={{
              cursor: "pointer",
              "& img": {
                // Target the image element within the Avatar
                objectFit: "cover", // Ensures the image covers the avatar area
                objectPosition: "top center", // Adjust vertical and horizontal position within the avatar
              },
            }}
            onClick={() =>
              handleImageClick(detail?.father_photo_url, "Father Photo")
            }
          />
          {/* Father Name */}
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
            onMouseEnter={() => handleHoverState("father_name", true)}
            onMouseLeave={() => handleHoverState("father_name", false)}
          >
            <Box
              sx={{ display: "flex", alignItems: "center", flex: 1, gap: 1 }}
            >
              {editingState.father_name ? (
                <>
                  <TextField
                    name="father_name"
                    value={formData?.father_name || ""}
                    onChange={handleChange}
                    size="small"
                    disabled={loadingState.father_name}
                    sx={{ maxWidth: "220px" }}
                  />
                  {loadingState.father_name ? (
                    <CircularProgress size={18} />
                  ) : (
                    <>
                      <IconButton
                        sx={{ color: "error.main" }}
                        onClick={() => handleEditingState("father_name", false)}
                      >
                        <Iconify icon="carbon:close-filled" />
                      </IconButton>
                      <IconButton
                        sx={{ color: "success.main" }}
                        onClick={() => handleUpdateStudentData("father_name")}
                      >
                        <Iconify icon="charm:circle-tick" />
                      </IconButton>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Typography>{detail?.father_name || "-"}</Typography>
                  <IconButton
                    onClick={() => handleEditingState("father_name")}
                    sx={{
                      color: "primary.main",
                      transition: "opacity 0.3s, visibility 0.3s",
                      opacity: hoverKey === "father_name" ? 1 : 0,
                      visibility:
                        hoverKey === "father_name" ? "visible" : "hidden",
                    }}
                  >
                    <Iconify icon="lucide:edit" />
                  </IconButton>
                </>
              )}
            </Box>
          </Box>
        </Box>

        {/* Father Mobile */}
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
          onMouseEnter={() => handleHoverState("father_mobile", true)}
          onMouseLeave={() => handleHoverState("father_mobile", false)}
        >
          <Typography sx={{ width: "130px", fontWeight: 600 }}>
            Mobile :{" "}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", flex: 1, gap: 1 }}>
            {editingState.father_mobile ? (
              <>
                <TextField
                  name="father_mobile"
                  value={formData?.father_mobile || ""}
                  onChange={handleChange}
                  size="small"
                  disabled={loadingState.father_mobile}
                  sx={{ maxWidth: "220px" }}
                />
                {loadingState.father_mobile ? (
                  <CircularProgress size={18} />
                ) : (
                  <>
                    <IconButton
                      sx={{ color: "error.main" }}
                      onClick={() => handleEditingState("father_mobile", false)}
                    >
                      <Iconify icon="carbon:close-filled" />
                    </IconButton>
                    <IconButton
                      sx={{ color: "success.main" }}
                      onClick={() => handleUpdateStudentData("father_mobile")}
                    >
                      <Iconify icon="charm:circle-tick" />
                    </IconButton>
                  </>
                )}
              </>
            ) : (
              <>
                <Typography>{detail?.father_mobile || "-"}</Typography>
                <IconButton
                  onClick={() => handleEditingState("father_mobile")}
                  sx={{
                    color: "primary.main",
                    transition: "opacity 0.3s, visibility 0.3s",
                    opacity: hoverKey === "father_mobile" ? 1 : 0,
                    visibility:
                      hoverKey === "father_mobile" ? "visible" : "hidden",
                  }}
                >
                  <Iconify icon="lucide:edit" />
                </IconButton>
              </>
            )}
          </Box>
        </Box>

        {/* Father Email */}
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
          onMouseEnter={() => handleHoverState("father_email", true)}
          onMouseLeave={() => handleHoverState("father_email", false)}
        >
          <Typography sx={{ width: "130px", fontWeight: 600 }}>
            Email :{" "}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", flex: 1, gap: 1 }}>
            {editingState.father_email ? (
              <>
                <TextField
                  name="father_email"
                  value={formData?.father_email || ""}
                  onChange={handleChange}
                  size="small"
                  disabled={loadingState.father_email}
                  sx={{ maxWidth: "220px" }}
                />
                {loadingState.father_email ? (
                  <CircularProgress size={18} />
                ) : (
                  <>
                    <IconButton
                      sx={{ color: "error.main" }}
                      onClick={() => handleEditingState("father_email", false)}
                    >
                      <Iconify icon="carbon:close-filled" />
                    </IconButton>
                    <IconButton
                      sx={{ color: "success.main" }}
                      onClick={() => handleUpdateStudentData("father_email")}
                    >
                      <Iconify icon="charm:circle-tick" />
                    </IconButton>
                  </>
                )}
              </>
            ) : (
              <>
                <Typography>{detail?.father_email || "-"}</Typography>
                <IconButton
                  onClick={() => handleEditingState("father_email")}
                  sx={{
                    color: "primary.main",
                    transition: "opacity 0.3s, visibility 0.3s",
                    opacity: hoverKey === "father_email" ? 1 : 0,
                    visibility:
                      hoverKey === "father_email" ? "visible" : "hidden",
                  }}
                >
                  <Iconify icon="lucide:edit" />
                </IconButton>
              </>
            )}
          </Box>
        </Box>

        {/* Father Occupation  */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Typography sx={{ width: "170px", fontWeight: 600 }}>
            Occupation :{" "}
          </Typography>
          <Typography>{detail?.father_occupation || "N/A"}</Typography>
        </Box>

        {/* Father Qualification */}
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
          onMouseEnter={() => handleHoverState("father_qualification", true)}
          onMouseLeave={() => handleHoverState("father_qualification", false)}
        >
          <Typography sx={{ width: "130px", fontWeight: 600 }}>
            Qualification :{" "}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", flex: 1, gap: 1 }}>
            {editingState.father_qualification ? (
              <>
                <TextField
                  name="father_qualification"
                  value={formData?.father_qualification || ""}
                  onChange={handleChange}
                  size="small"
                  disabled={loadingState.father_qualification}
                  sx={{ maxWidth: "220px" }}
                />
                {loadingState.father_qualification ? (
                  <CircularProgress size={18} />
                ) : (
                  <>
                    <IconButton
                      sx={{ color: "error.main" }}
                      onClick={() =>
                        handleEditingState("father_qualification", false)
                      }
                    >
                      <Iconify icon="carbon:close-filled" />
                    </IconButton>
                    <IconButton
                      sx={{ color: "success.main" }}
                      onClick={() =>
                        handleUpdateStudentData("father_qualification")
                      }
                    >
                      <Iconify icon="charm:circle-tick" />
                    </IconButton>
                  </>
                )}
              </>
            ) : (
              <>
                <Typography>{detail?.father_qualification || "-"}</Typography>
                <IconButton
                  onClick={() => handleEditingState("father_qualification")}
                  sx={{
                    color: "primary.main",
                    transition: "opacity 0.3s, visibility 0.3s",
                    opacity: hoverKey === "father_qualification" ? 1 : 0,
                    visibility:
                      hoverKey === "father_qualification"
                        ? "visible"
                        : "hidden",
                  }}
                >
                  <Iconify icon="lucide:edit" />
                </IconButton>
              </>
            )}
          </Box>
        </Box>

        {/* Father's Business/Employment Details */}
        {detail?.father_occupation === "self-employed" && (
          <>
            {/* Business Name */}
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
              onMouseEnter={() =>
                handleHoverState("father_business_name", true)
              }
              onMouseLeave={() =>
                handleHoverState("father_business_name", false)
              }
            >
              <Typography sx={{ width: "130px", fontWeight: 600 }}>
                Business Name :{" "}
              </Typography>
              <Box
                sx={{ display: "flex", alignItems: "center", flex: 1, gap: 1 }}
              >
                {editingState.father_business_name ? (
                  <>
                    <TextField
                      name="father_business_name"
                      value={formData?.father_business_name || ""}
                      onChange={handleChange}
                      size="small"
                      disabled={loadingState.father_business_name}
                      sx={{ maxWidth: "220px" }}
                    />
                    {loadingState.father_business_name ? (
                      <CircularProgress size={18} />
                    ) : (
                      <>
                        <IconButton
                          sx={{ color: "error.main" }}
                          onClick={() =>
                            handleEditingState("father_business_name", false)
                          }
                        >
                          <Iconify icon="carbon:close-filled" />
                        </IconButton>
                        <IconButton
                          sx={{ color: "success.main" }}
                          onClick={() =>
                            handleUpdateStudentData("father_business_name")
                          }
                        >
                          <Iconify icon="charm:circle-tick" />
                        </IconButton>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <Typography>
                      {detail?.father_business_name || "-"}
                    </Typography>
                    <IconButton
                      onClick={() => handleEditingState("father_business_name")}
                      sx={{
                        color: "primary.main",
                        transition: "opacity 0.3s, visibility 0.3s",
                        opacity: hoverKey === "father_business_name" ? 1 : 0,
                        visibility:
                          hoverKey === "father_business_name"
                            ? "visible"
                            : "hidden",
                      }}
                    >
                      <Iconify icon="lucide:edit" />
                    </IconButton>
                  </>
                )}
              </Box>
            </Box>

            {/* Business Nature */}
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
              onMouseEnter={() =>
                handleHoverState("father_business_nature", true)
              }
              onMouseLeave={() =>
                handleHoverState("father_business_nature", false)
              }
            >
              <Typography sx={{ width: "130px", fontWeight: 600 }}>
                Business Nature :{" "}
              </Typography>
              <Box
                sx={{ display: "flex", alignItems: "center", flex: 1, gap: 1 }}
              >
                {editingState.father_business_nature ? (
                  <>
                    <TextField
                      name="father_business_nature"
                      value={formData?.father_business_nature || ""}
                      onChange={handleChange}
                      size="small"
                      disabled={loadingState.father_business_nature}
                      sx={{ maxWidth: "220px" }}
                    />
                    {loadingState.father_business_nature ? (
                      <CircularProgress size={18} />
                    ) : (
                      <>
                        <IconButton
                          sx={{ color: "error.main" }}
                          onClick={() =>
                            handleEditingState("father_business_nature", false)
                          }
                        >
                          <Iconify icon="carbon:close-filled" />
                        </IconButton>
                        <IconButton
                          sx={{ color: "success.main" }}
                          onClick={() =>
                            handleUpdateStudentData("father_business_nature")
                          }
                        >
                          <Iconify icon="charm:circle-tick" />
                        </IconButton>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <Typography>
                      {detail?.father_business_nature || "-"}
                    </Typography>
                    <IconButton
                      onClick={() =>
                        handleEditingState("father_business_nature")
                      }
                      sx={{
                        color: "primary.main",
                        transition: "opacity 0.3s, visibility 0.3s",
                        opacity: hoverKey === "father_business_nature" ? 1 : 0,
                        visibility:
                          hoverKey === "father_business_nature"
                            ? "visible"
                            : "hidden",
                      }}
                    >
                      <Iconify icon="lucide:edit" />
                    </IconButton>
                  </>
                )}
              </Box>
            </Box>

            {/* Monthly Income */}
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
              onMouseEnter={() =>
                handleHoverState("father_monthly_income", true)
              }
              onMouseLeave={() =>
                handleHoverState("father_monthly_income", false)
              }
            >
              <Typography sx={{ width: "130px", fontWeight: 600 }}>
                Monthly Income :{" "}
              </Typography>
              <Box
                sx={{ display: "flex", alignItems: "center", flex: 1, gap: 1 }}
              >
                {editingState.father_monthly_income ? (
                  <>
                    <TextField
                      name="father_monthly_income"
                      value={formData?.father_monthly_income || ""}
                      onChange={handleChange}
                      size="small"
                      disabled={loadingState.father_monthly_income}
                      sx={{ maxWidth: "220px" }}
                    />
                    {loadingState.father_monthly_income ? (
                      <CircularProgress size={18} />
                    ) : (
                      <>
                        <IconButton
                          sx={{ color: "error.main" }}
                          onClick={() =>
                            handleEditingState("father_monthly_income", false)
                          }
                        >
                          <Iconify icon="carbon:close-filled" />
                        </IconButton>
                        <IconButton
                          sx={{ color: "success.main" }}
                          onClick={() =>
                            handleUpdateStudentData("father_monthly_income")
                          }
                        >
                          <Iconify icon="charm:circle-tick" />
                        </IconButton>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <Typography>
                      {detail?.father_monthly_income || "-"}
                    </Typography>
                    <IconButton
                      onClick={() =>
                        handleEditingState("father_monthly_income")
                      }
                      sx={{
                        color: "primary.main",
                        transition: "opacity 0.3s, visibility 0.3s",
                        opacity: hoverKey === "father_monthly_income" ? 1 : 0,
                        visibility:
                          hoverKey === "father_monthly_income"
                            ? "visible"
                            : "hidden",
                      }}
                    >
                      <Iconify icon="lucide:edit" />
                    </IconButton>
                  </>
                )}
              </Box>
            </Box>
          </>
        )}
        {detail?.father_occupation === "employed" && (
          <>
            {/* Employer Name */}
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
              onMouseEnter={() =>
                handleHoverState("father_employer_name", true)
              }
              onMouseLeave={() =>
                handleHoverState("father_employer_name", false)
              }
            >
              <Typography sx={{ width: "130px", fontWeight: 600 }}>
                Employer Name :{" "}
              </Typography>
              <Box
                sx={{ display: "flex", alignItems: "center", flex: 1, gap: 1 }}
              >
                {editingState.father_employer_name ? (
                  <>
                    <TextField
                      name="father_employer_name"
                      value={formData?.father_employer_name || ""}
                      onChange={handleChange}
                      size="small"
                      disabled={loadingState.father_employer_name}
                      sx={{ maxWidth: "220px" }}
                    />
                    {loadingState.father_employer_name ? (
                      <CircularProgress size={18} />
                    ) : (
                      <>
                        <IconButton
                          sx={{ color: "error.main" }}
                          onClick={() =>
                            handleEditingState("father_employer_name", false)
                          }
                        >
                          <Iconify icon="carbon:close-filled" />
                        </IconButton>
                        <IconButton
                          sx={{ color: "success.main" }}
                          onClick={() =>
                            handleUpdateStudentData("father_employer_name")
                          }
                        >
                          <Iconify icon="charm:circle-tick" />
                        </IconButton>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <Typography>
                      {detail?.father_employer_name || "-"}
                    </Typography>
                    <IconButton
                      onClick={() => handleEditingState("father_employer_name")}
                      sx={{
                        color: "primary.main",
                        transition: "opacity 0.3s, visibility 0.3s",
                        opacity: hoverKey === "father_employer_name" ? 1 : 0,
                        visibility:
                          hoverKey === "father_employer_name"
                            ? "visible"
                            : "hidden",
                      }}
                    >
                      <Iconify icon="lucide:edit" />
                    </IconButton>
                  </>
                )}
              </Box>
            </Box>
            {/* Designation */}
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
              onMouseEnter={() => handleHoverState("father_designation", true)}
              onMouseLeave={() => handleHoverState("father_designation", false)}
            >
              <Typography sx={{ width: "130px", fontWeight: 600 }}>
                Designation :{" "}
              </Typography>
              <Box
                sx={{ display: "flex", alignItems: "center", flex: 1, gap: 1 }}
              >
                {editingState.father_designation ? (
                  <>
                    <TextField
                      name="father_designation"
                      value={formData?.father_designation || ""}
                      onChange={handleChange}
                      size="small"
                      disabled={loadingState.father_designation}
                      sx={{ maxWidth: "220px" }}
                    />
                    {loadingState.father_designation ? (
                      <CircularProgress size={18} />
                    ) : (
                      <>
                        <IconButton
                          sx={{ color: "error.main" }}
                          onClick={() =>
                            handleEditingState("father_designation", false)
                          }
                        >
                          <Iconify icon="carbon:close-filled" />
                        </IconButton>
                        <IconButton
                          sx={{ color: "success.main" }}
                          onClick={() =>
                            handleUpdateStudentData("father_designation")
                          }
                        >
                          <Iconify icon="charm:circle-tick" />
                        </IconButton>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <Typography>{detail?.father_designation || "-"}</Typography>
                    <IconButton
                      onClick={() => handleEditingState("father_designation")}
                      sx={{
                        color: "primary.main",
                        transition: "opacity 0.3s, visibility 0.3s",
                        opacity: hoverKey === "father_designation" ? 1 : 0,
                        visibility:
                          hoverKey === "father_designation"
                            ? "visible"
                            : "hidden",
                      }}
                    >
                      <Iconify icon="lucide:edit" />
                    </IconButton>
                  </>
                )}
              </Box>
            </Box>
            {/* Monthly Income */}
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
              onMouseEnter={() =>
                handleHoverState("father_monthly_income", true)
              }
              onMouseLeave={() =>
                handleHoverState("father_monthly_income", false)
              }
            >
              <Typography sx={{ width: "130px", fontWeight: 600 }}>
                Monthly Income :{" "}
              </Typography>
              <Box
                sx={{ display: "flex", alignItems: "center", flex: 1, gap: 1 }}
              >
                {editingState.father_monthly_income ? (
                  <>
                    <TextField
                      name="father_monthly_income"
                      value={formData?.father_monthly_income || ""}
                      onChange={handleChange}
                      size="small"
                      disabled={loadingState.father_monthly_income}
                      sx={{ maxWidth: "220px" }}
                    />
                    {loadingState.father_monthly_income ? (
                      <CircularProgress size={18} />
                    ) : (
                      <>
                        <IconButton
                          sx={{ color: "error.main" }}
                          onClick={() =>
                            handleEditingState("father_monthly_income", false)
                          }
                        >
                          <Iconify icon="carbon:close-filled" />
                        </IconButton>
                        <IconButton
                          sx={{ color: "success.main" }}
                          onClick={() =>
                            handleUpdateStudentData("father_monthly_income")
                          }
                        >
                          <Iconify icon="charm:circle-tick" />
                        </IconButton>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <Typography>
                      {detail?.father_monthly_income || "-"}
                    </Typography>
                    <IconButton
                      onClick={() =>
                        handleEditingState("father_monthly_income")
                      }
                      sx={{
                        color: "primary.main",
                        transition: "opacity 0.3s, visibility 0.3s",
                        opacity: hoverKey === "father_monthly_income" ? 1 : 0,
                        visibility:
                          hoverKey === "father_monthly_income"
                            ? "visible"
                            : "hidden",
                      }}
                    >
                      <Iconify icon="lucide:edit" />
                    </IconButton>
                  </>
                )}
              </Box>
            </Box>
          </>
        )}
        {/* Father's Aadhaar */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1,
          }}
          onMouseEnter={() => handleHoverState("father_aadhar", true)}
          onMouseLeave={() => handleHoverState("father_aadhar", false)}
        >
          <Typography sx={{ width: "170px", fontWeight: 600 }}>
            {`Father's Aadhaar : `}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
            {editingState.father_aadhar ? (
              <>
                <TextField
                  name="father_aadhar"
                  value={formData?.father_aadhar || ""}
                  onChange={handleChange}
                  size="small"
                  disabled={loadingState.father_aadhar}
                  sx={{ maxWidth: "220px" }}
                />
                {loadingState.father_aadhar ? (
                  <CircularProgress size={18} />
                ) : (
                  <>
                    <IconButton
                      sx={{ color: "error.main" }}
                      onClick={() => handleEditingState("father_aadhar", false)}
                    >
                      <Iconify icon="carbon:close-filled" />
                    </IconButton>
                    <IconButton
                      sx={{ color: "success.main" }}
                      onClick={() => handleUpdateStudentData("father_aadhar")}
                    >
                      <Iconify icon="charm:circle-tick" />
                    </IconButton>
                  </>
                )}
              </>
            ) : (
              <>
                <Typography>{detail?.father_aadhar || "-"}</Typography>
                {detail?.father_aadhar_url ? (
                  <IconButton
                    size="small"
                    onClick={() => {
                      if (
                        String(detail.father_aadhar_url)
                          .toLowerCase()
                          .includes(".pdf")
                      ) {
                        window.open(
                          detail.father_aadhar_url,
                          "_blank",
                          "noopener,noreferrer"
                        );
                      } else {
                        handleImageClick(
                          detail.father_aadhar_url,
                          "Father Aadhaar"
                        );
                      }
                    }}
                    sx={{ color: "primary.main" }}
                    title="View Aadhaar"
                  >
                    <Iconify icon="lucide:file-text" />
                  </IconButton>
                ) : null}
                <IconButton
                  onClick={() => handleEditingState("father_aadhar")}
                  sx={{
                    color: "primary.main",
                    transition: "opacity 0.3s, visibility 0.3s",
                    opacity: hoverKey === "father_aadhar" ? 1 : 0,
                    visibility:
                      hoverKey === "father_aadhar" ? "visible" : "hidden",
                  }}
                >
                  <Iconify icon="lucide:edit" />
                </IconButton>
              </>
            )}
          </Box>
        </Box>
        {/* Father's Age */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1,
          }}
          onMouseEnter={() => handleHoverState("father_age", true)}
          onMouseLeave={() => handleHoverState("father_age", false)}
        >
          <Typography sx={{ width: "130px", fontWeight: 600 }}>
            {`Father's Age : `}
          </Typography>
          {editingState.father_age ? (
            <>
              <TextField
                name="father_age"
                value={formData?.father_age || ""}
                onChange={handleChange}
                size="small"
                disabled={loadingState.father_age}
                sx={{ maxWidth: "220px" }}
              />
              {loadingState.father_age ? (
                <CircularProgress size={18} />
              ) : (
                <>
                  <IconButton
                    sx={{ color: "error.main" }}
                    onClick={() => handleEditingState("father_age", false)}
                  >
                    <Iconify icon="carbon:close-filled" />
                  </IconButton>
                  <IconButton
                    sx={{ color: "success.main" }}
                    onClick={() => handleUpdateStudentData("father_age")}
                  >
                    <Iconify icon="charm:circle-tick" />
                  </IconButton>
                </>
              )}
            </>
          ) : (
            <>
              <Typography>{detail?.father_age || "-"}</Typography>
              <IconButton
                onClick={() => handleEditingState("father_age")}
                sx={{
                  color: "primary.main",
                  transition: "opacity 0.3s, visibility 0.3s",
                  opacity: hoverKey === "father_age" ? 1 : 0,
                  visibility: hoverKey === "father_age" ? "visible" : "hidden",
                }}
              >
                <Iconify icon="lucide:edit" />
              </IconButton>
            </>
          )}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar
            alt={detail?.mother_name || "N/A"}
            src={detail?.mother_photo_url}
            sx={{
              cursor: "pointer",
              "& img": {
                // Target the image element within the Avatar
                objectFit: "cover", // Ensures the image covers the avatar area
                objectPosition: "top center", // Adjust vertical and horizontal position within the avatar
              },
            }}
            onClick={() =>
              handleImageClick(detail?.mother_photo_url, "Mother Photo")
            }
          />
          {/* Mother Name */}
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
            onMouseEnter={() => handleHoverState("mother_name", true)}
            onMouseLeave={() => handleHoverState("mother_name", false)}
          >
            <Box
              sx={{ display: "flex", alignItems: "center", flex: 1, gap: 1 }}
            >
              {editingState.mother_name ? (
                <>
                  <TextField
                    name="mother_name"
                    value={formData?.mother_name || ""}
                    onChange={handleChange}
                    size="small"
                    disabled={loadingState.mother_name}
                    sx={{ maxWidth: "220px" }}
                  />
                  {loadingState.mother_name ? (
                    <CircularProgress size={18} />
                  ) : (
                    <>
                      <IconButton
                        sx={{ color: "error.main" }}
                        onClick={() => handleEditingState("mother_name", false)}
                      >
                        <Iconify icon="carbon:close-filled" />
                      </IconButton>
                      <IconButton
                        sx={{ color: "success.main" }}
                        onClick={() => handleUpdateStudentData("mother_name")}
                      >
                        <Iconify icon="charm:circle-tick" />
                      </IconButton>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Typography>{detail?.mother_name || "-"}</Typography>
                  <IconButton
                    onClick={() => handleEditingState("mother_name")}
                    sx={{
                      color: "primary.main",
                      transition: "opacity 0.3s, visibility 0.3s",
                      opacity: hoverKey === "mother_name" ? 1 : 0,
                      visibility:
                        hoverKey === "mother_name" ? "visible" : "hidden",
                    }}
                  >
                    <Iconify icon="lucide:edit" />
                  </IconButton>
                </>
              )}
            </Box>
          </Box>
        </Box>
        {/* Mother Mobile */}
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
          onMouseEnter={() => handleHoverState("mother_mobile", true)}
          onMouseLeave={() => handleHoverState("mother_mobile", false)}
        >
          <Typography sx={{ width: "130px", fontWeight: 600 }}>
            Mobile :{" "}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", flex: 1, gap: 1 }}>
            {editingState.mother_mobile ? (
              <>
                <TextField
                  name="mother_mobile"
                  value={formData?.mother_mobile || ""}
                  onChange={handleChange}
                  size="small"
                  disabled={loadingState.mother_mobile}
                  sx={{ maxWidth: "220px" }}
                />
                {loadingState.mother_mobile ? (
                  <CircularProgress size={18} />
                ) : (
                  <>
                    <IconButton
                      sx={{ color: "error.main" }}
                      onClick={() => handleEditingState("mother_mobile", false)}
                    >
                      <Iconify icon="carbon:close-filled" />
                    </IconButton>
                    <IconButton
                      sx={{ color: "success.main" }}
                      onClick={() => handleUpdateStudentData("mother_mobile")}
                    >
                      <Iconify icon="charm:circle-tick" />
                    </IconButton>
                  </>
                )}
              </>
            ) : (
              <>
                <Typography>{detail?.mother_mobile || "-"}</Typography>
                <IconButton
                  onClick={() => handleEditingState("mother_mobile")}
                  sx={{
                    color: "primary.main",
                    transition: "opacity 0.3s, visibility 0.3s",
                    opacity: hoverKey === "mother_mobile" ? 1 : 0,
                    visibility:
                      hoverKey === "mother_mobile" ? "visible" : "hidden",
                  }}
                >
                  <Iconify icon="lucide:edit" />
                </IconButton>
              </>
            )}
          </Box>
        </Box>
        {/* Mother Email */}
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
          onMouseEnter={() => handleHoverState("mother_email", true)}
          onMouseLeave={() => handleHoverState("mother_email", false)}
        >
          <Typography sx={{ width: "130px", fontWeight: 600 }}>
            Email :{" "}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", flex: 1, gap: 1 }}>
            {editingState.mother_email ? (
              <>
                <TextField
                  name="mother_email"
                  value={formData?.mother_email || ""}
                  onChange={handleChange}
                  size="small"
                  disabled={loadingState.mother_email}
                  sx={{ maxWidth: "220px" }}
                />
                {loadingState.mother_email ? (
                  <CircularProgress size={18} />
                ) : (
                  <>
                    <IconButton
                      sx={{ color: "error.main" }}
                      onClick={() => handleEditingState("mother_email", false)}
                    >
                      <Iconify icon="carbon:close-filled" />
                    </IconButton>
                    <IconButton
                      sx={{ color: "success.main" }}
                      onClick={() => handleUpdateStudentData("mother_email")}
                    >
                      <Iconify icon="charm:circle-tick" />
                    </IconButton>
                  </>
                )}
              </>
            ) : (
              <>
                <Typography>{detail?.mother_email || "-"}</Typography>
                <IconButton
                  onClick={() => handleEditingState("mother_email")}
                  sx={{
                    color: "primary.main",
                    transition: "opacity 0.3s, visibility 0.3s",
                    opacity: hoverKey === "mother_email" ? 1 : 0,
                    visibility:
                      hoverKey === "mother_email" ? "visible" : "hidden",
                  }}
                >
                  <Iconify icon="lucide:edit" />
                </IconButton>
              </>
            )}
          </Box>
        </Box>
        {/* Mother Occupation */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Typography sx={{ width: "170px", fontWeight: 600 }}>
            Occupation :{" "}
          </Typography>
          <Typography>{detail?.mother_occupation || "N/A"}</Typography>
        </Box>
        {/* Mother Qualification */}
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
          onMouseEnter={() => handleHoverState("mother_qualification", true)}
          onMouseLeave={() => handleHoverState("mother_qualification", false)}
        >
          <Typography sx={{ width: "130px", fontWeight: 600 }}>
            Qualification :{" "}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", flex: 1, gap: 1 }}>
            {editingState.mother_qualification ? (
              <>
                <TextField
                  name="mother_qualification"
                  value={formData?.mother_qualification || ""}
                  onChange={handleChange}
                  size="small"
                  disabled={loadingState.mother_qualification}
                  sx={{ maxWidth: "220px" }}
                />
                {loadingState.mother_qualification ? (
                  <CircularProgress size={18} />
                ) : (
                  <>
                    <IconButton
                      sx={{ color: "error.main" }}
                      onClick={() =>
                        handleEditingState("mother_qualification", false)
                      }
                    >
                      <Iconify icon="carbon:close-filled" />
                    </IconButton>
                    <IconButton
                      sx={{ color: "success.main" }}
                      onClick={() =>
                        handleUpdateStudentData("mother_qualification")
                      }
                    >
                      <Iconify icon="charm:circle-tick" />
                    </IconButton>
                  </>
                )}
              </>
            ) : (
              <>
                <Typography>{detail?.mother_qualification || "-"}</Typography>
                <IconButton
                  onClick={() => handleEditingState("mother_qualification")}
                  sx={{
                    color: "primary.main",
                    transition: "opacity 0.3s, visibility 0.3s",
                    opacity: hoverKey === "mother_qualification" ? 1 : 0,
                    visibility:
                      hoverKey === "mother_qualification"
                        ? "visible"
                        : "hidden",
                  }}
                >
                  <Iconify icon="lucide:edit" />
                </IconButton>
              </>
            )}
          </Box>
        </Box>

        {/* Mother's Business/Employment Details */}
        {detail?.mother_occupation === "self-employed" && (
          <>
            {/* Mother Business Name*/}
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
              onMouseEnter={() =>
                handleHoverState("mother_business_name", true)
              }
              onMouseLeave={() =>
                handleHoverState("mother_business_name", false)
              }
            >
              <Typography sx={{ width: "130px", fontWeight: 600 }}>
                Business Name:{" "}
              </Typography>
              <Box
                sx={{ display: "flex", alignItems: "center", flex: 1, gap: 1 }}
              >
                {editingState.mother_business_name ? (
                  <>
                    <TextField
                      name="mother_business_name"
                      value={formData?.mother_business_name || ""}
                      onChange={handleChange}
                      size="small"
                      disabled={loadingState.mother_business_name}
                      sx={{ maxWidth: "220px" }}
                    />
                    {loadingState.mother_business_name ? (
                      <CircularProgress size={18} />
                    ) : (
                      <>
                        <IconButton
                          sx={{ color: "error.main" }}
                          onClick={() =>
                            handleEditingState("mother_business_name", false)
                          }
                        >
                          <Iconify icon="carbon:close-filled" />
                        </IconButton>
                        <IconButton
                          sx={{ color: "success.main" }}
                          onClick={() =>
                            handleUpdateStudentData("mother_business_name")
                          }
                        >
                          <Iconify icon="charm:circle-tick" />
                        </IconButton>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <Typography>
                      {detail?.mother_business_name || "-"}
                    </Typography>
                    <IconButton
                      onClick={() => handleEditingState("mother_business_name")}
                      sx={{
                        color: "primary.main",
                        transition: "opacity 0.3s, visibility 0.3s",
                        opacity: hoverKey === "mother_business_name" ? 1 : 0,
                        visibility:
                          hoverKey === "mother_business_name"
                            ? "visible"
                            : "hidden",
                      }}
                    >
                      <Iconify icon="lucide:edit" />
                    </IconButton>
                  </>
                )}
              </Box>
            </Box>
            {/* Mother Business Nature */}
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
              onMouseEnter={() =>
                handleHoverState("mother_business_nature", true)
              }
              onMouseLeave={() =>
                handleHoverState("mother_business_nature", false)
              }
            >
              <Typography sx={{ width: "130px", fontWeight: 600 }}>
                Business Nature :{" "}
              </Typography>
              <Box
                sx={{ display: "flex", alignItems: "center", flex: 1, gap: 1 }}
              >
                {editingState.mother_business_nature ? (
                  <>
                    <TextField
                      name="mother_business_nature"
                      value={formData?.mother_business_nature || ""}
                      onChange={handleChange}
                      size="small"
                      disabled={loadingState.mother_business_nature}
                      sx={{ maxWidth: "220px" }}
                    />
                    {loadingState.mother_business_nature ? (
                      <CircularProgress size={18} />
                    ) : (
                      <>
                        <IconButton
                          sx={{ color: "error.main" }}
                          onClick={() =>
                            handleEditingState("mother_business_nature", false)
                          }
                        >
                          <Iconify icon="carbon:close-filled" />
                        </IconButton>
                        <IconButton
                          sx={{ color: "success.main" }}
                          onClick={() =>
                            handleUpdateStudentData("mother_business_nature")
                          }
                        >
                          <Iconify icon="charm:circle-tick" />
                        </IconButton>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <Typography>
                      {detail?.mother_business_nature || "-"}
                    </Typography>
                    <IconButton
                      onClick={() =>
                        handleEditingState("mother_business_nature")
                      }
                      sx={{
                        color: "primary.main",
                        transition: "opacity 0.3s, visibility 0.3s",
                        opacity: hoverKey === "mother_business_nature" ? 1 : 0,
                        visibility:
                          hoverKey === "mother_business_nature"
                            ? "visible"
                            : "hidden",
                      }}
                    >
                      <Iconify icon="lucide:edit" />
                    </IconButton>
                  </>
                )}
              </Box>
            </Box>
            {/* Mother Monthly Income */}
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
              onMouseEnter={() =>
                handleHoverState("mother_monthly_income", true)
              }
              onMouseLeave={() =>
                handleHoverState("mother_monthly_income", false)
              }
            >
              <Typography sx={{ width: "130px", fontWeight: 600 }}>
                Monthly Income :{" "}
              </Typography>
              <Box
                sx={{ display: "flex", alignItems: "center", flex: 1, gap: 1 }}
              >
                {editingState.mother_monthly_income ? (
                  <>
                    <TextField
                      name="mother_monthly_income"
                      value={formData?.mother_monthly_income || ""}
                      onChange={handleChange}
                      size="small"
                      disabled={loadingState.mother_monthly_income}
                      sx={{ maxWidth: "220px" }}
                    />
                    {loadingState.mother_monthly_income ? (
                      <CircularProgress size={18} />
                    ) : (
                      <>
                        <IconButton
                          sx={{ color: "error.main" }}
                          onClick={() =>
                            handleEditingState("mother_monthly_income", false)
                          }
                        >
                          <Iconify icon="carbon:close-filled" />
                        </IconButton>
                        <IconButton
                          sx={{ color: "success.main" }}
                          onClick={() =>
                            handleUpdateStudentData("mother_monthly_income")
                          }
                        >
                          <Iconify icon="charm:circle-tick" />
                        </IconButton>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <Typography>
                      {detail?.mother_monthly_income || "-"}
                    </Typography>
                    <IconButton
                      onClick={() =>
                        handleEditingState("mother_monthly_income")
                      }
                      sx={{
                        color: "primary.main",
                        transition: "opacity 0.3s, visibility 0.3s",
                        opacity: hoverKey === "mother_monthly_income" ? 1 : 0,
                        visibility:
                          hoverKey === "mother_monthly_income"
                            ? "visible"
                            : "hidden",
                      }}
                    >
                      <Iconify icon="lucide:edit" />
                    </IconButton>
                  </>
                )}
              </Box>
            </Box>
          </>
        )}
        {detail?.mother_occupation === "employed" && (
          <>
            {/* Employer Name */}
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
              onMouseEnter={() =>
                handleHoverState("mother_employer_name", true)
              }
              onMouseLeave={() =>
                handleHoverState("mother_employer_name", false)
              }
            >
              <Typography sx={{ width: "130px", fontWeight: 600 }}>
                Employer Name :{" "}
              </Typography>
              <Box
                sx={{ display: "flex", alignItems: "center", flex: 1, gap: 1 }}
              >
                {editingState.mother_employer_name ? (
                  <>
                    <TextField
                      name="mother_employer_name"
                      value={formData?.mother_employer_name || ""}
                      onChange={handleChange}
                      size="small"
                      disabled={loadingState.mother_employer_name}
                      sx={{ maxWidth: "220px" }}
                    />
                    {loadingState.mother_employer_name ? (
                      <CircularProgress size={18} />
                    ) : (
                      <>
                        <IconButton
                          sx={{ color: "error.main" }}
                          onClick={() =>
                            handleEditingState("mother_employer_name", false)
                          }
                        >
                          <Iconify icon="carbon:close-filled" />
                        </IconButton>
                        <IconButton
                          sx={{ color: "success.main" }}
                          onClick={() =>
                            handleUpdateStudentData("mother_employer_name")
                          }
                        >
                          <Iconify icon="charm:circle-tick" />
                        </IconButton>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <Typography>
                      {detail?.mother_employer_name || "-"}
                    </Typography>
                    <IconButton
                      onClick={() => handleEditingState("mother_employer_name")}
                      sx={{
                        color: "primary.main",
                        transition: "opacity 0.3s, visibility 0.3s",
                        opacity: hoverKey === "mother_employer_name" ? 1 : 0,
                        visibility:
                          hoverKey === "mother_employer_name"
                            ? "visible"
                            : "hidden",
                      }}
                    >
                      <Iconify icon="lucide:edit" />
                    </IconButton>
                  </>
                )}
              </Box>
            </Box>
            {/* Designation */}
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
              onMouseEnter={() => handleHoverState("mother_designation", true)}
              onMouseLeave={() => handleHoverState("mother_designation", false)}
            >
              <Typography sx={{ width: "130px", fontWeight: 600 }}>
                Designation :{" "}
              </Typography>
              <Box
                sx={{ display: "flex", alignItems: "center", flex: 1, gap: 1 }}
              >
                {editingState.mother_designation ? (
                  <>
                    <TextField
                      name="mother_designation"
                      value={formData?.mother_designation || ""}
                      onChange={handleChange}
                      size="small"
                      disabled={loadingState.mother_designation}
                      sx={{ maxWidth: "220px" }}
                    />
                    {loadingState.mother_designation ? (
                      <CircularProgress size={18} />
                    ) : (
                      <>
                        <IconButton
                          sx={{ color: "error.main" }}
                          onClick={() =>
                            handleEditingState("mother_designation", false)
                          }
                        >
                          <Iconify icon="carbon:close-filled" />
                        </IconButton>
                        <IconButton
                          sx={{ color: "success.main" }}
                          onClick={() =>
                            handleUpdateStudentData("mother_designation")
                          }
                        >
                          <Iconify icon="charm:circle-tick" />
                        </IconButton>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <Typography>{detail?.mother_designation || "-"}</Typography>
                    <IconButton
                      onClick={() => handleEditingState("mother_designation")}
                      sx={{
                        color: "primary.main",
                        transition: "opacity 0.3s, visibility 0.3s",
                        opacity: hoverKey === "mother_designation" ? 1 : 0,
                        visibility:
                          hoverKey === "mother_designation"
                            ? "visible"
                            : "hidden",
                      }}
                    >
                      <Iconify icon="lucide:edit" />
                    </IconButton>
                  </>
                )}
              </Box>
            </Box>
            {/* Monthly Income */}
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
              onMouseEnter={() =>
                handleHoverState("mother_monthly_income", true)
              }
              onMouseLeave={() =>
                handleHoverState("mother_monthly_income", false)
              }
            >
              <Typography sx={{ width: "130px", fontWeight: 600 }}>
                Monthly Income :{" "}
              </Typography>
              <Box
                sx={{ display: "flex", alignItems: "center", flex: 1, gap: 1 }}
              >
                {editingState.mother_monthly_income ? (
                  <>
                    <TextField
                      name="mother_monthly_income"
                      value={formData?.mother_monthly_income || ""}
                      onChange={handleChange}
                      size="small"
                      disabled={loadingState.mother_monthly_income}
                      sx={{ maxWidth: "220px" }}
                    />
                    {loadingState.mother_monthly_income ? (
                      <CircularProgress size={18} />
                    ) : (
                      <>
                        <IconButton
                          sx={{ color: "error.main" }}
                          onClick={() =>
                            handleEditingState("mother_monthly_income", false)
                          }
                        >
                          <Iconify icon="carbon:close-filled" />
                        </IconButton>
                        <IconButton
                          sx={{ color: "success.main" }}
                          onClick={() =>
                            handleUpdateStudentData("mother_monthly_income")
                          }
                        >
                          <Iconify icon="charm:circle-tick" />
                        </IconButton>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <Typography>
                      {detail?.mother_monthly_income || "-"}
                    </Typography>
                    <IconButton
                      onClick={() =>
                        handleEditingState("mother_monthly_income")
                      }
                      sx={{
                        color: "primary.main",
                        transition: "opacity 0.3s, visibility 0.3s",
                        opacity: hoverKey === "mother_monthly_income" ? 1 : 0,
                        visibility:
                          hoverKey === "mother_monthly_income"
                            ? "visible"
                            : "hidden",
                      }}
                    >
                      <Iconify icon="lucide:edit" />
                    </IconButton>
                  </>
                )}
              </Box>
            </Box>
          </>
        )}
        {/* Mother's Aadhaar */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1,
          }}
          onMouseEnter={() => handleHoverState("mother_aadhar", true)}
          onMouseLeave={() => handleHoverState("mother_aadhar", false)}
        >
          <Typography sx={{ width: "130px", fontWeight: 600 }}>
            {`Mother's Aadhaar : `}
          </Typography>
          {editingState.mother_aadhar ? (
            <>
              <TextField
                name="mother_aadhar"
                value={formData?.mother_aadhar || ""}
                onChange={handleChange}
                size="small"
                disabled={loadingState.mother_aadhar}
                sx={{ maxWidth: "220px" }}
              />
              {loadingState.mother_aadhar ? (
                <CircularProgress size={18} />
              ) : (
                <>
                  <IconButton
                    sx={{ color: "error.main" }}
                    onClick={() => handleEditingState("mother_aadhar", false)}
                  >
                    <Iconify icon="carbon:close-filled" />
                  </IconButton>
                  <IconButton
                    sx={{ color: "success.main" }}
                    onClick={() => handleUpdateStudentData("mother_aadhar")}
                  >
                    <Iconify icon="charm:circle-tick" />
                  </IconButton>
                </>
              )}
            </>
          ) : (
            <>
              <Typography>{detail?.mother_aadhar || "-"}</Typography>
              {detail?.mother_aadhar_url ? (
                <IconButton
                  size="small"
                  onClick={() => {
                    if (
                      String(detail.mother_aadhar_url)
                        .toLowerCase()
                        .includes(".pdf")
                    ) {
                      window.open(
                        detail.mother_aadhar_url,
                        "_blank",
                        "noopener,noreferrer"
                      );
                    } else {
                      handleImageClick(
                        detail.mother_aadhar_url,
                        "Mother Aadhaar"
                      );
                    }
                  }}
                  sx={{ color: "primary.main" }}
                  title="View Aadhaar"
                >
                  <Iconify icon="lucide:file-text" />
                </IconButton>
              ) : null}
              <IconButton
                onClick={() => handleEditingState("mother_aadhar")}
                sx={{
                  color: "primary.main",
                  transition: "opacity 0.3s, visibility 0.3s",
                  opacity: hoverKey === "mother_aadhar" ? 1 : 0,
                  visibility:
                    hoverKey === "mother_aadhar" ? "visible" : "hidden",
                }}
              >
                <Iconify icon="lucide:edit" />
              </IconButton>
            </>
          )}
        </Box>
        {/* Mother's Age */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1,
          }}
          onMouseEnter={() => handleHoverState("mother_age", true)}
          onMouseLeave={() => handleHoverState("mother_age", false)}
        >
          <Typography sx={{ width: "130px", fontWeight: 600 }}>
            {`Mother's Age : `}
          </Typography>
          {editingState.mother_age ? (
            <>
              <TextField
                name="mother_age"
                value={formData?.mother_age || ""}
                onChange={handleChange}
                size="small"
                disabled={loadingState.mother_age}
                sx={{ maxWidth: "220px" }}
              />
              {loadingState.mother_age ? (
                <CircularProgress size={18} />
              ) : (
                <>
                  <IconButton
                    sx={{ color: "error.main" }}
                    onClick={() => handleEditingState("mother_age", false)}
                  >
                    <Iconify icon="carbon:close-filled" />
                  </IconButton>
                  <IconButton
                    sx={{ color: "success.main" }}
                    onClick={() => handleUpdateStudentData("mother_age")}
                  >
                    <Iconify icon="charm:circle-tick" />
                  </IconButton>
                </>
              )}
            </>
          ) : (
            <>
              <Typography>{detail?.mother_age || "-"}</Typography>
              <IconButton
                onClick={() => handleEditingState("mother_age")}
                sx={{
                  color: "primary.main",
                  transition: "opacity 0.3s, visibility 0.3s",
                  opacity: hoverKey === "mother_age" ? 1 : 0,
                  visibility: hoverKey === "mother_age" ? "visible" : "hidden",
                }}
              >
                <Iconify icon="lucide:edit" />
              </IconButton>
            </>
          )}
        </Box>
      </CardContent>

      {/* Guardian — only when orphan admission has g_name (does not change father/mother UI) */}
      {detail?.g_name ? (
        <CardContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            color: "primary.main",
            borderTop: "1px solid #b1b1b1",
          }}
        >
          <Typography sx={{ fontWeight: 700 }}>Guardian Details</Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              alt={detail?.g_name || "Guardian"}
              src={detail?.guardian_photo_url}
              sx={{
                cursor: detail?.guardian_photo_url ? "pointer" : "default",
                "& img": {
                  objectFit: "cover",
                  objectPosition: "top center",
                },
              }}
              onClick={() => {
                if (detail?.guardian_photo_url) {
                  handleImageClick(
                    detail.guardian_photo_url,
                    "Guardian Photo"
                  );
                }
              }}
            />
            <Box>
              <Typography sx={{ fontWeight: 600 }}>
                {detail?.g_name || "-"}
              </Typography>
              <Typography variant="body2">
                Relation: {detail?.g_relation || "-"}
              </Typography>
            </Box>
          </Box>
          <Typography>Mobile: {detail?.g_contact || "-"}</Typography>
          <Typography>Email: {detail?.g_email || "-"}</Typography>
          <Typography>Occupation: {detail?.g_occupation || "-"}</Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography>Aadhaar: {detail?.g_aadhar || "-"}</Typography>
            {detail?.guardian_aadhar_url ? (
              <IconButton
                size="small"
                onClick={() => {
                  if (
                    String(detail.guardian_aadhar_url)
                      .toLowerCase()
                      .includes(".pdf")
                  ) {
                    window.open(
                      detail.guardian_aadhar_url,
                      "_blank",
                      "noopener,noreferrer"
                    );
                  } else {
                    handleImageClick(
                      detail.guardian_aadhar_url,
                      "Guardian Aadhaar"
                    );
                  }
                }}
                sx={{ color: "primary.main" }}
                title="View Aadhaar"
              >
                <Iconify icon="lucide:file-text" />
              </IconButton>
            ) : null}
          </Box>
        </CardContent>
      ) : null}
    </Card>
  );
};

RightSideCard.propTypes = {
  detail: PropTypes.object.isRequired,
  handleImageClick: PropTypes.func.isRequired,
  refetch: PropTypes.func.isRequired,
};

export default memo(RightSideCard);
