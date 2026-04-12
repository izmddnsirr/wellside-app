import * as React from "react";

type BookingCancellationAdminEmailProps = {
  customerName: string;
  customerPhone?: string | null;
  bookingId: string;
  services: string;
  barberName: string;
  bookingDate: string;
  bookingTime: string;
  totalPrice: string;
  status: string;
  preheader?: string;
};

export function BookingCancellationAdminEmail({
  customerName,
  customerPhone,
  bookingId,
  services,
  barberName,
  bookingDate,
  bookingTime,
  totalPrice,
  status,
  preheader,
}: BookingCancellationAdminEmailProps) {
  return (
    <div style={{ fontFamily: "ui-sans-serif, system-ui", lineHeight: 1.6 }}>
      {preheader ? (
        <div
          style={{
            display: "none",
            fontSize: "1px",
            color: "#f8fafc",
            lineHeight: "1px",
            maxHeight: "0px",
            maxWidth: "0px",
            opacity: 0,
            overflow: "hidden",
          }}
        >
          {preheader}
        </div>
      ) : null}
      <h1>Booking cancelled</h1>
      <p>A booking has been cancelled. Review the details below.</p>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td style={{ padding: "6px 0", color: "#6b7280" }}>Booking ID</td>
            <td style={{ padding: "6px 0", fontWeight: 600 }}>{bookingId}</td>
          </tr>
          <tr>
            <td style={{ padding: "6px 0", color: "#6b7280" }}>Customer</td>
            <td style={{ padding: "6px 0" }}>{customerName}</td>
          </tr>
          {customerPhone ? (
            <tr>
              <td style={{ padding: "6px 0", color: "#6b7280" }}>Phone</td>
              <td style={{ padding: "6px 0" }}>{customerPhone}</td>
            </tr>
          ) : null}
          <tr>
            <td style={{ padding: "6px 0", color: "#6b7280" }}>Service</td>
            <td style={{ padding: "6px 0" }}>{services}</td>
          </tr>
          <tr>
            <td style={{ padding: "6px 0", color: "#6b7280" }}>Barber</td>
            <td style={{ padding: "6px 0" }}>{barberName}</td>
          </tr>
          <tr>
            <td style={{ padding: "6px 0", color: "#6b7280" }}>Date</td>
            <td style={{ padding: "6px 0" }}>{bookingDate}</td>
          </tr>
          <tr>
            <td style={{ padding: "6px 0", color: "#6b7280" }}>Time</td>
            <td style={{ padding: "6px 0" }}>{bookingTime}</td>
          </tr>
          <tr>
            <td style={{ padding: "6px 0", color: "#6b7280" }}>Total</td>
            <td style={{ padding: "6px 0" }}>{totalPrice}</td>
          </tr>
          <tr>
            <td style={{ padding: "6px 0", color: "#6b7280" }}>Status</td>
            <td style={{ padding: "6px 0" }}>{status}</td>
          </tr>
        </tbody>
      </table>
      <p>Open the admin dashboard for follow-up actions.</p>
    </div>
  );
}

export default BookingCancellationAdminEmail;
