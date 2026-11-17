import PropTypes from "prop-types";
import { memo, useState } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import UploadImageIcon from "../../../assets/icons/UploadImageIcon.svg";
import ImageCropper from "../../../components/image-cropper/ImageCropper";
import InsertDriveFile from "@mui/icons-material/InsertDriveFile";
import Delete from "@mui/icons-material/Delete";
import { toast } from "react-toastify";
// import useAuth from "../../../hooks/useAuth";
// import { uploadStudentImage } from "../../../services/admin/students-management.service";
import Iconify from "../../../components/iconify/iconify";

/**
 * AttachmentsTab component that allows users to upload and view file attachments.
 * @param {Object} props - Component props.
 * @param {Object} props.detail - Detail object (unused).
 * @param {string} props.title - Title for the upload section.
 * @param {Object} props.attachments - Current attachments state from parent.
 * @returns {JSX.Element} The rendered component.
 */
const AttachmentsTab = ({
  title,
  setAttachments,
  attachments,
  isRequired = true,
}) => {
  const theme = useTheme();

  const FIXED_ASPECT = 35 / 45;

  // Image crop state
  const [imageForCrop, setImageForCrop] = useState(null); // original File
  const [imageSrc, setImageSrc] = useState(null); // data URL for preview
  const [showCropper, setShowCropper] = useState(false);

  // Map title to corresponding key in attachments state
  const getAttachmentKey = (title) => {
    switch (title) {
      case "Child's Photo":
        return "child_photo";
      case "Father's Photo":
        return "father_photo";
      case "Mother's Photo":
        return "mother_photo";
      case "Guardian's Photo":
        return "guardian_photo";
      case "Family Photo":
        return "family_photo";
      case "Birth Certificate":
        return "birth_certificate";
      case "Previous Report Card":
        return "previous_report";
      case "Father's Aadhaar Card":
        return "father_aadhar_card";
      case "Mother's Aadhaar Card":
        return "mother_aadhar_card";
      case "Guardian's Aadhaar Card":
        return "guardian_aadhar_card";
      default:
        return null;
    }
  };

  // Get the current file from parent state instead of local state
  const attachmentKey = getAttachmentKey(title);
  const file = attachments?.[attachmentKey] || null;

  /**
   * Returns the appropriate icon for a given file based on its type.
   * @param {Object} file - The file object.
   * @returns {JSX.Element} The icon element.
   */
  const getFileIcon = (file) => {
    if (file?.type?.includes("pdf") || file?.file_ext === "pdf")
      return <Iconify icon="vscode-icons:file-type-pdf2" width={150} />;
    if (
      file?.type?.includes("excel") ||
      file?.name?.endsWith(".xls") ||
      file?.name?.endsWith(".xlsx") ||
      file?.file_ext === "xlsx"
    )
      return <Iconify icon="vscode-icons:file-type-excel2" width={150} />;
    if (
      file?.type?.includes("word") ||
      file?.name?.endsWith(".doc") ||
      file?.name?.endsWith(".docx") ||
      file?.file_ext === "docx"
    )
      return <Iconify icon="vscode-icons:file-type-word" width={150} />;
    return (
      <InsertDriveFile sx={{ color: "primary.main", fontSize: "150px" }} />
    ); // Default icon
  };

  /**
   * Handles the file upload event.
   * @param {Event} event - The change event from the file input.
   */
  const handleFileUpload = (event) => {
    const selectedFile = event.target.files[0];

    if (!selectedFile) return;

    // Check file size (2MB — matches backend max:2048)
    if (selectedFile.size > 2 * 1024 * 1024) {
      toast.warning("File size should not exceed 2MB.");
      event.target.value = ""; // Reset input
      return;
    }

    const key = getAttachmentKey(title);
    // All image uploads open crop UI
    if (selectedFile.type.startsWith("image/") && key) {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result);
        setImageForCrop(selectedFile);
        setShowCropper(true);
      });
      reader.readAsDataURL(selectedFile);
    } else if (key) {
      // Non-image files (pdf etc.) set directly
      setAttachments((prev) => ({
        ...prev,
        [key]: selectedFile,
      }));
    }

    event.target.value = ""; // Reset input
  };

  // Crop callbacks for global ImageCropper
  const handleCropApply = (file) => {
    const key = getAttachmentKey(title);
    if (!key) return;
    setAttachments((prev) => ({ ...prev, [key]: file }));
    setImageForCrop(null);
    setImageSrc(null);
    setShowCropper(false);
  };

  const handleCropClose = () => {
    setImageForCrop(null);
    setImageSrc(null);
    setShowCropper(false);
  };

  /**
   * Removes the currently selected file.
   */
  const handleRemoveFile = () => {
    const key = getAttachmentKey(title);
    if (key) {
      setAttachments((prev) => ({
        ...prev,
        [key]: null,
      }));
    }
  };

  const isFixedAspectRatio =
    title === "Child's Photo" ||
    title === "Father's Photo" ||
    title === "Mother's Photo" ||
    title === "Guardian's Photo";

  return (
    <Box>
      {/* Header section with title and upload button */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Typography>{`${!file ? "Upload " : ""}${title}${
          isRequired ? "*" : " (Optional)"
        }`}</Typography>
        {/* {file && <Button variant="contained">Upload</Button>} */}
      </Box>

      {/* File upload area */}
      {!file && (
        <>
          <Box
            component="label"
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              p: 2,
              border: `1px dashed ${theme.palette.primary.lightActive}`,
              borderRadius: "8px",
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            <Box
              component="img"
              src={UploadImageIcon}
              alt="Upload Icon"
              sx={{ width: "30px", height: "30px" }}
            />
            <Box sx={{ color: "primary.main", fontSize: "12px" }}>
              Click to upload{" "}
              <input
                type="file"
                hidden
                onChange={handleFileUpload}
                accept="image/jpg,image/jpeg,application/pdf"
              />
            </Box>
            <Typography sx={{ fontSize: "10px", color: "neutralCool.dark" }}>
              JPG / PDF (Less than 2MB)
            </Typography>
          </Box>
          {title === "Family Photo" && (
            <Typography
              sx={{
                fontSize: "10px",
                color: "info.main",
                textAlign: "center",
                mt: "4px",
              }}
            >
              Should have child, father, mother & any other siblings
            </Typography>
          )}
        </>
      )}

      {/* Global ImageCropper - opens as dialog when an image is selected */}
      <ImageCropper
        open={!!imageSrc && showCropper}
        src={imageSrc}
        fileName={imageForCrop?.name}
        isFixedAspectRatio={isFixedAspectRatio}
        aspect={1}
        circular={true}
        onApply={handleCropApply}
        onClose={handleCropClose}
      />

      {/* Display uploaded file */}
      {file && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 4,
            my: 2,
          }}
        >
          <Box
            sx={{
              width: 200,
              height: isFixedAspectRatio ? Math.round(200 / FIXED_ASPECT) : 200,
              border: `2px solid ${theme.palette.primary.main}`,
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                bgcolor: "primary.main",
                color: "primary.contrastText",
                p: 0.5,
                width: "100%",
                height: "35px",
              }}
            >
              <Typography variant="body2" noWrap>
                {file?.name}
              </Typography>
              <Delete
                fontSize="small"
                onClick={handleRemoveFile}
                sx={{ cursor: "pointer" }}
              />
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "calc(100% - 35px)",
                p: 0.5,
              }}
            >
              {file?.type?.startsWith("image/") ? (
                <Box
                  component="img"
                  src={URL.createObjectURL(file)}
                  alt={file?.name}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderBottomLeftRadius: "10px",
                    borderBottomRightRadius: "10px",
                  }}
                />
              ) : (
                getFileIcon(file)
              )}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

AttachmentsTab.propTypes = {
  setAttachments: PropTypes.func,
  attachments: PropTypes.object,
  title: PropTypes.string.isRequired,
  isRequired: PropTypes.bool,
};

export default memo(AttachmentsTab);
