import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { v4 as uuidv4 } from "uuid";

interface ChartOfAccountAttributes {
  id: string;
  account_code: string;
  account_name: string;
  category: string;
  account_type: string;
  sub_type?: string | null;
  parent_id?: string | null;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

interface ChartOfAccountCreationAttributes
  extends Optional<
    ChartOfAccountAttributes,
    "id" | "parent_id" | "is_active" | "created_at" | "updated_at" | "sub_type"
  > {}

class ChartOfAccount
  extends Model<ChartOfAccountAttributes, ChartOfAccountCreationAttributes>
  implements ChartOfAccountAttributes
{
  public id!: string;
  public account_code!: string;
  public account_name!: string;
  public category!: string;
  public account_type!: string;
  public sub_type?: string | null;
  public parent_id?: string | null;
  public is_active!: boolean;
  public created_at!: Date;
  public updated_at!: Date;
}

export const initChartOfAccount = (sequelize: Sequelize) => {
  ChartOfAccount.init(
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: () => uuidv4(),
      },
      account_code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      account_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      account_type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      sub_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      parent_id: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
          model: "chart_of_accounts",
          key: "id",
        },
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
      tableName: "chart_of_accounts",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
  return ChartOfAccount;
};

export default ChartOfAccount;
