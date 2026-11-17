/**
 * Fetch city/state/country from India Post pincode API.
 * https://api.postalpincode.in/pincode/{pincode}
 */
export async function lookupIndianPincode(pincode) {
  const pin = String(pincode || "").replace(/\D/g, "").slice(0, 6);
  if (pin.length !== 6) {
    return { ok: false, message: "Enter a valid 6-digit pincode." };
  }

  try {
    const response = await fetch(
      `https://api.postalpincode.in/pincode/${pin}`,
    );
    const data = await response.json();
    const result = Array.isArray(data) ? data[0] : null;

    if (!result || result.Status !== "Success" || !result.PostOffice?.length) {
      return {
        ok: false,
        message: result?.Message || "No location found for this pincode.",
      };
    }

    const office = result.PostOffice[0];
    return {
      ok: true,
      data: {
        city: office?.District || office?.Block || office?.Name || "",
        state: office?.State || "",
        country: office?.Country || "India",
      },
    };
  } catch {
    return {
      ok: false,
      message: "Unable to fetch location for this pincode.",
    };
  }
}

export function digitsOnlyPincode(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 6);
}

