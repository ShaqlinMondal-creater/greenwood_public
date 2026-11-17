import PropTypes from "prop-types";
import { Delete, MoreVert } from "@mui/icons-material";
import {
  Avatar,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";
import Iconify from "../../../../components/iconify/iconify";
import { useState } from "react";
import { toast } from "react-toastify";
import useAuth from "../../../../hooks/useAuth";
import ConfirmationDialog from "../../../../components/confirmation-dialog/confirmation-dialog";
import AddNewTeacherModal from "./modals/add-new-teacher";
import ViewTeacherModal from "./modals/view-teacher-modal";
import { deleteTeacher } from "../../../../services/admin/teacher.service";

const ROLE_LABELS = {
  is_class_teacher: "Class Teacher",
  is_co_class_teacher: "Co-Class Teacher",
  is_coordinator: "Coordinator",
  is_academic_head: "Academic Head",
  is_hod: "HOD",
  is_subject_teacher: "Subject Teacher",
  is_admin_staff: "Admin Staff",
  is_other_staff: "Other Staff",
};

const getActiveRoleLabels = (row) =>
  Object.keys(ROLE_LABELS)
    .filter((key) => row?.[key] === "1" || row?.[key] === 1)
    .map((key) => ROLE_LABELS[key]);

const AllTeachersTableRow = ({
  row,
  refetch,
  index,
  page,
  rowsPerPage,
  genderList,
  bloodGroupList,
}) => {
  const { logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleViewModalOpen = () => {
    setSelectedTeacherId(row?.id);
    setViewModalOpen(true);
    handleMenuClose();
  };

  const handleViewModalClose = () => {
    setViewModalOpen(false);
    setSelectedTeacherId(null);
  };

  const handleEditModalOpen = () => {
    setSelectedTeacherId(row?.id);
    setEditModalOpen(true);
    handleMenuClose();
  };

  const handleEditModalClose = () => {
    setEditModalOpen(false);
    setSelectedTeacherId(null);
  };

  const handleConfirmationModalOpen = () => {
    setConfirmationModalOpen(true);
  };

  const handleConfirmationModalClose = () => {
    setConfirmationModalOpen(false);
    handleMenuClose();
  };

  const handleDelete = async () => {
    setIsDeleteLoading(true);
    const response = await deleteTeacher(row);
    setIsDeleteLoading(false);

    if (response?.code === 200) {
      handleConfirmationModalClose();
      toast.success(response?.message || "Teacher deleted successfully!");
      refetch();
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Some error occurred.");
    }
  };

  const activeRoles = getActiveRoleLabels(row);

  return (
    <>
      <TableRow hover tabIndex={-1} key={row?.id}>
        <TableCell>{page * rowsPerPage + index + 1 || ""}</TableCell>

        <TableCell>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar
              src={row?.photo_url || ""}
              alt={row?.name || "Teacher"}
              sx={{ width: 36, height: 36 }}
            />
            <Typography variant="body2">{row?.name || "-"}</Typography>
          </Box>
        </TableCell>
        <TableCell>{row?.email || "-"}</TableCell>
        <TableCell>{row?.mobile || "-"}</TableCell>

        <TableCell>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, maxWidth: 280 }}>
            {activeRoles.length > 0 ? (
              activeRoles.map((role) => (
                <Chip key={role} label={role} size="small" variant="outlined" />
              ))
            ) : (
              <Typography variant="body2">-</Typography>
            )}
          </Box>
          {row?.is_class_teacher === "1" &&
          (row?.class_teacher_class_names || []).length > 0 ? (
            <Typography variant="caption" color="text.secondary" display="block">
              Class Teacher: {(row.class_teacher_class_names || []).join(", ")}
            </Typography>
          ) : row?.is_class_teacher === "1" && row?.class_name ? (
            <Typography variant="caption" color="text.secondary" display="block">
              Class: {row.class_name}
            </Typography>
          ) : null}
          {row?.is_co_class_teacher === "1" &&
          (row?.co_class_teacher_class_names || []).length > 0 ? (
            <Typography variant="caption" color="text.secondary" display="block">
              Co-Class: {(row.co_class_teacher_class_names || []).join(", ")}
            </Typography>
          ) : null}
        </TableCell>

        <TableCell align="center">
          <IconButton onClick={handleMenuOpen}>
            <MoreVert />
          </IconButton>
        </TableCell>
      </TableRow>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        sx={{ color: "primary.main" }}
      >
        <MenuItem onClick={handleViewModalOpen} sx={{ color: "primary.main" }}>
          <Iconify icon="mdi:eye-outline" sx={{ mr: 1 }} />
          View
        </MenuItem>
        <MenuItem onClick={handleEditModalOpen} sx={{ color: "primary.main" }}>
          <Iconify icon="basil:edit-outline" sx={{ mr: 1 }} />
          Update
        </MenuItem>
        <MenuItem
          onClick={handleConfirmationModalOpen}
          sx={{ color: "primary.main" }}
        >
          <Delete fontSize="small" sx={{ cursor: "pointer", mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      <ConfirmationDialog
        open={confirmationModalOpen}
        onCancel={handleConfirmationModalClose}
        onConfirm={handleDelete}
        isLoading={isDeleteLoading}
        title="Are you sure you want to delete this teacher?"
      />

      <ViewTeacherModal
        open={viewModalOpen}
        onClose={handleViewModalClose}
        teacherId={selectedTeacherId}
      />

      <AddNewTeacherModal
        open={editModalOpen}
        onClose={handleEditModalClose}
        refetch={refetch}
        teacherId={selectedTeacherId}
        genderList={genderList || []}
        bloodGroupList={bloodGroupList || []}
      />
    </>
  );
};

AllTeachersTableRow.propTypes = {
  row: PropTypes.object,
  refetch: PropTypes.func,
  index: PropTypes.number,
  page: PropTypes.number,
  rowsPerPage: PropTypes.number,
  genderList: PropTypes.array,
  bloodGroupList: PropTypes.array,
};

export default AllTeachersTableRow;
