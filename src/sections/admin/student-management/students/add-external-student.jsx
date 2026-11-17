import {
  Autocomplete,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  FormLabel,
  Grid,
  Radio,
  RadioGroup,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import OtherDetailsTab from "./create-edit-tabs/other-details-tab";
import AddressDetailsTab from "./create-edit-tabs/address-details-tab";
import FatherDetailsTab from "./create-edit-tabs/father-details-tab";
import MotherDetailsTab from "./create-edit-tabs/mother-details-tab";
import { useGetApi } from "../../../../hooks/useGetApi";
import {
  checkStudentRoll,
  createExternalStudent,
  getAllAcademicYears,
  getClasses,
  getBloodGroups,
  getHouse,
} from "../../../../services/admin/students-management.service";
import useAuth from "../../../../hooks/useAuth";
import { sortClassGroups } from "../../../../utils/class-group-sort";

dayjs.extend(customParseFormat);

const AddExternalStudent = () => {
  const { userInfo, logout } = useAuth();
  const navigate = useNavigate();

  const initialState = {
    st_first_name: "",
    st_last_name: "",
    st_gender: "M",
    st_dob: null,
    st_roll_no: "",
    st_external: "1",
    st_mobile: "",
    st_bohra: 0,
    st_its_id: "",
    st_gmail_address: "",
    st_house: "",
    st_blood_group: "",
    aadhaar_no: "",
    st_year_of_admission: null,
    academicYear: null,
    class_group: null,
    residential_address1: "",
    residential_address2: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
    f_name: "",
    f_contact: "",
    f_email: "",
    f_occupation: "self-employed",
    f_business_name: "",
    f_business_nature: "",
    f_employer_name: "",
    f_designation: "",
    f_work_address1: "",
    f_work_city: "",
    f_work_state: "",
    f_work_country: "",
    f_work_pincode: "",
    f_business_address1: "",
    f_business_city: "",
    f_business_state: "",
    f_business_country: "",
    f_business_pincode: "",
    m_name: "",
    m_contact: "",
    m_email: "",
    m_occupation: "self-employed",
    m_business_name: "",
    m_business_nature: "",
    m_employer_name: "",
    m_designation: "",
    m_work_address1: "",
    m_work_city: "",
    m_work_state: "",
    m_work_country: "",
    m_work_pincode: "",
    m_business_address1: "",
    m_business_city: "",
    m_business_state: "",
    m_business_country: "",
    m_business_pincode: "",
  };

  const [formData, setFormData] = useState(initialState);
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [rollExists, setRollExists] = useState(false);
  const [rollSuggestions, setRollSuggestions] = useState([]);
  const [isCheckingRoll, setIsCheckingRoll] = useState(false);

  const { dataList: bloodGroupList } = useGetApi({
    apiFunction: getBloodGroups,
  });

  const { dataList: classList } = useGetApi({
    apiFunction: getClasses,
    body: {
      ay_id: formData?.academicYear?.ay_id || userInfo?.ay_id,
    },
    dependencies: [formData?.academicYear],
  });

  const { dataList: academicYearList } = useGetApi({
    apiFunction: getAllAcademicYears,
  });

  const { dataList: houseList } = useGetApi({
    apiFunction: getHouse,
  });

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
  };

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;

    setFormData((preValue) => ({
      ...preValue,
      [name]: value,
    }));
  }, []);

  useEffect(() => {
    const rollNo = String(formData?.st_roll_no || "").trim();
    const ayId = formData?.academicYear?.ay_id;

    if (rollNo.length < 7) {
      setRollExists(false);
      setRollSuggestions([]);
      return;
    }

    if (!ayId) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingRoll(true);
      const response = await checkStudentRoll({
        st_roll_no: rollNo,
        ay_id: ayId,
      });
      setIsCheckingRoll(false);

      if (response?.code === 200) {
        setRollExists(!!response?.exists);
        setRollSuggestions(response?.suggestions || []);
      } else if (response?.code === 401) {
        logout(response);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formData?.st_roll_no, formData?.academicYear?.ay_id, logout]);

  const buildPayload = () => {
    const { academicYear, class_group: classGroupSelection, ...rest } = formData;

    return {
      ...rest,
      st_its_id: formData?.st_its_id?.trim() ? formData.st_its_id.trim() : null,
      st_gmail_address: formData?.st_gmail_address?.trim() || null,
      st_year_of_admission: formData?.st_year_of_admission
        ? String(dayjs(formData.st_year_of_admission).year())
        : null,
      st_date_of_admission: formData?.st_year_of_admission
        ? dayjs(formData.st_year_of_admission).format("DD-MM-YYYY")
        : null,
      st_dob: formData?.st_dob
        ? dayjs(formData.st_dob).format("YYYY-MM-DD")
        : null,
      class_group: classGroupSelection?.id || null,
      ay_id: formData?.academicYear?.ay_id || null,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rollExists) {
      toast.error("This roll already exists. Please use a suggested roll.");
      return;
    }

    setIsLoading(true);
    const response = await createExternalStudent(buildPayload());
    setIsLoading(false);

    if (response?.code === 200) {
      toast.success(response?.message || "External student added successfully");
      setFormData(initialState);
      navigate(-1);
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Some error occurred.");
    }
  };

  const props = {
    isEdit: false,
    isExternal: true,
    formData,
    handleChange,
    bloodGroupList,
    classList,
    academicYearList,
  };

  return (
    <Card sx={{ p: 2 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography>Add External Student</Typography>
        <Button
          type="submit"
          variant="contained"
          form="external-student-form"
          disabled={isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : `Save`}
        </Button>
      </Box>
      <Divider sx={{ mt: 1, mb: 2, bgcolor: "primary.main" }} />
      <Box component="form" onSubmit={handleSubmit} id="external-student-form">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <Autocomplete
              options={academicYearList || []}
              getOptionLabel={(option) => option?.ay_name || ""}
              renderInput={(params) => (
                <TextField {...params} label="Academic Year" fullWidth required />
              )}
              value={formData?.academicYear || null}
              onChange={(_, newValue) =>
                setFormData((preValue) => ({
                  ...preValue,
                  academicYear: newValue,
                  class_group: null,
                }))
              }
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4} lg={3}>
            <Autocomplete
              options={sortClassGroups(classList || [])}
              getOptionLabel={(option) => option?.cg_name || ""}
              renderInput={(params) => (
                <TextField {...params} label="Class Group" fullWidth required />
              )}
              value={formData?.class_group || null}
              onChange={(_, newValue) =>
                handleChange({
                  target: { name: "class_group", value: newValue },
                })
              }
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4} lg={3}>
            <TextField
              name="st_first_name"
              label="First Name"
              required
              fullWidth
              value={formData?.st_first_name || ""}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4} lg={3}>
            <TextField
              name="st_last_name"
              label="Last Name"
              required
              fullWidth
              value={formData?.st_last_name || ""}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4} lg={3}>
            <FormLabel component="legend" required>
              Gender
            </FormLabel>
            <RadioGroup
              row
              name="st_gender"
              value={formData?.st_gender || ""}
              onChange={handleChange}
            >
              <FormControlLabel value="M" control={<Radio />} label="Male" />
              <FormControlLabel value="F" control={<Radio />} label="Female" />
            </RadioGroup>
          </Grid>

          <Grid item xs={12} sm={6} md={4} lg={3}>
            <DatePicker
              name="st_dob"
              label="Date of Birth"
              value={formData?.st_dob || null}
              onChange={(newValue) =>
                handleChange({ target: { name: "st_dob", value: newValue } })
              }
              slotProps={{
                textField: {
                  required: true,
                  fullWidth: true,
                },
              }}
              disableFuture
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4} lg={3}>
            <TextField
              name="st_roll_no"
              label="Roll No"
              required
              fullWidth
              value={formData?.st_roll_no || ""}
              onChange={handleChange}
              error={rollExists}
              helperText={
                rollExists
                  ? "This roll already exists. Pick a suggested roll below."
                  : isCheckingRoll
                    ? "Checking roll..."
                    : "Type at least 7 digits to check"
              }
            />
            {rollExists && rollSuggestions.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                {rollSuggestions.map((roll) => (
                  <Chip
                    key={roll}
                    label={roll}
                    color="primary"
                    variant="outlined"
                    onClick={() =>
                      handleChange({ target: { name: "st_roll_no", value: roll } })
                    }
                  />
                ))}
              </Box>
            )}
          </Grid>

          <Grid item xs={12} sm={6} md={4} lg={3}>
            <FormLabel component="legend" required>
              External
            </FormLabel>
            <RadioGroup
              row
              name="st_external"
              value={formData?.st_external || "1"}
              onChange={handleChange}
            >
              <FormControlLabel value="1" control={<Radio />} label="Yes" />
              <FormControlLabel value="0" control={<Radio />} label="No" />
            </RadioGroup>
          </Grid>

          <Grid item xs={12} sm={6} md={4} lg={3}>
            <TextField
              name="st_mobile"
              label="Mobile"
              type="tel"
              required
              fullWidth
              value={formData?.st_mobile || ""}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4} lg={3}>
            <FormLabel component="legend" required>
              Bohra
            </FormLabel>
            <RadioGroup
              row
              name="st_bohra"
              value={formData?.st_bohra ?? 0}
              onChange={handleChange}
            >
              <FormControlLabel value={1} control={<Radio />} label="Yes" />
              <FormControlLabel value={0} control={<Radio />} label="No" />
            </RadioGroup>
          </Grid>

          {formData?.st_bohra === 1 && (
            <Grid item xs={12} sm={6} md={4} lg={3}>
              <TextField
                name="st_its_id"
                label="ITS"
                fullWidth
                value={formData?.st_its_id || ""}
                onChange={handleChange}
              />
            </Grid>
          )}

          <Grid item xs={12} sm={6} md={4} lg={3}>
            <TextField
              name="st_gmail_address"
              label="Email"
              type="email"
              fullWidth
              value={formData?.st_gmail_address || ""}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4} lg={3}>
            <Autocomplete
              options={
                bloodGroupList?.length
                  ? bloodGroupList
                  : ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Rare"]
              }
              renderInput={(params) => (
                <TextField {...params} label="Blood Group" fullWidth />
              )}
              value={formData?.st_blood_group || ""}
              onChange={(_, newValue) =>
                handleChange({
                  target: { name: "st_blood_group", value: newValue },
                })
              }
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4} lg={3}>
            <Autocomplete
              options={houseList || []}
              renderInput={(params) => (
                <TextField
                  {...params}
                  name="st_house"
                  label="House"
                  fullWidth
                />
              )}
              value={formData?.st_house || ""}
              onChange={(_, newValue) =>
                handleChange({ target: { name: "st_house", value: newValue } })
              }
            />
          </Grid>
        </Grid>

        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ mt: 4 }}
          textColor="primary"
          indicatorColor="primary"
          scrollButtons="auto"
          variant="scrollable"
          allowScrollButtonsMobile
        >
          <Tab label="Other Details" />
          <Tab label="Address" />
          <Tab label="Father Details" />
          <Tab label="Mother Details" />
        </Tabs>

        <Divider sx={{ mb: 2 }} />

        {activeTab === 0 && <OtherDetailsTab props={props} />}
        {activeTab === 1 && <AddressDetailsTab props={props} />}
        {activeTab === 2 && <FatherDetailsTab props={props} />}
        {activeTab === 3 && <MotherDetailsTab props={props} />}
      </Box>
    </Card>
  );
};

export default AddExternalStudent;
