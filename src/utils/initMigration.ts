import * as fs from "fs";
import * as path from "path";

import removeCurrentRevisionMigrations from "./removeCurrentRevisionMigrations";

export const FILE_NAME = '00000001-init.cts';

export const MIGRATION_NAME = 'init';

export default async function initMigration(currentState, options) {
  await removeCurrentRevisionMigrations(
    currentState.revision,
    options.outDir,
    options
  );

  const name = MIGRATION_NAME;
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

  const auditTrigger = `CREATE OR REPLACE FUNCTION public.audit_trigger()
  RETURNS trigger
  LANGUAGE plpgsql
 AS $function$
     DECLARE columns text;
     table_exists bool;
 begin
     
 execute format(
     ' SELECT EXISTS (
     SELECT FROM 
         information_schema.tables 
     WHERE 
         table_type LIKE ''BASE TABLE'' AND
         table_name = ''%1$s_audit''
     );
     ', TG_TABLE_NAME ) into table_exists;
 -- if the table itself is not a history table and it has a corresponding history table, copy the record
 if POSITION('_audit' in TG_TABLE_NAME) = 0 AND table_exists then
 EXECUTE format('SELECT  string_agg(''"'' || c1.attname || ''"'', '','')
     FROM    pg_attribute c1
     where      c1.attrelid = ''%s''::regclass
     AND     c1.attname <> ''id''
     AND     c1.attnum > 0;', TG_TABLE_NAME) INTO columns;
 
     execute  format(
         '   INSERT INTO %1$s_audit ( "auditId", id, %2$s )
             values (md5(random()::text || ''%3$s'' || clock_timestamp()::text)::uuid, $1.*)
         ', TG_TABLE_NAME, columns, new.id) using new;
         
 end if;
 RETURN NEW;
 END
 $function$
 ;`;

  const dropAuditFunction = `DROP FUNCTION IF EXISTS public.audit_trigger;`;

  const template = `'use strict';

  import Sequelize, { QueryInterface } from 'sequelize';
  
  /**
   * Actions summary:
   *
   * Initialize Migration Metadata 
   *
   **/
  
  const info = {
      "revision": 1,
      "name": "tableSync",
      "created": "2024-04-11T19:34:11.031Z",
      "comment": ""
  };
  
  const migrationCommands = [
      {
          fn: "dropTable",
          params: ["SequelizeMeta"]
      },
      {
          fn: "createTable",
          params: [
              "SequelizeMeta",
              {
                  "name": {
                      "allowNull": false,
                      "primaryKey": true,
                      "type": Sequelize.STRING
                  },
                  "createdAt": {
                      "allowNull": false,
                      "type": Sequelize.DATE,
                      "defaultValue": Sequelize.fn('now')
                  },
                  "updatedAt": {
                      "allowNull": false,
                      "type": Sequelize.DATE,
                      "defaultValue": Sequelize.fn('now')
                  }
              },
              {}
          ]
      },
  
      {
          fn: "createTable",
          params: [
              "SequelizeMigrationsMeta",
              {
                  "revision": {
                      "primaryKey": true,
                      "type": Sequelize.INTEGER
                  },
                  "name": {
                      "allowNull": false,
                      "type": Sequelize.STRING
                  },
                  "state": {
                      "allowNull": false,
                      "type": Sequelize.JSON
                  },
                  "createdAt": {
                      "allowNull": false,
                      "type": Sequelize.DATE,
                      "defaultValue": Sequelize.fn('now')
                  },
                  "updatedAt": {
                      "allowNull": false,
                      "type": Sequelize.DATE,
                      "defaultValue": Sequelize.fn('now')
                  }
              },
              {}
          ]
      },
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
                  state: '{"revision":1,"tables":{}}'
              }],
              {}
          ]
      },
  ];
  
  const rollbackCommands = [
  
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
  ];
  
  module.exports = {
    async up (queryInterface: QueryInterface) {
      let index = 0;
      while (index < migrationCommands.length) {
          let command = migrationCommands[index];
          console.log("[#"+index+"] execute: " + command.fn);
          index++;
          await (queryInterface as any)[command.fn].apply(queryInterface, command.params);
      }
      await queryInterface.sequelize.query(\`${auditTrigger}\`);
    },
    async down (queryInterface: QueryInterface) {
      let index = 0;
      while (index < rollbackCommands.length) {
          let command = rollbackCommands[index];
          console.log("[#"+index+"] execute: " + command.fn);
          index++;
          await (queryInterface as any)[command.fn].apply(queryInterface, command.params);
      }
      await queryInterface.sequelize.query(\`${dropAuditFunction}\`);
    },
    info
  };   
`;

  const revisionNumber = currentState.revision.toString().padStart(8, "0");

  const filename = path.join(
    options.outDir,
    `${
      revisionNumber + (`-${name.replace(/[\s-]/g, "_")}`)
    }.cts`
  );

  fs.writeFileSync(filename, template);

  return { filename, info, revisionNumber };
}
