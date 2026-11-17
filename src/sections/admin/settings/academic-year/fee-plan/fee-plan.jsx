import PropTypes from "prop-types";
import { Box, Button, Divider, Tab, Tabs } from "@mui/material";
import { useState } from "react";
import AdmissionFees from "./tabs/admission-fees";
import OneTimeFees from "./tabs/one-time-fees";
import MonthlyFees from "./tabs/monthly-fees";
import RecurringFees from "./tabs/recurring-fees";

const FeePlan = ({ academicYear }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleModalOpen = () => {
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
  };

  const handleBulkModalOpen = () => {
    setBulkModalOpen(true);
  };

  const handleBulkModalClose = () => {
    setBulkModalOpen(false);
  };

  return (
    <Box>
      <Box
        sx={{
          textAlign: "right",
          mb: 2,
          display: "flex",
          justifyContent: "flex-end",
          gap: 1,
        }}
      >
        <Button
          variant="standard"
          sx={{ bgcolor: "primary.main", color: "primary.contrastText" }}
          onClick={handleBulkModalOpen}
        >
          + Bulk
        </Button>
        <Button
          variant="standard"
          sx={{ bgcolor: "primary.main", color: "primary.contrastText" }}
          onClick={handleModalOpen}
        >
          + Add New
        </Button>
      </Box>
      {/* Tabs Section */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="ADMISSION FEES" />
        <Tab label="MONTHLY FEES" />
        <Tab label="ONE-TIME FEES" />
        <Tab label="RECURRING FEES" />
      </Tabs>
      <Divider sx={{ mb: 2 }} />
      {/* Tab Content */}
      {activeTab === 0 && (
        <AdmissionFees
          academicYear={academicYear}
          open={modalOpen}
          onClose={handleModalClose}
          bulkOpen={bulkModalOpen}
          onBulkClose={handleBulkModalClose}
        />
      )}
      {activeTab === 1 && (
        <MonthlyFees
          academicYear={academicYear}
          open={modalOpen}
          onClose={handleModalClose}
          bulkOpen={bulkModalOpen}
          onBulkClose={handleBulkModalClose}
        />
      )}
      {activeTab === 2 && (
        <OneTimeFees
          academicYear={academicYear}
          open={modalOpen}
          onClose={handleModalClose}
          bulkOpen={bulkModalOpen}
          onBulkClose={handleBulkModalClose}
        />
      )}
      {activeTab === 3 && (
        <RecurringFees
          academicYear={academicYear}
          open={modalOpen}
          onClose={handleModalClose}
          bulkOpen={bulkModalOpen}
          onBulkClose={handleBulkModalClose}
        />
      )}
    </Box>
  );
};

FeePlan.propTypes = {
  academicYear: PropTypes.object,
};

export default FeePlan;
