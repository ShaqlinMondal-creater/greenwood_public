import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import { Helmet } from "react-helmet-async";
import Loader from "../../../../components/loader/loader";
import MessageBox from "../../../../components/error/message-box";
import { useGetApi } from "../../../../hooks/useGetApi";
import useAuth from "../../../../hooks/useAuth";
import {
  getAllAcademicYears,
  getClasses,
} from "../../../../services/admin/students-management.service";
import { getAllClassFmSubjects } from "../../../../services/admin/report-card-module.service";

const Subjects = () => {
  const navigate = useNavigate();
  const { userInfo } = useAuth();
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
    dataList: classGroups,
    allResponse,
    isLoading,
    isError,
    errorMessage,
  } = useGetApi({
    apiFunction: formData?.ay_id?.ay_id ? getAllClassFmSubjects : null,
    body: {
      ay_id: Number(formData?.ay_id?.ay_id) || userInfo?.ay_id,
      ...(formData?.cg_id?.id ? { cg_id: formData.cg_id.id } : {}),
    },
    dependencies: [formData?.ay_id, formData?.cg_id],
  });

  const groups = useMemo(
    () => (Array.isArray(classGroups) ? classGroups : []),
    [classGroups]
  );

  const maxSubjects = useMemo(() => {
    const fromApi = Number(allResponse?.max_subjects || 0);
    if (fromApi > 0) return fromApi;
    return groups.reduce(
      (max, group) => Math.max(max, (group?.subjects || []).length),
      0
    );
  }, [allResponse, groups]);

  const subjectColumns = useMemo(
    () => Array.from({ length: maxSubjects }, (_, index) => index + 1),
    [maxSubjects]
  );

  const groupedRows = useMemo(() => {
    const map = new Map();
    groups.forEach((group) => {
      const key = group?.class_group || group?.class_name || "Other";
      if (!map.has(key)) {
        map.set(key, {
          groupName: key,
          sortRank: Number(group?.sort_rank ?? 99),
          rows: [],
        });
      }
      const bucket = map.get(key);
      bucket.sortRank = Math.min(
        bucket.sortRank,
        Number(group?.sort_rank ?? 99)
      );
      bucket.rows.push(group);
    });

    return Array.from(map.values())
      .map((bucket) => ({
        ...bucket,
        rows: [...bucket.rows].sort((a, b) =>
          String(a.class_name || "").localeCompare(
            String(b.class_name || ""),
            undefined,
            { numeric: true, sensitivity: "base" }
          )
        ),
      }))
      .sort((a, b) => a.sortRank - b.sortRank || a.groupName.localeCompare(b.groupName));
  }, [groups]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "ay_id") {
      setFormData({ ay_id: value, cg_id: null });
      return;
    }
    setFormData((preValue) => ({ ...preValue, [name]: value }));
  };

  return (
    <Box>
      <Helmet>
        <title>Subjects | GREENWOOD</title>
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
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 2,
              }}
            >
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
              <Autocomplete
                options={classList || []}
                getOptionLabel={(option) => option?.cg_name || ""}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Class (optional)"
                    size="small"
                  />
                )}
                value={formData?.cg_id || null}
                onChange={(_, newValue) =>
                  handleChange({ target: { name: "cg_id", value: newValue } })
                }
                sx={{ width: "220px" }}
              />
            </Box>

            <Button
              variant="contained"
              onClick={() =>
                navigate("/report-card-module/subjects/distinct")
              }
            >
              Distinct Subjects
            </Button>
          </Box>

          <Typography variant="body2" sx={{ color: "text.secondary", mb: 1.5 }}>
            Green tick only when the subject is in Term 1 and Term 2. Marks
            subjects show FM. Grade subjects show Grade.
          </Typography>

          {!formData?.ay_id?.ay_id ? (
            <Box
              sx={{
                height: "150px",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Typography variant="h6" sx={{ textAlign: "center" }}>
                Select a year to view subjects.
              </Typography>
            </Box>
          ) : isLoading ? (
            <Loader />
          ) : isError ? (
            <MessageBox errorMessage={errorMessage} />
          ) : groups.length === 0 ? (
            <MessageBox errorMessage="No classes found for this year." />
          ) : (
            <TableContainer
              sx={{
                border: "1px solid",
                borderColor: "divider",
                maxHeight: "75vh",
              }}
            >
              <Table size="small" stickyHeader sx={{ minWidth: 900 }}>
                <TableHead>
                  <TableRow>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: 700,
                        bgcolor: "primary.main",
                        color: "primary.contrastText",
                        position: "sticky",
                        left: 0,
                        zIndex: 3,
                        minWidth: 90,
                      }}
                    >
                      Class
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        bgcolor: "primary.main",
                        color: "primary.contrastText",
                        position: "sticky",
                        left: 90,
                        zIndex: 3,
                        minWidth: 180,
                      }}
                    >
                      Class Name
                    </TableCell>
                    {subjectColumns.map((n) => (
                      <TableCell
                        key={`subject-${n}`}
                        align="center"
                        sx={{
                          fontWeight: 700,
                          bgcolor: "primary.main",
                          color: "primary.contrastText",
                          whiteSpace: "nowrap",
                          minWidth: 170,
                        }}
                      >
                        Subject {n}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {groupedRows.map(({ groupName, rows }) =>
                    rows.map((row, rowIndex) => (
                      <TableRow key={row.cg_id}>
                        {rowIndex === 0 ? (
                          <TableCell
                            align="center"
                            rowSpan={rows.length}
                            sx={{
                              fontWeight: 700,
                              verticalAlign: "middle",
                              textAlign: "center",
                              bgcolor: "grey.50",
                              position: "sticky",
                              left: 0,
                              zIndex: 1,
                              borderRight: "1px solid",
                              borderColor: "divider",
                            }}
                          >
                            {groupName}
                          </TableCell>
                        ) : null}
                        <TableCell
                          sx={{
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            textAlign: "left",
                            position: "sticky",
                            left: 90,
                            bgcolor: "background.paper",
                            zIndex: 1,
                            borderRight: "1px solid",
                            borderColor: "divider",
                          }}
                        >
                          {row.class_name}
                        </TableCell>
                        {subjectColumns.map((n) => {
                          const subject = (row.subjects || [])[n - 1];
                          const scoreLabel = subject?.uses_grade
                            ? "Grade"
                            : `FM: ${subject?.marks ?? 0}`;
                          return (
                            <TableCell
                              key={`${row.cg_id}-${n}`}
                              align="center"
                              sx={{
                                py: 0.75,
                                verticalAlign: "middle",
                                textAlign: "center",
                              }}
                            >
                              {!subject ? null : (
                                <Box
                                  sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 0.75,
                                    textAlign: "center",
                                  }}
                                >
                                  <Typography
                                    sx={{
                                      fontSize: 12,
                                      lineHeight: 1.3,
                                      wordBreak: "break-word",
                                      textAlign: "center",
                                    }}
                                  >
                                    {subject.subj_name}{" "}
                                    <Box
                                      component="span"
                                      sx={{ color: "text.secondary" }}
                                    >
                                      ({subject.subj_id})
                                    </Box>{" "}
                                    <Box
                                      component="span"
                                      sx={{
                                        color: subject.uses_grade
                                          ? "warning.main"
                                          : "success.main",
                                        fontWeight: 600,
                                      }}
                                    >
                                      {scoreLabel}
                                    </Box>
                                  </Typography>
                                  {subject.in_both_terms ? (
                                    <CheckBoxIcon
                                      sx={{
                                        color: "success.main",
                                        fontSize: 18,
                                        flexShrink: 0,
                                      }}
                                    />
                                  ) : null}
                                </Box>
                              )}
                            </TableCell>
                          );
                        })}
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

export default Subjects;
