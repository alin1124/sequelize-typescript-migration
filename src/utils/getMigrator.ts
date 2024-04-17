import { Sequelize } from 'sequelize-typescript';
import Umzug from 'umzug';

export default function getMigrator(sequelize: Sequelize, path: string) {
  return new Umzug({
    migrations: {
      // indicates the folder containing the migration .js files
      path: path,
      // inject sequelize's QueryInterface in the migrations
      params: [
        sequelize.getQueryInterface(),
        Sequelize,
      ],
    },
    // indicates that the migration data should be store in the database
    // itself through sequelize. The default configuration creates a table
    // named `SequelizeMeta`.
    storage: 'sequelize',
    storageOptions: {
      sequelize,
    },
  });
};
