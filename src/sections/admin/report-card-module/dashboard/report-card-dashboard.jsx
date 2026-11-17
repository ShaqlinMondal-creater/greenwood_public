import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Menu,
  MenuItem,
  Radio,
  TablePagination,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useGetApi } from "../../../../hooks/useGetApi";
import { getAllClassGroup } from "../../../../services/admin/classes.service";
import Loader from "../../../../components/loader/loader";
import MessageBox from "../../../../components/error/message-box";
import Iconify from "../../../../components/iconify/iconify";
import {
  DEFAULT_LIMIT,
  ROWS_PER_PAGE_OPTIONS,
} from "../../../../utils/constants";
import useAuth from "../../../../hooks/useAuth";
import { getAllAcademicYears } from "../../../../services/admin/students-management.service";
import { useNavigate } from "react-router-dom";
import { ExpandLessRounded, ExpandMoreRounded } from "@mui/icons-material";
import { toast } from "react-toastify";
import { Helmet } from "react-helmet-async";
import {
  exportReportCard,
  exportTabular,
} from "../../../../services/admin/report-card-module.service";
import Popover from "@mui/material/Popover";
import { BASE_URL } from "../../../../services/api.request";
// import { getTerms } from "../../../../services/admin/report-card-module.service";

const STATUS_LIST = ["pending", "locked", "verified"];

// 1–9 & XI: Half Yearly (term 1) / Final Term (term 2)
const TERMS_HALF_FINAL = [
  { term_id: "1", term_name: "Half Yearly" },
  { term_id: "2", term_name: "Final Term" },
];

// 10 & XII: Selection (term 2) / Pre Board (term 1) — matches t_terms naming
const TERMS_SELECTION_PREBOARD = [
  { term_id: "2", term_name: "Selection" },
  { term_id: "1", term_name: "Pre Board" },
];

const isClass10Or12Name = (name) => {
  const u = String(name || "")
    .toUpperCase()
    .replace(/\s*\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!u) return false;
  // XII / Class 12 (do before XI)
  if (/\bXII\b/.test(u) || /\bCLASS\s*12\b/.test(u) || /^12\b/.test(u)) {
    return true;
  }
  // Class 10
  if (/\bCLASS\s*10\b/.test(u) || /^10\b/.test(u)) {
    return true;
  }
  return false;
};

const termsForContext = (text) =>
  isClass10Or12Name(text) ? TERMS_SELECTION_PREBOARD : TERMS_HALF_FINAL;

const reportRouteForTermName = (termName) => {
  const name = String(termName || "").trim();
  if (name === "Half Yearly" || name === "Selection") return "half-yearly";
  if (name === "Final Term" || name === "Pre Board") return "final-term";
  return null;
};

