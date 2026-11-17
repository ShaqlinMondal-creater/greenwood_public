import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  Box,
} from "@mui/material";
import { Close, Print } from "@mui/icons-material";
import PropTypes from "prop-types";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { toast } from "react-toastify";

const ImagePreviewModal = ({
  open,
  onClose,
  imageUrl,
  imageAlt = "Image Preview",
}) => {
  const printRef = useRef(null);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: imageAlt,
    onAfterPrint: () => {
      // no-op
    },
    removeAfterPrint: true,
  });

  const onPrintClick = () => {
    try {
      handlePrint();
    } catch (error) {
      console.error("Print error:", error);
      toast.error("Failed to print image");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md">
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 2,
          bgcolor: "primary.main",
          color: "primary.contrastText",
        }}
      >
        <Typography variant="h6" component="div">
          {imageAlt}
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          {imageUrl && (
            <IconButton
              onClick={onPrintClick}
              sx={{ color: "primary.contrastText" }}
              title="Print"
            >
              <Print />
            </IconButton>
          )}
          <IconButton
            onClick={onClose}
            sx={{ color: "primary.contrastText" }}
            title="Close"
          >
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "500px",
          }}
        >
          {imageUrl ? (
            <Box
              component="img"
              ref={printRef}
              src={imageUrl}
              alt={imageAlt}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
          ) : (
            <Typography color="text.secondary">No image available</Typography>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

ImagePreviewModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  imageUrl: PropTypes.string,
  imageAlt: PropTypes.string,
};

export default ImagePreviewModal;
