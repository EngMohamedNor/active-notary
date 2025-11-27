import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { v4 as uuidv4 } from "uuid";

interface JournalLineAttributes {
  id: string;
  journal_id: string;
  account_code: string;
  debit: number;
  credit: number;
  description?: string | null;
  party_id?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

interface JournalLineCreationAttributes
  extends Optional<
    JournalLineAttributes,
    "id" | "description" | "party_id" | "created_at" | "updated_at"
  > {}

class JournalLine
  extends Model<JournalLineAttributes, JournalLineCreationAttributes>
  implements JournalLineAttributes
{
  public id!: string;
  public journal_id!: string;
  public account_code!: string;
  public debit!: number;
  public credit!: number;
  public description?: string | null;
  public party_id?: string | null;
  public created_at!: Date;
  public updated_at!: Date;
}

export const initJournalLine = (sequelize: Sequelize) => {
  JournalLine.init(
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: () => uuidv4(),
      },
      journal_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: "general_journals",
          key: "id",
        },
      },
      account_code: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: "chart_of_accounts",
          key: "account_code",
        },
      },
      debit: {
        type: DataTypes.DECIMAL(20, 6),
        allowNull: false,
        defaultValue: 0,
      },
      credit: {
        type: DataTypes.DECIMAL(20, 6),
        allowNull: false,
        defaultValue: 0,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      party_id: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
          model: "parties",
          key: "id",
        },
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
      tableName: "journal_lines",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
  return JournalLine;
};

export default JournalLine;
