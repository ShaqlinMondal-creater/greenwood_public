import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  Grid,
  Typography,
} from "@mui/material";
import { CancelOutlined } from "@mui/icons-material";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import useAuth from "../../../../../hooks/useAuth";
import { getTeacherById } from "../../../../../services/admin/teacher.service";

const ROLE_LABELS = {
  is_class_teacher: "Class Teacher",
  is_co_class_teacher: "Co-Class Teacher",
  is_coordinator: "Coordinator",
  is_academic_head: "Academic Head",
  is_hod: "Head of Department",
  is_subject_teacher: "Subject Teacher",
  is_admin_staff: "Admin Staff",
  is_other_staff: "Other Staff",
};

const DetailItem = ({ label, value }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" display="block">
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.25 }}>
      {value || "-"}
    </Typography>
  </Box>
);

DetailItem.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

const getActiveRoleLabels = (teacher) =>
  Object.keys(ROLE_LABELS)
    .filter((key) => teacher?.[key] === "1" || teacher?.[key] === 1)
    .map((key) => ROLE_LABELS[key]);

const ViewTeacherModal = ({ open, onClose, teacherId }) => {
  const { logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [teacher, setTeacher] = useState(null);

  useEffect(() => {
    if (!open) {
      setTeacher(null);
      return;
    }

    if (!teacherId) {
      toast.error("Teacher id is missing.");
      return;
    }

    let isActive = true;

    const fetchTeacher = async () => {
      setIsLoading(true);
      const response = await getTeacherById(teacherId);

      if (!isActive) return;

      setIsLoading(false);

      if (response?.code === 200) {
        setTeacher(response?.data || null);
      } else if (response?.code === 401) {
        logout(response);
      } else {
        toast.error(response?.message || "Failed to fetch teacher details.");
      }
    };

    fetchTeacher();

    return () => {
      isActive = false;
    };
  }, [open, teacherId, logout]);

  const genderLabel =
    teacher?.gender === "M"
      ? "Male"
      : teacher?.gender === "F"
        ? "Female"
        : "-";

  const activeRoles = getActiveRoleLabels(teacher);

  return (
    <Dialog
      open={open}
      onClose={!isLoading ? onClose : undefined}
      PaperProps={{
        sx: {
          minWidth: { xs: "95vw", sm: "550px", md: "800px", lg: "900px" },
          position: "relative",
        },
      }}
    >
      <CancelOutlined
        sx={{
          position: "absolute",
          right: 8,
          top: 8,
          color: "primary.contrastText",
          fontSize: "24px",
          cursor: "pointer",
        }}
        onClick={!isLoading ? onClose : undefined}
      />
      <Box
        sx={{
          px: 2,
          py: 1,
          bgcolor: "primary.main",
          color: "primary.contrastText",
          textAlign: "center",
          fontWeight: 600,
        }}
      >
        Teacher Details
      </Box>

      <DialogContent>
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar
                  src={teacher?.photo_url || ""}
                  alt={teacher?.name || "Teacher"}
                  sx={{ width: 80, height: 80 }}
                />
                <Box>
                  <Typography variant="h6">{teacher?.name || "-"}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {teacher?.email || "-"}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <DetailItem label="Mobile No" value={teacher?.mobile} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <DetailItem label="Gender" value={genderLabel} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <DetailItem
                label="Date of Birth"
                value={
                  teacher?.dob ? dayjs(teacher.dob).format("YYYY-MM-DD") : "-"
                }
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <DetailItem label="Blood Group" value={teacher?.blood_group} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <DetailItem label="Degree" value={teacher?.degree} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <DetailItem
                label="Class Teacher Classes"
                value={
                  (teacher?.class_teacher_class_names || []).join(", ") ||
                  teacher?.class_name ||
                  "-"
                }
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <DetailItem
                label="Co-Class Teacher Classes"
                value={
                  (teacher?.co_class_teacher_class_names || []).join(", ") || "-"
                }
              />
            </Grid>
            <Grid item xs={12}>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                Roles
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 0.75 }}>
                {activeRoles.length > 0 ? (
                  activeRoles.map((role) => (
                    <Chip key={role} label={role} size="small" color="primary" />
                  ))
                ) : (
                  <Typography variant="body2">-</Typography>
                )}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <DetailItem label="Address" value={teacher?.address} />
            </Grid>
          </Grid>
        )}

        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
          <Button variant="contained" onClick={onClose} disabled={isLoading}>
            Close
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

ViewTeacherModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  teacherId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default ViewTeacherModal;
