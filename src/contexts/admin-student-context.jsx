import { createContext, useState } from "react";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import { useGetApi } from "../hooks/useGetApi";
import { getAllStudents } from "../services/admin/students-management.service";
import { DEFAULT_LIMIT } from "../utils/constants";
import useAuth from "../hooks/useAuth";

const AdminStudentContext = createContext();

const formatDobFilter = (value) => {
  if (!value) return "";
  const d = dayjs(value);
  if (!d.isValid()) return "";
  // Local calendar date only (never UTC ISO)
  return `${d.year()}-${String(d.month() + 1).padStart(2, "0")}-${String(d.date()).padStart(2, "0")}`;
};

const AdminStudentProvider = ({ children }) => {
  const { userInfo } = useAuth();
  const [page, setPage] = useState(0);

  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_LIMIT);

  const [search, setSearch] = useState("");
  const [parentSearch, setParentSearch] = useState("");

  const [bohra, setBohra] = useState(null);
  const [cgId, setCgId] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]); // to select multiple checkboxes in class field
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
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [isExportLoading, setIsExportLoading] = useState(false);

  const dataSendToBackend = {
    ay_id: academicYear?.ay_id || userInfo?.ay_id,
    stExternal: stExternal?.value || "0",
    search: search || "",
    parent_search: parentSearch || "",
    bohra: bohra?.value || "",
    cg_id: cgId || "",
    gender: gender?.value || "",
    dob_from: formatDobFilter(dobFrom),
    dob_to: formatDobFilter(dobTo),
    st_on_roll: stOnRoll?.value || "1",
    is_promoted: isPromoted?.value || "%",
  };

  // api to get students list

  const {
    dataList: studentsList,
    dataCount: studentsCount,
    isLoading,
    isError,
    refetch,
    errorMessage,
  } = useGetApi({
    apiFunction: getAllStudents,
    body: {
      ...dataSendToBackend,
      offset: page * rowsPerPage,
      limit: rowsPerPage,
    },
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
      cgId,
      gender,
      dobFrom,
      dobTo,
    ],
    debounceDelay: 500,
  });

  const value = {
    bohra,
    selectedOptions,
    gender,
    dobFrom,
    dobTo,
    academicYear,
    anchorEl,
    selectedRows,
    isExportLoading,
    page,
    rowsPerPage,
    search,
    parentSearch,
    stExternal,
    stOnRoll,
    isPromoted,
    dataSendToBackend,
    studentsList,
    studentsCount,
    isLoading,
    isError,
    errorMessage,
    setPage,
    setRowsPerPage,
    setSearch,
    setParentSearch,
    setBohra,
    setCgId,
    setSelectedOptions,
    setGender,
    setDobFrom,
    setDobTo,
    setAcademicYear,
    setAnchorEl,
    setSelectedRows,
    setIsExportLoading,
    setStExternal,
    setStOnRoll,
    setIsPromoted,
    refetch,
  };

  return (
    <AdminStudentContext.Provider value={value}>
      {children}
    </AdminStudentContext.Provider>
  );
};

AdminStudentProvider.propTypes = {
  children: PropTypes.node,
};

export { AdminStudentContext };

export default AdminStudentProvider;
