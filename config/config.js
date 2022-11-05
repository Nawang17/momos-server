require("dotenv").config();
module.exports = {
  development: {
    username: "root",
    password: "password",
    database: "momos-dev",
    host: "127.0.0.1",
    dialect: "mysql",
    dialectOptions: {
      charset: "utf8mb4",
    },
  },
  test: {
    username: "root",
    password: null,
    database: "database_test",
    host: "127.0.0.1",
    dialect: "mysql",
    dialectOptions: {
      charset: "utf8mb4",
    },
  },
  // production: {
  //   username: "root",
  //   password: "scxiJ0MKxecMcTSoqjIB",
  //   database: "railway",
  //   host: "containers-us-west-95.railway.app",
  //   dialect: "mysql",
  //   port: 6304,
  //   dialectOptions: {
  //     charset: "utf8mb4",
  //   },
  // },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: 6304,
    dialect: "mysql",
    dialectOptions: {
      charset: "utf8mb4",
    },
  },
};
