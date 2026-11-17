import useAuth from "../hooks/useAuth";
import { Helmet } from "react-helmet-async";
import { Box, Button, Card, CardContent, Typography } from "@mui/material";
import { useGetApi } from "../hooks/useGetApi";
import { getStudentStats } from "../services/student/dashboard.service";
import { Link } from "react-router-dom";
import Loader from "../components/loader/loader";
import MessageBox from "../components/error/message-box";
import { FORMAT_INDIAN_CURRENCY } from "../utils/constants";

const BRAND_LOGO = "/green_wood_.png";

const StudentDashboard = () => {
  const { userInfo } = useAuth();

  const {
    dataList: studentStats,
    isLoading,
    isError,
    errorMessage,
  } = useGetApi({
    apiFunction: getStudentStats,
    body: {
      st_id: userInfo?.st_id,
    },
  });
  return (
    <>
      <Helmet>
        <title>Dashboard | GREENWOOD</title>
      </Helmet>
      <Box>
        {isLoading ? (
          <Loader />
        ) : isError ? (
          <MessageBox errorMessage={errorMessage} />
        ) : (
          <Card sx={{ minHeight: "450px" }}>
            <CardContent>
              <Box
                component="img"
                src={BRAND_LOGO}
                alt="Greenwood Logo"
                sx={{
                  width: { xs: "150px", sm: "180px" },
                  height: "auto",
                  mb: 2,
                }}
              />
              <Typography variant="h4" sx={{ color: "primary.main" }}>
                Welcome {studentStats?.name || ""}
              </Typography>
              <Typography variant="h5" sx={{ color: "primary.main" }}>
                {studentStats?.class || ""}
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 1,
                  mt: 2,
                  mb: 1,
                }}
              >
                <Button
                  variant="contained"
                  sx={{ textTransform: "none", minWidth: "150px" }}
                >
                  Deposit: ₹
                  {FORMAT_INDIAN_CURRENCY(studentStats?.st_deposit) || "0"}/-
                </Button>
                <Button
                  variant="contained"
                  sx={{ textTransform: "none", minWidth: "150px" }}
                >
                  Wallet: ₹
                  {FORMAT_INDIAN_CURRENCY(studentStats?.st_wallet) || "0"}/-
                </Button>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 1,
                  mt: 3,
                }}
              >
                <Link to="/fees/pending-fees">
                  <Button
                    variant="contained"
                    sx={{ textTransform: "none", minWidth: "150px" }}
                  >
                    Pending Fees
                  </Button>
                </Link>
                <Link to="/fees/paid-fees">
                  <Button
                    variant="contained"
                    sx={{ textTransform: "none", minWidth: "150px" }}
                  >
                    Paid Fees
                  </Button>
                </Link>
                <Link to="/fees/transactions">
                  <Button
                    variant="contained"
                    sx={{ textTransform: "none", minWidth: "150px" }}
                  >
                    Transactions
                  </Button>
                </Link>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    </>
  );
};

export default StudentDashboard;
