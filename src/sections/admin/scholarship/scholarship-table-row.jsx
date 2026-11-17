import PropTypes from "prop-types";
import { useState } from "react";
import { MoreVert } from "@mui/icons-material";
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
import Iconify from "../../../components/iconify/iconify";
import {
  normalizeScholarshipStatus,
  scholarshipStatusColor,
} from "./scholarship-utils";

const displayValue = (value) => {
  const text = String(value ?? "").trim();
  return text || "-";
};

const ScholarshipTableRow = ({
  row,
  index,
  page,
  rowsPerPage,
  onViewDetails,
  onUpdateStatus,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleViewDetails = () => {
    handleMenuClose();
    onViewDetails?.(row);
  };

  const handleUpdate = () => {
    handleMenuClose();
    onUpdateStatus?.(row);
  };

  return (
    <>
      <TableRow hover tabIndex={-1}>
        <TableCell>{page * rowsPerPage + index + 1}</TableCell>
        <TableCell sx={{ whiteSpace: "nowrap" }}>
          {displayValue(row?.class_roll_no_section)}
        </TableCell>
        <TableCell>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Avatar
              alt={row?.student_full_name || "Student"}
              sx={{ width: 26, height: 26, fontSize: 12 }}
            >
              {(row?.student_full_name || "?").charAt(0).toUpperCase()}
            </Avatar>
            <Typography
              variant="body2"
              onClick={() => onViewDetails?.(row)}
              sx={{
                fontWeight: 600,
                cursor: "pointer",
                color: "primary.main",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              {displayValue(row?.student_full_name)}
            </Typography>
          </Box>
        </TableCell>
        <TableCell>{displayValue(row?.mobile)}</TableCell>
        <TableCell>{displayValue(row?.student_email)}</TableCell>
        <TableCell>{displayValue(row?.admission_reg_no)}</TableCell>
        <TableCell>{displayValue(row?.is_orphan)}</TableCell>
        <TableCell>{displayValue(row?.is_disabled)}</TableCell>
        <TableCell>
          <Chip
            size="small"
            label={normalizeScholarshipStatus(row?.application_status)}
            color={scholarshipStatusColor(row?.application_status)}
            variant="outlined"
            sx={{ height: 22, fontSize: 11, fontWeight: 600 }}
          />
        </TableCell>
        <TableCell sx={{ whiteSpace: "nowrap" }}>
          {displayValue(row?.timestamp)}
        </TableCell>
        <TableCell align="center" sx={{ py: 0 }}>
          <IconButton size="small" onClick={handleMenuOpen}>
            <MoreVert fontSize="small" />
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
      >
        <MenuItem onClick={handleViewDetails} sx={{ color: "primary.main" }}>
          <Iconify icon="mdi:eye-outline" sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleUpdate} sx={{ color: "primary.main" }}>
          <Iconify icon="basil:edit-outline" sx={{ mr: 1 }} />
          Update
        </MenuItem>
      </Menu>
    </>
  );
};

ScholarshipTableRow.propTypes = {
  row: PropTypes.object,
  index: PropTypes.number,
  page: PropTypes.number,
  rowsPerPage: PropTypes.number,
  onViewDetails: PropTypes.func,
  onUpdateStatus: PropTypes.func,
};

export default ScholarshipTableRow;
