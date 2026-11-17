import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  CancelOutlined,
  ContentCopy,
  Download,
  OpenInNew,
} from "@mui/icons-material";
import {
  driveViewUrl,
  isHttpUrl,
  isSensitiveField,
  normalizeScholarshipStatus,
  scholarshipStatusColor,
} from "../scholarship-utils";
import {
  downloadCompressedScholarshipFile,
  downloadCompressedScholarshipZip,
  previewScholarshipFile,
} from "../scholarship.service";

const SECTION_ORDER = [
  "Student",
  "Family",
  "Disability",
  "Permanent Address",
  "Present Address",
  "Identity Documents",
  "Academic & Fees",
];

const SHORT_LABELS = {
  "Student Full Name": "Full Name",
  "Student Email": "Email",
  "Single Girl Child": "Single Girl Child",
  "Parents Alive?": "Parents Alive",
  "Is Orphan": "Orphan",
  "Legal Guardian Name": "Legal Guardian",
  "Is Disabled": "Disabled",
  "Percentage of Disability": "% Disability",
  "Type of Disability": "Disability Type",
  "Father's Profession": "Father Profession",
  "Mother's Profession": "Mother Profession",
  "GP Name / Ward No.": "GP / Ward",
  "Village / Town": "Village / Town",
  "House / Lane No.": "House / Lane",
  "Is Present Address same as Permanent Address?": "Same as Permanent",
  "Aadhaar Number": "Student Aadhaar",
  "Mother’s/Father’s/Legal Guardian Aadhaar Number": "Guardian Aadhaar",
  "Mother's/Father's/Legal Guardian Aadhaar Number": "Guardian Aadhaar",
  "Father's Voter Card (EPIC)": "Father Voter ID",
  "Mother's Voter Card (EPIC)": "Mother Voter ID",
  "Legal Guardian Voter Card (EPIC)": "Guardian Voter ID",
  "Student's Voter Card (EPIC)": "Student Voter ID",
  "Course Start Date": "Course Start",
  "Admission/Reg. No.": "Admission No.",
  "Admission/Reg. Year": "Admission Year",
  "Class Roll No/Section": "Class / Roll",
  "Mode of Study": "Mode of Study",
  "Admission Fees (Rs.)": "Admission Fees",
  "Tution Fees (Rs.)": "Tuition Fees",
  "Misc. Fees (Rs.)": "Misc. Fees",
};

const displayValue = (value) => {
  const text = String(value ?? "").trim();
  return text || "-";
};

const shortLabel = (label) => SHORT_LABELS[label] || label;

const flattenFields = (row) =>
  (row?.sections || []).flatMap((section) =>
    (section.fields || []).map((field) => ({
      ...field,
      section: section.title,
    }))
  );

