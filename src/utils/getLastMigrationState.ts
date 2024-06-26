import { QueryTypes } from "sequelize";
import type { Sequelize } from "sequelize-typescript";

import type {
  MigrationState,
  SequelizeMigrations,
  SequelizeMigrationsMeta,
} from "../constants";

export async function getLastMigrationState(sequelize: Sequelize) {
  try {
    const [lastMigration] = await sequelize.query<SequelizeMigrationsMeta>(
      `SELECT state FROM "SequelizeMigrationsMeta" ORDER BY revision desc`,
      { type: QueryTypes.SELECT }
    );

    if (lastMigration)
      return typeof lastMigration.state === "string"
        ? (JSON.parse(lastMigration.state) as MigrationState)
        : lastMigration.state;
  } catch (error) {
    //SequelizeMigrationsMeta table does not exist
  }
}

export async function getLastMigrationVersion(sequelize: Sequelize) {
  try {
    const [lastExecutedMigration] = await sequelize.query<SequelizeMigrations>(
      'SELECT name FROM "SequelizeMeta" ORDER BY name desc limit 1',
      { type: QueryTypes.SELECT }
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const lastRevision: number =
      lastExecutedMigration !== undefined
        ? parseInt(lastExecutedMigration.name.split("-")[0])
        : 0;
    return lastRevision;
  } catch (error) {
    //SequelizeMigrationsMeta table does not exist
  }
}
