import {
  Table,
  Model,
  Column,
  ForeignKey,
  BelongsTo,
  DataType,
} from "sequelize-typescript";
import { Audit } from "../../src";

import { CarBrand } from "./car_brand.model";

@Audit
@Table
export class Car extends Model<Car> {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
  })
  declare id: string;

  @Column
  name!: string;

  @ForeignKey(() => CarBrand)
  @Column
  carBrandId!: number;

  @BelongsTo(() => CarBrand)
  carBrand!: CarBrand;
}
