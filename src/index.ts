import { existsSync } from "fs";
import beautify from "js-beautify";
import type { Model, ModelCtor } from "sequelize/types";
import { Sequelize } from "sequelize-typescript";

import type { MigrationState } from "./constants";
import getDiffActionsFromTables, { Direction } from "./utils/getDiffActionsFromTables";
import { getLastMigrationState, getLastMigrationVersion } from "./utils/getLastMigrationState";
import getMigration from "./utils/getMigration";
import getTablesFromModels, { ReverseModelsOptions } from "./utils/getTablesFromModels";
import writeMigration from "./utils/writeMigration";
import sqlMigration from "./utils/sqlMigration";
import path from "path";
import initMigration, { FILE_NAME } from "./utils/initMigration";
import getMigrator from "./utils/getMigrator";

export * from "./decorators/audit";

export type IMigrationOptions = {
    /**
     * directory where migration file saved. We recommend that you specify this path to sequelize migration path.
     */
    outDir: string;

    /**
     * if true, it doesn't generate files but just prints result action.
     */
    preview?: boolean;

    /**
     * migration file name, default is "noname"
     */
    migrationName?: string;

    /**
     * comment of migration.
     */
    comment?: string;

    debug?: boolean;

    sync?: boolean;
} & ReverseModelsOptions;

export type IMigratorOption = {

    path: string;

    dir: MigratorDir;

    to?: string;

    pattern?: RegExp;
};

export enum MigratorDir {
    UP = 'up',
    DOWN = 'down'
}

export class SequelizeTypescriptMigration {
    /**
     * generates migration file including up, down code
     * after this, run 'npx sequelize-cli db:migrate'.
     * @param sequelize sequelize-typescript instance
     * @param options options
     */
    public static makeMigration = async (sequelize: Sequelize, options: IMigrationOptions) => {
        options.preview = options.preview || false;

        if (!existsSync(options.outDir))
            return Promise.reject(
                new Error(
                    `${options.outDir} not exists. check path and if you did 'npx sequelize init' you must use path used in sequelize migration path`,
                ),
            );

        await sequelize.authenticate();

        const models: {
            [key: string]: ModelCtor<Model>;
        } = sequelize.models;

        const lastMigrationState = await getLastMigrationState(sequelize);
        const lastMigrationVersion = await getLastMigrationVersion(sequelize);
        const previousState: MigrationState = {
            revision: lastMigrationVersion ?? 0,
            tables: lastMigrationState?.tables ?? {},
        };
        const currentState: MigrationState = {
            revision: (previousState.revision || 0) + 1,
            tables: getTablesFromModels(sequelize, models, options),
        };

        await SequelizeTypescriptMigration.initMigration(currentState, options);

        let info;

        if (options.sync) {
            const upActions = getDiffActionsFromTables(previousState.tables, currentState.tables, Direction.Up);
            const downActions = getDiffActionsFromTables(currentState.tables, previousState.tables, Direction.Down);
    
            const migration = getMigration(upActions);
            const tmp = getMigration(downActions);
    
            migration.commandsDown = tmp.commandsUp;
            //create table sync migration
            if (migration.commandsUp.length === 0) return Promise.resolve({ msg: 'success: no changes found' });

            // log
            migration.consoleOut.forEach((v) => {
                console.log(`[Actions] ${v}`);
            });

            if (options.preview) {
                console.log('Migration result:');
                console.log(beautify(`[ \n${migration.commandsUp.join(', \n')} \n];\n`));
                console.log('Undo commands:');
                console.log(beautify(`[ \n${migration.commandsDown.join(', \n')} \n];\n`));

                return Promise.resolve({ msg: 'success without save' });
            }
            info = await writeMigration(currentState, migration, options);
        } else {
            //create empty migration for custom migration
            info = await sqlMigration(currentState, options);
        }

        console.log(`New migration to revision ${currentState.revision} has been saved to file '${info.filename}'`);


        try {
            console.log(`Use sequelize CLI:
npx sequelize db:migrate --to ${info.revisionNumber}-${info.info.name}.js ${`--migrations-path=${options.outDir}`} `);

            return await Promise.resolve({ msg: 'success' });
        } catch (err) {
            if (options.debug) console.error(err);
        }

        return Promise.resolve({ msg: 'success anyway...' });
    };

    /**
     * @param currentState 
     * @param options 
     * @returns {void}
     */
    public static initMigration = async (currentState: MigrationState, options: IMigrationOptions) => {
        if (existsSync(path.join(options.outDir, FILE_NAME))) {
            return;
        }
        const info = await initMigration(currentState, options);
        console.log(`Initial migration to revision ${currentState.revision} has been saved to file '${info.filename}'`);
        // save current state, Ugly hack, see https://github.com/sequelize/sequelize/issues/8310
        const rows = [
            {
                revision: currentState.revision,
                name: info.info.name,
                state: JSON.stringify(currentState),
            },
        ];

        currentState.revision = currentState.revision! + 1; 
    }

    public static migrate = async (sequelize: Sequelize, options: IMigratorOption) => {
        const umzug = getMigrator(sequelize, options.path, options.pattern);
        return MigratorDir.UP === options.dir ? umzug.up(options.to) : umzug.down(options.to);
    }
}
