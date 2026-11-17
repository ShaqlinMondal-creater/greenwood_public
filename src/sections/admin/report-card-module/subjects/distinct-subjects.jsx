import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Helmet } from "react-helmet-async";
import Loader from "../../../../components/loader/loader";
import MessageBox from "../../../../components/error/message-box";
import { useGetApi } from "../../../../hooks/useGetApi";
import useAuth from "../../../../hooks/useAuth";
import {
  getAllAcademicYears,
  getClasses,
} from "../../../../services/admin/students-management.service";
import { getDistinctSubjects } from "../../../../services/admin/report-card-module.service";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "distinct", label: "Distinct only" },
  { value: "duplicate", label: "Duplicates only" },
];

const headerCellSx = {
  fontWeight: 700,
  bgcolor: "primary.main",
  color: "primary.contrastText",
};

const DistinctSubjects = () => {
  const navigate = useNavigate();
  const { userInfo } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(STATUS_OPTIONS[0]);
  const [formData, setFormData] = useState({
    ay_id: { ay_id: userInfo?.ay_id, ay_name: userInfo?.ay_name },
    cg_id: null,
  });

  const { dataList: academicYearList } = useGetApi({
    apiFunction: getAllAcademicYears,
  });

  const { dataList: classList } = useGetApi({
    apiFunction: getClasses,
    body: {
      ay_id: Number(formData?.ay_id?.ay_id) || userInfo?.ay_id,
    },
    dependencies: [formData?.ay_id],
  });

  const {
    dataList: subjects,
    allResponse,
    isLoading,
    isError,
    errorMessage,
  } = useGetApi({
    apiFunction: getDistinctSubjects,
    body: {
      search: search.trim() || undefined,
      status: status?.value || "all",
      ay_id: Number(formData?.ay_id?.ay_id) || userInfo?.ay_id,
      ...(formData?.cg_id?.id ? { cg_id: formData.cg_id.id } : {}),
    },
    dependencies: [search, status?.value, formData?.ay_id, formData?.cg_id],
    debounceDelay: 300,
  });

  const rows = useMemo(
    () => (Array.isArray(subjects) ? subjects : []),
    [subjects]
  );
  const summary = allResponse?.summary || {};

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "ay_id" ? { cg_id: null } : {}),
    }));
  };

  return (
    <Box>
      <Helmet>
        <title>Distinct Subjects | GREENWOOD</title>
      </Helmet>

      <Card>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              mb: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Button
                size="small"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate("/report-card-module/subjects")}
              >
                Back
              </Button>
              <Box>
                <Typography sx={{ fontWeight: 700 }}>
                  Distinct Subjects
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  One row per subject name. Duplicate names show all IDs
                  together.
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              <Chip
                size="small"
                label={`Total IDs: ${summary.total_subjects ?? 0}`}
              />
              <Chip
                size="small"
                color="success"
                label={`Distinct names: ${summary.distinct_names ?? 0}`}
              />
              <Chip
                size="small"
                color="warning"
                label={`Duplicate names: ${summary.duplicate_names ?? 0}`}
              />
              <Chip
                size="small"
                color="error"
                variant="outlined"
                label={`Showing: ${summary.filtered_rows ?? rows.length}`}
              />
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 2,
              mb: 2,
            }}
          >
            <Autocomplete
              options={academicYearList || []}
              getOptionLabel={(option) => option?.ay_name || ""}
              value={formData?.ay_id || null}
              onChange={(_, newValue) =>
                handleChange({ target: { name: "ay_id", value: newValue } })
              }
              sx={{ width: { xs: "100%", sm: 200 } }}
              renderInput={(params) => (
                <TextField {...params} label="Year" size="small" />
              )}
            />
            <Autocomplete
              options={classList || []}
              getOptionLabel={(option) => option?.cg_name || ""}
              value={formData?.cg_id || null}
              onChange={(_, newValue) =>
                handleChange({ target: { name: "cg_id", value: newValue } })
              }
              sx={{ width: { xs: "100%", sm: 200 } }}
              renderInput={(params) => (
                <TextField {...params} label="Class (optional)" size="small" />
              )}
            />
            <TextField
              size="small"
              label="Search name or ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ width: { xs: "100%", sm: 220 } }}
            />
            <Autocomplete
              options={STATUS_OPTIONS}
              getOptionLabel={(option) => option?.label || ""}
              value={status}
              onChange={(_e, value) => setStatus(value || STATUS_OPTIONS[0])}
              sx={{ width: { xs: "100%", sm: 180 } }}
              renderInput={(params) => (
                <TextField {...params} label="Status" size="small" />
              )}
            />
          </Box>

          {isLoading ? (
            <Loader />
          ) : isError ? (
            <MessageBox errorMessage={errorMessage} />
          ) : (
            <TableContainer
              sx={{
                border: "1px solid",
                borderColor: "divider",
                maxHeight: "70vh",
              }}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ ...headerCellSx, width: 56 }}>#</TableCell>
                    <TableCell sx={headerCellSx}>Subject Name</TableCell>
                    <TableCell sx={{ ...headerCellSx, width: 70 }}>
                      Type
                    </TableCell>
                    <TableCell sx={{ ...headerCellSx, width: 90 }}>
                      Category
                    </TableCell>
                    <TableCell sx={{ ...headerCellSx, width: 70 }}>
                      Serial
                    </TableCell>
                    <TableCell sx={{ ...headerCellSx, width: 110 }}>
                      Status
                    </TableCell>
                    <TableCell sx={{ ...headerCellSx, minWidth: 280 }}>
                      Same Name IDs
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No subjects found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row, index) => (
                      <TableRow
                        key={row.sub_ids_label || row.id}
                        sx={{
                          bgcolor: row.is_duplicate
                            ? "rgba(255, 167, 38, 0.06)"
                            : "inherit",
                          verticalAlign: "top",
                        }}
                      >
                        <TableCell>{index + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {row.subj_name}
                        </TableCell>
                        <TableCell>{row.type || "—"}</TableCell>
                        <TableCell>{row.category || "—"}</TableCell>
                        <TableCell>{row.serial ?? "—"}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            color={row.is_duplicate ? "warning" : "success"}
                            label={row.status}
                          />
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 0.75,
                            }}
                          >
                            {(row.same_name_details || []).map((item) => (
                              <Typography
                                key={item.id}
                                sx={{ fontSize: 13, lineHeight: 1.4 }}
                              >
                                {item.id} - use in :{" "}
                                {item.used_in_label || "not used"}
                              </Typography>
                            ))}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default DistinctSubjects;
