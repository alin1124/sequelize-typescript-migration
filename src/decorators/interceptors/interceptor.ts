import { Model, ModelStatic } from "sequelize";
import { InterceptorFunction, interceptorRegistry } from "./registerInterceptor";

export function interceptModel(model: ModelStatic<Model>, tables: {
    [key: string]: any;
}) {
    interceptorRegistry.forEach((interceptorFunction: InterceptorFunction) => {
        new interceptorFunction().interceptModel(model, tables);
    });
}
