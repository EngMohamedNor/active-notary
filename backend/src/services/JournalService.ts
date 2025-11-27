import { Op, Transaction } from "sequelize";
import {
  GeneralJournal,
  JournalLine,
  ChartOfAccount,
} from "../models/index.js";

export interface JournalEntry {
  accountCode: string;
  debit: number;
  credit: number;
  description?: string;
  partyId?: string | null;
}

export interface TrialBalanceItem {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  balance: number;
}

export class JournalService {
  /**
   * Get trial balance
   */
  static async getTrialBalance(asOfDate?: Date): Promise<TrialBalanceItem[]> {
    const whereClause: any = {};
    const journalWhere: any = {};

    if (asOfDate) {
      journalWhere.date = { [Op.lte]: asOfDate };
    }

    // Get all journal lines up to the date
    const journalLines = await JournalLine.findAll({
      include: [
        {
          model: GeneralJournal,
          as: "journal",
          ...(Object.keys(journalWhere).length > 0 && { where: journalWhere }),
        },
      ],
    });

    // Get all accounts
    const accounts = await ChartOfAccount.findAll({
      where: { is_active: true },
    });

    // Calculate balances for each account
    const accountBalances = new Map<
      string,
      { debit: number; credit: number }
    >();

    // Initialize all accounts with zero balances
    accounts.forEach((account) => {
      accountBalances.set(account.account_code, { debit: 0, credit: 0 });
    });

    // Calculate balances from journal lines
    journalLines.forEach((line) => {
      const balance = accountBalances.get(line.account_code) || {
        debit: 0,
        credit: 0,
      };
      balance.debit += parseFloat(line.debit.toString());
      balance.credit += parseFloat(line.credit.toString());
      accountBalances.set(line.account_code, balance);
    });

    // Convert to trial balance format
    const trialBalance: TrialBalanceItem[] = accounts
      .map((account) => {
        const balance = accountBalances.get(account.account_code) || {
          debit: 0,
          credit: 0,
        };
        const netBalance = balance.debit - balance.credit;

        return {
          accountCode: account.account_code,
          accountName: account.account_name,
          debit: balance.debit,
          credit: balance.credit,
          balance: netBalance,
        };
      })
      .filter((item) => item.debit > 0 || item.credit > 0) // Only show accounts with activity
      .sort((a, b) => a.accountCode.localeCompare(b.accountCode));

    return trialBalance;
  }

  /**
   * Get account balance
   */
  static async getAccountBalance(
    accountCode: string,
    asOfDate?: Date
  ): Promise<{ debit: number; credit: number; balance: number }> {
    const whereClause: any = { account_code: accountCode };
    const journalWhere: any = {};

    if (asOfDate) {
      journalWhere.date = { [Op.lte]: asOfDate };
    }

    const journalLines = await JournalLine.findAll({
      where: whereClause,
      include: [
        {
          model: GeneralJournal,
          as: "journal",
          ...(Object.keys(journalWhere).length > 0 && { where: journalWhere }),
        },
      ],
    });

    let totalDebit = 0;
    let totalCredit = 0;

    journalLines.forEach((line) => {
      totalDebit += parseFloat(line.debit.toString());
      totalCredit += parseFloat(line.credit.toString());
    });

    return {
      debit: totalDebit,
      credit: totalCredit,
      balance: totalDebit - totalCredit,
    };
  }

  /**
   * Validate journal balance (debits must equal credits)
   */
  static validateJournalBalance(entries: JournalEntry[]): {
    isBalanced: boolean;
    totalDebit: number;
    totalCredit: number;
  } {
    const totalDebit = entries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredit = entries.reduce((sum, entry) => sum + entry.credit, 0);

    return {
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01, // Allow small floating point differences
      totalDebit,
      totalCredit,
    };
  }

  /**
   * Create journal lines
   */
  static async createJournalLines(
    journalId: string,
    entries: JournalEntry[],
    transaction?: Transaction
  ): Promise<JournalLine[]> {
    const journalLines = await JournalLine.bulkCreate(
      entries.map((entry) => ({
        journal_id: journalId,
        account_code: entry.accountCode,
        debit: entry.debit,
        credit: entry.credit,
        description: entry.description || null,
        party_id: entry.partyId || null,
      })),
      { transaction }
    );

    return journalLines;
  }
}
