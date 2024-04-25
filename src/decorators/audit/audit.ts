import { Model } from "sequelize-typescript";

export const AUDIT_NAME = 'audit';

export const AUDIT_METADATA_NAME = `sequelize:${AUDIT_NAME}`;

export function Audit(arg: any): void {
  return annotate(arg);
}

function annotate(target: typeof Model): void {
  Reflect.defineMetadata(AUDIT_METADATA_NAME, true, target);
}