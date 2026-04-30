const { Sequelize } = require("sequelize");

const dbPassword = process.env.DB_PASS ?? process.env.DB_PASSWORD;

if (typeof dbPassword !== "string" || dbPassword.length === 0) {
  throw new Error("Missing DB password: set DB_PASS or DB_PASSWORD in your .env file.");
}

const isProduction = process.env.NODE_ENV === "production";

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  dbPassword,
  {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "5432", 10),
    dialect: "postgres",
    dialectOptions: isProduction
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : {},
    logging: false,
  }
);

module.exports = sequelize;
