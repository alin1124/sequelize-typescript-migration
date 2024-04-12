import {
  DataType as SequelizeTypescriptDataType,
  Sequelize,
} from "sequelize-typescript";

export default async function createMigrationTable(sequelize: Sequelize) {
  const queryInterface = sequelize.getQueryInterface();

  await queryInterface.createTable("SequelizeMeta", {
    name: {
      type: SequelizeTypescriptDataType.STRING,
      allowNull: false,
      unique: true,
      primaryKey: true,
    },
    createdAt: {
      type: SequelizeTypescriptDataType.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn("now"),
    },
    updatedAt: {
      type: SequelizeTypescriptDataType.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn("now"),
    },
  });
  await queryInterface.createTable("SequelizeMigrationsMeta", {
    revision: {
      type: SequelizeTypescriptDataType.INTEGER,
      allowNull: false,
      unique: true,
      primaryKey: true,
    },
    name: {
      type: SequelizeTypescriptDataType.STRING,
      allowNull: false,
    },
    state: {
      type: SequelizeTypescriptDataType.JSON,
      allowNull: false,
    },
    createdAt: {
      type: SequelizeTypescriptDataType.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn("now"),
    },
    updatedAt: {
      type: SequelizeTypescriptDataType.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn("now"),
    },
  });
}
