import { IInterceptor } from "./IInterceptor";

export type InterceptorFunction = new () => IInterceptor;
export const interceptorRegistry: Array<InterceptorFunction> = [];

export function registerInterceptor(target: InterceptorFunction) {
    interceptorRegistry.push(target);
}
