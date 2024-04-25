import { Model, ModelStatic } from "sequelize";
import { Json } from "../../constants";
import { IAction } from "../../utils/getDiffActionsFromTables";

export interface IInterceptMigration {
    tableState: Json;
    actions: IAction[];
}

export interface IInterceptor {
    interceptModel(model: ModelStatic<Model>): Promise<void> | void;

    interceptMigration(input: IInterceptMigration): Promise<void> | void;
}
