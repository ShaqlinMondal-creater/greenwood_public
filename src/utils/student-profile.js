import { getStudentProfile } from "../services/student/profile.service";

const profileStatusCache = {};

export const hasProfileValue = (value) => {
  if (value === null || value === undefined || value === "") return false;
  if (value === 0 || value === "0") return false;
  return String(value).trim() !== "";
};

const ADDRESS_REQUIRED_KEYS = [
  "address",
  "city",
  "state",
  "country",
  "pincode",
];

export const getStudentProfileMissingStatus = async (stId) => {
  if (!stId) {
    return { missing: false, missingBasic: false, missingParent: false };
  }

  if (profileStatusCache[stId] !== undefined) {
    return profileStatusCache[stId];
  }

  const response = await getStudentProfile({ st_id: stId });
  const data = response?.data || {};

  // My Profile: Email OR Aadhaar missing (blood group not in warning)
  const missingBasic =
    !hasProfileValue(data?.email) || !hasProfileValue(data?.aadhaar_no);

  // Address always required
  const missingAddress = ADDRESS_REQUIRED_KEYS.some(
    (key) => !hasProfileValue(data?.[key])
  );

  // At least one complete path:
  // Father (name + contact) OR Mother (name + contact) OR Guardian (name + contact)
  const hasFather =
    hasProfileValue(data?.f_name) && hasProfileValue(data?.f_contact);
  const hasMother =
    hasProfileValue(data?.m_name) && hasProfileValue(data?.m_contact);
  const hasGuardian =
    hasProfileValue(data?.g_name) && hasProfileValue(data?.g_contact);

  const missingParentPeople = !(hasFather || hasMother || hasGuardian);
  const missingParent = missingAddress || missingParentPeople;

  const status = {
    missing: missingBasic || missingParent,
    missingBasic,
    missingParent,
  };

  profileStatusCache[stId] = status;
  return status;
};

export const checkStudentMissingProfileFields = async (stId) => {
  const status = await getStudentProfileMissingStatus(stId);
  return status.missing;
};

export const invalidateStudentProfileCache = (stId) => {
  if (stId) {
    delete profileStatusCache[stId];
  }
};

// Backward-compatible alias
export const checkStudentMissingAadhaar = checkStudentMissingProfileFields;
export const invalidateStudentAadhaarCache = invalidateStudentProfileCache;
export const hasAadhaarNumber = hasProfileValue;
