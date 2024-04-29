import EventEmitter from "events";
import { Model, ModelStatic } from "sequelize";
import { IEvent } from "./event";

export type EVENT = 'model.pre.load' | 'model.post.load';

export type EVENT_PAYLOAD = {
  model: ModelStatic<Model>;
  tables: {
    [key: string]: any;
  };
}

export class ModelEvent implements IEvent {
  constructor(private readonly emitter: EventEmitter) {}
  subscribe(event: EVENT, executor: (payload: EVENT_PAYLOAD) => any): this {
   this.emitter.on(event, executor);
   return this;
  }
 
  publish(event: EVENT, payload: EVENT_PAYLOAD): this {
   this.emitter.emit(event, payload);
   return this;
  }
 }