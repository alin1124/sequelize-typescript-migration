'use strict';

  const Sequelize = require('sequelize');
  
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
    async up (queryInterface, Sequelize) {
      let index = 0;
      while (index < migrationCommands.length) {
          let command = migrationCommands[index];
          console.log("[#"+index+"] execute: " + command.fn);
          index++;
          await queryInterface[command.fn].apply(queryInterface, command.params);
      }
    },
    async down (queryInterface, Sequelize) {
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
