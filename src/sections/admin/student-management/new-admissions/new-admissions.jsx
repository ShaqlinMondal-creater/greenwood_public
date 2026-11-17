import { useState } from "react";

import Card from "@mui/material/Card";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import Typography from "@mui/material/Typography";
import TableContainer from "@mui/material/TableContainer";
import TablePagination from "@mui/material/TablePagination";

import TableNoData from "../../../../components/table/table-no-data";
import TableEmptyRows from "../../../../components/table/table-empty-rows";

import {
  getAllAcademicYears,
  getClasses,
  getNewAdmissions,
  exportNewAdmissions,
} from "../../../../services/admin/students-management.service";
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  Menu,
  MenuItem,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import { ExpandLessRounded, ExpandMoreRounded } from "@mui/icons-material";
import { useGetApi } from "../../../../hooks/useGetApi";
import {
  CLASS_LIST,
  DEFAULT_LIMIT,
  emptyRows,
  ROWS_PER_PAGE_OPTIONS,
} from "../../../../utils/constants";
import Loader from "../../../../components/loader/loader";
import MessageBox from "../../../../components/error/message-box";
import dayjs from "dayjs";
import { Helmet } from "react-helmet-async";
import {
  getAdmissionStatus,
  getAdmittedClassStatus,
  getLastRollNumbers,
} from "../../../../services/new-admission.service";
import AdmissionStatusDialog from "./admission-status-dialog";
import { DatePicker } from "@mui/x-date-pickers";
import AdmittedClassStatusDialog from "./admitted-class-status-dialog";
import LastRollNoDialog from "./last-roll-no-dialog";
import useAuth from "../../../../hooks/useAuth";
import NewAdmissionsTableRow from "./new-admissions-table-row";
import { toast } from "react-toastify";
import Iconify from "../../../../components/iconify/iconify";
// ----------------------------------------------------------------------

const HEAD_LABEL = [
  { id: "sn", label: "SN" },
  { id: "application_no", label: "Application No" },
  { id: "child", label: "Child" },
  { id: "ad_paid", label: "Form Fee" },
  { id: "afee_paid", label: "Admission Fee" },
  { id: "april_fee_paid", label: "April Fee" },
  { id: "interview_date", label: "Interview Date", align: "center" },
  { id: "action", label: "Action", align: "center" },
];

const PRINT_STATUS_LIST = [
  { label: "Printed", value: "1" },
  { label: "Not Printed", value: "0" },
];

const ADMISSION_STATUS_FILTER_OPTIONS = [
  "Pending Form Fee",
  "Form Fee Paid",
  "Written Test",
  "Interview Scheduled",
  "Rejected",
  "Selected",
  "Admission Fee Paid",
  "Documents Submitted",
  "Admitted to School",
];

