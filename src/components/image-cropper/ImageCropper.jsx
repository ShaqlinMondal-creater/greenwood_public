import PropTypes from "prop-types";
import { useState, useRef, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
} from "@mui/material";
import ReactCrop from "react-image-crop";

const ImageCropper = ({
  open,
  src,
  fileName,
  isFixedAspectRatio = false,
  onApply,
  onClose,
}) => {
  const FIXED_ASPECT = 35 / 45; // default to 35:45 if no override
  const imgRef = useRef(null);
  const [crop, setCrop] = useState({
    unit: "%",
    width: 50,
    aspect: isFixedAspectRatio ? FIXED_ASPECT : undefined,
  });
  const [completedCrop, setCompletedCrop] = useState(null);

  useEffect(() => {
    // update crop aspect when fixed/aspectOverride change
    setCrop((prev) => ({
      ...prev,
      aspect: isFixedAspectRatio ? FIXED_ASPECT : undefined,
    }));
  }, [isFixedAspectRatio, FIXED_ASPECT]);

  const onLoad = useCallback(
    (img) => {
      imgRef.current = img;
      try {
        const displayW = img.width || img.naturalWidth || 0;
        const displayH = img.height || img.naturalHeight || 0;
        if (displayW > 0 && displayH > 0) {
          const widthPercent = 50;
          const aspectValue = isFixedAspectRatio ? FIXED_ASPECT : undefined;
          let heightPercent = aspectValue
            ? (widthPercent * displayW) / (aspectValue * displayH)
            : widthPercent;
          if (!Number.isFinite(heightPercent) || heightPercent <= 0)
            heightPercent = widthPercent;
          if (heightPercent > 100) heightPercent = 100;
          const x = Math.max(0, (100 - widthPercent) / 2);
          const y = Math.max(0, (100 - heightPercent) / 2);
          const initial = {
            unit: "%",
            x,
            y,
            width: widthPercent,
            height: heightPercent,
            aspect: aspectValue,
          };
          setCrop(initial);
          setCompletedCrop(initial);
        }
      } catch {
        // ignore
      }
    },
    [isFixedAspectRatio, FIXED_ASPECT]
  );

  // sanitize crop object coming from ReactCrop
  const sanitizeCrop = (c) => {
    if (!c)
      return {
        unit: "%",
        width: 50,
        aspect: isFixedAspectRatio ? FIXED_ASPECT : undefined,
      };
    const parse = (v) => {
      if (v == null) return NaN;
      if (typeof v === "number") return v;
      if (typeof v === "string") {
        const s = v.trim();
        if (s.endsWith("%")) return parseFloat(s.slice(0, -1));
        if (s.endsWith("px")) return parseFloat(s.slice(0, -2));
        return parseFloat(s);
      }
      return NaN;
    };

    const unit = c.unit === "px" ? "px" : "%";
    if (unit === "%") {
      let x = parse(c.x);
      let y = parse(c.y);
      let width = parse(c.width);
      let height = parse(c.height);
      if (!Number.isFinite(width) || width <= 0) width = 50;
      if (!Number.isFinite(height) || height <= 0) height = width;
      if (!Number.isFinite(x)) x = 0;
      if (!Number.isFinite(y)) y = 0;
      x = Math.min(100, Math.max(0, x));
      y = Math.min(100, Math.max(0, y));
      width = Math.min(100, Math.max(0.1, width));
      height = Math.min(100, Math.max(0.1, height));
      return {
        unit: "%",
        x,
        y,
        width,
        height,
        aspect: isFixedAspectRatio ? FIXED_ASPECT : undefined,
      };
    }

    // px units
    let x = parse(c.x);
    let y = parse(c.y);
    let width = parse(c.width);
    let height = parse(c.height);
    if (!Number.isFinite(width) || width <= 0) width = 1;
    if (!Number.isFinite(height) || height <= 0) height = width;
    if (!Number.isFinite(x)) x = 0;
    if (!Number.isFinite(y)) y = 0;
    return {
      unit: "px",
      x,
      y,
      width: Math.max(1, width),
      height: Math.max(1, height),
      aspect: isFixedAspectRatio ? FIXED_ASPECT : undefined,
    };
  };

  // create cropped File from completedCrop
  const generateCroppedFile = async (cropRegion) => {
    if (!imgRef.current) return null;
    const image = imgRef.current;
    const canvas = document.createElement("canvas");

    let region = cropRegion;
    if (!region) {
      // full image
      region = {
        x: 0,
        y: 0,
        width: image.width || image.naturalWidth,
        height: image.height || image.naturalHeight,
        unit: "px",
      };
    }

    if (region.unit === "%" || region.unit === undefined) {
      const displayW = image.width || image.naturalWidth || 1;
      const displayH = image.height || image.naturalHeight || 1;
      region = {
        x: Math.round((region.x / 100) * displayW),
        y: Math.round((region.y / 100) * displayH),
        width: Math.round((region.width / 100) * displayW),
        height: Math.round((region.height / 100) * displayH),
      };
    }

    const scaleX =
      image.naturalWidth / (image.width || image.naturalWidth || 1);
    const scaleY =
      image.naturalHeight / (image.height || image.naturalHeight || 1);
    const rawW = Math.max(1, Math.floor(region.width * scaleX));
    const rawH = Math.max(1, Math.floor(region.height * scaleY));
    const MAX_OUTPUT = 2000;
    let outW = rawW;
    let outH = rawH;
    if (outW > MAX_OUTPUT || outH > MAX_OUTPUT) {
      const s = Math.min(MAX_OUTPUT / outW, MAX_OUTPUT / outH);
      outW = Math.max(1, Math.floor(outW * s));
      outH = Math.max(1, Math.floor(outH * s));
    }
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, outW, outH);

    ctx.drawImage(
      image,
      region.x * scaleX,
      region.y * scaleY,
      region.width * scaleX,
      region.height * scaleY,
      0,
      0,
      outW,
      outH
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return resolve(null);
        const base = (fileName || "image").replace(/\.[^/.]+$/, "");
        const file = new File([blob], `${base}.jpg`, { type: "image/jpeg" });
        resolve(file);
      }, "image/jpeg");
    });
  };

  const handleApply = async () => {
    const file = await generateCroppedFile(completedCrop);
    if (file && onApply) onApply(file);
  };

  return (
    <Dialog open={!!open} onClose={onClose} maxWidth="sm">
      <DialogTitle sx={{ mb: 1 }}>Crop Image</DialogTitle>
      <DialogContent
        sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
      >
        <Box>
          {src && (
            <Box
              component={ReactCrop}
              aspect={isFixedAspectRatio ? FIXED_ASPECT : undefined}
              crop={crop}
              onChange={(c) => setCrop(sanitizeCrop(c))}
              onComplete={(c) => setCompletedCrop(sanitizeCrop(c))}
              circularCrop={false}
              sx={{
                maxHeight: 400,
              }}
            >
              <Box
                component="img"
                alt="To be cropped"
                src={src}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
                ref={imgRef}
                onLoad={(e) => onLoad(e.currentTarget)}
              />
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={handleApply}>
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
};

ImageCropper.propTypes = {
  open: PropTypes.bool,
  src: PropTypes.string,
  fileName: PropTypes.string,
  isFixedAspectRatio: PropTypes.bool,
  aspectOverride: PropTypes.number,
  defaultWidth: PropTypes.number,
  onApply: PropTypes.func,
  onClose: PropTypes.func,
};

export default ImageCropper;
