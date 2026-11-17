const DRIVE_ID_PATTERNS = [
  /drive\.google\.com\/file\/d\/([^/]+)/i,
  /[?&]id=([^&]+)/i,
  /drive\.google\.com\/thumbnail\?id=([^&]+)/i,
];

export const isHttpUrl = (value) =>
  /^https?:\/\//i.test(String(value || "").trim());

export const extractDriveId = (url) => {
  const text = String(url || "").trim();
  if (!text) return "";
  for (const pattern of DRIVE_ID_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1];
  }
  return "";
};

export const driveViewUrl = (url) => {
  const id = extractDriveId(url);
  if (id) return `https://drive.google.com/file/d/${id}/view`;
  return isHttpUrl(url) ? String(url).trim() : "";
};

export const driveDownloadUrl = (url) => {
  const id = extractDriveId(url);
  if (id) return `https://drive.google.com/uc?export=download&id=${id}`;
  return isHttpUrl(url) ? String(url).trim() : "";
};

export const driveImageSources = (url) => {
  const text = String(url || "").trim();
  const id = extractDriveId(text);
  const sources = [];
  if (id) {
    sources.push(`https://drive.google.com/thumbnail?id=${id}&sz=w400`);
    sources.push(`https://lh3.googleusercontent.com/d/${id}`);
    sources.push(`https://drive.google.com/uc?export=view&id=${id}`);
  } else if (isHttpUrl(text)) {
    sources.push(text);
  }
  return [...new Set(sources)];
};

export const isSensitiveField = (field) => {
  const text = `${field?.key || ""} ${field?.label || ""}`.toLowerCase();
  return /aadhaar|aadhar|voter|epic|mobile|email|phone/.test(text);
};

export const STATUS_OPTIONS = ["Pending", "Completed", "Rejected"];

export const normalizeScholarshipStatus = (value) => {
  const text = String(value || "").trim().toLowerCase();
  if (["completed", "complete", "done"].includes(text)) return "Completed";
  if (["rejected", "reject"].includes(text)) return "Rejected";
  return "Pending";
};

export const scholarshipStatusColor = (value) => {
  const status = normalizeScholarshipStatus(value);
  if (status === "Completed") return "success";
  if (status === "Rejected") return "error";
  return "warning";
};

export const scholarshipRowKey = (row) =>
  `${row?.timestamp || ""}|${row?.mobile || ""}|${row?.student_full_name || ""}`;
