import { pxToRem, responsiveFontSizes } from "../utils/getFontValue";

/** Site-wide type — Ubuntu (Google Fonts) */
export const primaryFont = '"Ubuntu", sans-serif';
export const secondaryFont = '"Ubuntu", sans-serif';
export const brandFont = '"Ubuntu", sans-serif';

// ----------------------------------------------------------------------

const typography = {
  fontFamily: primaryFont,
  fontSecondaryFamily: secondaryFont,
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightSemiBold: 500,
  fontWeightBold: 700,
  h1: {
    fontFamily: primaryFont,
    fontWeight: 700,
    lineHeight: 80 / 64,
    fontSize: pxToRem(40),
    ...responsiveFontSizes({ xs: 40, sm: 52, md: 58, lg: 64 }),
  },
  h2: {
    fontFamily: primaryFont,
    fontWeight: 700,
    lineHeight: 64 / 48,
    fontSize: pxToRem(32),
    ...responsiveFontSizes({ xs: 32, sm: 40, md: 44, lg: 48 }),
  },
  h3: {
    fontFamily: primaryFont,
    fontWeight: 700,
    lineHeight: 1.5,
    fontSize: pxToRem(24),
    ...responsiveFontSizes({ xs: 24, sm: 26, md: 30, lg: 32 }),
  },
  h4: {
    fontFamily: primaryFont,
    fontWeight: 500,
    lineHeight: 1.5,
    fontSize: pxToRem(20),
    ...responsiveFontSizes({ xs: 20, sm: 20, md: 24, lg: 24 }),
  },
  h5: {
    fontFamily: primaryFont,
    fontWeight: 500,
    lineHeight: 1.5,
    fontSize: pxToRem(18),
    ...responsiveFontSizes({ xs: 18, sm: 19, md: 20, lg: 20 }),
  },
  h6: {
    fontFamily: primaryFont,
    fontWeight: 500,
    lineHeight: 28 / 18,
    fontSize: pxToRem(17),
    ...responsiveFontSizes({ xs: 17, sm: 18, md: 18, lg: 18 }),
  },
  subtitle1: {
    fontFamily: primaryFont,
    fontWeight: 500,
    lineHeight: 1.5,
    fontSize: pxToRem(16),
  },
  subtitle2: {
    fontFamily: primaryFont,
    fontWeight: 500,
    lineHeight: 22 / 14,
    fontSize: pxToRem(14),
  },
  body1: {
    fontFamily: primaryFont,
    fontWeight: 400,
    lineHeight: 1.5,
    fontSize: pxToRem(16),
  },
  body2: {
    fontFamily: primaryFont,
    fontWeight: 400,
    lineHeight: 22 / 14,
    fontSize: pxToRem(14),
  },
  caption: {
    fontFamily: primaryFont,
    fontWeight: 400,
    lineHeight: 1.5,
    fontSize: pxToRem(12),
  },
  overline: {
    fontFamily: primaryFont,
    fontWeight: 700,
    lineHeight: 1.5,
    fontSize: pxToRem(12),
    textTransform: "uppercase",
  },
  button: {
    fontFamily: primaryFont,
    fontWeight: 700,
    lineHeight: 24 / 14,
    fontSize: pxToRem(14),
    textTransform: "unset",
  },
};

export default typography;
