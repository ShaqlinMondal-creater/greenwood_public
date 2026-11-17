import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";

import PropTypes from "prop-types";
import { useRef, useState, useEffect } from "react";
import OtherDetailsTab from "../sections/new-admission/other-details-tab";
import FatherDetailsTab from "../sections/new-admission/father-details-tab";
import MotherDetailsTab from "../sections/new-admission/mother-details-tab";
import GuardianDetailsTab from "../sections/new-admission/guardian-details-tab";

// import { createStudent } from "../../../../services/admin/students-management.service";
import useAuth from "../hooks/useAuth";
import { toast } from "react-toastify";
import { Helmet } from "react-helmet-async";
import InstructionsTab from "../sections/new-admission/instructions-tab";
import ChildDetailsTab from "../sections/new-admission/child-details-tab";
import SiblingsDetailsTab from "../sections/new-admission/siblings-details-tab";
import {
  getAdmissionClasses,
  newAdmission,
} from "../services/new-admission.service";
import dayjs from "dayjs";
import { useNavigate, useSearchParams } from "react-router-dom";
import { WEBSITE_NAME } from "../utils/constants";
import { useGetApi } from "../hooks/useGetApi";
import {
  clearAdmissionDraft,
  deserializeAdmissionDraft,
  hasAdmissionDraftContent,
  loadAdmissionDraft,
  saveAdmissionDraft,
  serializeAdmissionDraft,
} from "../utils/admission-draft";

const BRAND_LOGO = "/green_wood_.png";

const getAdmissionTabs = (isOrphan) =>
  isOrphan
    ? [
        "Instructions",
        "Child Details",
        "Guardian Details",
        "Sibling's Details",
        "Other Details",
      ]
    : [
        "Instructions",
        "Child Details",
        "Father Details",
        "Mother Details",
        "Sibling's Details",
        "Other Details",
      ];

const INITIAL_ADMISSION_FORM_STATE = {
  // child info
  first_name: "",
  last_name: "",
  ay_id: null,
  gender: "m",
  dob: null,
  class: null,
  aadhaar: "",
  address_1: "",
  address_2: "",
  city: "",
  state: "",
  country: "",
  pincode: "",
  has_previous_school: "no",
  last_school: "",
  last_school_address: "",
  udise_pen_id: "",
  is_orphan: "no",
  stream: "",

  // guardian (orphan)
  g_name: "",
  g_relation: "",
  g_relation_other: "",
  g_relation_choice: "",
  g_contact: "",
  g_email: "",
  g_occupation: "",
  g_aadhar: "",

  // father info
  father_name: "",
  father_surname: "",
  father_mobile: "",
  father_email: "",
  father_aadhar: "",
  father_qualification: "",
  father_occupation: "business", // or "employed", "no-occupation"
  father_monthly_income: "",

  // business details
  father_business_name: "",
  father_business_nature: "",
  father_business_address: "",
  father_business_city: "",
  father_business_state: "",
  father_business_country: "",
  father_business_pincode: "",

  // employment details
  father_employer_name: "",
  father_designation: "",
  father_work_address: "",
  father_work_city: "",
  father_work_state: "",
  father_work_country: "",
  father_work_pincode: "",

  // mother info
  mother_first_name: "",
  mother_last_name: "",
  mother_mobile: "",
  mother_email: "",
  mother_aadhar: "",
  mother_qualification: "",
  mother_occupation: "business", // or "employed", "housewife", "not-applicable"
  mother_monthly_income: "",

  // business details
  mother_business_name: "",
  mother_business_nature: "",
  mother_business_address: "",
  mother_business_city: "",
  mother_business_state: "",
  mother_business_country: "",
  mother_business_pincode: "",

  // employment details
  mother_employer_name: "",
  mother_designation: "",
  mother_work_address: "",
  mother_work_city: "",
  mother_work_state: "",
  mother_work_country: "",
  mother_work_pincode: "",

  siblings: [{}],
  attracted: "",
  strengths: "",
  remarks: "",
};

