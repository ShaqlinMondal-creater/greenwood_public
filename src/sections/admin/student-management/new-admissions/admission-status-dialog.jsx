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

const AdmissionStatusDialog = ({
  open,
  onClose,
  admissionStatusData,
  academicYearList,
}) => {
  // Find the academic year name based on ay_id
  const currentAcademicYear = academicYearList?.find(
    (year) => Number(year.ay_id) === admissionStatusData?.ay_id
  );

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
          <Typography variant="h6">Admission Status</Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>

        {currentAcademicYear?.ay_name && (
          <Typography variant="body2">
            Academic Year: {currentAcademicYear.ay_name}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent>
        <TableContainer sx={{ overflowY: "auto", maxHeight: "500px" }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Sl. No</TableCell>
                <TableCell>Class</TableCell>
                <TableCell sx={{ textAlign: "center" }}>
                  Admissions Count
                </TableCell>
                <TableCell sx={{ textAlign: "center" }}>Selected</TableCell>
                <TableCell sx={{ textAlign: "center" }}>Admitted</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {admissionStatusData?.counts?.length > 0 ? (
                <>
                  {admissionStatusData.counts.map((row, index) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{row.cg_name}</TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        {row.total || "0"}
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        {row.selected_count || "0"}
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        {row.completed_count || "0"}
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Grand Total Row */}
                  {admissionStatusData?.grand_total !== undefined && (
                    <TableRow>
                      <TableCell></TableCell>
                      <TableCell>Grand Total</TableCell>
                      <TableCell sx={{ textAlign: "center", fontWeight: 600 }}>
                        {admissionStatusData.grand_total || "0"}
                      </TableCell>
                      <TableCell sx={{ textAlign: "center", fontWeight: 600 }}>
                        {admissionStatusData.selected_total || "0"}
                      </TableCell>
                      <TableCell sx={{ textAlign: "center", fontWeight: 600 }}>
                        {admissionStatusData.completed_total || "0"}
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ) : (
                <TableRow>
                  <TableCell colSpan={3} sx={{ textAlign: "center", py: 3 }}>
                    <Typography color="text.secondary">
                      No admission data available
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

AdmissionStatusDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  academicYearList: PropTypes.arrayOf(
    PropTypes.shape({
      ay_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      ay_name: PropTypes.string,
    })
  ),
  admissionStatusData: PropTypes.shape({
    ay_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    grand_total: PropTypes.number,
    selected_total: PropTypes.number,
    completed_total: PropTypes.number,
    counts: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number,
        cg_id: PropTypes.string,
        cg_name: PropTypes.string,
        total: PropTypes.number,
        selected_count: PropTypes.number,
        completed_count: PropTypes.number,
      })
    ),
  }),
};

export default memo(AdmissionStatusDialog);
