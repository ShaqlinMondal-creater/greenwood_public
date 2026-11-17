import PropTypes from "prop-types";
import {
  Autocomplete,
  Box,
  CircularProgress,
  FormControlLabel,
  FormLabel,
  Grid,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import AttachmentsTab from "./attachments/attachments-tab";
import { memo, useState } from "react";
import { toast } from "react-toastify";
import { lookupIndianPincode } from "../../utils/pincode-lookup";

const SKIP_PREVIOUS_SCHOOL_CLASSES = ["nursery", "lkg", "ukg", "class_1"];

const ChildDetailsTab = ({ props }) => {
  const { formData, setFormData, setAttachments, handleChange, attachments } =
    props;
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);

  const classId = formData?.class?.cg_id;
  const hidePreviousSchool = SKIP_PREVIOUS_SCHOOL_CLASSES.includes(classId);
  const isOrphan = formData?.is_orphan === "yes";

  const handlePincodeChange = async (e) => {
    const digits = String(e.target.value || "")
      .replace(/\D/g, "")
      .slice(0, 6);

    setFormData((prev) => ({
      ...prev,
      pincode: digits,
      ...(digits.length < 6 ? { city: "", state: "", country: "" } : {}),
    }));

    if (digits.length !== 6) return;

    setIsPincodeLoading(true);
    const result = await lookupIndianPincode(digits);
    setIsPincodeLoading(false);

    if (!result.ok) {
      toast.error(result.message);
      setFormData((prev) => ({
        ...prev,
        city: "",
        state: "",
        country: "",
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      pincode: digits,
      city: result.data.city,
      state: result.data.state,
      country: result.data.country,
    }));
  };

  return (
    <Box>
      <Grid container spacing={4}>
        {/* Kindly Note */}
        {(classId === "class_3" ||
          classId === "class_4" ||
          classId === "class_5" ||
          classId === "class_6" ||
          classId === "class_7" ||
          classId === "class_8" ||
          classId === "class_9") && (
          <Grid item xs={12}>
            <Box
              sx={{
                bgcolor: "warning.light",
                borderLeft: "4px solid",
                borderColor: "warning.main",
                borderRadius: "5px",
                p: 1.2,
                color: "warning.dark",
              }}
            >
              <Typography sx={{ fontWeight: 500 }}>
                <strong>Kindly Note :</strong>{" "}
                {`Child's admission shall be considered based on Seat
              vacancy`}
              </Typography>
            </Box>
          </Grid>
        )}

        {/* First Name */}
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <TextField
            name="first_name"
            label="First Name"
            required
            fullWidth
            value={formData?.first_name || ""}
            onChange={handleChange}
          />
        </Grid>

        {/* Last Name */}
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <TextField
            name="last_name"
            label="Last Name"
            required
            fullWidth
            value={formData?.last_name || ""}
            onChange={handleChange}
          />
        </Grid>

        {/* Gender */}
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <FormLabel component="legend" required>
            Gender
          </FormLabel>
          <RadioGroup
            row
            name="gender"
            value={formData?.gender || ""}
            onChange={handleChange}
          >
            <FormControlLabel value="m" control={<Radio />} label="Male" />
            <FormControlLabel value="f" control={<Radio />} label="Female" />
          </RadioGroup>
        </Grid>

        {/* Date of Birth */}
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <DatePicker
            name="dob"
            label="Date of Birth"
            value={formData?.dob || null}
            onChange={(newValue) =>
              handleChange({
                target: { name: "dob", value: newValue },
              })
            }
            slotProps={{
              textField: {
                required: true,
                fullWidth: true,
              },
            }}
            disableFuture
          />
        </Grid>

        {/* Aadhaar No */}
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <TextField
            label="Aadhaar No"
            placeholder="Leave empty if does not exist"
            name="aadhaar"
            value={formData?.aadhaar || ""}
            onChange={(e) => {
              const value = String(e.target.value || "")
                .replace(/\D/g, "")
                .slice(0, 12);
              setFormData((prev) => ({
                ...prev,
                aadhaar: value,
              }));
            }}
            fullWidth
            inputProps={{ maxLength: 12, inputMode: "numeric" }}
            helperText="Must be exactly 12 digits if entered"
          />
        </Grid>

        {/* Residential Address 1 */}
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <TextField
            name="address_1"
            label="Residential Address 1"
            fullWidth
            required
            value={formData?.address_1 || ""}
            onChange={handleChange}
          />
        </Grid>

        {/* Residential Address 2 */}
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <TextField
            name="address_2"
            label="Residential Address 2"
            fullWidth
            value={formData?.address_2 || ""}
            onChange={handleChange}
          />
        </Grid>

        {/* Pincode -> auto fills city/state/country */}
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <TextField
            name="pincode"
            label="Pincode"
            fullWidth
            required
            value={formData?.pincode || ""}
            onChange={handlePincodeChange}
            inputProps={{ maxLength: 6, inputMode: "numeric" }}
            InputProps={{
              endAdornment: isPincodeLoading ? (
                <CircularProgress size={18} />
              ) : null,
            }}
            helperText={
              isPincodeLoading
                ? "Fetching city, state, country..."
                : "Enter 6-digit pincode to auto-fill"
            }
          />
        </Grid>

        {/* City */}
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

        {/* State */}
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

        {/* Country */}
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

        {/* Previous School — hidden for Nursery, LKG, UKG, Class 1 */}
        {!hidePreviousSchool && (
          <>
            <Grid item xs={12} sm={6} md={4} lg={3}>
              <FormLabel component="legend" required>
                Previous School?
              </FormLabel>
              <RadioGroup
                row
                name="has_previous_school"
                value={formData?.has_previous_school || "no"}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    has_previous_school: value,
                    ...(value === "no"
                      ? {
                          last_school: "",
                          last_school_address: "",
                          udise_pen_id: "",
                        }
                      : {}),
                  }));
                }}
              >
                <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                <FormControlLabel value="no" control={<Radio />} label="No" />
              </RadioGroup>
            </Grid>

            {formData?.has_previous_school === "yes" && (
              <>
                <Grid item xs={12} sm={6} md={4} lg={3}>
                  <TextField
                    name="last_school"
                    label="Previous School"
                    placeholder="Previous school name"
                    fullWidth
                    value={formData?.last_school || ""}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={4} lg={3}>
                  <TextField
                    name="last_school_address"
                    label="Previous School Place / Address"
                    fullWidth
                    value={formData?.last_school_address || ""}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={4} lg={3}>
                  <TextField
                    name="udise_pen_id"
                    label="PEN No (UDISE+)"
                    placeholder="Permanent Education Number"
                    fullWidth
                    value={formData?.udise_pen_id || ""}
                    onChange={(e) => {
                      const value = String(e.target.value || "")
                        .replace(/\D/g, "")
                        .slice(0, 11);
                      setFormData((prev) => ({
                        ...prev,
                        udise_pen_id: value,
                      }));
                    }}
                    inputProps={{ maxLength: 11, inputMode: "numeric" }}
                    helperText="Must be exactly 11 digits if entered"
                  />
                </Grid>
              </>
            )}
          </>
        )}

        {/* Is orphan? frontend-only */}
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <FormLabel component="legend" required>
            Is Orphan?
          </FormLabel>
          <RadioGroup
            row
            name="is_orphan"
            value={formData?.is_orphan || "no"}
            onChange={(e) => {
              const value = e.target.value;
              setFormData((prev) => ({
                ...prev,
                is_orphan: value,
              }));
              if (value === "yes") {
                setAttachments((prev) => ({
                  ...prev,
                  father_photo: null,
                  mother_photo: null,
                  father_aadhar_card: null,
                  mother_aadhar_card: null,
                }));
              } else {
                setAttachments((prev) => ({
                  ...prev,
                  guardian_photo: null,
                  guardian_aadhar_card: null,
                }));
              }
            }}
          >
            <FormControlLabel value="yes" control={<Radio />} label="Yes" />
            <FormControlLabel value="no" control={<Radio />} label="No" />
          </RadioGroup>
        </Grid>

        {/* Second Language only for above Nursery and LKG */}
        {classId !== "nursery" && classId !== "lkg" && (
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <Autocomplete
              options={["Hindi", "Urdu", "Bengali"]}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Second Language"
                  fullWidth
                  required
                />
              )}
              value={formData?.second_language || ""}
              onChange={(_, newValue) =>
                handleChange({
                  target: { name: "second_language", value: newValue },
                })
              }
            />
          </Grid>
        )}

        {/* Stream for Class 9 and Class 11 */}
        {(classId === "class_9" || classId === "class_11") && (
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <Autocomplete
              options={
                classId === "class_11"
                  ? ["Science", "Commerce", "Humanities"]
                  : ["Science", "Commerce"]
              }
              renderInput={(params) => (
                <TextField {...params} label="Stream" fullWidth required />
              )}
              value={formData?.stream || ""}
              onChange={(_, newValue) =>
                handleChange({
                  target: { name: "stream", value: newValue },
                })
              }
            />
          </Grid>
        )}

        <Grid item xs={12}>
          <Typography variant="h6">
            {isOrphan
              ? "Recent photo of child and guardian to be uploaded"
              : "Recent photo of child and parents to be uploaded"}
          </Typography>
        </Grid>

        {/* Attachments */}
        <Grid item xs={12}>
          <Grid container spacing={4}>
            <Grid item xs={12} sm={6} md={4}>
              <AttachmentsTab
                setAttachments={setAttachments}
                attachments={attachments}
                title="Child's Photo"
              />
            </Grid>

            {isOrphan ? (
              <Grid item xs={12} sm={6} md={4}>
                <AttachmentsTab
                  setAttachments={setAttachments}
                  attachments={attachments}
                  title="Guardian's Photo"
                />
              </Grid>
            ) : (
              <>
                <Grid item xs={12} sm={6} md={4}>
                  <AttachmentsTab
                    setAttachments={setAttachments}
                    attachments={attachments}
                    title="Father's Photo"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <AttachmentsTab
                    setAttachments={setAttachments}
                    attachments={attachments}
                    title="Mother's Photo"
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12} sm={6} md={4}>
              <AttachmentsTab
                setAttachments={setAttachments}
                attachments={attachments}
                title="Family Photo"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <AttachmentsTab
                setAttachments={setAttachments}
                attachments={attachments}
                title="Birth Certificate"
              />
            </Grid>

            {isOrphan ? (
              <Grid item xs={12} sm={6} md={4}>
                <AttachmentsTab
                  setAttachments={setAttachments}
                  attachments={attachments}
                  title="Guardian's Aadhaar Card"
                />
              </Grid>
            ) : (
              <>
                <Grid item xs={12} sm={6} md={4}>
                  <AttachmentsTab
                    setAttachments={setAttachments}
                    attachments={attachments}
                    title="Father's Aadhaar Card"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <AttachmentsTab
                    setAttachments={setAttachments}
                    attachments={attachments}
                    title="Mother's Aadhaar Card"
                  />
                </Grid>
              </>
            )}

            {classId && classId !== "nursery" && (
              <Grid item xs={12} sm={6} md={4}>
                <AttachmentsTab
                  setAttachments={setAttachments}
                  attachments={attachments}
                  title="Previous Report Card"
                  isRequired={false}
                />
              </Grid>
            )}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

ChildDetailsTab.propTypes = {
  props: PropTypes.shape({
    formData: PropTypes.object,
    setFormData: PropTypes.func,
    setAttachments: PropTypes.func,
    attachments: PropTypes.object,
    handleChange: PropTypes.func,
  }).isRequired,
  // Declared for eslint react/prop-types (nested destructure from `props`)
  formData: PropTypes.object,
  setFormData: PropTypes.func,
  setAttachments: PropTypes.func,
  attachments: PropTypes.object,
  handleChange: PropTypes.func,
};

export default memo(ChildDetailsTab);
