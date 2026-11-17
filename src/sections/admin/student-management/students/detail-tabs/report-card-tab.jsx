import PropTypes from "prop-types";
import { Fragment } from "react";
import {
  Box,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import Iconify from "../../../../../components/iconify/iconify";
import Loader from "../../../../../components/loader/loader";
import MessageBox from "../../../../../components/error/message-box";
import { useGetApi } from "../../../../../hooks/useGetApi";
import { getStudentReportCards } from "../../../../../services/admin/students-management.service";
import { BASE_URL } from "../../../../../services/api.request";

const formatAttendance = (term) => {
  if (term?.attendance) return term.attendance;
  if (term?.attendance_present != null && term?.attendance_total != null) {
    return `${term.attendance_present}/${term.attendance_total}`;
  }
  if (term?.attendance_present != null) return String(term.attendance_present);
  return "—";
};

const ReportCardTab = ({ detail }) => {
  const {
    dataList: reportCardYears,
    isLoading,
    isError,
    errorMessage,
  } = useGetApi({
    apiFunction: getStudentReportCards,
    body: { st_id: detail?.id },
    dependencies: [detail?.id],
    skip: !detail?.id,
  });

  const handlePrint = (printPath) => {
    window.open(
      `${BASE_URL}${printPath}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  if (isLoading) {
    return <Loader />;
  }

  if (isError) {
    return <MessageBox errorMessage={errorMessage} />;
  }

  if (!reportCardYears?.length) {
    return (
      <Box sx={{ py: 2, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          No report cards found for this student.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {reportCardYears.map((yearGroup) => (
        <Box
          key={yearGroup?.ay_id}
          sx={{
            border: "1px solid #b1b1b1",
            borderRadius: 1,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              px: 1.5,
              py: 0.75,
              bgcolor: "primary.main",
              color: "primary.contrastText",
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {yearGroup?.ay_name || "Academic Year"}
            </Typography>
          </Box>

          <TableContainer>
            <Table size="small" sx={{ minWidth: 560 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ py: 0.75, fontWeight: 600, width: "28%" }}>
                    Class
                  </TableCell>
                  <TableCell sx={{ py: 0.75, fontWeight: 600, width: "16%" }}>
                    Term
                  </TableCell>
                  <TableCell sx={{ py: 0.75, fontWeight: 600, width: "14%" }}>
                    Report Date
                  </TableCell>
                  <TableCell sx={{ py: 0.75, fontWeight: 600, width: "12%" }}>
                    Overall %
                  </TableCell>
                  <TableCell sx={{ py: 0.75, fontWeight: 600, width: "14%" }}>
                    Attendance
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ py: 0.75, fontWeight: 600, width: "16%" }}
                  >
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {yearGroup?.classes?.map((classGroup) => {
                  const terms = classGroup?.terms || [];
                  const summary = classGroup?.attendance_summary;
                  const hasSummary = Boolean(summary?.display);
                  const rowSpan = terms.length + (hasSummary ? 1 : 0);

                  return (
                    <Fragment key={classGroup?.cg_id}>
                      {terms.map((term, termIndex) => (
                        <TableRow
                          key={`${classGroup?.cg_id}-${term?.term_id}`}
                          hover
                          sx={{
                            "& td": { py: 0.6, fontSize: "0.8125rem" },
                          }}
                        >
                          {termIndex === 0 ? (
                            <TableCell rowSpan={rowSpan}>
                              {classGroup?.cg_name || "N/A"}
                            </TableCell>
                          ) : null}
                          <TableCell>{term?.term_name}</TableCell>
                          <TableCell>
                            {term?.report_date
                              ? dayjs(term.report_date).format("DD-MM-YYYY")
                              : "—"}
                          </TableCell>
                          <TableCell>
                            {term?.overall_percentage != null
                              ? `${Number(term.overall_percentage).toFixed(2)}%`
                              : "—"}
                          </TableCell>
                          <TableCell>{formatAttendance(term)}</TableCell>
                          <TableCell align="right">
                            <Link
                              component="button"
                              type="button"
                              underline="hover"
                              onClick={() => handlePrint(term?.print_path)}
                              sx={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 0.5,
                                color: "primary.main",
                                fontSize: "0.8125rem",
                                fontWeight: 600,
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                              }}
                            >
                              <Iconify icon="mdi:printer" width={15} />
                              Print
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}

                      {hasSummary ? (
                        <TableRow
                          sx={{
                            bgcolor: "action.hover",
                            "& td": {
                              py: 0.7,
                              fontSize: "0.8125rem",
                              fontWeight: 700,
                              borderBottom: 0,
                            },
                          }}
                        >
                          <TableCell colSpan={3} align="right">
                            Total Attendance
                            {summary?.percentage != null
                              ? ` (${Number(summary.percentage).toFixed(1)}%)`
                              : ""}
                          </TableCell>
                          <TableCell>{summary.display}</TableCell>
                          <TableCell />
                        </TableRow>
                      ) : null}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ))}
    </Box>
  );
};

ReportCardTab.propTypes = {
  detail: PropTypes.object,
};

export default ReportCardTab;
