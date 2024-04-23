import dotenv from "dotenv";
import { Car } from "models/car.model";
import { CarBrand } from "models/car_brand.model";
import { Sequelize } from "sequelize-typescript";
import { join } from "path";
import { SequelizeTypescriptMigration, MigratorDir } from "../src";

const config = require("./db/config.json");

dotenv.config();

const bootstrap = async () => {
  const sequelize: Sequelize = new Sequelize({
    username: config.development.username,
    password: config.development.password,
    database: config.development.database,
    host: config.development.host,
    dialect: config.development.dialect,
    models: [CarBrand, Car],
    logging: false,
  });
  try {
    const result = await SequelizeTypescriptMigration.migrate(sequelize, {
      path: join(__dirname, "./db/migrations"),
      dir: MigratorDir.UP,
      pattern: /\.cts$/ 
    });
    console.log(result);
  } catch (e) {
    console.log(e);
  }
};

bootstrap();