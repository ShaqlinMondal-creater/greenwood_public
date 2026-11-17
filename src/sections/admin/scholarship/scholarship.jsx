import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";

import Card from "@mui/material/Card";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import Typography from "@mui/material/Typography";
import TableContainer from "@mui/material/TableContainer";
import TablePagination from "@mui/material/TablePagination";
import {
  Box,
  Button,
  Chip,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
} from "@mui/material";

import TableNoData from "../../../components/table/table-no-data";
import TableEmptyRows from "../../../components/table/table-empty-rows";
import Loader from "../../../components/loader/loader";
import MessageBox from "../../../components/error/message-box";
import { useGetApi } from "../../../hooks/useGetApi";
import {
  DEFAULT_LIMIT,
  emptyRows,
  ROWS_PER_PAGE_OPTIONS,
} from "../../../utils/constants";
import { getScholarshipApplications } from "./scholarship.service";
import ScholarshipTableRow from "./scholarship-table-row";
import ViewScholarshipDetailsModal from "./modals/view-scholarship-details-modal";
import UpdateScholarshipStatusModal from "./modals/update-scholarship-status-modal";
import {
  normalizeScholarshipStatus,
  scholarshipRowKey,
} from "./scholarship-utils";

const HEAD_LABEL = [
  { id: "sn", label: "SN" },
  { id: "class_roll_no_section", label: "Class / Roll" },
  { id: "student_full_name", label: "Student Name" },
  { id: "mobile", label: "Mobile" },
  { id: "student_email", label: "Email" },
  { id: "admission_reg_no", label: "Admission No." },
  { id: "is_orphan", label: "Orphan" },
  { id: "is_disabled", label: "Disabled" },
  { id: "status", label: "Status" },
  { id: "timestamp", label: "Submitted On" },
  { id: "action", label: "Action", align: "center" },
];

const matchesSearch = (row, search) => {
  if (!search) return true;
  const q = search.toLowerCase();
  const values = [
    row?.student_full_name,
    row?.mobile,
    row?.student_email,
    row?.class_roll_no_section,
    row?.admission_reg_no,
    row?.legal_guardian_name,
    row?.timestamp,
    row?.application_status,
  ];
  return values.some((value) => String(value || "").toLowerCase().includes(q));
};

export default function Scholarship() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_LIMIT);
  const [search, setSearch] = useState("");
  const [viewRow, setViewRow] = useState(null);
  const [updateRow, setUpdateRow] = useState(null);
  const [statusOverrides, setStatusOverrides] = useState({});

  const {
    dataList,
    isLoading,
    isError,
    errorMessage,
    refetch,
  } = useGetApi({
    apiFunction: getScholarshipApplications,
    body: {},
    dependencies: [],
  });

  const applications = (Array.isArray(dataList) ? dataList : []).map((row) => {
    const override = statusOverrides[scholarshipRowKey(row)];
    return {
      ...row,
      application_status: normalizeScholarshipStatus(
        override || row?.application_status
      ),
    };
  });

  const filteredList = useMemo(
    () => applications.filter((row) => matchesSearch(row, search.trim())),
    [applications, search]
  );

  const pagedList = filteredList.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleSearch = (event) => {
    setPage(0);
    setSearch(event.target.value);
  };

  const handleChangePage = (_, newPage) => {
    if (!isLoading) setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setPage(0);
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  const notFound = !filteredList.length;

  return (
    <>
      <Helmet>
        <title>Scholarship | GREENWOOD</title>
      </Helmet>

      <Card sx={{ p: 1.5, width: "100%" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            flexWrap: "wrap",
            mb: 0.5,
          }}
        >
          <Typography variant="h5">Scholarship</Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip
              label={`Applications: ${applications.length}`}
              color="primary"
              variant="outlined"
              size="small"
            />
            <Button variant="outlined" size="small" onClick={refetch}>
              Refresh
            </Button>
          </Box>
        </Box>

        <TextField
          value={search || ""}
          onChange={handleSearch}
          placeholder="Search by name, mobile, email or admission no."
          size="small"
          sx={{ width: "clamp(240px, 36%, 340px)", mb: 1.25, mt: 0.5 }}
        />

        {isLoading ? (
          <Loader />
        ) : isError ? (
          <MessageBox errorMessage={errorMessage} />
        ) : (
          <TableContainer sx={{ overflowY: "unset" }}>
            <Table
              size="small"
              sx={{
                minWidth: 900,
                "& .MuiTableCell-root": {
                  py: 0.5,
                  px: 1,
                  fontSize: 13,
                  lineHeight: 1.3,
                },
                "& .MuiTableCell-head": {
                  py: 0.75,
                  fontSize: 12.5,
                },
                "& .MuiTableCell-body:first-of-type, & .MuiTableCell-head:first-of-type":
                  {
                    pl: 1.25,
                  },
                "& .MuiTableCell-body:last-of-type, & .MuiTableCell-head:last-of-type":
                  {
                    pr: 0.75,
                  },
              }}
            >
              <TableHead>
                <TableRow>
                  {HEAD_LABEL.map((headCell) => (
                    <TableCell
                      key={headCell.id}
                      align={headCell.align || "left"}
                      sx={{ whiteSpace: "nowrap" }}
                    >
                      <TableSortLabel hideSortIcon>
                        {headCell.label}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {pagedList.map((row, index) => (
                  <ScholarshipTableRow
                    key={row?.id || `${row?.timestamp}-${index}`}
                    index={index}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    row={row}
                    onViewDetails={setViewRow}
                    onUpdateStatus={setUpdateRow}
                  />
                ))}

                <TableEmptyRows
                  height={48}
                  emptyRows={emptyRows(page, rowsPerPage, filteredList.length)}
                />

                {notFound && <TableNoData query={search} />}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <TablePagination
          page={page}
          component="div"
          count={filteredList.length}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      <ViewScholarshipDetailsModal
        open={Boolean(viewRow)}
        row={viewRow}
        onClose={() => setViewRow(null)}
      />
      <UpdateScholarshipStatusModal
        open={Boolean(updateRow)}
        row={updateRow}
        onClose={() => setUpdateRow(null)}
        onUpdated={(nextStatus) => {
          if (!updateRow) return;
          setStatusOverrides((prev) => ({
            ...prev,
            [scholarshipRowKey(updateRow)]: nextStatus,
          }));
          setViewRow((current) =>
            current && scholarshipRowKey(current) === scholarshipRowKey(updateRow)
              ? { ...current, application_status: nextStatus }
              : current
          );
          refetch();
        }}
      />
    </>
  );
}