const copyText = async (value, label) => {
  const text = String(value ?? "").trim();
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label || "Value"} copied`);
  } catch {
    toast.error("Could not copy");
  }
};

const CopyButton = ({ value, label }) => {
  const text = String(value ?? "").trim();
  if (!text || text === "-") return null;

  return (
    <Tooltip title="Copy">
      <IconButton
        size="small"
        onClick={() => copyText(text, label)}
        sx={{ p: 0.25, ml: 0.25, color: "primary.main" }}
      >
        <ContentCopy sx={{ fontSize: 14 }} />
      </IconButton>
    </Tooltip>
  );
};

CopyButton.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  label: PropTypes.string,
};

const DrivePreview = ({ url, alt, size = 72 }) => {
  const [src, setSrc] = useState("");
  const [loading, setLoading] = useState(() => isHttpUrl(url));

  useEffect(() => {
    let cancelled = false;
    let objectUrl = "";

    if (!isHttpUrl(url)) {
      setSrc("");
      setLoading(false);
      return undefined;
    }

    setSrc("");
    setLoading(true);

    previewScholarshipFile(url).then((blob) => {
      if (cancelled) return;
      if (!blob) {
        setLoading(false);
        return;
      }
      objectUrl = URL.createObjectURL(blob);
      if (cancelled) {
        URL.revokeObjectURL(objectUrl);
        objectUrl = "";
        return;
      }
      setSrc(objectUrl);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  if (loading) {
    return (
      <Box
        sx={{
          width: size,
          height: size,
          flexShrink: 0,
          borderRadius: 1,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "action.hover",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress size={18} />
      </Box>
    );
  }

  if (!src) {
    return (
      <Box
        sx={{
          width: size,
          height: size,
          flexShrink: 0,
          borderRadius: 1,
          bgcolor: isHttpUrl(url) ? "primary.lighter" : "action.hover",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: isHttpUrl(url) ? "primary.main" : "text.disabled",
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        FILE
      </Box>
    );
  }

  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        objectFit: "cover",
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "action.hover",
      }}
    />
  );
};

DrivePreview.propTypes = {
  url: PropTypes.string,
  alt: PropTypes.string,
  size: PropTypes.number,
};

const DetailField = ({ label, value, copyable }) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: "132px 1fr",
      columnGap: 1,
      alignItems: "start",
      py: 0.4,
      px: 0.5,
      borderBottom: "1px solid",
      borderColor: "divider",
      minWidth: 0,
    }}
  >
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ lineHeight: 1.35, pt: 0.15 }}
    >
      {shortLabel(label)}
    </Typography>
    <Box sx={{ display: "flex", alignItems: "flex-start", minWidth: 0 }}>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 600,
          lineHeight: 1.35,
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
        }}
      >
        {displayValue(value)}
      </Typography>
      {copyable ? <CopyButton value={value} label={shortLabel(label)} /> : null}
    </Box>
  </Box>
);

DetailField.propTypes = {
  label: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  copyable: PropTypes.bool,
};

const SectionBlock = ({ title, children }) => (
  <Box
    sx={{
      border: "1px solid",
      borderColor: "divider",
      borderRadius: 1,
      overflow: "hidden",
      height: "100%",
    }}
  >
    <Typography
      variant="caption"
      sx={{
        display: "block",
        px: 1,
        py: 0.5,
        bgcolor: "primary.main",
        color: "primary.contrastText",
        fontWeight: 700,
        letterSpacing: 0.3,
        textTransform: "uppercase",
      }}
    >
      {title}
    </Typography>
    <Box sx={{ px: 0.5, py: 0.25 }}>{children}</Box>
  </Box>
);

SectionBlock.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
};

const DocumentCard = ({ label, url, isPhoto }) => {
  const hasFile = isHttpUrl(url);
  const viewUrl = driveViewUrl(url);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleCompressedDownload = async () => {
    if (!hasFile || isDownloading) return;
    setIsDownloading(true);
    const response = await downloadCompressedScholarshipFile({
      file_url: url,
      file_name: label,
    });
    setIsDownloading(false);
    if (response?.code && response.code !== 200) {
      toast.error(response?.message || "Failed to fit file into 110–290 KB.");
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        p: 1,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        minWidth: 0,
      }}
    >
      <DrivePreview url={url} alt={label} size={isPhoto ? 96 : 72} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
          {label}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          {hasFile ? "Uploaded · download as 110–290 KB JPG" : "Not uploaded"}
        </Typography>
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 0.75,
          flexShrink: 0,
        }}
      >
        <Button
          size="small"
          variant="contained"
          disabled={!hasFile}
          href={hasFile ? viewUrl || url : undefined}
          target="_blank"
          rel="noopener noreferrer"
          endIcon={<OpenInNew sx={{ fontSize: 14 }} />}
          sx={{ whiteSpace: "nowrap", py: 0.45, px: 1.1 }}
        >
          Open in new tab
        </Button>
        <Button
          size="small"
          variant="outlined"
          disabled={!hasFile || isDownloading}
          onClick={handleCompressedDownload}
          endIcon={
            isDownloading ? (
              <CircularProgress size={14} />
            ) : (
              <Download sx={{ fontSize: 14 }} />
            )
          }
          sx={{ whiteSpace: "nowrap", py: 0.45, px: 1.1 }}
        >
          {isDownloading ? "Compressing..." : "Download 110–290 KB JPG"}
        </Button>
      </Box>
    </Box>
  );
};

DocumentCard.propTypes = {
  label: PropTypes.string,
  url: PropTypes.string,
  isPhoto: PropTypes.bool,
};

const ViewScholarshipDetailsModal = ({ open, onClose, row }) => {
  const [isZipDownloading, setIsZipDownloading] = useState(false);
  const allFields = flattenFields(row);
  const documentFields = allFields.filter(
    (field) =>
      field.section === "Documents" || field.type === "link" || isHttpUrl(field.value)
  );
  const declarationField = allFields.find((field) => field.key === "declaration");
  const detailFields = allFields.filter(
    (field) =>
      field.key !== "declaration" &&
      field.section !== "Documents" &&
      field.type !== "link" &&
      !isHttpUrl(field.value) &&
      field.key !== "timestamp"
  );

  const grouped = SECTION_ORDER.map((title) => ({
    title,
    fields: detailFields.filter((field) => field.section === title),
  })).filter((section) => section.fields.length > 0);

  const otherFields = detailFields.filter(
    (field) => !SECTION_ORDER.includes(field.section)
  );
  if (otherFields.length) {
    grouped.push({ title: "Other", fields: otherFields });
  }

  const photoField = documentFields.find(
    (field) => field.key === "copy_of_applicant_photo"
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: { xs: "96vw", md: "92vw" },
          maxWidth: 1280,
          height: { xs: "94vh", md: "90vh" },
          position: "relative",
        },
      }}
    >
      <CancelOutlined
        sx={{
          position: "absolute",
          right: 10,
          top: 10,
          color: "primary.contrastText",
          fontSize: "24px",
          cursor: "pointer",
          zIndex: 1,
        }}
        onClick={onClose}
      />
      <Box
        sx={{
          px: 2,
          py: 1,
          bgcolor: "primary.main",
          color: "primary.contrastText",
          fontWeight: 600,
        }}
      >
        Scholarship Application Details
      </Box>

      <DialogContent sx={{ p: 1.5, overflow: "auto" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            mb: 1.5,
            p: 1,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
          }}
        >
          <DrivePreview
            url={photoField?.value || row?.photo_url}
            alt={row?.student_full_name || "Student"}
            size={56}
          />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {displayValue(row?.student_full_name)}
            </Typography>
            <Chip
              size="small"
              label={normalizeScholarshipStatus(row?.application_status)}
              color={scholarshipStatusColor(row?.application_status)}
              variant="outlined"
              sx={{ mt: 0.5, height: 22, fontWeight: 600 }}
            />
            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.5, mt: 0.25 }}>
              <Typography variant="body2" color="text.secondary">
                {displayValue(row?.class_roll_no_section)}
                {"  |  Admission: "}
                {displayValue(row?.admission_reg_no)}
                {"  |  "}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {displayValue(row?.mobile)}
              </Typography>
              <CopyButton value={row?.mobile} label="Mobile" />
              <Typography variant="body2" color="text.secondary">
                {" | "}
                {displayValue(row?.student_email)}
              </Typography>
              <CopyButton value={row?.student_email} label="Email" />
            </Box>
          </Box>
          <Box sx={{ textAlign: "right", pr: 1, flexShrink: 0 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Submitted On
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {displayValue(row?.timestamp)}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 1.25,
          }}
        >
          {grouped.map((section) => (
            <Box key={section.title}>
              <SectionBlock title={section.title}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: section.fields.length > 3 ? "1fr 1fr" : "1fr",
                    },
                  }}
                >
                  {section.fields.map((field) => (
                    <DetailField
                      key={`${section.title}-${field.key}`}
                      label={field.label}
                      value={field.value}
                      copyable={isSensitiveField(field)}
                    />
                  ))}
                </Box>
              </SectionBlock>
            </Box>
          ))}
        </Box>

        {documentFields.length > 0 && (
          <Box sx={{ mt: 1.5 }}>
            <SectionBlock title="Documents">
              <Box sx={{ display: "flex", justifyContent: "flex-end", px: 0.75, pt: 0.75 }}>
                <Button
                  size="small"
                  variant="contained"
                  disabled={
                    isZipDownloading ||
                    !documentFields.some((field) => isHttpUrl(field.value))
                  }
                  onClick={async () => {
                    const files = documentFields
                      .filter((field) => isHttpUrl(field.value))
                      .map((field) => ({
                        file_url: String(field.value).trim(),
                        file_name: shortLabel(field.label) || field.label,
                      }));
                    if (!files.length) return;
                    setIsZipDownloading(true);
                    const response = await downloadCompressedScholarshipZip({
                      student_name: row?.student_full_name || "scholarship",
                      files,
                    });
                    setIsZipDownloading(false);
                    if (response?.code && response.code !== 200) {
                      toast.error(
                        response?.message ||
                          "Failed to fit documents into 110–290 KB."
                      );
                    }
                  }}
                  startIcon={
                    isZipDownloading ? <CircularProgress size={14} color="inherit" /> : <Download />
                  }
                >
                  {isZipDownloading
                    ? "Compressing all..."
                    : "Download all 110–290 KB JPG"}
                </Button>
              </Box>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                  gap: 1,
                  p: 0.75,
                }}
              >
                {documentFields.map((field) => (
                  <DocumentCard
                    key={field.key}
                    label={shortLabel(field.label) || field.label}
                    url={String(field.value || "").trim()}
                    isPhoto={field.key === "copy_of_applicant_photo"}
                  />
                ))}
              </Box>
            </SectionBlock>
          </Box>
        )}

        {declarationField && (
          <Box sx={{ mt: 1.5 }}>
            <SectionBlock title="Declaration">
              <Typography
                variant="body2"
                sx={{
                  p: 1,
                  lineHeight: 1.45,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {displayValue(declarationField.value)}
              </Typography>
            </SectionBlock>
          </Box>
        )}

        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1.5 }}>
          <Button variant="contained" onClick={onClose}>
            Close
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

ViewScholarshipDetailsModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  row: PropTypes.object,
};

export default ViewScholarshipDetailsModal;
