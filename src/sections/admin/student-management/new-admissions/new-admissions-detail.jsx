import {
  Avatar,
  Box,
  Card,
  CardContent,
  Divider,
  Button,
  Grid,
  IconButton,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useAuth from "../../../../hooks/useAuth";
import {
  CAPITALIZE,
  splitNameToFirstAndLast,
} from "../../../../utils/constants";
import dayjs from "dayjs";
import useLayout from "../../../../hooks/uesLayout";
import {
  editStudentDetail,
  getNewAdmissionById,
  getNewAdmissions,
} from "../../../../services/admin/students-management.service";
import { useGetApi } from "../../../../hooks/useGetApi";
import Loader from "../../../../components/loader/loader";
import MessageBox from "../../../../components/error/message-box";
import { Launch } from "@mui/icons-material";
import { Helmet } from "react-helmet-async";
import ImagePreviewModal from "../../../../components/image-preview-modal/image-preview-modal";
import LeftSideCard from "./components/left-side-card";
import RightSideCard from "./components/right-side-card";
import OtherInformation from "./components/other-information";
import SiblingsDetail from "./components/siblings-detail";
import ActionSection from "./components/action-section";
import AdmissionStatusBar from "./components/admission-status-bar";
import {
  BASE_URL,
  BASE_URL_WITHOUT_API,
} from "../../../../services/api.request";
import Iconify from "../../../../components/iconify/iconify";
import { toast } from "react-toastify";

const PRINT_BUTTONS = [
  { label: "Check List", slug: "check_list", isDifferent: true },
  { label: "Admission Form", slug: "admissionform" },
  { label: "Parents Details", slug: "parentsdetails" },
  { label: "Parents Orientation", slug: "parentsorientation" },
  { label: "School Rules", slug: "schoolrules" },
  { label: "ID Card", slug: "id_card" },
  {
    label: "Download Form",
    slug: "download_form",
    isDownload: true,
    href: "#",
  },
  { label: "Undertaking Form", slug: "undertaking" },
];

const NewAdmissionsDetail = () => {
  const { userInfo, logout } = useAuth();
  const { layout } = useLayout();
  const navigate = useNavigate();
  const location = useLocation();
  const dataSendToBackend = location?.state?.dataSendToBackend || {};

  const [selectedId, setSelectedId] = useState(location?.state?.row?.id);
  const [search, setSearch] = useState(dataSendToBackend?.search || "");
  const [previewImage, setPreviewImage] = useState(
    location?.state?.row?.photo_url || "",
  );

  // Modal state for image preview
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState({
    url: "",
    alt: "",
  });

  // api to get new admissions list
  const {
    dataList: newAdmissionsList,
    isLoading,
    isError,
    errorMessage,
    refetch: leftSideLayoutRefetch,
  } = useGetApi({
    apiFunction: getNewAdmissions,
    body: {
      ...dataSendToBackend,
      search,
      limit: 300,
    },
    dependencies: [search],
    debounceDelay: 500,
  });

  // api to get new admission detail by id
  const {
    dataList: detail,
    isLoading: isLoadingDetail,
    isError: isErrorDetail,
    refetch,
    errorMessage: errorMessage2,
  } = useGetApi({
    apiFunction: getNewAdmissionById,
    body: {
      id: selectedId,
    },
    dependencies: [selectedId],
  });

  const [name, setName] = useState("");
  const [loadingState, setLoadingState] = useState(false);
  const [editingState, setEditingState] = useState(false);
  const [hoverState, setHoverState] = useState(false);

  const handleSearchInputChange = (event) => {
    const searchValue = event.target.value;
    setSearch(searchValue);
  };

  const handleClick = (row) => {
    setSelectedId(row?.id);
    setPreviewImage(row?.photo_url || "");
  };

  // Modal handlers
  const handleImageClick = (imageUrl, altText) => {
    setSelectedImage({ url: imageUrl, alt: altText });
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedImage({ url: "", alt: "" });
  };

  const handleUpdateStudentData = async () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setLoadingState(true);
    const { firstName, lastName } = splitNameToFirstAndLast(name);
    const response = await editStudentDetail(detail?.id, {
      first_name: firstName,
      last_name: lastName,
    });
    setLoadingState(false);
    setEditingState(false);
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

  const getInitialName = useCallback(
    () =>
      `${detail?.first_name?.trim() || ""} ${detail?.last_name?.trim() || ""}`,
    [detail?.first_name, detail?.last_name],
  );

  useEffect(() => {
    if (!location?.state?.row?.id) {
      navigate(-1);
    }
  }, [location?.state?.row?.id, navigate]);

  useEffect(() => {
    setName(getInitialName());
  }, [detail?.first_name, detail?.last_name, getInitialName]);

  // New code
  // Build URLs with the correct endpoint per button
  const applicationId = detail?.hashed_id ?? detail?.id ?? selectedId ?? "";
  const isAdmitted =
    detail?.status === "Submitted" || detail?.status === "Documents";

  const buildPrintUrl = (id, slug) =>
    `${BASE_URL}/admission_classes/${id}/${slug}`;

  const buildCheckListPrintUrl = () =>
    `${BASE_URL_WITHOUT_API}/storage/admission_checklist.pdf`;

  // End new code
  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        width: "100%",
      }}
    >
      <Helmet>
        <title>New Admissions Detail | GREENWOOD</title>
      </Helmet>

      {/* Layout Left Side */}
      <Card
        elevation={10}
        sx={{
          width: "400px",
          maxHeight: `calc(100vh - ${layout?.headerHeight} - 30px)`,
          overflowY: "auto",
          position: "sticky",
          top: 0,
          zIndex: 1,
        }}
      >
        <CardContent>
          <TextField
            label="Search by name..."
            fullWidth
            size="small"
            value={search || ""}
            onChange={handleSearchInputChange}
            sx={{ mb: 2 }}
          />
          {isLoading ? (
            <Loader />
          ) : isError ? (
            <MessageBox errorMessage={errorMessage} />
          ) : (
            newAdmissionsList?.map((row, index) => {
              const isPaid = row?.ad_paid === "1";
              return (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    p: 1,
                    mb: 0.3,
                    borderRadius: "5px",
                    bgcolor:
                      row?.id === detail?.id ? "primary.light" : "transparent",
                    cursor: "pointer",
                    "&:hover": {
                      bgcolor: "primary.lightHover",
                    },
                    "&:active": {
                      bgcolor: "primary.lightActive",
                    },
                  }}
                  onClick={() => handleClick(row)}
                >
                  <Avatar
                    src={row?.photo_url}
                    alt="Child Pic"
                    sx={{
                      height: "70px",
                      width: "70px",
                      cursor: "pointer",
                      "& img": {
                        // Target the image element within the Avatar
                        objectFit: "cover", // Ensures the image covers the avatar area
                        objectPosition: "top center", // Adjust vertical and horizontal position within the avatar
                      },
                    }}
                    onClick={() => {
                      handleImageClick(row?.photo_url, "Child Photo");
                    }}
                  />
                  <Divider
                    orientation="vertical"
                    flexItem
                    sx={{
                      bgcolor: "primary.main",
                      width: "2px",
                    }}
                  />
                  <Box sx={{ whiteSpace: "nowrap" }}>
                    <Typography variant="subtitle2">
                      {row?.name || ""}
                    </Typography>
                    <Typography>
                      Gender: {CAPITALIZE(row?.gender) || ""}
                    </Typography>
                    <Typography>
                      DOB:{" "}
                      {row?.dob ? dayjs(row?.dob).format("DD-MM-YYYY") : null}
                    </Typography>

                    <Typography>
                      Payment Status: {isPaid ? "Paid" : "Unpaid"}
                    </Typography>
                  </Box>
                </Box>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Layout Right Side */}
      <Card
        elevation={10}
        sx={{
          flex: 1,
          minHeight: `calc(100vh - ${layout?.headerHeight} - 30px)`,
          py: 2,
          display: isLoadingDetail || isErrorDetail ? "flex" : "block",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isLoadingDetail ? (
          <Loader />
        ) : isErrorDetail ? (
          <MessageBox errorMessage={errorMessage2} />
        ) : (
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, px: 2 }}>
              {/* Image */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Box
                  sx={{
                    width: "150px",
                    height: "150px",
                    borderRadius: "50%",
                    position: "relative",
                    "&:hover": {
                      ".overlay-image": {
                        visibility: "visible",
                        opacity: 1,
                        cursor: "pointer",
                      },
                    },
                  }}
                >
                  <Avatar
                    alt="Preview"
                    src={previewImage}
                    sx={{
                      width: "100%",
                      height: "100%",
                      cursor: "pointer",
                      "& img": {
                        // Target the image element within the Avatar
                        objectFit: "cover", // Ensures the image covers the avatar area
                        objectPosition: "top center", // Adjust vertical and horizontal position within the avatar
                      },
                    }}
                    onClick={() => {
                      if (previewImage) {
                        handleImageClick(previewImage, "Student Photo");
                      }
                    }}
                  />
                  {/* <Box
                className="overlay-image"
                component="label"
                sx={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  background: "rgba(0,0,0,0.4)",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  display: "grid",
                  placeItems: "center",
                  visibility: "hidden",
                  opacity: 0,
                  transition: "all 0.4s ease",
                }}
              >
                <Iconify
                  icon="eva:edit-fill"
                  width={30}
                  sx={{ color: "white" }}
                />
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleImageUpload}
                />
              </Box> */}
                </Box>
              </Box>

              {/* Student Data */}
              <Box sx={{ flex: 1 }}>
                {/* Student Name */}

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    flex: 1,
                    gap: 1,
                    mb: 1,
                  }}
                  onMouseEnter={() => setHoverState(true)}
                  onMouseLeave={() => setHoverState(false)}
                >
                  {editingState ? (
                    <>
                      <TextField
                        name="name"
                        value={name || ""}
                        onChange={(e) => setName(e.target.value)}
                        size="small"
                        disabled={loadingState}
                        sx={{ maxWidth: "220px" }}
                      />
                      {loadingState ? (
                        <CircularProgress size={18} />
                      ) : (
                        <>
                          <IconButton
                            sx={{ color: "error.main" }}
                            onClick={() => {
                              setEditingState(false);
                              setName(getInitialName());
                            }}
                          >
                            <Iconify icon="carbon:close-filled" />
                          </IconButton>
                          <IconButton
                            sx={{ color: "success.main" }}
                            onClick={handleUpdateStudentData}
                          >
                            <Iconify icon="charm:circle-tick" />
                          </IconButton>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <Typography>{`${detail?.first_name?.trim() || ""} ${
                        detail?.last_name?.trim() || ""
                      }`}</Typography>
                      <IconButton
                        onClick={() => setEditingState(true)}
                        sx={{
                          color: "primary.main",
                          transition: "opacity 0.3s, visibility 0.3s",
                          opacity: hoverState ? 1 : 0,
                          visibility: hoverState ? "visible" : "hidden",
                        }}
                      >
                        <Iconify icon="lucide:edit" />
                      </IconButton>
                    </>
                  )}
                </Box>

                <Card
                  sx={{
                    flex: 1,
                    background: "transparent",
                    border: "1px solid #b1b1b1",
                    overflow: "hidden",
                  }}
                >
                  <CardContent
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "1fr 1fr",
                        md: "1fr 1fr 1fr",
                      },
                      gap: { xs: 2, md: 3 },
                      color: "primary.main",
                      alignItems: "start",
                    }}
                  >
                    {/* Column 1 — basic */}
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <Typography sx={{ minWidth: "120px", fontWeight: 600 }}>
                          Gender :
                        </Typography>
                        <Typography>
                          {detail?.gender === "m"
                            ? "Male"
                            : detail?.gender === "f"
                              ? "Female"
                              : "N/A"}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <Typography sx={{ minWidth: "120px", fontWeight: 600 }}>
                          D.O.B :
                        </Typography>
                        <Typography>
                          {detail?.dob
                            ? dayjs(detail?.dob).format("DD-MM-YYYY")
                            : "N/A"}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <Typography sx={{ minWidth: "120px", fontWeight: 600 }}>
                          Payment Status :
                        </Typography>
                        <Typography>
                          {detail?.ad_paid === "1" ? "Paid" : "Unpaid"}
                        </Typography>
                        {detail?.receipt_api_url && detail?.ad_paid === "1" && (
                          <IconButton
                            size="small"
                            onClick={() => {
                              window.open(
                                detail?.receipt_api_url,
                                "_blank",
                                "noopener,noreferrer",
                              );
                            }}
                            sx={{ color: "primary.main" }}
                            title="View PDF"
                          >
                            <Launch />
                          </IconButton>
                        )}
                      </Box>
                    </Box>

                    {/* Column 2 — application */}
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <Typography sx={{ minWidth: "120px", fontWeight: 600 }}>
                          Application No :
                        </Typography>
                        <Typography>
                          {detail?.application_no || "N/A"}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <Typography sx={{ minWidth: "120px", fontWeight: 600 }}>
                          Submitted On :
                        </Typography>
                        <Typography>
                          {detail?.created_at
                            ? dayjs(detail?.created_at).format("DD-MM-YYYY")
                            : "N/A"}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          alignItems: "flex-start",
                          gap: 1,
                        }}
                      >
                        <Typography sx={{ minWidth: "120px", fontWeight: 600 }}>
                          Interview :
                        </Typography>
                        <Box>
                          <Typography>
                            {detail?.interview_status === "1"
                              ? "Cleared"
                              : detail?.interview_status === "2"
                                ? "Rejected"
                                : detail?.interview_status === "3"
                                  ? "Not Interested"
                                  : "Not Cleared"}
                          </Typography>
                          {detail?.interview_date ? (
                            <Typography>
                              {dayjs(detail.interview_date).format(
                                "DD-MM-YYYY hh:mm A",
                              )}
                            </Typography>
                          ) : null}
                        </Box>
                      </Box>
                    </Box>

                    {/* Column 3 — written test */}
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <Typography sx={{ minWidth: "140px", fontWeight: 600 }}>
                          Written Test Date :
                        </Typography>
                        <Typography>
                          {detail?.written_test_date
                            ? dayjs(detail.written_test_date).format(
                                "DD-MM-YYYY hh:mm A",
                              )
                            : "N/A"}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <Typography sx={{ minWidth: "140px", fontWeight: 600 }}>
                          Written Test Status :
                        </Typography>
                        <Typography>
                          {detail?.written_test_status === "1"
                            ? "Pass"
                            : detail?.written_test_status === "2"
                              ? "Fail"
                              : detail?.written_test_status === "0"
                                ? "Pending"
                                : "N/A"}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Box>

            {/* Process status bar */}
            <AdmissionStatusBar
              status={detail?.status}
              studentClass={detail?.accepted_class || detail?.class}
            />

            {/* Action Section */}
            <ActionSection
              detail={detail}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              refetch={refetch}
            />

            {/* New Code */}
            {/* Actions Field */}
            {isAdmitted && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  px: 2,
                  my: 2,
                  flexWrap: "wrap",
                }}
              >
                {PRINT_BUTTONS.map((btn, index) => (
                  <Button
                    key={btn.slug}
                    variant="contained"
                    href={
                      btn.isDownload
                        ? btn.href
                        : btn.isDifferent
                          ? buildCheckListPrintUrl()
                          : applicationId
                            ? buildPrintUrl(applicationId, btn.slug)
                            : undefined
                    }
                    target="_blank"
                    rel="noopener"
                    disabled={!btn.isDownload && !applicationId}
                    sx={{
                      display:
                        index === PRINT_BUTTONS.length - 1 &&
                        detail?.undertaking === false
                          ? "none"
                          : "inline-block",
                    }}
                  >
                    {btn.label}
                  </Button>
                ))}
              </Box>
            )}
            {/* End New Code */}

            {/* Student Details */}
            <Typography
              variant="h3"
              sx={{ textAlign: "center", color: "primary.main" }}
            >
              {`Admission Form for ${detail?.class} ${
                userInfo?.next_ay_name || userInfo?.ay_name
              }`}
            </Typography>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                px: { xs: 1, xl: 3 },
                my: 2,
              }}
            >
              <Grid container spacing={3} justifyContent="center">
                {/* left side card */}
                <Grid item xs={12} lg={8} xl={5}>
                  <LeftSideCard
                    detail={detail}
                    handleImageClick={handleImageClick}
                    refetch={refetch}
                    leftSideLayoutRefetch={leftSideLayoutRefetch}
                  />
                </Grid>

                {/* right side card */}
                <Grid item xs={12} lg={8} xl={5}>
                  <RightSideCard
                    detail={detail}
                    handleImageClick={handleImageClick}
                    refetch={refetch}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* siblings details */}
            <SiblingsDetail detail={detail} />

            {/* Other Information */}
            <OtherInformation detail={detail} />
          </Box>
        )}
      </Card>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        open={modalOpen}
        onClose={handleModalClose}
        imageUrl={selectedImage.url}
        imageAlt={selectedImage.alt}
      />
    </Box>
  );
};

export default NewAdmissionsDetail;
