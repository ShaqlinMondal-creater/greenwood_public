import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { toast } from "react-toastify";
import useAuth from "../hooks/useAuth";
import {
  getFinalFormDataApi,
  setFinalFormDataApi,
  setFinalFormSubmitDataApi,
} from "../services/admin/students-management.service";
import Loader from "../components/loader/loader";
import { NavLink } from "react-router-dom";
import { BASE_URL, BASE_URL_WITHOUT_API } from "../services/api.request";

// -------------------------------------------------------------------

const BRAND_LOGO = "/green_wood_.png";

const FinalForm = () => {
  const { logout } = useAuth();

  const initialState = {
    Name: "",
    application_no: "",
    birth_place: "",
    religion: "",
    mother_tongue: "",
    home_town: "",
    nationality: "",
    blood_group: "",
    aadhaar_no: "",
    father_aadhar: "",
    father_age: "",
    mother_aadhar: "",
    mother_age: "",
  };

  const [hashCode, setHashCode] = useState("");
  const [formData, setFormData] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [initialStatusLoading, setInitialStatusLoading] = useState(false);
  const [finalFormSubmitLoading, setFinalFormSubmitLoading] = useState(false);
  const [isCheckboxChecked, setIsCheckboxChecked] = useState(false);

  const createUrl = (text) => {
    return `${BASE_URL}/admission_classes/${hashCode}/${text}`;
  };

  const buildCheckListPrintUrl = () =>
    `${BASE_URL_WITHOUT_API}/storage/admission_checklist.pdf`;

  const UNDERTAKING_BUTTONS = [
    {
      label: "Check List",
      link: buildCheckListPrintUrl(),
    },
    {
      label: "Final Admission Form",
      link: createUrl("admissionform"),
    },
    {
      label: "Parent’s Details",
      link: createUrl("parentsdetails "),
    },
    {
      label: "Parent’s Orientation ",
      link: createUrl("parentsorientation"),
    },
    {
      label: "⁠School Rules",
      link: createUrl("schoolrules"),
    },
    {
      label: "⁠ID Card",
      link: createUrl("id_card"),
    },
    {
      label: "Undertaking Form",
      link: createUrl("undertaking"),
    },
  ];

  const handleCheckboxChange = (event) => {
    setIsCheckboxChecked(event.target.checked);
  };

  const handleFinalDataStatus = async (urlId = "") => {
    setHashCode(urlId);

    setInitialStatusLoading(true);
    const response = await getFinalFormDataApi(urlId);
    setInitialStatusLoading(false);

    if (response?.code === 200) {
      setFormData(response?.data || initialState);
      toast.success(response?.message || "Check Successful");
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Some error occurred.");
    }
  };
  console.log(formData, "formData");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData?.id) {
      toast.error(
        "Invalid submission. Please check the URL or contact support."
      );
      return;
    }

    const payload = {
      ...formData,
      father_age: Number(formData?.father_age),
      mother_age: Number(formData?.mother_age),
    };

    setIsLoading(true);
    const response = await setFinalFormDataApi(payload);
    setIsLoading(false);

    if (response?.code === 200) {
      toast.success(response?.message || "Form submitted successfully!");
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Some error occurred.");
    }
  };

  const handleFinalFormSubmit = async () => {
    setFinalFormSubmitLoading(true);
    const response = await setFinalFormSubmitDataApi(formData?.id, {
      document_status: "1",
    });
    setFinalFormSubmitLoading(false);

    if (response?.code === 200) {
      toast.success(response?.message || "Final Form submitted successfully!");
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Some error occurred.");
    }
  };

  // Auto-call API when component mounts with applicationNo URL param
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlData = Object.fromEntries(urlParams.entries());

    if (urlData?.id) {
      handleFinalDataStatus(urlData.id || "");
    }
  }, []);

  return (
    <Box
      sx={{
        height: "auto",
        width: "100%",
      }}
    >
      <Helmet>
        <title>Final Form | GREENWOOD</title>
      </Helmet>

      {/* Logo & Card */}
      <Box
        sx={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          p: 3,
        }}
      >
        {/* Logo */}

        <Box
          component="img"
          src={BRAND_LOGO}
          sx={{
            height: "150px",
            width: "150px",
            objectFit: "contain",
          }}
        ></Box>

        {/* Card */}
        {initialStatusLoading ? (
          <Loader />
        ) : (
          <Box
            sx={{
              width: "95vw",
              maxWidth: "700px",
              height: "auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
            }}
          >
            <Card elevation={10} sx={{ width: "100%" }}>
              <CardContent>
                <Box
                  component="form"
                  sx={{ display: "flex", flexDirection: "column" }}
                  onSubmit={handleSubmit}
                >
                  <Typography
                    variant="h4"
                    sx={{
                      textAlign: "center",
                      color: "primary.main",
                      mb: 2,
                    }}
                  >
                    Final Form
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1.5,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "text.primary",
                          minWidth: "160px",
                          mr: 1,
                        }}
                      >
                        Name:
                      </Typography>
                      <TextField
                        name="Name"
                        value={formData?.Name || ""}
                        disabled
                        fullWidth
                        size="small"
                      />
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "text.primary",
                          minWidth: "160px",
                          mr: 1,
                        }}
                      >
                        Application No:
                      </Typography>
                      <TextField
                        name="application_no"
                        value={formData?.application_no || ""}
                        disabled
                        fullWidth
                        size="small"
                      />
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "text.primary",
                          minWidth: "160px",
                          mr: 1,
                        }}
                      >
                        Birth Place:
                      </Typography>
                      <TextField
                        name="birth_place"
                        value={formData?.birth_place || ""}
                        onChange={handleChange}
                        fullWidth
                        size="small"
                      />
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "text.primary",
                          minWidth: "160px",
                          mr: 1,
                        }}
                      >
                        Religion:
                      </Typography>
                      <TextField
                        name="religion"
                        value={formData?.religion || ""}
                        onChange={handleChange}
                        fullWidth
                        size="small"
                      />
                    </Box>

                    {/* Mother Tongue  */}
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "text.primary",
                          minWidth: "160px",
                          mr: 1,
                        }}
                      >
                        Mother Tongue:
                      </Typography>
                      <TextField
                        name="mother_tongue"
                        value={formData?.mother_tongue || ""}
                        onChange={handleChange}
                        fullWidth
                        size="small"
                      />
                    </Box>

                    {/* Home Town */}
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "text.primary",
                          minWidth: "160px",
                          mr: 1,
                        }}
                      >
                        Home Town:
                      </Typography>
                      <TextField
                        name="home_town"
                        value={formData?.home_town || ""}
                        onChange={handleChange}
                        fullWidth
                        size="small"
                      />
                    </Box>

                    {/* Nationality */}
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "text.primary",
                          minWidth: "160px",
                          mr: 1,
                        }}
                      >
                        Nationality:
                      </Typography>
                      <TextField
                        name="nationality"
                        value={formData?.nationality || ""}
                        onChange={handleChange}
                        fullWidth
                        size="small"
                      />
                    </Box>

                    {/* Blood Group */}
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "text.primary",
                          minWidth: "160px",
                          mr: 1,
                        }}
                      >
                        Blood Group:
                      </Typography>
                      <TextField
                        name="blood_group"
                        value={formData?.blood_group || ""}
                        onChange={handleChange}
                        fullWidth
                        size="small"
                      />
                    </Box>

                    {/* Aadhaar No */}
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "text.primary",
                          minWidth: "160px",
                          mr: 1,
                        }}
                      >
                        Aadhaar No:
                      </Typography>
                      <TextField
                        name="aadhaar_no"
                        value={formData?.aadhaar_no || ""}
                        onChange={handleChange}
                        fullWidth
                        size="small"
                      />
                    </Box>

                    {/* Father Aadhaar*/}
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "text.primary",
                          minWidth: "160px",
                          mr: 1,
                        }}
                      >
                        Father Aadhaar:
                      </Typography>
                      <TextField
                        name="father_aadhar"
                        value={formData?.father_aadhar || ""}
                        onChange={handleChange}
                        fullWidth
                        size="small"
                      />
                    </Box>

                    {/* Father Age*/}
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "text.primary",
                          minWidth: "160px",
                          mr: 1,
                        }}
                      >
                        Father Age:
                      </Typography>
                      <TextField
                        name="father_age"
                        value={formData?.father_age || ""}
                        onChange={handleChange}
                        fullWidth
                        size="small"
                      />
                    </Box>

                    {/* Mother Aadhaar*/}
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "text.primary",
                          minWidth: "160px",
                          mr: 1,
                        }}
                      >
                        Mother Aadhaar:
                      </Typography>
                      <TextField
                        name="mother_aadhar"
                        value={formData?.mother_aadhar || ""}
                        onChange={handleChange}
                        fullWidth
                        size="small"
                      />
                    </Box>

                    {/* Mother Age*/}
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "text.primary",
                          minWidth: "160px",
                          mr: 1,
                        }}
                      >
                        Mother Age:
                      </Typography>
                      <TextField
                        name="mother_age"
                        value={formData?.mother_age || ""}
                        onChange={handleChange}
                        fullWidth
                        size="small"
                      />
                    </Box>

                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      disabled={isLoading}
                      sx={{ mt: 2 }}
                    >
                      {isLoading ? <CircularProgress size={24} /> : `Submit`}
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card elevation={10} sx={{ width: "100%" }}>
              <CardContent>
                <Box
                  sx={{
                    mb: 2,
                    borderRadius: 1,
                    border: "2px dashed",
                    borderColor: "error.main",
                    p: 2,
                    color: "error.main",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Dear Parents,
                  </Typography>
                  <Typography variant="caption">
                    You are requested to buy <strong>Rs. 10/-</strong> Stamp
                    paper along with Dummy (Green) paper and get it notorised by
                    a Magistrate, the attached form is to be signed by both
                    Parents and submit the same along with the admission form
                    and other enclosures.
                  </Typography>
                  <Box
                    component={NavLink}
                    to="#"
                    target="_blank"
                    sx={{ mt: 1, ml: "auto", width: "150px" }}
                  >
                    <Button
                      variant="contained"
                      size="small"
                      sx={{ width: "100%" }}
                    >
                      Download Form
                    </Button>
                  </Box>
                </Box>
                {UNDERTAKING_BUTTONS?.map((item, index) => (
                  <Box
                    key={index}
                    component={NavLink}
                    to={item.link}
                    target="_blank"
                    sx={{
                      display:
                        index === UNDERTAKING_BUTTONS.length - 1 &&
                        formData?.undertaking === false
                          ? "none"
                          : "inline-block",
                    }}
                  >
                    <Button key={index} variant="outlined" sx={{ m: 1 }}>
                      {item.label}
                    </Button>
                  </Box>
                ))}

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isCheckboxChecked}
                      onChange={handleCheckboxChange}
                    />
                  }
                  disabled={finalFormSubmitLoading}
                  label="All forms have been printed and are ready to be submitted at school along with the undertaking done on a Rs. 10/- Stamp paper."
                  sx={{ mt: 2 }}
                />

                <Typography sx={{ my: 2 }} variant="body2">
                  {`Submit child's birthday certificate copy, aadhaar copy and
                  parents aadhaar copy along with the green form.`}
                </Typography>

                <Button
                  variant="contained"
                  sx={{ mt: 2, ml: "auto", width: "150px" }}
                  disabled={!isCheckboxChecked || finalFormSubmitLoading}
                  onClick={handleFinalFormSubmit}
                >
                  {finalFormSubmitLoading ? (
                    <CircularProgress size={24} />
                  ) : (
                    `Submit Form`
                  )}
                </Button>
              </CardContent>
            </Card>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default FinalForm;