const NewAdmission = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Initial form state with all required fields
  const initialState = INITIAL_ADMISSION_FORM_STATE;

  const acceptTermsRef = useRef(null);
  const skipDraftSaveRef = useRef(true);
  const draftCheckedClassRef = useRef(null);
  const [formData, setFormData] = useState(initialState);
  const [attachments, setAttachments] = useState({
    child_photo: null,
    father_photo: null,
    mother_photo: null,
    guardian_photo: null,
    family_photo: null,
    birth_certificate: null,
    previous_report: null,
    father_aadhar_card: null,
    mother_aadhar_card: null,
    guardian_aadhar_card: null,
  });

  const tabsList = getAdmissionTabs(formData?.is_orphan === "yes");

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    if (activeTab > tabsList.length - 1) {
      setActiveTab(tabsList.length - 1);
    }
  }, [tabsList.length, activeTab]);

  const { dataList: admissionClassList, isLoading: admissionClassLoading } =
    useGetApi({
      apiFunction: getAdmissionClasses,
    });

  const handleCheckboxChange = (event) => {
    setTermsAccepted(event.target.checked);
  };

  const applyAdmissionDraft = (draft) => {
    const restoredDraft = deserializeAdmissionDraft(
      draft,
      admissionClassList,
      initialState
    );

    if (!restoredDraft) return;

    skipDraftSaveRef.current = true;
    setFormData(restoredDraft.formData);
    setTermsAccepted(restoredDraft.termsAccepted);
    setActiveTab(restoredDraft.activeTab);
    setHasDraft(true);
    setTimeout(() => {
      skipDraftSaveRef.current = false;
    }, 0);
  };

  const handleFreshApplication = () => {
    const currentClass = formData?.class || null;
    const classCgId = currentClass?.cg_id;

    if (classCgId) {
      clearAdmissionDraft(classCgId);
    }

    skipDraftSaveRef.current = true;
    setFormData({
      ...initialState,
      class: currentClass,
    });
    setTermsAccepted(false);
    setActiveTab(0);
    setAttachments({
      child_photo: null,
      father_photo: null,
      mother_photo: null,
      guardian_photo: null,
      family_photo: null,
      birth_certificate: null,
      previous_report: null,
      father_aadhar_card: null,
      mother_aadhar_card: null,
      guardian_aadhar_card: null,
    });
    setHasDraft(false);
    setTimeout(() => {
      skipDraftSaveRef.current = false;
    }, 0);
    toast.info("Starting a fresh application.");
  };

  // tab change
  const handleTabChange = (event, newValue) => {
    // Only enforce checks when leaving the Instructions tab
    if (activeTab === 0 && newValue !== 0) {
      if (!formData?.class?.status) {
        toast.warning("This class is not available for admission");
        setActiveTab(0);
        return;
      }
      if (!formData?.class) {
        toast.info("Please select a class before proceeding");
        return;
      }
      if (!termsAccepted) {
        toast.info("Please accept terms and conditions");
        acceptTermsRef.current?.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }

    setActiveTab(newValue);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((preValue) => {
      if (name === "class") {
        // Remove previous_report when class is nursery
        setAttachments((prev) => {
          if (value?.cg_id === "nursery") {
            return {
              ...prev,
              previous_report: null,
            };
          }
          return prev;
        });

        const isClassChanged =
          value?.cg_id && preValue?.class?.cg_id !== value?.cg_id;

        if (isClassChanged) {
          draftCheckedClassRef.current = null;
          skipDraftSaveRef.current = true;
          setTermsAccepted(false);
          setActiveTab(0);
          setTimeout(() => {
            skipDraftSaveRef.current = false;
          }, 0);
          return { ...initialState, class: value, dob: null };
        }

        if (activeTab !== 0) {
          setActiveTab(1);
          toast.warning("Re-enter Date of Birth");
        }
        return { ...preValue, [name]: value, dob: null };
      }
      return { ...preValue, [name]: value };
    });
  };

  const handleNext = () => {
    if (!formData?.class) {
      toast.info("Please select a class before proceeding");
      return;
    }
    if (!termsAccepted) {
      toast.info("Please accept terms and conditions");
      acceptTermsRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    // Check if stream is required (for class 9 and class 11)
    if (
      (formData?.class?.cg_id === "class_9" ||
        formData?.class?.cg_id === "class_11") &&
      !formData?.stream &&
      activeTab >= 1
    ) {
      setActiveTab(1);
      toast.info("Please select a stream before proceeding");
      return;
    }

    const skipPreviousSchool = [
      "nursery",
      "lkg",
      "ukg",
      "class_1",
    ].includes(formData?.class?.cg_id);

    if (
      activeTab === 1 &&
      !skipPreviousSchool &&
      !formData?.has_previous_school
    ) {
      toast.info("Please select if the child has a previous school");
      return;
    }

    if (activeTab === 1 && !formData?.is_orphan) {
      toast.info("Please select if the child is an orphan");
      return;
    }

    if (activeTab === 1) {
      const aadhaar = String(formData?.aadhaar || "").replace(/\D/g, "");
      if (aadhaar && aadhaar.length !== 12) {
        toast.info("Aadhaar number must be exactly 12 digits");
        return;
      }

      const penNo = String(formData?.udise_pen_id || "").replace(/\D/g, "");
      if (penNo && penNo.length !== 11) {
        toast.info("PEN No (UDISE+) must be exactly 11 digits");
        return;
      }
    }

    if (activeTab < tabsList?.length - 1) {
      setActiveTab((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    if (activeTab > 0) {
      setActiveTab((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());

  /** Returns { ok, tabName?, message? } — used before submit (and heavier next checks). */
  const validateAdmissionForm = () => {
    const classId = formData?.class?.cg_id;
    const isOrphan = formData?.is_orphan === "yes";
    const skipPreviousSchool = ["nursery", "lkg", "ukg", "class_1"].includes(
      classId
    );

    if (!classId) {
      return { ok: false, tabName: "Instructions", message: "Please select a class before proceeding" };
    }
    if (!formData?.dob) {
      return { ok: false, tabName: "Child Details", message: "Please select Date of Birth" };
    }
    if (!formData?.first_name?.trim()) {
      return { ok: false, tabName: "Child Details", message: "Please enter child's first name" };
    }
    if (!formData?.last_name?.trim()) {
      return { ok: false, tabName: "Child Details", message: "Please enter child's last name" };
    }
    if (!formData?.gender) {
      return { ok: false, tabName: "Child Details", message: "Please select gender" };
    }
    if (!formData?.address_1?.trim()) {
      return { ok: false, tabName: "Child Details", message: "Please enter residential address" };
    }
    if (!formData?.pincode || String(formData.pincode).length !== 6) {
      return { ok: false, tabName: "Child Details", message: "Please enter a valid 6-digit pincode" };
    }
    if (!formData?.city?.trim() || !formData?.state?.trim() || !formData?.country?.trim()) {
      return { ok: false, tabName: "Child Details", message: "Please fill city, state and country" };
    }
    if (
      (classId === "class_9" || classId === "class_11") &&
      !formData?.stream
    ) {
      return { ok: false, tabName: "Child Details", message: "Please select a stream" };
    }
    if (!skipPreviousSchool && !formData?.has_previous_school) {
      return {
        ok: false,
        tabName: "Child Details",
        message: "Please select if the child has a previous school",
      };
    }
    if (!formData?.is_orphan) {
      return {
        ok: false,
        tabName: "Child Details",
        message: "Please select if the child is an orphan",
      };
    }
    if (!attachments?.child_photo) {
      return { ok: false, tabName: "Child Details", message: "Please upload Child's photo" };
    }
    if (!attachments?.birth_certificate) {
      return {
        ok: false,
        tabName: "Child Details",
        message: "Please upload Birth Certificate",
      };
    }

    const aadhaar = String(formData?.aadhaar || "").replace(/\D/g, "");
    if (aadhaar && aadhaar.length !== 12) {
      return {
        ok: false,
        tabName: "Child Details",
        message: "Aadhaar number must be exactly 12 digits",
      };
    }

    const penNo = String(formData?.udise_pen_id || "").replace(/\D/g, "");
    if (penNo && penNo.length !== 11) {
      return {
        ok: false,
        tabName: "Child Details",
        message: "PEN No (UDISE+) must be exactly 11 digits",
      };
    }

    if (isOrphan) {
      if (!formData?.g_relation?.trim()) {
        return {
          ok: false,
          tabName: "Guardian Details",
          message:
            formData?.g_relation_choice === "Other"
              ? "Please specify the guardian relation"
              : "Please select guardian relation",
        };
      }
      if (!formData?.g_name?.trim()) {
        return {
          ok: false,
          tabName: "Guardian Details",
          message: "Please enter guardian name",
        };
      }
      if (!formData?.g_contact || String(formData.g_contact).length < 10) {
        return {
          ok: false,
          tabName: "Guardian Details",
          message: "Please enter a valid 10-digit guardian mobile",
        };
      }
      if (!attachments?.guardian_photo) {
        return {
          ok: false,
          tabName: "Child Details",
          message: "Please upload Guardian's photo",
        };
      }
      if (String(formData?.g_aadhar || "").replace(/\D/g, "").length !== 12) {
        return {
          ok: false,
          tabName: "Guardian Details",
          message: "Please enter a valid 12-digit guardian Aadhaar number",
        };
      }
      if (!attachments?.guardian_aadhar_card) {
        return {
          ok: false,
          tabName: "Child Details",
          message: "Please upload Guardian's Aadhaar card",
        };
      }
    } else {
      if (!formData?.father_name?.trim()) {
        return { ok: false, tabName: "Father Details", message: "Please enter father's name" };
      }
      if (!formData?.father_surname?.trim()) {
        return { ok: false, tabName: "Father Details", message: "Please enter father's surname" };
      }
      if (!formData?.father_mobile?.trim()) {
        return { ok: false, tabName: "Father Details", message: "Please enter father's mobile" };
      }
      if (!formData?.father_email?.trim()) {
        return { ok: false, tabName: "Father Details", message: "Father email is required" };
      }
      if (!isValidEmail(formData.father_email)) {
        return { ok: false, tabName: "Father Details", message: "Please enter a valid father email" };
      }
      if (!formData?.father_qualification?.trim()) {
        return { ok: false, tabName: "Father Details", message: "Please enter father's qualification" };
      }
      if (!formData?.father_occupation) {
        return { ok: false, tabName: "Father Details", message: "Please select father's occupation" };
      }
      if (!attachments?.father_photo) {
        return { ok: false, tabName: "Child Details", message: "Please upload Father's photo" };
      }
      if (String(formData?.father_aadhar || "").replace(/\D/g, "").length !== 12) {
        return {
          ok: false,
          tabName: "Father Details",
          message: "Please enter a valid 12-digit father Aadhaar number",
        };
      }
      if (!attachments?.father_aadhar_card) {
        return {
          ok: false,
          tabName: "Child Details",
          message: "Please upload Father's Aadhaar card",
        };
      }

      if (!formData?.mother_first_name?.trim()) {
        return { ok: false, tabName: "Mother Details", message: "Please enter mother's name" };
      }
      if (!formData?.mother_last_name?.trim()) {
        return { ok: false, tabName: "Mother Details", message: "Please enter mother's surname" };
      }
      if (!formData?.mother_mobile?.trim()) {
        return { ok: false, tabName: "Mother Details", message: "Please enter mother's mobile" };
      }
      if (formData?.mother_email?.trim() && !isValidEmail(formData.mother_email)) {
        return { ok: false, tabName: "Mother Details", message: "Please enter a valid mother email" };
      }
      if (!formData?.mother_qualification?.trim()) {
        return { ok: false, tabName: "Mother Details", message: "Please enter mother's qualification" };
      }
      if (!formData?.mother_occupation) {
        return { ok: false, tabName: "Mother Details", message: "Please select mother's occupation" };
      }
      if (!attachments?.mother_photo) {
        return { ok: false, tabName: "Child Details", message: "Please upload Mother's photo" };
      }
      if (String(formData?.mother_aadhar || "").replace(/\D/g, "").length !== 12) {
        return {
          ok: false,
          tabName: "Mother Details",
          message: "Please enter a valid 12-digit mother Aadhaar number",
        };
      }
      if (!attachments?.mother_aadhar_card) {
        return {
          ok: false,
          tabName: "Child Details",
          message: "Please upload Mother's Aadhaar card",
        };
      }
    }

    return { ok: true };
  };

  const goToTabByName = (tabName) => {
    const index = tabsList.indexOf(tabName);
    if (index >= 0) setActiveTab(index);
  };

  const cleanOccupationFields = (data, prefix, occupation) => {
    // Normalize occupation to handle case sensitivity and edge cases
    const normalizedOccupation =
      typeof occupation === "string" ? occupation.toLowerCase().trim() : "";

    const businessFields = [
      "business_name",
      "business_nature",
      "business_address",
      "business_city",
      "business_state",
      "business_country",
      "business_pincode",
    ];

    const employedFields = [
      "employer_name",
      "designation",
      "work_address",
      "work_city",
      "work_state",
      "work_country",
      "work_pincode",
    ];

    // Delete fields based on occupation
    if (normalizedOccupation === "business") {
      employedFields.forEach((field) => {
        const key = `${prefix}_${field}`;
        if (key in data) {
          delete data[key];
        }
      });
    } else if (normalizedOccupation === "employed") {
      businessFields.forEach((field) => {
        const key = `${prefix}_${field}`;
        if (key in data) {
          delete data[key];
        }
      });
    } else {
      [...businessFields, ...employedFields].forEach((field) => {
        const key = `${prefix}_${field}`;
        if (key in data) {
          delete data[key];
          delete data[`${prefix}_monthly_income`];
        }
      });
    }

    return data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validation = validateAdmissionForm();
    if (!validation.ok) {
      if (validation.tabName) goToTabByName(validation.tabName);
      toast.info(validation.message);
      return;
    }

    // Deep clone formData to avoid mutating the original
    const cleanedData = JSON.parse(JSON.stringify(formData));

    // Nursery / LKG / UKG / Class 1 always pass previous school as No
    if (
      ["nursery", "lkg", "ukg", "class_1"].includes(cleanedData?.class?.cg_id)
    ) {
      cleanedData.has_previous_school = "no";
    }

    if (cleanedData.has_previous_school !== "yes") {
      cleanedData.last_school = "";
      cleanedData.last_school_address = "";
      cleanedData.udise_pen_id = "";
    }
    delete cleanedData.has_previous_school;

    // Keep is_orphan for backend branching only (not a DB column)
    if (cleanedData.is_orphan === "yes") {
      // Father/Mother must not be sent with defaults — null / none only
      const parentKeys = [
        "father_name",
        "father_surname",
        "father_mobile",
        "father_email",
        "father_qualification",
        "father_monthly_income",
        "father_business_name",
        "father_business_nature",
        "father_business_address",
        "father_business_city",
        "father_business_state",
        "father_business_country",
        "father_business_pincode",
        "father_employer_name",
        "father_designation",
        "father_work_address",
        "father_work_city",
        "father_work_state",
        "father_work_country",
        "father_work_pincode",
        "father_aadhar",
        "mother_first_name",
        "mother_last_name",
        "mother_mobile",
        "mother_email",
        "mother_qualification",
        "mother_monthly_income",
        "mother_business_name",
        "mother_business_nature",
        "mother_business_address",
        "mother_business_city",
        "mother_business_state",
        "mother_business_country",
        "mother_business_pincode",
        "mother_employer_name",
        "mother_designation",
        "mother_work_address",
        "mother_work_city",
        "mother_work_state",
        "mother_work_country",
        "mother_work_pincode",
        "mother_aadhar",
      ];
      parentKeys.forEach((key) => {
        cleanedData[key] = null;
      });
      cleanedData.father_occupation = "no-occupation";
      cleanedData.mother_occupation = "not-applicable";
    } else {
      cleanedData.g_name = null;
      cleanedData.g_relation = null;
      cleanedData.g_contact = null;
      cleanedData.g_email = null;
      cleanedData.g_occupation = null;
      cleanedData.g_aadhar = null;
      if (!cleanedData.mother_email) cleanedData.mother_email = null;
    }
    delete cleanedData.g_relation_other;
    delete cleanedData.g_relation_choice;

    // Clean up occupation-based fields
    cleanOccupationFields(cleanedData, "father", cleanedData.father_occupation);
    cleanOccupationFields(cleanedData, "mother", cleanedData.mother_occupation);

    // Prepare json_data
    const jsonData = {
      ...cleanedData,
      dob: cleanedData?.dob
        ? dayjs(cleanedData?.dob).format("YYYY-MM-DD")
        : null,
      class: cleanedData?.class?.cg_id,
    };

    // Create FormData object
    const formDataPayload = new FormData();

    // Append json_data as a stringified JSON blob
    formDataPayload.append("json_data", JSON.stringify(jsonData));

    // Append only real files (never null/"null")
    Object.keys(attachments).forEach((key) => {
      if (
        attachments[key] instanceof File ||
        attachments[key] instanceof Blob
      ) {
        formDataPayload.append(key, attachments[key]);
      }
    });

    setIsLoading(true);
    const response = await newAdmission(formDataPayload);
    setIsLoading(false);

    if (response?.code === 200) {
      if (formData?.class?.cg_id) {
        clearAdmissionDraft(formData.class.cg_id);
      }
      setHasDraft(false);
      toast.success(response?.message || "Student Creation Successful");
      setFormData(initialState);
      navigate(
        response?.data?.application_no
          ? `/payment?applicationNo=${response.data.application_no}`
          : "/"
      );
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Some error occurred.");
    }
  };
  //   props for each tab
  const props = {
    acceptTermsRef,
    formData,
    setFormData,
    setAttachments,
    attachments,
    handleChange,
    termsAccepted,
    handleCheckboxChange,
    admissionClassList,
    admissionClassLoading,
  };

  // Auto-select class based on URL parameter
  useEffect(() => {
    const classParam = searchParams.get("class");
    if (classParam && !formData.class) {
      // Find the matching class from admissionClassList (case-insensitive)
      const selectedClass = admissionClassList?.find(
        (cls) => cls.cg_id === classParam.toLowerCase()
      );
      if (selectedClass) {
        setFormData((prev) => ({
          ...prev,
          class: selectedClass,
        }));
      }
    }
  }, [searchParams, formData.class, admissionClassList]);

  // Auto-restore saved draft for selected class
  useEffect(() => {
    const classCgId = formData?.class?.cg_id;
    if (!classCgId || !admissionClassList?.length) return;
    if (draftCheckedClassRef.current === classCgId) return;

    draftCheckedClassRef.current = classCgId;
    const savedDraft = loadAdmissionDraft(classCgId);

    if (savedDraft) {
      applyAdmissionDraft(savedDraft);
      toast.info("Draft restored. Please re-upload photos if needed.");
    } else {
      setHasDraft(false);
    }

    skipDraftSaveRef.current = false;
  }, [formData?.class?.cg_id, admissionClassList]);

  // Auto-save draft while filling the form
  useEffect(() => {
    const classCgId = formData?.class?.cg_id;
    if (!classCgId || skipDraftSaveRef.current) return;

    const timer = setTimeout(() => {
      if (!hasAdmissionDraftContent(formData, termsAccepted, activeTab)) {
        clearAdmissionDraft(classCgId);
        setHasDraft(false);
        return;
      }

      saveAdmissionDraft(
        classCgId,
        serializeAdmissionDraft(formData, termsAccepted, activeTab)
      );
      setHasDraft(true);
    }, 800);

    return () => clearTimeout(timer);
  }, [formData, termsAccepted, activeTab]);

  return (
    <Box sx={{ bgcolor: "custom.body_color", minHeight: "100vh", py: 2 }}>
      <Helmet>
        <title>New Admission | GREENWOOD</title>
      </Helmet>

      <Container maxWidth="lg">
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            mb: 2,
          }}
        >
          <Box
            component="img"
            src={BRAND_LOGO}
            alt="Greenwood Logo"
            sx={{
              width: { xs: "150px", sm: "180px" },
              height: "auto",
            }}
          />
          <Typography
            noWrap
            sx={{
              textTransform: "uppercase",
              fontSize: { xs: "16px", sm: "20px", md: "24px" },
              fontWeight: { xs: "600" },
              color: "primary.main",
            }}
          >
            {WEBSITE_NAME}
          </Typography>
        </Box>
        <Card>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Typography variant="h6">New Admission</Typography>
                {hasDraft && (
                  <>
                    <Chip
                      label="Draft"
                      size="small"
                      color="warning"
                      variant="outlined"
                    />
                    <Button
                      type="button"
                      size="small"
                      variant="outlined"
                      color="inherit"
                      onClick={handleFreshApplication}
                    >
                      Fresh Application
                    </Button>
                  </>
                )}
              </Box>
              {/* Class */}
              <Autocomplete
                options={admissionClassList || []}
                getOptionLabel={(option) => option?.cg_name || ""}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Class"
                    required
                    fullWidth
                    size="small"
                  />
                )}
                name="class"
                value={formData?.class || null}
                onChange={(_, newValue) =>
                  handleChange({ target: { name: "class", value: newValue } })
                }
                sx={{ width: "150px" }}
              />
            </Box>

            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
            >
              {tabsList?.map((label, index) => (
                <Tab key={label} label={label} type="button" />
              ))}
            </Tabs>

            <Divider sx={{ mb: 4 }} />

            <Box component="form" onSubmit={handleSubmit} id="student-form">
              {/* Tab Content */}
              {tabsList[activeTab] === "Instructions" && (
                <InstructionsTab props={props} />
              )}
              {tabsList[activeTab] === "Child Details" && (
                <ChildDetailsTab props={props} />
              )}
              {tabsList[activeTab] === "Father Details" && (
                <FatherDetailsTab props={props} />
              )}
              {tabsList[activeTab] === "Mother Details" && (
                <MotherDetailsTab props={props} />
              )}
              {tabsList[activeTab] === "Guardian Details" && (
                <GuardianDetailsTab props={props} />
              )}
              {tabsList[activeTab] === "Sibling's Details" && (
                <SiblingsDetailsTab props={props} />
              )}
              {tabsList[activeTab] === "Other Details" && (
                <OtherDetailsTab props={props} />
              )}
            </Box>

            {formData?.class?.status && (
              <Box sx={{ my: 2, textAlign: "right" }}>
                {activeTab > 0 && (
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={handlePrev}
                    sx={{ mr: 2 }}
                    disabled={isLoading}
                  >
                    Previous
                  </Button>
                )}
                {activeTab < tabsList?.length - 1 && (
                  <Button
                    type="button"
                    variant="contained"
                    onClick={handleNext}
                  >
                    Next
                  </Button>
                )}

                {activeTab === tabsList?.length - 1 && (
                  <Button
                    form="student-form"
                    type="submit"
                    variant="contained"
                    disabled={isLoading}
                  >
                    {isLoading ? <CircularProgress size={24} /> : "Save"}
                  </Button>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

NewAdmission.propTypes = {
  isEdit: PropTypes.bool,
};

export default NewAdmission;
