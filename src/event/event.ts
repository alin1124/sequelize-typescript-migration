import EventEmitter from "events";
import { ModelEvent } from "./modelEvent";

export interface IEvent {
    publish(
        event: string,
        payload: any
    ): this;

    subscribe(
        event: string,
        executor: (payload: any) => any | Promise<any>,
    ): this;
}

export interface ISubscriber {
    subscribe(event: IEvent): any | Promise<any>;
}

type SubscriberFunction = new () => ISubscriber;

const eventEmitter: EventEmitter = new EventEmitter();

export const modelEvent = new ModelEvent(eventEmitter);

export function registerSubscriber(target: SubscriberFunction) {
    const subscriber = new target();
    subscriber.subscribe(modelEvent);
}