export default function NewAdmissions() {
  const { userInfo, logout } = useAuth();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_LIMIT);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState({
    class: null,
    year: null,
    interview_date: null,
    printed: null,
    status: [],
    session_roll: false,
  });
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const [isExportLoading, setIsExportLoading] = useState(false);

  // Dialog state for admission status
  const [admissionStatusDialogOpen, setAdmissionStatusDialogOpen] =
    useState(false);

  // Dialog state for admitted class status
  const [admittedClassStatusDialogOpen, setAdmittedClassStatusDialogOpen] =
    useState(false);

  // Dialog state for last roll numbers
  const [lastRollNoDialogOpen, setLastRollNoDialogOpen] = useState(false);

  const selectedStatuses = Array.isArray(filter?.status)
    ? filter.status
    : filter?.status
      ? [filter.status]
      : [];

  const sessionRollYearCode = (() => {
    const ay = filter?.year;
    if (ay?.ay_start_year) {
      return String(ay.ay_start_year).slice(-2);
    }
    const nameMatch = String(ay?.ay_name || "").match(/(20\d{2})/);
    if (nameMatch?.[1]) {
      return nameMatch[1].slice(-2);
    }
    // Default current session 2026-27
    return "26";
  })();

  const dataSendToBackend = {
    search,
    ...filter,
    class: filter?.class?.cg_id || "",
    year: Number(filter?.year?.ay_id) || "",
    interview_date: filter?.interview_date
      ? dayjs(filter?.interview_date).format("YYYY-MM-DD")
      : null,
    printed: filter?.printed?.value || "",
    status: selectedStatuses,
    session_roll: filter?.session_roll ? 1 : 0,
  };

  // api to get new admissions list

  const {
    dataList: newAdmissionsList,
    dataCount: newAdmissionsCount,
    allResponse,
    isLoading,
    isError,
    errorMessage,
    refetch,
  } = useGetApi({
    apiFunction: getNewAdmissions,
    body: {
      ...dataSendToBackend,
      offset: page * rowsPerPage,
      limit: rowsPerPage,
    },
    dependencies: [page, rowsPerPage, search, filter],
    debounceDelay: 500,
  });

  // api to get academicYearList
  const { dataList: academicYearList } = useGetApi({
    apiFunction: getAllAcademicYears,
  });

  // api to get classList

  const { dataList: classList } = useGetApi({
    apiFunction: getClasses,
    body: {
      ay_id: userInfo?.ay_id,
    },
  });

  const selectedAyId =
    Number(filter?.year?.ay_id) || Number(userInfo?.ay_id) || null;

  // Admission Status / Admitted Class Status follow selected academic year
  const { dataList: admissionStatusList } = useGetApi({
    apiFunction: selectedAyId ? getAdmissionStatus : null,
    body: { ay_id: selectedAyId },
    dependencies: [selectedAyId],
    skip: !selectedAyId,
  });

  const { dataList: admittedClassStatusList } = useGetApi({
    apiFunction: selectedAyId ? getAdmittedClassStatus : null,
    body: { ay_id: selectedAyId },
    dependencies: [selectedAyId],
    skip: !selectedAyId,
  });

  const { dataList: lastRollData } = useGetApi({
    apiFunction: selectedAyId ? getLastRollNumbers : null,
    body: { ay_id: selectedAyId },
    dependencies: [selectedAyId],
    skip: !selectedAyId,
  });

  const selectedAcademicYearName =
    filter?.year?.ay_name ||
    academicYearList?.find((y) => Number(y?.ay_id) === Number(selectedAyId))
      ?.ay_name ||
    "";

  // Dialog handlers for admission status
  const handleAdmissionStatusOpen = () => {
    setAdmissionStatusDialogOpen(true);
  };

  const handleAdmissionStatusClose = () => {
    setAdmissionStatusDialogOpen(false);
  };
  // Dialog handlers for admitted class status
  const handleAdmittedClassStatusOpen = () => {
    setAdmittedClassStatusDialogOpen(true);
  };

  const handleAdmittedClassStatusClose = () => {
    setAdmittedClassStatusDialogOpen(false);
  };

  const handleLastRollNoOpen = () => {
    setLastRollNoDialogOpen(true);
  };

  const handleLastRollNoClose = () => {
    setLastRollNoDialogOpen(false);
  };

  const handleStatusClick = (newStatus) => {
    setPage(0);
    // "Total Applied" clears status filter (show all)
    if (newStatus === "Total Applied") {
      setFilter((prevState) => ({ ...prevState, status: [] }));
      return;
    }
    setFilter((prevState) => {
      const current = Array.isArray(prevState.status)
        ? prevState.status
        : prevState.status
          ? [prevState.status]
          : [];
      const exists = current.includes(newStatus);
      return {
        ...prevState,
        status: exists
          ? current.filter((s) => s !== newStatus)
          : [...current, newStatus],
      };
    });
  };

  // change to next or prev page

  const handleChangePage = (_, newPage) => {
    if (!isLoading) setPage(newPage);
  };

  // change rows per page
  const handleChangeRowsPerPage = (event) => {
    setPage(0);
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  // for searching
  const handleSearch = (event) => {
    setPage(0);
    setSearch(event.target.value);
  };

  // for filtering
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFilter((prevState) => ({ ...prevState, [name]: value }));
    setPage(0); // Reset page to 0 whenever a filter is changed
  };

  const handleExportMenuOpen = (event) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportAnchorEl(null);
  };

  const handleExport = async (type) => {
    handleExportMenuClose();
    setIsExportLoading(true);
    const response = await exportNewAdmissions({
      ...dataSendToBackend,
      type,
    });
    setIsExportLoading(false);

    if (response?.code === 200) {
      const link = document.createElement("a");
      link.href = response?.data?.file_url || "";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(response?.message || "File downloaded successfully!");
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Some error occurred.");
    }
  };

  // if no search result is found
  const notFound = !newAdmissionsCount && !!search;

  return (
    <>
      <Helmet>
        <title>New Admissions | GREENWOOD</title>
      </Helmet>
      <Card sx={{ p: 2, width: "100%" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            width: "100%",
          }}
        >
          <Typography variant="h6">New Admissions</Typography>
          {/* Status Bar  */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 2,
              borderRadius: "10px",
              bgcolor: "primary.light",
              color: "primary.dark",
              overflow: "auto",
              maxWidth: "calc(100% - 200px)",
              border: `1px solid`,
              borderColor: "primary.main",
            }}
          >
            {typeof allResponse?.status_summary === "object" &&
              Object.keys(allResponse?.status_summary || {}).map(
                (key, index) => (
                  <Box
                    key={key + index}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 0.5,
                      height: "80px",
                    }}
                  >
                    {index !== 0 && (
                      <Divider
                        orientation="vertical"
                        flexItem
                        sx={{
                          bgcolor: "primary.main",
                          width: "1px",
                          height: "100%",
                        }}
                      />
                    )}
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 0.5,
                        px: 0.5,
                        cursor: "pointer",
                        borderRadius: 1,
                        bgcolor:
                          key === "Total Applied"
                            ? selectedStatuses.length === 0
                              ? "primary.main"
                              : "transparent"
                            : selectedStatuses.includes(key)
                              ? "primary.main"
                              : "transparent",
                        color:
                          key === "Total Applied"
                            ? selectedStatuses.length === 0
                              ? "primary.contrastText"
                              : "inherit"
                            : selectedStatuses.includes(key)
                              ? "primary.contrastText"
                              : "inherit",
                      }}
                      onClick={() => handleStatusClick(key)}
                    >
                      <Typography variant="h6" sx={{ textAlign: "center" }}>
                        {allResponse?.status_summary[key]}
                      </Typography>
                      <Typography
                        sx={{
                          textAlign: "center",
                          fontSize: "12px",
                          fontWeight: "fontWeightMedium",
                        }}
                      >
                        {key}
                      </Typography>
                    </Box>
                  </Box>
                ),
              )}
            {typeof allResponse?.status_summary === "object" &&
              Object.keys(allResponse?.status_summary || {}).length === 0 && (
                <Typography variant="body2">No status available</Typography>
              )}
          </Box>
        </Box>

        {/* Search and Filters */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 2,
              my: 2,
            }}
          >
            <TextField
              value={search || ""}
              onChange={handleSearch}
              placeholder="Search by Name or Roll No..."
              size="small"
              sx={{ width: "200px" }}
            />

            <Autocomplete
              options={academicYearList || []}
              getOptionLabel={(option) => option?.ay_name || ""}
              renderInput={(params) => (
                <TextField {...params} label="Select Year" size="small" />
              )}
              value={filter?.year || null}
              onChange={(_, newValue) =>
                handleChange({ target: { name: "year", value: newValue } })
              }
              sx={{ width: "200px" }}
            />

            <Autocomplete
              options={CLASS_LIST || []}
              getOptionLabel={(option) => option?.cg_name || ""} // it is necessary for searching the options
              renderInput={(params) => (
                <TextField {...params} label="Class" size="small" />
              )}
              value={filter?.class || null}
              onChange={(_, newValue) =>
                handleChange({
                  target: { name: "class", value: newValue },
                })
              }
              sx={{ minWidth: "200px" }}
            />

            {/* New filter for Printed Status */}
            <Autocomplete
              options={PRINT_STATUS_LIST || []}
              getOptionLabel={(option) => option?.label || ""}
              renderInput={(params) => (
                <TextField {...params} label="Printed Status" size="small" />
              )}
              value={filter?.printed || null}
              onChange={(_, newValue) =>
                handleChange({ target: { name: "printed", value: newValue } })
              }
              sx={{ width: "200px" }}
            />

            <Autocomplete
              multiple
              disableCloseOnSelect
              options={ADMISSION_STATUS_FILTER_OPTIONS}
              getOptionLabel={(option) => option || ""}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Admission Status"
                  size="small"
                  placeholder={
                    selectedStatuses.length ? "" : "Select status"
                  }
                />
              )}
              value={selectedStatuses}
              onChange={(_, newValue) =>
                handleChange({
                  target: { name: "status", value: newValue || [] },
                })
              }
              sx={{ minWidth: "260px", maxWidth: "420px" }}
            />

            <DatePicker
              label="Interview Date"
              value={
                filter?.interview_date ? dayjs(filter?.interview_date) : null
              }
              onChange={(newValue) => {
                handleChange({
                  target: { name: "interview_date", value: newValue },
                });
              }}
              slotProps={{
                textField: {
                  size: "small",
                },
              }}
              sx={{ width: "200px" }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(filter?.session_roll)}
                  onChange={(event) =>
                    handleChange({
                      target: {
                        name: "session_roll",
                        value: event.target.checked,
                      },
                    })
                  }
                  size="small"
                />
              }
              label={`Include session rolls (${sessionRollYearCode}… / C${sessionRollYearCode}… / H${sessionRollYearCode}… + school)`}
              sx={{ ml: 0.5, whiteSpace: "nowrap" }}
            />
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Button
              variant="contained"
              onClick={handleExportMenuOpen}
              endIcon={
                exportAnchorEl ? (
                  <ExpandLessRounded />
                ) : (
                  <ExpandMoreRounded />
                )
              }
              disabled={isExportLoading}
            >
              {isExportLoading ? <CircularProgress size={22} /> : "Export"}
            </Button>
            <Menu
              anchorEl={exportAnchorEl}
              open={Boolean(exportAnchorEl)}
              onClose={handleExportMenuClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              <MenuItem
                onClick={() => handleExport("excel")}
                sx={{ color: "primary.main" }}
              >
                <Iconify icon="uiw:file-excel" sx={{ mr: 1 }} />
                Export Excel
              </MenuItem>
              <MenuItem
                onClick={() => handleExport("pdf")}
                sx={{ color: "primary.main" }}
              >
                <Iconify icon="uiw:file-pdf" sx={{ mr: 1 }} />
                Export PDF
              </MenuItem>
            </Menu>
            <Button variant="outlined" onClick={handleAdmissionStatusOpen}>
              Admission Status
            </Button>
            <Button variant="outlined" onClick={handleAdmittedClassStatusOpen}>
              Admitted Class Status
            </Button>
            <Button variant="outlined" onClick={handleLastRollNoOpen}>
              Last Roll No
            </Button>
          </Box>
        </Box>

        {/* Table */}

        {isLoading ? (
          <Loader />
        ) : isError ? (
          <MessageBox errorMessage={errorMessage} />
        ) : (
          <TableContainer sx={{ overflowY: "unset" }}>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  {HEAD_LABEL?.map((headCell) => (
                    <TableCell
                      key={headCell?.id}
                      align={headCell?.align || "left"}
                      sx={{
                        width: headCell?.width,
                        minWidth: headCell?.minWidth,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {headCell?.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {newAdmissionsList?.map((row, index) => {
                  return (
                    <NewAdmissionsTableRow
                      key={page * rowsPerPage + index}
                      row={row}
                      dataSendToBackend={dataSendToBackend}
                      classList={classList}
                      academicYearList={academicYearList}
                      selectedAcademicYear={filter?.year || null}
                      refetch={refetch}
                    />
                  );
                })}

                <TableEmptyRows
                  height={77}
                  emptyRows={emptyRows(page, rowsPerPage, newAdmissionsCount)}
                />

                {notFound && <TableNoData query={search} />}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Pagination */}

        <TablePagination
          page={page}
          component="div"
          count={newAdmissionsCount}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      {/* Admission Status Dialog */}
      <AdmissionStatusDialog
        open={admissionStatusDialogOpen}
        onClose={handleAdmissionStatusClose}
        admissionStatusData={admissionStatusList}
        academicYearList={academicYearList}
      />

      {/* Admitted Class Status Dialog */}
      <AdmittedClassStatusDialog
        open={admittedClassStatusDialogOpen}
        onClose={handleAdmittedClassStatusClose}
        admittedClassStatusData={admittedClassStatusList}
        academicYearName={selectedAcademicYearName}
      />

      {/* Last Roll No Dialog */}
      <LastRollNoDialog
        open={lastRollNoDialogOpen}
        onClose={handleLastRollNoClose}
        lastRollData={lastRollData}
        academicYearName={selectedAcademicYearName}
      />
    </>
  );
}
