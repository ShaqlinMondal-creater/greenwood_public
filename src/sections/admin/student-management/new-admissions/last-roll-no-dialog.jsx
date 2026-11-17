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

const LastRollNoDialog = ({
  open,
  onClose,
  lastRollData,
  academicYearName,
}) => {
  const rows = Array.isArray(lastRollData?.rows) ? lastRollData.rows : [];

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
          <Typography variant="h6">Last Roll No</Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
        {academicYearName ? (
          <Typography variant="body2">
            Academic Year: {academicYearName}
            {lastRollData?.year_code
              ? ` (roll code ${lastRollData.year_code})`
              : ""}
          </Typography>
        ) : null}
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            mb: 2,
            p: 1.5,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
          }}
        >
          <Box sx={{ minWidth: 180 }}>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Last Application No
            </Typography>
            <Typography sx={{ fontWeight: 700 }}>
              {lastRollData?.last_application_no || "—"}
            </Typography>
          </Box>
          <Box sx={{ minWidth: 180 }}>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Next Application No
            </Typography>
            <Typography sx={{ fontWeight: 700 }}>
              {lastRollData?.next_application_no || "—"}
            </Typography>
          </Box>
          <Box sx={{ minWidth: 100 }}>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Applications
            </Typography>
            <Typography sx={{ fontWeight: 700 }}>
              {lastRollData?.application_count ?? 0}
            </Typography>
          </Box>
        </Box>

        <TableContainer sx={{ overflowY: "auto", maxHeight: "500px" }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Sl. No</TableCell>
                <TableCell>Series</TableCell>
                <TableCell>Prefix</TableCell>
                <TableCell sx={{ textAlign: "center" }}>Last Roll</TableCell>
                <TableCell sx={{ textAlign: "center" }}>Next Roll</TableCell>
                <TableCell sx={{ textAlign: "center" }}>Count</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length > 0 ? (
                rows.map((row, index) => (
                  <TableRow key={row.series || index} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{row.label || ""}</TableCell>
                    <TableCell>{row.prefix || "—"}</TableCell>
                    <TableCell
                      sx={{ textAlign: "center", fontWeight: 700 }}
                    >
                      {row.last_roll || "—"}
                    </TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      {row.next_roll || "—"}
                    </TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      {row.count ?? 0}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: "center", py: 3 }}>
                    <Typography color="text.secondary">
                      No roll data available
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

LastRollNoDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  academicYearName: PropTypes.string,
  lastRollData: PropTypes.shape({
    ay_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    year_code: PropTypes.string,
    application_code: PropTypes.string,
    last_application_no: PropTypes.string,
    next_application_no: PropTypes.string,
    application_count: PropTypes.number,
    rows: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string,
        series: PropTypes.string,
        prefix: PropTypes.string,
        last_roll: PropTypes.string,
        next_roll: PropTypes.string,
        count: PropTypes.number,
      })
    ),
  }),
};

export default memo(LastRollNoDialog);
