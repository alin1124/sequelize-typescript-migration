import * as fs from "fs";
import * as path from "path";

import removeCurrentRevisionMigrations from "./removeCurrentRevisionMigrations";

export default async function sqlMigration(currentState, options) {
  await removeCurrentRevisionMigrations(
    currentState.revision,
    options.outDir,
    options
  );

  const name = options.migrationName || "sql";
  const comment = options.comment || "";

  let myState = JSON.stringify(currentState);
  const searchRegExp = /'/g;
  const replaceWith = "\\'";

  myState = myState.replace(searchRegExp, replaceWith);

  const info = {
    revision: currentState.revision,
    name,
    created: new Date(),
    comment,
  };

  const template = `'use strict';
  
  import { QueryInterface } from 'sequelize';

  /** @type {import('sequelize-cli').Migration} */
  module.exports = {
    async up (queryInterface: QueryInterface) {
      /**
       * Add altering commands here.
       *
       * Example:
       * await queryInterface.query('CREATE TABLE mytable (id INTEGER)');
       */
    },
  
    async down (queryInterface: QueryInterface) {
      /**
       * Add reverting commands here.
       *
       * Example:
       * await queryInterface.query('DROP TABLE mytable'); 
       */
    }
  };  
`;

  const revisionNumber = currentState.revision.toString().padStart(8, "0");

  const filename = path.join(
    options.outDir,
    `${
      revisionNumber + (name !== "" ? `-${name.replace(/[\s-]/g, "_")}` : "")
    }.cts`
  );

  fs.writeFileSync(filename, template);

  return { filename, info, revisionNumber };
}
