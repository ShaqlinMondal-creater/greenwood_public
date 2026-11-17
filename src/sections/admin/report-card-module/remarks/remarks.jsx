import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Loader from "../../../../components/loader/loader";
import MessageBox from "../../../../components/error/message-box";
import { useGetApi } from "../../../../hooks/useGetApi";
import useAuth from "../../../../hooks/useAuth";
import {
  createRemarkPoint,
  deleteRemarkPoint,
  getRemarkBank,
  printRemarkBank,
  updateRemarkPoint,
} from "../../../../services/admin/report-card-module.service";

const classLabel = (classes) => {
  const labels = (classes || []).map((item) => {
    if (item === "NURSERY") return "Nursery";
    if (item === "LKG") return "LKG";
    if (item === "UKG") return "UKG";
    return String(item).replace("CLASS_", "Class ");
  });
  return labels.join(", ");
};

const Remarks = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [remarkDrafts, setRemarkDrafts] = useState({});
  const [newRemarkTexts, setNewRemarkTexts] = useState({});
  const [savingRemarkId, setSavingRemarkId] = useState(null);
  const [addingGroupKey, setAddingGroupKey] = useState(null);
  const [deletingRemarkId, setDeletingRemarkId] = useState(null);
  const [printingBandId, setPrintingBandId] = useState(null);

  const {
    dataList: remarkBanks,
    isLoading,
    isError,
    errorMessage,
    refetch: refetchRemarks,
  } = useGetApi({
    apiFunction: getRemarkBank,
    body: {},
  });

  const bands = Array.isArray(remarkBanks) ? remarkBanks : [];

  useEffect(() => {
    const next = {};
    bands.forEach((band) => {
      (band.groups || []).forEach((group) => {
        (group.points || []).forEach((point) => {
          next[point.id] = point.text || "";
        });
      });
    });
    setRemarkDrafts(next);
    setNewRemarkTexts({});
  }, [remarkBanks]);

  const groupKey = (band, group) => `${band.id}::${group.id}`;

  const handleSaveRemark = async (point) => {
    const nextText = String(remarkDrafts[point.id] || "").trim();
    if (!nextText) {
      toast.error("Remark text is required.");
      return;
    }
    setSavingRemarkId(point.id);
    const response = await updateRemarkPoint({
      id: point.id,
      text: nextText,
    });
    setSavingRemarkId(null);
    if (response?.code === 200) {
      toast.success(response?.message || "Remark updated.");
      refetchRemarks();
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Could not update remark.");
    }
  };

  const handleAddRemark = async (band, group) => {
    const key = groupKey(band, group);
    const nextText = String(newRemarkTexts[key] || "").trim();
    if (!nextText) {
      toast.error("Remark text is required.");
      return;
    }
    setAddingGroupKey(key);
    const response = await createRemarkPoint({
      band_id: band.id,
      group_id: group.id,
      text: nextText,
    });
    setAddingGroupKey(null);
    if (response?.code === 200) {
      toast.success(response?.message || "Remark added.");
      refetchRemarks();
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Could not add remark.");
    }
  };

  const handleDeleteRemark = async (point) => {
    if (!window.confirm("Delete this remark?")) {
      return;
    }
    setDeletingRemarkId(point.id);
    const response = await deleteRemarkPoint({ id: point.id });
    setDeletingRemarkId(null);
    if (response?.code === 200) {
      toast.success(response?.message || "Remark deleted.");
      refetchRemarks();
    } else if (response?.code === 401) {
      logout(response);
    } else {
      toast.error(response?.message || "Could not delete remark.");
    }
  };

  const handlePrint = async (bandId = "") => {
    setPrintingBandId(bandId || "all");
    const response = await printRemarkBank(bandId ? { band_id: bandId } : {});
    setPrintingBandId(null);

    if (response?.code && response?.code !== 200) {
      if (response?.code === 401) {
        logout(response);
        return;
      }
      toast.error(response?.message || "Could not print remarks.");
      return;
    }

    const blob = response?.data;
    if (!(blob instanceof Blob)) {
      toast.error("Could not print remarks.");
      return;
    }
    if ((blob.type || "").includes("application/json")) {
      try {
        const json = JSON.parse(await blob.text());
        toast.error(json?.message || "Could not print remarks.");
      } catch {
        toast.error("Could not print remarks.");
      }
      return;
    }

    const pdfBlob =
      blob.type === "application/pdf"
        ? blob
        : new Blob([blob], { type: "application/pdf" });
    const url = window.URL.createObjectURL(pdfBlob);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => window.URL.revokeObjectURL(url), 60000);
  };

  return (
    <Box>
      <Helmet>
        <title>Remarks | GREENWOOD</title>
      </Helmet>

      <Card>
        <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 1.5,
              gap: 1,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Typography variant="h6">Remarks</Typography>
              <Button
                size="small"
                variant="contained"
                onClick={() => navigate("/report-card-module/remarks-audit")}
                sx={{
                  bgcolor: "#F5C518",
                  color: "#1a1a1a",
                  "&:hover": { bgcolor: "#E0B000" },
                }}
              >
                Remarks Audit
              </Button>
            </Box>
            <Button
              size="small"
              variant="contained"
              onClick={() => handlePrint()}
              disabled={!!printingBandId || bands.length === 0}
            >
              {printingBandId === "all" ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                "Print All"
              )}
            </Button>
          </Box>

          {isLoading ? (
            <Loader />
          ) : isError ? (
            <MessageBox errorMessage={errorMessage} />
          ) : bands.length === 0 ? (
            <Typography sx={{ color: "text.secondary" }}>
              No remarks found.
            </Typography>
          ) : (
            bands.map((band) => (
              <Box key={band.id} sx={{ mb: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                    mb: 0.25,
                  }}
                >
                  <Typography sx={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>
                    {band.label}
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handlePrint(band.id)}
                    disabled={!!printingBandId}
                    sx={{ minWidth: 78, px: 1 }}
                  >
                    {printingBandId === band.id ? (
                      <CircularProgress size={14} />
                    ) : (
                      "Print"
                    )}
                  </Button>
                </Box>
                <Typography sx={{ color: "text.secondary", fontSize: 12, mb: 0.75 }}>
                  {classLabel(band.classes)}
                </Typography>

                {(band.groups || []).map((group) => {
                  const key = groupKey(band, group);
                  return (
                    <Box key={key} sx={{ mb: 1.25 }}>
                      <Typography sx={{ fontWeight: 600, mb: 0.5, fontSize: 12.5 }}>
                        {group.label}
                      </Typography>
                      <TableContainer>
                        <Table size="small" sx={{ "& td, & th": { py: 0.4, px: 0.75 } }}>
                          <TableHead>
                            <TableRow>
                              <TableCell width={48}>SN</TableCell>
                              <TableCell>Remark</TableCell>
                              <TableCell align="center" width={150}>
                                Action
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(group.points || []).length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={3} align="center">
                                  No remarks in this group.
                                </TableCell>
                              </TableRow>
                            ) : (
                              (group.points || []).map((point) => (
                                <TableRow key={point.id}>
                                  <TableCell sx={{ fontWeight: 600 }}>
                                    {point.id}
                                  </TableCell>
                                  <TableCell>
                                    <TextField
                                      size="small"
                                      fullWidth
                                      value={remarkDrafts[point.id] ?? ""}
                                      onChange={(e) =>
                                        setRemarkDrafts((preValue) => ({
                                          ...preValue,
                                          [point.id]: e.target.value,
                                        }))
                                      }
                                      sx={{
                                        "& .MuiInputBase-input": {
                                          py: 0.5,
                                          fontSize: 13,
                                        },
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell align="center">
                                    <Box
                                      sx={{
                                        display: "flex",
                                        gap: 0.5,
                                        justifyContent: "center",
                                      }}
                                    >
                                      <Button
                                        size="small"
                                        variant="contained"
                                        onClick={() => handleSaveRemark(point)}
                                        disabled={savingRemarkId === point.id}
                                        sx={{ minWidth: 58, px: 1 }}
                                      >
                                        {savingRemarkId === point.id ? (
                                          <CircularProgress
                                            size={14}
                                            color="inherit"
                                          />
                                        ) : (
                                          "Save"
                                        )}
                                      </Button>
                                      <Button
                                        size="small"
                                        color="error"
                                        variant="outlined"
                                        onClick={() => handleDeleteRemark(point)}
                                        disabled={deletingRemarkId === point.id}
                                        sx={{ minWidth: 58, px: 1 }}
                                      >
                                        {deletingRemarkId === point.id ? (
                                          <CircularProgress size={14} />
                                        ) : (
                                          "Delete"
                                        )}
                                      </Button>
                                    </Box>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                            <TableRow>
                              <TableCell />
                              <TableCell>
                                <TextField
                                  size="small"
                                  fullWidth
                                  placeholder="Type a new remark"
                                  value={newRemarkTexts[key] ?? ""}
                                  onChange={(e) =>
                                    setNewRemarkTexts((preValue) => ({
                                      ...preValue,
                                      [key]: e.target.value,
                                    }))
                                  }
                                  sx={{
                                    "& .MuiInputBase-input": {
                                      py: 0.5,
                                      fontSize: 13,
                                    },
                                  }}
                                />
                              </TableCell>
                              <TableCell align="center">
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={() => handleAddRemark(band, group)}
                                  disabled={addingGroupKey === key}
                                  sx={{ minWidth: 58, px: 1 }}
                                >
                                  {addingGroupKey === key ? (
                                    <CircularProgress size={14} color="inherit" />
                                  ) : (
                                    "Add"
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  );
                })}
              </Box>
            ))
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Remarks;
