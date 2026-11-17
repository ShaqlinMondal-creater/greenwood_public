import PropTypes from "prop-types";
import { Box, CircularProgress, Grid, InputAdornment, TextField } from "@mui/material";
import { memo, useState } from "react";
import { toast } from "react-toastify";
import {
  digitsOnlyPincode,
  lookupIndianPincode,
} from "../../../../../utils/pincode-lookup";

const AddressDetailsTab = ({ props }) => {
  const { formData, handleChange } = props;
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);

  const handlePincodeChange = async (e) => {
    const digits = digitsOnlyPincode(e.target.value);
    handleChange({ target: { name: "pincode", value: digits } });
    if (digits.length !== 6) return;

    setIsPincodeLoading(true);
    const result = await lookupIndianPincode(digits);
    setIsPincodeLoading(false);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    handleChange({ target: { name: "city", value: result.data.city } });
    handleChange({ target: { name: "state", value: result.data.state } });
    handleChange({ target: { name: "country", value: result.data.country } });
  };

  return (
    <Box>
      <Grid container spacing={4}>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <TextField
            name="residential_address1"
            label="Residential Address 1"
            fullWidth
            required
            value={formData?.residential_address1 || ""}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={3}>
          <TextField
            name="residential_address2"
            label="Residential Address 2"
            fullWidth
            value={formData?.residential_address2 || ""}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={3}>
          <TextField
            name="pincode"
            label="Pincode"
            fullWidth
            required
            value={formData?.pincode || ""}
            onChange={handlePincodeChange}
            helperText="Enter 6-digit pincode to auto-fill city, state, country"
            InputProps={{
              endAdornment: isPincodeLoading ? (
                <InputAdornment position="end">
                  <CircularProgress size={18} />
                </InputAdornment>
              ) : null,
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={3}>
          <TextField
            name="city"
            label="City"
            fullWidth
            required
            value={formData?.city || ""}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={3}>
          <TextField
            name="state"
            label="State"
            fullWidth
            required
            value={formData?.state || ""}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={3}>
          <TextField
            name="country"
            label="Country"
            fullWidth
            required
            value={formData?.country || ""}
            onChange={handleChange}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

AddressDetailsTab.propTypes = {
  props: PropTypes.object,
  formData: PropTypes.object,
  handleChange: PropTypes.func,
};

export default memo(AddressDetailsTab);
