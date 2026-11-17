import Card from "@mui/material/Card";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import Typography from "@mui/material/Typography";
import TableContainer from "@mui/material/TableContainer";
import TablePagination from "@mui/material/TablePagination";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";

import TableNoData from "../../../components/table/table-no-data";
import TableEmptyRows from "../../../components/table/table-empty-rows";

import {
  getAllAcademicYears,
  getClasses,
} from "../../../services/admin/students-management.service";
import {
  exportUdise,
  getUdisePreviewData,
  getUdiseStudents,
} from "../../../services/admin/udise.service";
import useAuth from "../../../hooks/useAuth";
import {
  Autocomplete,
  Avatar,
  Box,
  Checkbox,
  Chip,
  Menu,
  MenuItem,
  Stack,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
} from "@mui/material";
import { useGetApi } from "../../../hooks/useGetApi";
import { DEFAULT_LIMIT, emptyRows } from "../../../utils/constants";
import Loader from "../../../components/loader/loader";
import MessageBox from "../../../components/error/message-box";
import { DatePicker } from "@mui/x-date-pickers";
import {
  CheckBox,
  CheckBoxOutlineBlank,
  ExpandLessRounded,
  ExpandMoreRounded,
} from "@mui/icons-material";
import { Helmet } from "react-helmet-async";
import { useState } from "react";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import Iconify from "../../../components/iconify/iconify";
import UdisePreviewModal from "./modals/udise-preview-modal";
import UdisePreviewV3Modal from "./modals/udise-preview-v3-modal";
import MsbStudentModal from "./modals/msb-student-modal";

const STUDENTS_ROWS_PER_PAGE_OPTIONS = [5, 10, 25, 50, 100, 500, 1000, 2200];

const HEAD_LABEL = [
  { id: "st_first_name", label: "Name" },
  { id: "class_name", label: "Class" },
  { id: "st_admitted_class", label: "Admission Class" },
  { id: "st_date_of_admission", label: "Admission Date" },
  { id: "st_roll_no", label: "Roll No" },
  { id: "st_gender", label: "Gender" },
  { id: "st_dob", label: "Date of Birth" },
  { id: "st_mobile", label: "Phone" },
];

const BOHRA_LIST = [
  { label: "Bohra", value: "1" },
  { label: "Non Bohra", value: "0" },
];

const GENDER_LIST = [
  { label: "Male", value: "M" },
  { label: "Female", value: "F" },
];

const STUDENT_TYPE_LIST = [
  { label: "Internal", value: "0" },
  { label: "External", value: "1" },
  { label: "Both", value: "%" },
];

const ON_ROLL_LIST = [
  { label: "On Roll", value: "1" },
  { label: "Off Roll", value: "0" },
];

const IS_PROMOTED_LIST = [
  { label: "Both", value: "%" },
  { label: "Promoted", value: "1" },
  { label: "Not Promoted", value: "0" },
];

const formatDobFilter = (value) => {
  if (!value) return "";
  const d = dayjs(value);
  if (!d.isValid()) return "";
  // Local calendar date only (never UTC ISO)
  return `${d.year()}-${String(d.month() + 1).padStart(2, "0")}-${String(d.date()).padStart(2, "0")}`;
};

