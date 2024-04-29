import _ from "lodash";
import { Sequelize } from "sequelize";
import { ModelEvent, EVENT_PAYLOAD } from "../../event/modelEvent";
import { ISubscriber, registerSubscriber } from "../../event/event";
import { AUDIT_METADATA_NAME } from "./audit";

@registerSubscriber
export class auditSubscriber implements ISubscriber {
  subscribe(modelEvent: ModelEvent) {
    modelEvent.subscribe('model.post.load', this.interceptModel);
  }

  interceptModel(payload: EVENT_PAYLOAD): void {
    const { model, tables } = payload;
    const audit = Reflect.getMetadata(AUDIT_METADATA_NAME, model);
    if (!audit) {
      return;
    }
    
    const table = tables[model.tableName];

    let auditTable = _.cloneDeep(table);
    let attributes: any[] = [];
    
    for (let attr in auditTable.schema) {
     attributes.push(auditTable.schema[attr]);
    }
    //primary key handler
    //disable original table primary key 
    attributes.filter(attribute => {
      return attribute.primaryKey;
    }).forEach( attribute => {
      attribute.primaryKey = false;
      attribute.autoIncrement = false;
    });
    //create audit table primary key column
    auditTable.schema.auditId = {
     primaryKey: true,
     seqType: 'Sequelize.UUID'
    };

    //foreign key handler
    //disable foreign key
    auditTable.depends = [];
    attributes.filter(attribute => {
      return attribute.references;
    }).forEach( attribute => {
      delete attribute.onDelete;
      delete attribute.onUpdate;
      delete attribute.references;
    });

    //create audit table date column
    auditTable.schema.auditDate = {
        allowNull: false,
        seqType: 'Sequelize.DATE',
        defaultValue: {value: Sequelize.fn('now')}
    };

    auditTable.tableName = `${auditTable.tableName}_audit`;

    //create trigger for audit table
    auditTable.rawSQL = `create trigger audit_update before insert or update on "${model.tableName}" for each row execute procedure audit_trigger();`;
    tables[auditTable.tableName] = auditTable;
  }
}