import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import PropTypes from "prop-types";
import { memo } from "react";

const AdmittedClassStatusDialog = ({
  open,
  onClose,
  admittedClassStatusData,
  academicYearName,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 0.5 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">Admitted Class Status</Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
        {academicYearName ? (
          <Typography variant="body2">
            Academic Year: {academicYearName}
          </Typography>
        ) : null}
      </DialogTitle>
      <DialogContent>
        <TableContainer sx={{ overflowY: "auto", maxHeight: "500px" }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Sl. No</TableCell>
                <TableCell>Admitted Class</TableCell>
                <TableCell sx={{ textAlign: "center" }}>Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {admittedClassStatusData?.length > 0 ? (
                admittedClassStatusData.map((row, index) => (
                  <TableRow key={index} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{row.admitted_class || ""}</TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      {row.total || "0"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} sx={{ textAlign: "center", py: 3 }}>
                    <Typography color="text.secondary">
                      No admitted class data available
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
    </Dialog>
  );
};

AdmittedClassStatusDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  academicYearName: PropTypes.string,
  admittedClassStatusData: PropTypes.arrayOf(
    PropTypes.shape({
      admitted_class: PropTypes.string,
      total: PropTypes.number,
    })
  ),
};

export default memo(AdmittedClassStatusDialog);
