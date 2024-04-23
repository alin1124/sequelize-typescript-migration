import * as fs from "fs";
import beautify from "js-beautify";
import * as path from "path";

import removeCurrentRevisionMigrations from "./removeCurrentRevisionMigrations";

export default async function writeMigration(currentState, migration, options) {
  await removeCurrentRevisionMigrations(
    currentState.revision,
    options.outDir,
    options
  );

  const name = options.migrationName || "table-sync";
  const comment = options.comment || "";

  let myState = JSON.stringify(currentState);
  const searchRegExp = /'/g;
  const replaceWith = "\\'";

  myState = myState.replace(searchRegExp, replaceWith);

  const versionCommands = `
      {
        fn: "bulkDelete",
        params: [
          "SequelizeMigrationsMeta",
          [{
            revision: info.revision
          }],
          {}
        ]
      },
      {
        fn: "bulkInsert",
        params: [
          "SequelizeMigrationsMeta",
          [{
            revision: info.revision,
            name: info.name,
            state: '${myState}'
          }],
          {}
        ]
      },
    `;

  const versionDownCommands = `
    {
      fn: "bulkDelete",
      params: [
        "SequelizeMigrationsMeta",
        [{
          revision: info.revision,
        }],
        {}
      ]
    },
`;

  let commands = `const migrationCommands = [\n${versionCommands}\n\n \n${migration.commandsUp.join(
    ", \n"
  )} \n];\n`;
  let commandsDown = `const rollbackCommands = [\n${versionDownCommands}\n\n \n${migration.commandsDown.join(
    ", \n"
  )} \n];\n`;

  const actions = ` * ${migration.consoleOut.join("\n * ")}`;

  commands = beautify(commands);
  commandsDown = beautify(commandsDown);

  const info = {
    revision: currentState.revision,
    name,
    created: new Date(),
    comment,
  };

  const template = `'use strict';

const Sequelize = require('sequelize');

/**
 * Actions summary:
 *
${actions}
 *
 **/

const info = ${JSON.stringify(info, null, 4)};

${commands}

${commandsDown}

module.exports = {
  async up (queryInterface: any, Sequelize: any) {
    let index = 0;
    while (index < migrationCommands.length) {
        let command = migrationCommands[index];
        console.log("[#"+index+"] execute: " + command.fn);
        index++;
        await queryInterface[command.fn].apply(queryInterface, command.params);
    }
  },
  async down (queryInterface: any, Sequelize: any) {
    let index = 0;
    while (index < rollbackCommands.length) {
        let command = rollbackCommands[index];
        console.log("[#"+index+"] execute: " + command.fn);
        index++;
        await queryInterface[command.fn].apply(queryInterface, command.params);
    }
  },
  info
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
