import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import express from "express";
import rateLimiter from "./middleware/rateLimiter.js";
import TransactionsRoute from "./routes/transactionsRoute.js";
import { sql } from "./config/db.js";
import job from "./config/cron.js";

const app = express();

if (process.env.NODE_ENV === "production") job.start();

//middlewares
app.use(rateLimiter);
app.use(express.json());

const port = process.env.PORT || 8000;

app.get("/api/health", (req, res) => [res.status(200).json({ status: "OK" })]);

async function initDB() {
  try {
    await sql`CREATE TABLE IF NOT EXISTS transactions(
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            title VARCHAR(255) NOT NULL,
            amount DECIMAL(10, 2) NOT NULL,
            category VARCHAR(255) NOT NULL,
            created_at DATE NOT NULL DEFAULT CURRENT_DATE
        )`;

    console.log("Database initialisd successfully");
  } catch (error) {
    console.log("Error initialising db: ", error);
    process.exit(1);
  }
}

app.get("/", (req, res) => {
  res.send("Expense Tracker API is running");
});

app.use("/api/transactions", TransactionsRoute);

initDB().then(() => {
  app.listen(port, () => {
    console.log("Server is running on port:", port);
  });
});
