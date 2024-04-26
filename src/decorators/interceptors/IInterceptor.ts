import { Model, ModelStatic } from "sequelize";
import { Json } from "../../constants";
import { IAction } from "../../utils/getDiffActionsFromTables";

export interface IInterceptMigration {
    tableState: Json;
    actions: IAction[];
}

export interface IInterceptor {
    interceptModel(model: ModelStatic<Model>, tables: {
        [key: string]: any;
    }): Promise<void> | void;
}
