import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";

const DEFAULT_WAIT_MINUTES = 10;

const formatCountdown = (totalSeconds) => {
  const secs = Math.max(0, Number(totalSeconds) || 0);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

/** Seconds remaining for pending-payment wait (survives refresh via created_at). */
export const calcPendingPaymentSecondsLeft = (pendingPayment) => {
  const waitMinutes = pendingPayment?.wait_minutes ?? DEFAULT_WAIT_MINUTES;
  if (pendingPayment?.created_at) {
    const startMs = new Date(pendingPayment.created_at).getTime();
    if (!Number.isNaN(startMs)) {
      const endMs = startMs + waitMinutes * 60 * 1000;
      return Math.max(0, Math.ceil((endMs - Date.now()) / 1000));
    }
  }
  return waitMinutes * 60;
};

/** True while last payment is pending AND wait window is still active. */
export const isPendingPaymentLocked = (allResponse) => {
  if (allResponse?.last_payment_status !== "pending") return false;
  return calcPendingPaymentSecondsLeft(allResponse?.pending_payment) > 0;
};

/** Countdown based on payment created_at (survives refresh). Hides when wait ends. */
const PendingPaymentBanner = ({ message, pendingPayment, onWaitEnd }) => {
  const initialSeconds = useMemo(
    () => calcPendingPaymentSecondsLeft(pendingPayment),
    [pendingPayment?.created_at, pendingPayment?.wait_minutes],
  );

  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onWaitEnd?.();
      return undefined;
    }
    const timer = setInterval(() => {
      // Recompute from created_at so refresh/tab sleep stay accurate
      setSecondsLeft(calcPendingPaymentSecondsLeft(pendingPayment));
    }, 1000);
    return () => clearInterval(timer);
  }, [
    secondsLeft > 0,
    pendingPayment?.created_at,
    pendingPayment?.wait_minutes,
    onWaitEnd,
  ]);

  if (secondsLeft <= 0) return null;

  return (
    <Box sx={{ mb: 2, fontSize: "14px", color: "warning.main" }}>
      <Typography variant="body2" sx={{ color: "warning.main", mb: 0.5 }}>
        {message}
      </Typography>
      <Typography variant="body2" sx={{ color: "warning.dark", fontWeight: 700 }}>
        {`Please wait: ${formatCountdown(secondsLeft)}`}
      </Typography>
    </Box>
  );
};

PendingPaymentBanner.propTypes = {
  message: PropTypes.string,
  pendingPayment: PropTypes.shape({
    created_at: PropTypes.string,
    wait_minutes: PropTypes.number,
  }),
  onWaitEnd: PropTypes.func,
};

export default PendingPaymentBanner;
