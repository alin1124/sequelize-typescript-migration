import { Model, ModelStatic } from "sequelize";
import { InterceptorFunction, interceptorRegistry } from "./registerInterceptor";
import '../audit';
import { IInterceptMigration } from "./IInterceptor";

export function interceptModel(model: ModelStatic<Model>, tableMetadata: {
    [key: string]: any;
}) {
    const a = interceptorRegistry;
    interceptorRegistry.forEach((interceptorFunction: InterceptorFunction) => {
        new interceptorFunction().interceptModel(model);
    });
}

export function interceptMigration(input: IInterceptMigration) {
    interceptorRegistry.forEach((interceptorFunction: InterceptorFunction) => {
        new interceptorFunction().interceptMigration(input);
    });
}
