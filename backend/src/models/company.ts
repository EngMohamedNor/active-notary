import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { v4 as uuidv4 } from "uuid";

interface CompanyAttributes {
  id: string;
  name: string;
  code?: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

interface CompanyCreationAttributes
  extends Optional<
    CompanyAttributes,
    "id" | "code" | "is_active" | "created_at" | "updated_at"
  > {}

class Company
  extends Model<CompanyAttributes, CompanyCreationAttributes>
  implements CompanyAttributes
{
  public id!: string;
  public name!: string;
  public code?: string;
  public is_active!: boolean;
  public created_at!: Date;
  public updated_at!: Date;
}

export const initCompany = (sequelize: Sequelize) => {
  Company.init(
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: () => uuidv4(),
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: "companies",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
  return Company;
};

export default Company;
