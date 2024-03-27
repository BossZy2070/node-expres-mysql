import mysql from "mysql";

export const conn = mysql.createPool({
  connectionLimit: 10,
  host: "nv1.metrabyte.cloud",
  user: "aemandko_65011212070",
  password: "65011212070",
  database: "aemandko_65011212070",
});