import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Typography,
} from "@mui/material";
import { CancelOutlined } from "@mui/icons-material";

const lcFirst = (text) => {
  const value = String(text || "");
  if (!value) return value;
  return value.charAt(0).toLowerCase() + value.slice(1);
};

const personalizeRemark = (name, text) => {
  const studentName = String(name || "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
  let body = String(text || "")
    .trim()
    .replace(/\s+/g, " ");
  if (!body) return "";
  if (studentName) {
    const escaped = studentName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const leadingName = new RegExp(`^${escaped}(?:'s)?(?:\\s+|\\s*$)`, "i");
    let guard = 0;
    while (guard < 5 && leadingName.test(body)) {
      body = body.replace(new RegExp(`^${escaped}(?:'s)?\\s*`, "i"), "").trim();
      guard += 1;
    }
  }
  if (!body) return studentName;
  if (!studentName) return body;
  if (/^His\/Her\s+/i.test(body)) {
    return `${studentName}'s ${body.replace(/^His\/Her\s+/i, "")}`;
  }
  if (/^Is\b/i.test(body)) {
    return `${studentName} ${lcFirst(body)}`;
  }
  if (/^(A|An)\s+/i.test(body)) {
    return `${studentName} is ${lcFirst(body)}`;
  }
  if (/^(The|Parents|Performance|Results)\b/i.test(body)) {
    return body;
  }
  if (/^Social skills\b/i.test(body)) {
    return `${studentName}'s ${lcFirst(body)}`;
  }
  return `${studentName} ${lcFirst(body)}`;
};

export default function RemarksSelectModal({
  open,
  onClose,
  student,
  className,
  bankLabel,
  groups,
  selectedIds,
  readOnly,
  saving,
  onSave,
}) {
  const [checked, setChecked] = useState([]);

  useEffect(() => {
    if (open) {
      setChecked(
        Array.isArray(selectedIds) ? selectedIds.map((id) => Number(id)) : [],
      );
    }
  }, [open, selectedIds]);

  const selectedCount = checked.length;
  const titleName = useMemo(
    () =>
      String(student?.name || student?.st_first_name || "Student")
        .trim()
        .replace(/\s+/g, " ")
        .toUpperCase(),
    [student],
  );
  const sectionName = String(className || "").trim();

  const toggleId = (id) => {
    if (readOnly) return;
    const num = Number(id);
    setChecked((prev) =>
      prev.includes(num) ? prev.filter((item) => item !== num) : [...prev, num],
    );
  };

  return (
    <Dialog
      open={open}
      onClose={!saving ? onClose : null}
      PaperProps={{
        sx: {
          minWidth: { xs: "95vw", sm: "720px" },
          maxWidth: "860px",
          position: "relative",
        },
      }}
    >
      <CancelOutlined
        onClick={!saving ? onClose : undefined}
        sx={{
          position: "absolute",
          right: 8,
          top: 8,
          color: "error.main",
          cursor: saving ? "default" : "pointer",
          zIndex: 1,
        }}
      />
      <DialogContent sx={{ pt: 3, pb: 1 }}>
        <Typography variant="h6" sx={{ pr: 4 }}>
          Remarks — {titleName}
          {sectionName ? ` (${sectionName})` : ""}
        </Typography>
        {bankLabel ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
            {bankLabel}
          </Typography>
        ) : null}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Tick the points that apply. Selected: {selectedCount}
        </Typography>

        <Box sx={{ maxHeight: "62vh", overflowY: "auto", pr: 1 }}>
          {(groups || []).map((group) => (
            <Box key={group.id || group.label} sx={{ mb: 2.5 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  bgcolor: "primary.light",
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 0.5,
                  mb: 0.5,
                  fontWeight: 700,
                  letterSpacing: 0.3,
                }}
              >
                {group.label}
              </Typography>
              {(group.points || []).map((point) => {
                const isChecked = checked.includes(Number(point.id));
                return (
                  <Box
                    key={point.id}
                    onClick={() => toggleId(point.id)}
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 0.5,
                      py: 0.35,
                      cursor: readOnly || saving ? "default" : "pointer",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        minWidth: 28,
                        pt: 0.7,
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {point.id}.
                    </Typography>
                    <Checkbox
                      size="small"
                      checked={isChecked}
                      disabled={readOnly || saving}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => toggleId(point.id)}
                      sx={{ p: 0.5, mt: 0.1 }}
                    />
                    <Typography variant="body2" sx={{ pt: 0.7 }}>
                      {personalizeRemark(titleName, point.text)}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          {readOnly ? "Close" : "Cancel"}
        </Button>
        {!readOnly && (
          <Button
            variant="contained"
            onClick={() => onSave(checked)}
            disabled={saving}
          >
            {saving ? <CircularProgress size={22} /> : "Save Remarks"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

RemarksSelectModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  student: PropTypes.object,
  className: PropTypes.string,
  bankLabel: PropTypes.string,
  groups: PropTypes.array,
  selectedIds: PropTypes.array,
  readOnly: PropTypes.bool,
  saving: PropTypes.bool,
  onSave: PropTypes.func,
};