export default function Udise() {
  const { userInfo } = useAuth();

  const [selectedRollNos, setSelectedRollNos] = useState([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isExportLoading, setIsExportLoading] = useState(false);
  const [bulkMenuAnchor, setBulkMenuAnchor] = useState(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewModalData, setPreviewModalData] = useState(null);
  const [previewFormatVersion, setPreviewFormatVersion] = useState("v1");
  const [msbModalOpen, setMsbModalOpen] = useState(false);

  // Local filters only — no useStudent / no /student/view
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_LIMIT);
  const [search, setSearch] = useState("");
  const [parentSearch, setParentSearch] = useState("");
  const [bohra, setBohra] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [gender, setGender] = useState(null);
  const [dobFrom, setDobFrom] = useState(null);
  const [dobTo, setDobTo] = useState(null);
  const [academicYear, setAcademicYear] = useState({
    ay_id: userInfo?.ay_id,
    ay_name: userInfo?.ay_name,
  });
  const [stExternal, setStExternal] = useState({
    label: "Internal",
    value: "0",
  });
  const [stOnRoll, setStOnRoll] = useState({
    label: "On Roll",
    value: "1",
  });
  const [isPromoted, setIsPromoted] = useState({
    label: "Both",
    value: "%",
  });

  const selectedCgIds = (selectedOptions || [])
    .map((option) => option?.id)
    .filter((id) => id !== undefined && id !== null && id !== "")
    .join(",");

  const udiseListBody = {
    ay_id: academicYear?.ay_id || userInfo?.ay_id,
    stExternal: stExternal?.value || "0",
    search: search || "",
    parent_search: parentSearch || "",
    bohra: bohra?.value || "",
    cg_id: selectedCgIds,
    gender: gender?.value || "",
    dob_from: dobFrom || "",
    dob_to: dobTo || "",
    st_on_roll: stOnRoll?.value || "1",
    is_promoted: isPromoted?.value || "%",
    offset: page * rowsPerPage,
    limit: rowsPerPage,
  };

  const {
    dataList: studentsListRaw,
    dataCount: studentsCount,
    allResponse,
    isLoading,
    isError,
    errorMessage,
    refetch: refetchUdiseStudents,
  } = useGetApi({
    apiFunction: getUdiseStudents,
    body: udiseListBody,
    dependencies: [
      academicYear,
      stExternal,
      stOnRoll,
      isPromoted,
      page,
      rowsPerPage,
      search,
      parentSearch,
      bohra,
      selectedCgIds,
      gender,
      dobFrom,
      dobTo,
    ],
    debounceDelay: 500,
  });

  const studentsList = Array.isArray(studentsListRaw) ? studentsListRaw : [];
  const missingAadhaarCount = Number(allResponse?.missing_aadhaar_count || 0);

  const { dataList: classList } = useGetApi({
    apiFunction: getClasses,
    body: {
      ay_id: academicYear?.ay_id || userInfo?.ay_id,
    },
    dependencies: [academicYear],
  });

  const { dataList: academicYearList } = useGetApi({
    apiFunction: getAllAcademicYears,
  });

  const handleChangePage = (_, newPage) => {
    if (!isLoading) setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setPage(0);
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  const handleSearch = (event) => {
    setPage(0);
    setSearch(event.target.value);
  };

  const handleParentSearch = (event) => {
    setPage(0);
    setParentSearch(event.target.value);
  };

  const handleSelectionChange = (_, newValues) => {
    setSelectedOptions(newValues || []);
    setPage(0);
  };

  const handleChange = (field, value) => {
    switch (field) {
      case "bohra":
        setBohra(value);
        break;
      case "gender":
        setGender(value);
        break;
      case "dobFrom":
        setDobFrom(formatDobFilter(value) || null);
        break;
      case "dobTo":
        setDobTo(formatDobFilter(value) || null);
        break;
      case "academicYear":
        setAcademicYear(value);
        setSelectedOptions([]);
        break;
      case "st_external":
        setStExternal(value);
        break;
      case "st_on_roll":
        setStOnRoll(value);
        break;
      case "is_promoted":
        setIsPromoted(value);
        break;
      default:
        break;
    }
    setPage(0);
  };

  const handleSelectAllClick = (event) => {
    const pageRollNos = studentsList
      .map((student) => student?.st_roll_no)
      .filter(Boolean);

    if (event.target.checked) {
      setSelectedRollNos((prev) =>
        Array.from(new Set([...prev, ...pageRollNos]))
      );
      return;
    }

    setSelectedRollNos((prev) =>
      prev.filter((rollNo) => !pageRollNos.includes(rollNo))
    );
  };

  const handleRowSelect = (rollNo) => {
    if (!rollNo) return;

    setSelectedRollNos((prev) =>
      prev.includes(rollNo)
        ? prev.filter((item) => item !== rollNo)
        : [...prev, rollNo]
    );
  };

  const handlePreviewPdf = async (formatVersion = "v1") => {
    if (!selectedRollNos.length) {
      toast.info("Please select at least one student");
      return;
    }

    setIsPreviewLoading(true);
    const response = await getUdisePreviewData({
      roll_nos: selectedRollNos.join(","),
      ay_id: Number(academicYear?.ay_id) || userInfo?.ay_id,
    });
    setIsPreviewLoading(false);

    if (response?.code !== 200) {
      toast.error(response?.message || "Failed to load UDISE preview");
      return;
    }

    if (!response?.data?.students?.length) {
      toast.error("No students found for the selected roll numbers.");
      return;
    }

    setPreviewFormatVersion(
      formatVersion === "v2" ? "v2" : formatVersion === "v3" ? "v3" : "v1"
    );
    setPreviewModalData(response?.data || null);
    setPreviewModalOpen(true);
  };

  const handleClosePreviewModal = () => {
    setPreviewModalOpen(false);
    setPreviewModalData(null);
    setPreviewFormatVersion("v1");
  };

  const handleBulkMenuOpen = (event) => {
    setBulkMenuAnchor(event.currentTarget);
  };

  const handleBulkMenuClose = () => {
    setBulkMenuAnchor(null);
  };

  const downloadBlobFile = async (response, fallbackName) => {
    if (response?.code) {
      toast.error(response?.message || "Failed to export UDISE data");
      return false;
    }

    const blob = response?.data;
    if (!(blob instanceof Blob)) {
      toast.error("Failed to export UDISE data");
      return false;
    }

    if (blob.type?.includes("application/json")) {
      const text = await blob.text();
      try {
        const errorData = JSON.parse(text);
        toast.error(errorData?.message || "Failed to export UDISE data");
      } catch {
        toast.error("Failed to export UDISE data");
      }
      return false;
    }

    const header = response?.headers?.["content-disposition"] || "";
    const match = String(header).match(/filename="?([^"]+)"?/i);
    const fileName = match?.[1] || fallbackName;
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return true;
  };

  const handleBulkExport = async (format) => {
    handleBulkMenuClose();
    if (!selectedRollNos.length) {
      toast.info("Please select at least one student");
      return;
    }

    setIsExportLoading(true);
    const response = await exportUdise({
      format,
      roll_nos: selectedRollNos.join(","),
      ay_id: Number(academicYear?.ay_id) || userInfo?.ay_id,
    });
    setIsExportLoading(false);

    const ok = await downloadBlobFile(
      response,
      format === "excel" ? "udise_export.xlsx" : "udise_export.pdf"
    );
    if (ok) {
      toast.success(
        format === "excel"
          ? "UDISE Excel downloaded"
          : "UDISE PDF downloaded"
      );
    }
  };

  const notFound = !studentsCount && (!!search || !!parentSearch);
  const currentPageRollNos = studentsList
    .map((student) => student?.st_roll_no)
    .filter(Boolean);
  const selectedOnPageCount = currentPageRollNos.filter((rollNo) =>
    selectedRollNos.includes(rollNo)
  ).length;

  return (
    <>
      <Helmet>
        <title>UDISE | GREENWOOD</title>
      </Helmet>

      <Card sx={{ p: 2, width: "100%" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1,
            mb: 1,
            flexWrap: "wrap",
          }}
        >
          <Typography>UDISE</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              label={`Total Students: ${studentsCount || 0}`}
              color="primary"
              variant="outlined"
              size="small"
            />
            <Chip
              label={`Missing Aadhaar: ${missingAadhaarCount}`}
              sx={{
                bgcolor: "#ffe0b2",
                borderColor: "#ff9800",
                color: "#e65100",
                fontWeight: 600,
              }}
              variant="outlined"
              size="small"
            />
          </Stack>
        </Box>

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

          <TextField
            value={parentSearch || ""}
            onChange={handleParentSearch}
            placeholder="Search by Parent Name..."
            size="small"
            sx={{ width: "200px" }}
          />

          <Autocomplete
            options={BOHRA_LIST || []}
            getOptionLabel={(option) => option?.label || ""}
            renderInput={(params) => (
              <TextField {...params} label="Bohra/Non-Bohra" size="small" />
            )}
            value={bohra || null}
            onChange={(_, newValue) => handleChange("bohra", newValue)}
            sx={{ width: "200px" }}
          />

          <Autocomplete
            options={GENDER_LIST || []}
            getOptionLabel={(option) => option?.label || ""}
            renderInput={(params) => (
              <TextField {...params} label="Gender" size="small" />
            )}
            value={gender || null}
            onChange={(_, newValue) => handleChange("gender", newValue)}
            sx={{ width: "200px" }}
          />

          <DatePicker
            label="DOB From"
            format="DD-MM-YYYY"
            slotProps={{
              textField: {
                size: "small",
                sx: { width: "200px" },
              },
            }}
            disableFuture
            value={dobFrom ? dayjs(dobFrom) : null}
            onChange={(newDate) => handleChange("dobFrom", newDate)}
          />
          <DatePicker
            label="DOB To"
            format="DD-MM-YYYY"
            slotProps={{
              textField: {
                size: "small",
                sx: { width: "200px" },
              },
            }}
            disableFuture
            value={dobTo ? dayjs(dobTo) : null}
            onChange={(newDate) => handleChange("dobTo", newDate)}
          />

          <Autocomplete
            options={academicYearList || []}
            getOptionLabel={(option) => option?.ay_name || ""}
            renderInput={(params) => (
              <TextField {...params} label="Select Year" size="small" />
            )}
            value={academicYear || null}
            onChange={(_, newValue) => handleChange("academicYear", newValue)}
            sx={{ width: "200px" }}
          />
          <Autocomplete
            options={STUDENT_TYPE_LIST || []}
            getOptionLabel={(option) => option?.label || ""}
            renderInput={(params) => (
              <TextField {...params} label="Student Type" size="small" />
            )}
            value={stExternal || null}
            onChange={(_, newValue) => handleChange("st_external", newValue)}
            sx={{ width: "200px" }}
          />
          <Autocomplete
            options={ON_ROLL_LIST || []}
            getOptionLabel={(option) => option?.label || ""}
            renderInput={(params) => (
              <TextField {...params} label="Student On Roll" size="small" />
            )}
            value={stOnRoll || null}
            onChange={(_, newValue) => handleChange("st_on_roll", newValue)}
            sx={{ width: "200px" }}
          />

          <Autocomplete
            options={IS_PROMOTED_LIST || []}
            getOptionLabel={(option) => option?.label || ""}
            renderInput={(params) => (
              <TextField {...params} label="Is Promoted" size="small" />
            )}
            value={isPromoted || null}
            onChange={(_, newValue) => handleChange("is_promoted", newValue)}
            sx={{ width: "200px" }}
          />

          <Autocomplete
            multiple
            disableCloseOnSelect
            limitTags={1}
            options={classList || []}
            getOptionLabel={(option) => option?.cg_name || ""}
            renderInput={(params) => (
              <TextField {...params} label="Class" size="small" />
            )}
            renderOption={(props, option, { selected }) => (
              <li {...props} key={option?.id}>
                <Checkbox
                  size="small"
                  icon={<CheckBoxOutlineBlank fontSize="small" />}
                  checkedIcon={<CheckBox fontSize="small" />}
                  checked={selected}
                  sx={{ mr: 1 }}
                />
                {option?.cg_name || ""}
              </li>
            )}
            renderTags={(selected, getTagProps) =>
              selected?.map((option, index) => (
                <Chip
                  label={option?.cg_name}
                  size="small"
                  {...getTagProps({ index })}
                  key={option?.id}
                />
              ))
            }
            value={selectedOptions || []}
            onChange={handleSelectionChange}
            sx={{ minWidth: "200px" }}
          />

          <Stack direction="row" spacing={1} sx={{ ml: "auto" }} flexWrap="wrap" useFlexGap>
            <Button
              variant="outlined"
              onClick={() => setMsbModalOpen(true)}
            >
              MSB Student
            </Button>
            <Button
              variant="contained"
              onClick={handleBulkMenuOpen}
              endIcon={
                bulkMenuAnchor ? <ExpandLessRounded /> : <ExpandMoreRounded />
              }
              disabled={isExportLoading || !selectedRollNos.length}
            >
              {isExportLoading ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                "Bulk Actions"
              )}
            </Button>
            <Menu
              anchorEl={bulkMenuAnchor}
              open={Boolean(bulkMenuAnchor)}
              onClose={handleBulkMenuClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              <MenuItem
                onClick={() => handleBulkExport("excel")}
                sx={{ color: "primary.main" }}
              >
                <Iconify icon="uiw:file-excel" sx={{ mr: 1 }} />
                Export as Excel
              </MenuItem>
              <MenuItem
                onClick={() => handleBulkExport("pdf")}
                sx={{ color: "primary.main" }}
              >
                <Iconify icon="uiw:file-pdf" sx={{ mr: 1 }} />
                Export in PDF
              </MenuItem>
            </Menu>
            <Button
              variant="contained"
              onClick={() => handlePreviewPdf("v1")}
              disabled={isPreviewLoading || !selectedRollNos.length}
            >
              {isPreviewLoading ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                "Preview"
              )}
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => handlePreviewPdf("v2")}
              disabled={isPreviewLoading || !selectedRollNos.length}
            >
              {isPreviewLoading ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                "Preview V2"
              )}
            </Button>
            <Button
              variant="outlined"
              onClick={() => handlePreviewPdf("v3")}
              disabled={isPreviewLoading || !selectedRollNos.length}
            >
              {isPreviewLoading ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                "Preview V3"
              )}
            </Button>
          </Stack>
        </Box>

        {isLoading ? (
          <Loader />
        ) : isError ? (
          <MessageBox errorMessage={errorMessage} />
        ) : (
          <TableContainer sx={{ overflowY: "unset" }}>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={
                        selectedOnPageCount > 0 &&
                        selectedOnPageCount < currentPageRollNos.length
                      }
                      checked={
                        currentPageRollNos.length > 0 &&
                        selectedOnPageCount === currentPageRollNos.length
                      }
                      onChange={handleSelectAllClick}
                    />
                  </TableCell>
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
                      <TableSortLabel hideSortIcon>
                        {headCell?.label}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {studentsList.map((row) => (
                  <TableRow
                    hover
                    tabIndex={-1}
                    key={`${row?.id}-${row?.st_roll_no}`}
                    selected={selectedRollNos.includes(row?.st_roll_no)}
                    sx={
                      row?.has_aadhaar === false
                        ? {
                            bgcolor: "#ffe0b2",
                            "&:hover": { bgcolor: "#ffcc80" },
                            "&.Mui-selected": { bgcolor: "#ffb74d" },
                            "&.Mui-selected:hover": { bgcolor: "#ffa726" },
                          }
                        : undefined
                    }
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        disableRipple
                        checked={selectedRollNos.includes(row?.st_roll_no)}
                        onChange={() => handleRowSelect(row?.st_roll_no)}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar
                          alt={`${row?.st_first_name || ""} ${
                            row?.st_last_name || ""
                          }`}
                          src={row?.photo}
                        />
                        <Box>
                          <Typography variant="subtitle2" noWrap>
                            {`${row?.st_first_name || ""} ${
                              row?.st_last_name || ""
                            }`}
                          </Typography>
                          {row?.cisce_no ? (
                            <Typography sx={{ fontSize: "12px" }}>
                              {row.cisce_no}
                            </Typography>
                          ) : null}
                        </Box>
                      </Stack>
                    </TableCell>

                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {row?.class_name || ""}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {row?.st_admitted_class || ""}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {row?.st_date_of_admission || ""}
                    </TableCell>
                    <TableCell>{row?.st_roll_no || ""}</TableCell>
                    <TableCell>{row?.st_gender || ""}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {row?.st_dob || ""}
                    </TableCell>
                    <TableCell>{row?.st_mobile || ""}</TableCell>
                  </TableRow>
                ))}

                <TableEmptyRows
                  height={77}
                  emptyRows={emptyRows(page, rowsPerPage, studentsCount)}
                />

                {notFound && (
                  <TableNoData query={search || parentSearch} />
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <TablePagination
          page={page}
          component="div"
          count={studentsCount}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          rowsPerPageOptions={STUDENTS_ROWS_PER_PAGE_OPTIONS}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      {previewFormatVersion === "v3" ? (
        <UdisePreviewV3Modal
          open={previewModalOpen}
          onClose={handleClosePreviewModal}
          previewData={previewModalData}
          rollNos={selectedRollNos.join(",")}
          ayId={Number(academicYear?.ay_id) || userInfo?.ay_id}
        />
      ) : (
      <UdisePreviewModal
        key={
          previewModalOpen
            ? `${previewFormatVersion}-${selectedRollNos.join(",")}`
            : "closed"
        }
        open={previewModalOpen}
        onClose={handleClosePreviewModal}
        previewData={previewModalData}
        rollNos={selectedRollNos.join(",")}
        ayId={Number(academicYear?.ay_id) || userInfo?.ay_id}
        onFieldsSaved={refetchUdiseStudents}
        formatVersion={previewFormatVersion}
      />
      )}

      <MsbStudentModal
        open={msbModalOpen}
        onClose={() => setMsbModalOpen(false)}
      />
    </>
  );
}
