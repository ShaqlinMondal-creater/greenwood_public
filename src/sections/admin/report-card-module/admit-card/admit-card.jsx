import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  TablePagination,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { toast } from "react-toastify";
import Loader from "../../../../components/loader/loader";
import MessageBox from "../../../../components/error/message-box";
import { useGetApi } from "../../../../hooks/useGetApi";
import useAuth from "../../../../hooks/useAuth";
import { getAllClassGroup } from "../../../../services/admin/classes.service";
import { getAllAcademicYears } from "../../../../services/admin/students-management.service";
import { printAdmitCards } from "../../../../services/admin/report-card-module.service";

const isClassTenOrTwelve = (name) => {
  const n = String(name || "")
    .toUpperCase()
    .trim();
  if (/^(10|12)(\s|-)/.test(n)) return true;
  if (/^XII(\s|-)/.test(n)) return true;
  if (/^X(\s|-)/.test(n) && !n.startsWith("XI")) return true;
  return /\b(CLASS\s*)?(10|12|XII)\b/.test(n);
};

const isPrePrimaryClass = (name) => {
  const n = String(name || "")
    .toUpperCase()
    .trim();
  return (
    /\bNURSERY\b|\bNUR\b/.test(n) ||
    /\bLKG\b|\bL\.K\.G\b/.test(n) ||
    /\bUKG\b|\bU\.K\.G\b/.test(n)
  );
};

const AdmitCard = () => {
  const theme = useTheme();
  const { userInfo, logout } = useAuth();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({
    ay_id: { ay_id: userInfo?.ay_id, ay_name: userInfo?.ay_name },
  });
  const [printingKey, setPrintingKey] = useState("");

  const { dataList: academicYearList } = useGetApi({
    apiFunction: getAllAcademicYears,
  });

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
      term: "1",
    },
    dependencies: [page, rowsPerPage, search, formData?.ay_id],
    debounceDelay: 500,
  });

  const handleSearch = (e) => {
    setPage(0);
    setSearch(e.target.value);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((preValue) => ({ ...preValue, [name]: value }));
    setPage(0);
  };

  const handlePrint = async (option, term) => {
    if (isPrePrimaryClass(option?.cg_name)) {
      toast.error("Admit card is only for Class 1 to 12.");
      return;
    }
    const key = `${option?.cg_id}-${term}`;
    setPrintingKey(key);
    const response = await printAdmitCards({
      cg_id: option?.cg_id,
      ay_id: formData?.ay_id?.ay_id || userInfo?.ay_id,
      term,
    });
    setPrintingKey("");

    if (response?.code === 200) {
      const link = document.createElement("a");
      link.href = response?.file_url || "";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(response?.message || "Admit cards generated.");
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Some error occurred.");
    }
  };

  const visibleClassList = (classList || []).filter(
    (option) => !isPrePrimaryClass(option?.cg_name)
  );

  return (
    <Box>
      <Helmet>
        <title>Admit Card | GREENWOOD</title>
      </Helmet>

      <Card>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 2,
              mb: 2,
            }}
          >
            <TextField
              value={search || ""}
              onChange={handleSearch}
              placeholder="Search by class name..."
              size="small"
              sx={{ width: "220px" }}
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
              sx={{ width: "220px" }}
            />
          </Box>

          {isLoading ? (
            <Loader />
          ) : isError ? (
            <MessageBox errorMessage={errorMessage} />
          ) : (
            <Box sx={{ py: 2 }}>
              <Grid container spacing={3}>
                {visibleClassList?.map((option) => {
                  const boardClass = isClassTenOrTwelve(option?.cg_name);
                  const firstLabel = boardClass ? "Selection" : "Half Yearly";
                  const secondLabel = boardClass ? "Pre Board" : "Final Term";
                  const firstKey = `${option?.cg_id}-half-yearly`;

                  return (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={option?.cg_id}>
                      <Box
                        sx={{
                          width: "100%",
                          border: `2px solid ${theme.palette.primary.main}`,
                          borderRadius: "12px",
                          overflow: "hidden",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 0.5,
                            minHeight: "90px",
                            textAlign: "center",
                            p: 1,
                          }}
                        >
                          <Typography
                            sx={{
                              color: "primary.main",
                              fontSize: { xs: "16px", md: "18px" },
                              fontWeight: 600,
                              lineHeight: 1.2,
                            }}
                          >
                            {option?.cg_name || ""}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: "13px",
                              lineHeight: 1.2,
                              color: "text.secondary",
                              fontWeight: 500,
                            }}
                          >
                            Students: {option?.total_students ?? 0}
                          </Typography>
                          <Typography sx={{ fontSize: "14px", lineHeight: 1.2 }}>
                            {option?.class_teacher_name || ""}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "stretch",
                            gap: 0.75,
                            bgcolor: "primary.light",
                            p: 1,
                          }}
                        >
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            onClick={() => handlePrint(option, "half-yearly")}
                            disabled={printingKey === firstKey}
                            sx={{
                              flex: 1,
                              minHeight: 36,
                              fontWeight: 600,
                              textTransform: "none",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {printingKey === firstKey ? (
                              <CircularProgress size={18} color="inherit" />
                            ) : (
                              firstLabel
                            )}
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            disabled
                            sx={{
                              flex: 1,
                              minHeight: 36,
                              fontWeight: 600,
                              textTransform: "none",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {secondLabel}
                          </Button>
                        </Box>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
              {visibleClassList.length === 0 && (
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
              <TablePagination
                page={page}
                component="div"
                count={classCount}
                rowsPerPage={rowsPerPage}
                onPageChange={(_, newPage) => {
                  if (!isLoading) setPage(newPage);
                }}
                rowsPerPageOptions={[4, 12, 24, 48, 100]}
                onRowsPerPageChange={(event) => {
                  setPage(0);
                  setRowsPerPage(parseInt(event.target.value, 10));
                }}
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdmitCard;
