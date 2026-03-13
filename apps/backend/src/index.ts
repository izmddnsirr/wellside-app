import "dotenv/config";
import cors from "cors";
import express from "express";
import availabilityRoutes from "./routes/availabilityRoutes";
import bookingsRoutes from "./routes/bookingsRoutes";
import operationsRoutes from "./routes/operationsRoutes";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/availability", availabilityRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/operations", operationsRoutes);

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
