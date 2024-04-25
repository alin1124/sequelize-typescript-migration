import _ from "lodash";
import { ModelStatic } from "sequelize";
import { Model } from "sequelize-typescript";
import { IAction } from "../../utils/getDiffActionsFromTables";
import { IInterceptMigration, IInterceptor } from "../interceptors/IInterceptor";
import { registerInterceptor } from "../interceptors/registerInterceptor";
import { AUDIT_METADATA_NAME } from "./audit";

export const auditRegistry: {[tableName: string]: boolean} = {};

@registerInterceptor
export class auditInterceptor implements IInterceptor {
  interceptModel(model: ModelStatic<Model>): void {
    auditRegistry[model.tableName] = Reflect.getMetadata(AUDIT_METADATA_NAME, model);
  }

  interceptMigration(input: IInterceptMigration): void {
    const actions = input.actions;
    let auditActions: IAction[] = [];
    actions.forEach(action => {
      const modelName = action.tableName;
      if (auditRegistry[modelName]) {
        switch (action.actionType) {
          case 'createTable':
            auditActions.push(this.createTable(action));
            break;
          case 'dropTable':
              auditActions.push(this.dropTable(action));
              break;
          default:
            break;
        }
      }
    });
    input.actions = actions.concat(auditActions);
  }

  private createTable(action: IAction) {
    let auditAction = _.cloneDeep(action);
    let attributes: any[] = [];
    
    for (let attr in auditAction.attributes) {
     attributes.push(auditAction.attributes[attr]);
    }
    
    //primary key handler
    //disable original table primary key 
    attributes.filter(attribute => {
      return attribute.primaryKey;
    }).forEach( attribute => {
      attribute.primaryKey = false;
      attribute.autoIncrement = false;
    });
    //create audit table primary key
    auditAction.attributes.auditId = {
     primaryKey: true,
     seqType: 'Sequelize.UUID'
    };

    //foreign key handler
    //disable foreign key
    auditAction.depends = [];
    attributes.filter(attribute => {
      return attribute.references;
    }).forEach( attribute => {
      delete attribute.onDelete;
      delete attribute.onUpdate;
      delete attribute.references;
    });

    auditAction.tableName = `${action.tableName}Audit`;
    return auditAction;
  }

  private dropTable(action: IAction) {
    let auditAction = _.cloneDeep(action);
    auditAction.tableName = `${action.tableName}Audit`;
    return auditAction;
  }
}