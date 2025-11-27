import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { v4 as uuidv4 } from "uuid";

interface PartyAttributes {
  id: string;
  party_type: string;
  name: string;
  code: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  country?: string | null;
  tax_id?: string | null;
  payment_terms?: string | null;
  credit_limit?: number | null;
  vendor_number?: string | null;
  employee_id?: string | null;
  department?: string | null;
  hire_date?: Date | null;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

interface PartyCreationAttributes
  extends Optional<
    PartyAttributes,
    | "id"
    | "email"
    | "phone"
    | "address"
    | "city"
    | "state"
    | "zip_code"
    | "country"
    | "tax_id"
    | "payment_terms"
    | "credit_limit"
    | "vendor_number"
    | "employee_id"
    | "department"
    | "hire_date"
    | "is_active"
    | "created_at"
    | "updated_at"
  > {}

class Party
  extends Model<PartyAttributes, PartyCreationAttributes>
  implements PartyAttributes
{
  public id!: string;
  public party_type!: string;
  public name!: string;
  public code!: string;
  public email?: string | null;
  public phone?: string | null;
  public address?: string | null;
  public city?: string | null;
  public state?: string | null;
  public zip_code?: string | null;
  public country?: string | null;
  public tax_id?: string | null;
  public payment_terms?: string | null;
  public credit_limit?: number | null;
  public vendor_number?: string | null;
  public employee_id?: string | null;
  public department?: string | null;
  public hire_date?: Date | null;
  public is_active!: boolean;
  public created_at!: Date;
  public updated_at!: Date;
}

export const initParty = (sequelize: Sequelize) => {
  Party.init(
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: () => uuidv4(),
      },
      party_type: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isIn: [["customer", "vendor", "employee"]],
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isEmail: true,
        },
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      state: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      zip_code: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      country: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      tax_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      payment_terms: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      credit_limit: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
      },
      vendor_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      employee_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      department: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      hire_date: {
        type: DataTypes.DATE,
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
      tableName: "parties",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          unique: true,
          fields: ["party_type", "code"],
          name: "unique_party_code_per_type",
        },
      ],
    }
  );
  return Party;
};

export default Party;