const ReportCardDashboard = () => {
  const theme = useTheme();
  const { userInfo, logout } = useAuth();
  const navigate = useNavigate();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({
    ay_id: { ay_id: userInfo?.ay_id, ay_name: userInfo?.ay_name },
    term: TERMS_HALF_FINAL[0],
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [isExportLoading, setIsExportLoading] = useState(false);
  const [isPrintTabularLoading, setIsPrintTabularLoading] = useState([]);
  const [popoverAnchor, setPopoverAnchor] = useState(null);
  const [printOption, setPrintOption] = useState(null);
  const [printTerm, setPrintTerm] = useState(null);
  const [printIndex, setPrintIndex] = useState(null);
  const [type, setType] = useState("pdf");

  const termsList = useMemo(() => termsForContext(search), [search]);

  useEffect(() => {
    const stillValid = termsList.some(
      (t) =>
        String(t.term_id) === String(formData?.term?.term_id) &&
        t.term_name === formData?.term?.term_name,
    );
    if (!stillValid) {
      setFormData((pre) => ({ ...pre, term: termsList[0] }));
    }
  }, [termsList]);

  const dataSendToBackend = {
    search: search || "",
    ay_id: formData?.ay_id?.ay_id || "",
  };

  // open bulk action menu
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Open popover for print / export tabulation
  const handlePrintPopoverOpen = async (e, option, index) => {
    e.stopPropagation(); // Prevent the click from propagating to the card
    const classTerms = termsForContext(option?.cg_name || search);
    const preferred =
      classTerms.find(
        (t) =>
          String(t.term_id) === String(formData?.term?.term_id) &&
          t.term_name === formData?.term?.term_name,
      ) || classTerms[0];
    setPopoverAnchor(e.currentTarget);
    setPrintIndex(index);
    setPrintOption(option);
    setPrintTerm(preferred);
  };

  const handlePrintPopoverClose = () => {
    setPopoverAnchor(null);
    setPrintIndex(null);
    setPrintOption(null);
    setPrintTerm(null);
  };

  // function to print tabular format pdf
  const handlePrintTabular = async (e, option, index) => {
    e.stopPropagation(); // Prevent the click from propagating to the card
    const selectedTerm = printTerm || formData.term;
    if (!selectedTerm) {
      toast.error("Please select a term to export tabulation.");
      return;
    }
    setIsPrintTabularLoading((prev) => {
      const newLoadingState = [...prev];
      newLoadingState[index] = true; // Set the specific index to true
      return newLoadingState;
    });
    const response = await exportTabular({
      type,
      cg_id: option.cg_id || "",
      ay_id: formData?.ay_id?.ay_id || "",
      term: selectedTerm?.term_id || "",
    });
    setIsPrintTabularLoading((prev) => {
      const newLoadingState = [...prev];
      newLoadingState[index] = false; // Set the specific index to false
      return newLoadingState;
    });

    if (response?.code === 200) {
      const link = document.createElement("a");
      link.href = response?.file_url || "";
      link.target = "_blank"; // Open in a new tab
      link.rel = "noopener noreferrer"; // Add security attributes

      // Append the link to the document and trigger the download
      document.body.appendChild(link);
      link.click();

      // Remove the link after triggering the download
      document.body.removeChild(link);
      handlePrintPopoverClose(); // Close the popover after printing
      toast.success(response?.message || "File downloaded successfully!");
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Some error occurred.");
    }
  };

  // function to print report card pdf
  const handlePrintReportCard = async (e, option) => {
    e.stopPropagation(); // Prevent the click from propagating to the card
    const classTerms = termsForContext(option?.cg_name || search);
    const selectedTerm =
      classTerms.find(
        (t) =>
          String(t.term_id) === String(formData?.term?.term_id) &&
          t.term_name === formData?.term?.term_name,
      ) || formData?.term;

    if (!selectedTerm) {
      toast.error("Please select a term to print the report card.");
      return;
    }
    const term_name = reportRouteForTermName(selectedTerm?.term_name);
    if (!term_name) {
      toast.error("Invalid term selected for report card.");
      return;
    }

    window.open(
      `${BASE_URL}/reports/${term_name}/${option?.cg_id}/0`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  // function to export students data as pdf
  const handleExport = async (type) => {
    handleMenuClose();
    // setIsExportLoading(true);
    // const response = await exportStudents({
    //   ...dataSendToBackend,
    //   type: type,
    // });
    // setIsExportLoading(false);

    // if (response?.code === 200) {
    //   const link = document.createElement("a");
    //   link.href = response?.data?.file_url || "";
    //   link.target = "_blank"; // Open in a new tab
    //   link.rel = "noopener noreferrer"; // Add security attributes

    //   // Append the link to the document and trigger the download
    //   document.body.appendChild(link);
    //   link.click();

    //   // Remove the link after triggering the download
    //   document.body.removeChild(link);

    //   toast.success(response?.message || "File downloaded successfully!");
    // } else if (response?.code === 401) {
    //   logout(response);
    //   // toast.error(response?.message || "Unauthorized");
    // } else {
    //   toast.error(response?.message || "Some error occurred.");
    // }
  };

  const handleSearch = (e) => {
    setPage(0);
    setSearch(e.target.value);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((preValue) => ({ ...preValue, [name]: value }));
    setPage(0);
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

  const handleCardClick = (option) => {
    navigate("/report-card-module/marks-grade-entry", {
      state: { ...option, ay_id: formData?.ay_id?.ay_id || userInfo?.ay_id },
    });
  };

  // api to get academicYearList
  const { dataList: academicYearList } = useGetApi({
    apiFunction: getAllAcademicYears,
  });

  // api to get classList
  const {
    dataList: classList,
    dataCount: classCount,
    isLoading,
    isError,
    errorMessage,
  } = useGetApi({
    apiFunction: getAllClassGroup,
    body: {
      ay_id: formData?.ay_id?.ay_id || userInfo?.ay_id,
      offset: page * rowsPerPage,
      limit: rowsPerPage,
      search,
      term: formData?.term?.term_id || null,
      status: formData?.status || "",
    },
    dependencies: [
      page,
      rowsPerPage,
      search,
      formData?.ay_id,
      formData?.term,
      formData?.status,
    ],
    debounceDelay: 500,
  });

  // if no search result is found
  const notFound = !classCount;

  return (
    <Box>
      <Helmet>
        <title>Report Card | GREENWOOD</title>
      </Helmet>

      <Card>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              mb: 2,
            }}
          >
            {/* header */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <TextField
                value={search || ""}
                onChange={handleSearch}
                placeholder="Search by class name..."
                size="small"
                sx={{ width: "200px" }}
              />
              <Autocomplete
                options={STATUS_LIST || []}
                getOptionLabel={(option) => option.toUpperCase()}
                renderInput={(params) => (
                  <TextField {...params} label="Status" size="small" />
                )}
                value={formData?.status || null}
                onChange={(_, newValue) =>
                  handleChange({ target: { name: "status", value: newValue } })
                }
                sx={{ width: "200px" }}
              />
              <Autocomplete
                options={academicYearList || []}
                getOptionLabel={(option) => option?.ay_name || ""}
                renderInput={(params) => (
                  <TextField {...params} label="Select Year" size="small" />
                )}
                value={formData?.ay_id || null}
                onChange={(_, newValue) =>
                  handleChange({ target: { name: "ay_id", value: newValue } })
                }
                sx={{ width: "200px" }}
              />
              <Autocomplete
                options={termsList || []}
                getOptionLabel={(option) => option?.term_name || ""}
                isOptionEqualToValue={(option, value) =>
                  String(option?.term_id) === String(value?.term_id) &&
                  option?.term_name === value?.term_name
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Term"
                    size="small"
                    required
                  />
                )}
                value={formData?.term || null}
                onChange={(_, newValue) =>
                  handleChange({ target: { name: "term", value: newValue } })
                }
                sx={{ width: "200px" }}
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "end",
                gap: 2,
                ml: "auto",
              }}
            >
              <TextField
                placeholder="Roll No"
                size="small"
                sx={{ bgcolor: "white" }}
              />
              {/* Bulk Actions */}
              <Box>
                <Button
                  variant="contained"
                  onClick={handleMenuOpen}
                  endIcon={
                    anchorEl ? <ExpandLessRounded /> : <ExpandMoreRounded />
                  }
                  disabled={isExportLoading}
                >
                  {isExportLoading ? (
                    <CircularProgress size={24} />
                  ) : (
                    `Bulk Actions`
                  )}
                </Button>

                {/* Menu  */}
                <Menu
                  anchorEl={anchorEl}
                  anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                  }}
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  sx={{ color: "primary.main" }}
                >
                  {/* export excel */}
                  <MenuItem
                    onClick={() => handleExport("excel")}
                    sx={{ color: "primary.main" }}
                  >
                    <Iconify icon="uiw:file-excel" sx={{ mr: 1 }} />
                    Export Excel
                  </MenuItem>

                  {/* export pdf */}
                  <MenuItem
                    onClick={() => handleExport("pdf")}
                    sx={{ color: "primary.main" }}
                  >
                    <Iconify icon="uiw:file-pdf" sx={{ mr: 1 }} />
                    Export PDF
                  </MenuItem>

                  {/* individual report */}
                  <MenuItem
                    sx={{ color: "primary.main" }}
                    onClick={handleMenuClose}
                  >
                    {/* <Iconify icon="uiw:file-pdf" sx={{ mr: 1 }} /> */}
                    Individual Report
                  </MenuItem>
                </Menu>
              </Box>
            </Box>
          </Box>

          {isLoading ? (
            <Loader />
          ) : isError ? (
            <MessageBox errorMessage={errorMessage} />
          ) : (
            <Box sx={{ py: 2 }}>
              <Grid container spacing={3}>
                {classList?.map((option, index) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={option?.cg_id}>
                    <Box
                      sx={{
                        height: "150px",
                        width: "100%",
                        border: `2px solid ${theme.palette.primary.main}`,
                        borderRadius: "12px",
                        overflow: "hidden",
                        position: "relative",
                        cursor: "pointer",
                      }}
                      onClick={() => handleCardClick(option)}
                    >
                      <Box sx={{ position: "absolute", top: 0, right: 0 }}>
                        <Radio
                          defaultChecked
                          color={
                            option.term_status === "verified"
                              ? "success"
                              : option.term_status === "locked"
                                ? "warning"
                                : "error"
                          }
                        />
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 0.5,
                          height: "calc(100% - 35px)",
                          textAlign: "center",
                          p: 0.5,
                        }}
                      >
                        <Typography
                          sx={{
                            color: "primary.main",
                            fontSize: { xs: "16px", md: "18px", xl: "20px" },
                            fontWeight: { xs: 500, md: 600 },
                            lineHeight: 1.2,
                          }}
                        >
                          {option?.cg_name || ""}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: { xs: "14px", md: "15px", xl: "16px" },
                            lineHeight: 1.2,
                          }}
                        >
                          {option?.class_teacher_name || ""}
                        </Typography>
                      </Box>
                      {/* bottom */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          bgcolor: "primary.main",
                          color: "primary.contrastText",
                          py: 0.5,
                          px: 1,
                          width: "100%",
                          height: "35px",
                        }}
                      >
                        <Iconify
                          icon="carbon:report-data"
                          sx={{ cursor: "pointer" }}
                          onClick={(e) =>
                            handlePrintPopoverOpen(e, option, index)
                          }
                        />

                        <Iconify
                          icon="mdi-light:printer"
                          sx={{ cursor: "pointer" }}
                          onClick={(e) => handlePrintReportCard(e, option)}
                        />
                      </Box>
                    </Box>

                    <Popover
                      open={Boolean(popoverAnchor) && printIndex === index}
                      anchorEl={popoverAnchor}
                      onClose={handlePrintPopoverClose}
                      anchorOrigin={{
                        vertical: "bottom",
                        horizontal: "left",
                      }}
                      transformOrigin={{
                        vertical: "top",
                        horizontal: "left",
                      }}
                    >
                      <Box sx={{ p: 2, minWidth: 220 }}>
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>
                          Export Tabulation
                        </Typography>
                        <Autocomplete
                          options={termsForContext(
                            printOption?.cg_name || option?.cg_name || search,
                          )}
                          getOptionLabel={(opt) => opt?.term_name || ""}
                          isOptionEqualToValue={(opt, val) =>
                            String(opt?.term_id) === String(val?.term_id) &&
                            opt?.term_name === val?.term_name
                          }
                          value={printTerm || null}
                          onChange={(_, newValue) => setPrintTerm(newValue)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Term"
                              size="small"
                              fullWidth
                              required
                            />
                          )}
                          sx={{ mb: 2 }}
                        />
                        <Autocomplete
                          options={["pdf", "excel"]}
                          getOptionLabel={(opt) => opt.toUpperCase()}
                          value={type || null}
                          onChange={(_, newValue) => setType(newValue)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Type"
                              size="small"
                              fullWidth
                            />
                          )}
                          sx={{
                            mb: 2,
                          }}
                        />

                        <Button
                          variant="contained"
                          fullWidth
                          onClick={(e) => {
                            handlePrintTabular(e, option, index);
                          }}
                          disabled={isPrintTabularLoading[index] || !printTerm}
                        >
                          {isPrintTabularLoading[index] ? (
                            <CircularProgress size={24} color="inherit" />
                          ) : (
                            "Print"
                          )}
                        </Button>
                      </Box>
                    </Popover>
                  </Grid>
                ))}
              </Grid>
              {notFound && (
                <Box
                  sx={{
                    height: "150px",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Typography variant="h4" sx={{ textAlign: "center" }}>
                    No Data Found
                  </Typography>
                </Box>
              )}
              {/* Pagination */}

              <TablePagination
                page={page}
                component="div"
                count={classCount}
                rowsPerPage={rowsPerPage}
                onPageChange={handleChangePage}
                rowsPerPageOptions={[4, 12, 24, 48, 100]}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ReportCardDashboard;
