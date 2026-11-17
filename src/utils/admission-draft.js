import dayjs from "dayjs";

const DRAFT_KEY_PREFIX = "greenwood_admission_draft_";

export const getAdmissionDraftKey = (classCgId) =>
  `${DRAFT_KEY_PREFIX}${classCgId}`;

export const loadAdmissionDraft = (classCgId) => {
  if (!classCgId) return null;

  try {
    const raw = localStorage.getItem(getAdmissionDraftKey(classCgId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const saveAdmissionDraft = (classCgId, draft) => {
  if (!classCgId) return;

  try {
    localStorage.setItem(getAdmissionDraftKey(classCgId), JSON.stringify(draft));
  } catch (error) {
    console.warn("Failed to save admission draft:", error);
  }
};

export const clearAdmissionDraft = (classCgId) => {
  if (!classCgId) return;

  try {
    localStorage.removeItem(getAdmissionDraftKey(classCgId));
  } catch (error) {
    console.warn("Failed to clear admission draft:", error);
  }
};

export const serializeAdmissionDraft = (formData, termsAccepted, activeTab) => ({
  formData: {
    ...formData,
    class: formData?.class?.cg_id || null,
    dob: formData?.dob ? dayjs(formData.dob).format("YYYY-MM-DD") : null,
  },
  termsAccepted,
  activeTab,
  savedAt: new Date().toISOString(),
});

export const deserializeAdmissionDraft = (
  draft,
  admissionClassList,
  initialFormState
) => {
  if (!draft?.formData) return null;

  const { class: classCgId, dob, ...restFormData } = draft.formData;
  const classObj =
    admissionClassList?.find((item) => item.cg_id === classCgId) || null;

  return {
    formData: {
      ...initialFormState,
      ...restFormData,
      class: classObj,
      dob: dob ? dayjs(dob) : null,
    },
    termsAccepted: Boolean(draft.termsAccepted),
    activeTab: Number.isInteger(draft.activeTab) ? draft.activeTab : 0,
    savedAt: draft.savedAt || null,
  };
};

const TRACKED_DRAFT_FIELDS = [
  "first_name",
  "last_name",
  "aadhaar",
  "address_1",
  "address_2",
  "city",
  "state",
  "country",
  "pincode",
  "has_previous_school",
  "last_school",
  "last_school_address",
  "udise_pen_id",
  "is_orphan",
  "g_name",
  "g_relation",
  "g_contact",
  "g_email",
  "g_occupation",
  "stream",
  "second_language",
  "father_name",
  "father_surname",
  "father_mobile",
  "father_email",
  "father_aadhar",
  "mother_first_name",
  "mother_last_name",
  "mother_mobile",
  "mother_email",
  "mother_aadhar",
  "g_aadhar",
  "attracted",
  "strengths",
  "remarks",
];

export const hasAdmissionDraftContent = (formData, termsAccepted, activeTab) => {
  if (termsAccepted || activeTab > 0) return true;
  if (formData?.dob) return true;

  if (
    TRACKED_DRAFT_FIELDS.some((field) =>
      String(formData?.[field] || "").trim()
    )
  ) {
    return true;
  }

  const siblings = formData?.siblings || [];
  return siblings.some(
    (sibling) =>
      String(sibling?.name || "").trim() ||
      String(sibling?.cg_id || "").trim() ||
      String(sibling?.roll_no || "").trim()
  );
};
