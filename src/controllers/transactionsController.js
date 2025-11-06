import { sql } from "../config/db.js";

export async function getTransactionsByUserId(req, res) {
  try {
    const { userId } = req.params;
    console.log(userId);

    const transactions = await sql`
        SELECT * FROM transactions WHERE user_id = ${userId} ORDER BY created_at DESC
        `;

    res.status(200).json({ transactions });
  } catch (error) {
    console.log(`Error gettings transactions: `, error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function createTransaction(req, res) {
  try {
    //title, amount, category, user_id
    const { title, amount, category, user_id } = req.body;

    if (!title || amount === undefined || !category || !user_id) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const transaction = await sql`
        INSERT INTO transactions (title, amount, category, user_id)
        VALUES (${title}, ${amount}, ${category}, ${user_id})
        RETURNING *
        `;

    console.log("Transaction: ", transaction);
    res.status(201).json({ transaction: transaction[0] });
  } catch (error) {
    console.log("Error creating transactions: ", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function deleteTransaction(req, res) {
  try {
    const { id } = req.params;

    if (isNaN(parseInt(id))) {
      return res.status(400).json({ message: "Invalid transaction ID" });
    }

    const result = await sql`
        DELETE FROM transactions WHERE id = ${id} RETURNING *
        `;

    if (result.length === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.log("Error deleting transactions: ", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function getTransactionSummary(req, res) {
  try {
    const { userId } = req.params;

    const balanceResult = await sql`
        SELECT COALESCE(SUM(amount), 0) as balance FROM transactions 
        WHERE user_id = ${userId}
        `;

    const incomeResult = await sql`
        SELECT COALESCE(SUM(amount), 0) as income FROM transactions 
        WHERE user_id = ${userId} 
        AND amount > 0
        `;

    const expensesResult = await sql`
        SELECT COALESCE(SUM(amount), 0) as expense FROM transactions 
        WHERE user_id = ${userId} 
        AND amount < 0
        `;

    res.status(200).json({
      balance: balanceResult[0].balance,
      income: incomeResult[0].income,
      expenses: expensesResult[0].expense,
    });
  } catch (error) {
    console.log("Error gettings transactions summary: ", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
