import { Router, Request, Response } from "express";
import { Op, Transaction } from "sequelize";
import { JournalService } from "../services/JournalService.js";
import {
  GeneralJournal,
  JournalLine,
  ChartOfAccount,
} from "../models/index.js";
import sequelize from "../models/index.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

// Get trial balance
router.get(
  "/trial-balance",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { asOfDate } = req.query;

      const trialBalance = await JournalService.getTrialBalance(
        asOfDate ? new Date(asOfDate as string) : undefined
      );

      res.json({
        trialBalance,
        asOfDate: asOfDate ? new Date(asOfDate as string) : new Date(),
        totalDebits: trialBalance.reduce(
          (sum, account) => sum + account.debit,
          0
        ),
        totalCredits: trialBalance.reduce(
          (sum, account) => sum + account.credit,
          0
        ),
      });
    } catch (error) {
      console.error("Error getting trial balance:", error);
      res.status(500).json({
        error: "Failed to get trial balance",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Get account balance
router.get(
  "/accounts/:accountCode/balance",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { accountCode } = req.params;
      const { asOfDate } = req.query;

      const balance = await JournalService.getAccountBalance(
        accountCode,
        asOfDate ? new Date(asOfDate as string) : undefined
      );

      res.json({
        accountCode,
        balance,
        asOfDate: asOfDate ? new Date(asOfDate as string) : new Date(),
      });
    } catch (error) {
      console.error("Error getting account balance:", error);
      res.status(500).json({
        error: "Failed to get account balance",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Get journal entries for an account
router.get(
  "/accounts/:accountCode/entries",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { accountCode } = req.params;
      const { startDate, endDate, page = 1, limit = 50 } = req.query;

      const offset = (Number(page) - 1) * Number(limit);

      const whereClause: any = {
        account_code: accountCode,
      };

      const journalWhere: any = {};
      if (startDate)
        journalWhere.date = { [Op.gte]: new Date(startDate as string) };
      if (endDate)
        journalWhere.date = {
          ...journalWhere.date,
          [Op.lte]: new Date(endDate as string),
        };

      const { count, rows: entries } = await JournalLine.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: GeneralJournal,
            as: "journal",
            ...(Object.keys(journalWhere).length > 0 && {
              where: journalWhere,
            }),
          },
        ],
        order: [["created_at", "DESC"]],
        limit: Number(limit),
        offset,
      });

      res.json({
        entries: entries.map((entry) => ({
          id: entry.id,
          journalId: entry.journal_id,
          accountCode: entry.account_code,
          debit: entry.debit,
          credit: entry.credit,
          description: entry.description,
          journalDate: (entry as any).journal?.date,
          journalDescription: (entry as any).journal?.description,
          createdAt: entry.created_at,
        })),
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      });
    } catch (error) {
      console.error("Error getting account journal entries:", error);
      res.status(500).json({
        error: "Failed to get account journal entries",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Get chart of accounts
router.get(
  "/chart-of-accounts",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { category, isActive } = req.query;

      const whereClause: any = {};
      if (category) whereClause.category = category;
      if (isActive !== undefined) {
        const activeValue = Array.isArray(isActive) ? isActive[0] : isActive;
        if (typeof activeValue === "string") {
          whereClause.is_active = activeValue === "true";
        } else if (typeof activeValue === "boolean") {
          whereClause.is_active = activeValue;
        }
      }

      let accounts;
      let useManualParentFetch = false;

      try {
        accounts = await ChartOfAccount.findAll({
          where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
          order: [["account_code", "ASC"]],
          include: [
            {
              model: ChartOfAccount,
              as: "parent",
              attributes: ["id", "account_code", "account_name"],
              required: false,
            },
          ],
        });
      } catch (includeError: any) {
        console.warn(
          "Parent association not available, using manual fetch:",
          includeError.message
        );
        useManualParentFetch = true;
        accounts = await ChartOfAccount.findAll({
          where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
          order: [["account_code", "ASC"]],
        });

        const parentIds = accounts
          .map((acc: any) => acc.parent_id)
          .filter(
            (id: string | undefined): id is string =>
              id !== null && id !== undefined
          );

        if (parentIds.length > 0) {
          const parents = await ChartOfAccount.findAll({
            where: { id: parentIds },
            attributes: ["id", "account_code", "account_name"],
          });

          const parentMap = new Map(
            parents.map((p: any) => [
              p.id,
              {
                id: p.id,
                accountCode: p.account_code,
                accountName: p.account_name,
              },
            ])
          );

          accounts = accounts.map((acc: any) => ({
            ...acc.toJSON(),
            parent: acc.parent_id ? parentMap.get(acc.parent_id) || null : null,
          }));
        } else {
          accounts = accounts.map((acc: any) => ({
            ...acc.toJSON(),
            parent: null,
          }));
        }
      }

      res.json({
        accounts: accounts.map((account: any) => {
          const accountData = useManualParentFetch ? account : account.toJSON();
          const parentData = accountData.parent;

          return {
            id: accountData.id,
            accountCode: accountData.account_code,
            accountName: accountData.account_name,
            category: accountData.category,
            accountType: accountData.account_type,
            subType: accountData.sub_type,
            parentId: accountData.parent_id,
            parent: parentData
              ? {
                  id: parentData.id,
                  accountCode:
                    parentData.account_code || parentData.accountCode,
                  accountName:
                    parentData.account_name || parentData.accountName,
                }
              : null,
            isActive: accountData.is_active,
            createdAt: accountData.created_at,
            updatedAt: accountData.updated_at,
          };
        }),
      });
    } catch (error) {
      console.error("Error getting chart of accounts:", error);
      res.status(500).json({
        error: "Failed to get chart of accounts",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Get chart of account by ID
router.get(
  "/chart-of-accounts/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const account = await ChartOfAccount.findByPk(id, {
        include: [
          {
            model: ChartOfAccount,
            as: "parent",
            attributes: ["id", "account_code", "account_name"],
          },
        ],
      });

      if (!account) {
        res.status(404).json({
          error: "Chart of account not found",
        });
        return;
      }

      res.json({
        id: account.id,
        accountCode: account.account_code,
        accountName: account.account_name,
        category: account.category,
        accountType: account.account_type,
        subType: account.sub_type,
        parentId: account.parent_id,
        parent: (account as any).parent
          ? {
              id: (account as any).parent.id,
              accountCode: (account as any).parent.account_code,
              accountName: (account as any).parent.account_name,
            }
          : null,
        isActive: account.is_active,
        createdAt: account.created_at,
        updatedAt: account.updated_at,
      });
    } catch (error) {
      console.error("Error getting chart of account:", error);
      res.status(500).json({
        error: "Failed to get chart of account",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Create chart of account
router.post(
  "/chart-of-accounts",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const {
        accountCode,
        accountName,
        category,
        accountType,
        subType,
        parentId,
        isActive,
      } = req.body;

      if (!accountCode || !accountName || !category || !accountType) {
        res.status(400).json({
          error:
            "Missing required fields: accountCode, accountName, category, accountType",
        });
        return;
      }

      const existingAccount = await ChartOfAccount.findOne({
        where: { account_code: accountCode },
      });

      if (existingAccount) {
        res.status(409).json({
          error: "Account code already exists",
        });
        return;
      }

      if (parentId) {
        const parent = await ChartOfAccount.findByPk(parentId);
        if (!parent) {
          res.status(404).json({
            error: "Parent account not found",
          });
          return;
        }
      }

      const account = await ChartOfAccount.create({
        account_code: accountCode,
        account_name: accountName,
        category,
        account_type: accountType,
        sub_type: subType || null,
        parent_id: parentId || null,
        is_active: isActive !== undefined ? isActive : true,
      });

      res.status(201).json({
        message: "Chart of account created successfully",
        account: {
          id: account.id,
          accountCode: account.account_code,
          accountName: account.account_name,
          category: account.category,
          accountType: account.account_type,
          subType: account.sub_type,
          parentId: account.parent_id,
          isActive: account.is_active,
          createdAt: account.created_at,
          updatedAt: account.updated_at,
        },
      });
    } catch (error: any) {
      console.error("Error creating chart of account:", error);

      if (error.name === "SequelizeUniqueConstraintError") {
        res.status(409).json({
          error: "Account code already exists",
        });
        return;
      }

      if (error.name === "SequelizeValidationError") {
        res.status(400).json({
          error: "Validation error",
          details: error.errors.map((e: any) => e.message).join(", "),
        });
        return;
      }

      res.status(500).json({
        error: "Failed to create chart of account",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Update chart of account
router.put(
  "/chart-of-accounts/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const {
        accountCode,
        accountName,
        category,
        accountType,
        subType,
        parentId,
        isActive,
      } = req.body;

      const account = await ChartOfAccount.findByPk(id);

      if (!account) {
        res.status(404).json({
          error: "Chart of account not found",
        });
        return;
      }

      if (accountCode && accountCode !== account.account_code) {
        const existingAccount = await ChartOfAccount.findOne({
          where: { account_code: accountCode },
        });

        if (existingAccount) {
          res.status(409).json({
            error: "Account code already exists",
          });
          return;
        }
      }

      if (parentId && parentId !== account.parent_id) {
        if (parentId === id) {
          res.status(400).json({
            error: "Account cannot be its own parent",
          });
          return;
        }

        const parent = await ChartOfAccount.findByPk(parentId);
        if (!parent) {
          res.status(404).json({
            error: "Parent account not found",
          });
          return;
        }
      }

      await account.update({
        ...(accountCode && { account_code: accountCode }),
        ...(accountName && { account_name: accountName }),
        ...(category && { category }),
        ...(accountType && { account_type: accountType }),
        ...(subType !== undefined && { sub_type: subType || null }),
        ...(parentId !== undefined && { parent_id: parentId || null }),
        ...(isActive !== undefined && { is_active: isActive }),
      });

      res.json({
        message: "Chart of account updated successfully",
        account: {
          id: account.id,
          accountCode: account.account_code,
          accountName: account.account_name,
          category: account.category,
          accountType: account.account_type,
          subType: account.sub_type,
          parentId: account.parent_id,
          isActive: account.is_active,
          createdAt: account.created_at,
          updatedAt: account.updated_at,
        },
      });
    } catch (error: any) {
      console.error("Error updating chart of account:", error);

      if (error.name === "SequelizeUniqueConstraintError") {
        res.status(409).json({
          error: "Account code already exists",
        });
        return;
      }

      if (error.name === "SequelizeValidationError") {
        res.status(400).json({
          error: "Validation error",
          details: error.errors.map((e: any) => e.message).join(", "),
        });
        return;
      }

      res.status(500).json({
        error: "Failed to update chart of account",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Delete chart of account
router.delete(
  "/chart-of-accounts/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const account = await ChartOfAccount.findByPk(id);

      if (!account) {
        res.status(404).json({
          error: "Chart of account not found",
        });
        return;
      }

      const childAccounts = await ChartOfAccount.count({
        where: { parent_id: id },
      });

      if (childAccounts > 0) {
        res.status(400).json({
          error:
            "Cannot delete account with child accounts. Please reassign or delete child accounts first.",
        });
        return;
      }

      const hasJournalEntries = await JournalLine.count({
        where: { account_code: account.account_code },
      });

      if (hasJournalEntries > 0) {
        await account.update({ is_active: false });
        res.json({
          message:
            "Account deactivated successfully (has existing journal entries)",
        });
      } else {
        await account.destroy();
        res.json({
          message: "Account deleted successfully",
        });
      }
    } catch (error) {
      console.error("Error deleting chart of account:", error);
      res.status(500).json({
        error: "Failed to delete chart of account",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Get journal entries
router.get(
  "/journal-entries",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, page = 1, limit = 50 } = req.query;

      const offset = (Number(page) - 1) * Number(limit);

      const whereClause: any = {};
      if (startDate || endDate) {
        whereClause.date = {};
        if (startDate) whereClause.date[Op.gte] = new Date(startDate as string);
        if (endDate) whereClause.date[Op.lte] = new Date(endDate as string);
      }

      const { count, rows: journals } = await GeneralJournal.findAndCountAll({
        where: whereClause,
        order: [
          ["date", "DESC"],
          ["created_at", "DESC"],
        ],
        limit: Number(limit),
        offset,
      });

      const journalIds = journals.map((j) => j.id);

      let journalLines: any[] = [];
      let accountsMap = new Map();

      if (journalIds.length > 0) {
        journalLines = await JournalLine.findAll({
          where: {
            journal_id: { [Op.in]: journalIds },
          },
        });

        const accountCodes = [
          ...new Set(journalLines.map((line) => line.account_code)),
        ];

        if (accountCodes.length > 0) {
          const accounts = await ChartOfAccount.findAll({
            where: {
              account_code: { [Op.in]: accountCodes },
            },
            attributes: ["account_code", "account_name", "category"],
          });

          accounts.forEach((acc) => {
            accountsMap.set(acc.account_code, acc);
          });
        }
      }

      const linesByJournal = new Map();
      journalLines.forEach((line) => {
        if (!linesByJournal.has(line.journal_id)) {
          linesByJournal.set(line.journal_id, []);
        }
        const account = accountsMap.get(line.account_code);
        linesByJournal.get(line.journal_id).push({
          id: line.id,
          accountCode: line.account_code,
          accountName: account?.account_name || line.account_code,
          accountCategory: account?.category || null,
          debit: line.debit,
          credit: line.credit,
          description: line.description,
        });
      });

      res.json({
        journals: journals.map((journal) => ({
          id: journal.id,
          date: journal.date,
          description: journal.description,
          referenceId: journal.reference_id,
          createdAt: journal.created_at,
          lines: linesByJournal.get(journal.id) || [],
        })),
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      });
    } catch (error) {
      console.error("Error getting journal entries:", error);
      res.status(500).json({
        error: "Failed to get journal entries",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Get journal entry by ID
router.get(
  "/journal-entries/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const journal = await GeneralJournal.findByPk(id, {
        include: [
          {
            model: JournalLine,
            as: "journal_lines",
            include: [
              {
                model: ChartOfAccount,
                as: "account",
                attributes: ["account_code", "account_name", "category"],
              },
            ],
          },
        ],
      });

      if (!journal) {
        res.status(404).json({
          error: "Journal entry not found",
        });
        return;
      }

      res.json({
        id: journal.id,
        date: journal.date,
        description: journal.description,
        referenceId: journal.reference_id,
        createdAt: journal.created_at,
        lines:
          (journal as any).journal_lines?.map((line: any) => ({
            id: line.id,
            accountCode: line.account_code,
            accountName: line.account?.account_name,
            accountCategory: line.account?.category,
            debit: line.debit,
            credit: line.credit,
            description: line.description,
          })) || [],
      });
    } catch (error) {
      console.error("Error getting journal entry:", error);
      res.status(500).json({
        error: "Failed to get journal entry",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Delete journal entry
router.delete(
  "/journal-entries/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    const transaction: Transaction = await sequelize.transaction();
    try {
      const { id } = req.params;

      const journal = await GeneralJournal.findByPk(id, { transaction });

      if (!journal) {
        await transaction.rollback();
        res.status(404).json({
          error: "Journal entry not found",
        });
        return;
      }

      const journalLines = await JournalLine.findAll({
        where: { journal_id: id },
        transaction,
      });

      if (journalLines && journalLines.length > 0) {
        for (const line of journalLines) {
          await line.destroy({ transaction });
        }
      }

      await GeneralJournal.destroy({
        where: { id },
        transaction,
      });

      await transaction.commit();

      res.json({
        message: "Journal entry deleted successfully",
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Error deleting journal entry:", error);
      res.status(500).json({
        error: "Failed to delete journal entry",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Create journal entry
router.post(
  "/journal-entries",
  authenticateToken,
  async (req: Request, res: Response) => {
    const transaction: Transaction = await sequelize.transaction();

    try {
      const { date, description, lines } = req.body;

      if (
        !date ||
        !description ||
        !lines ||
        !Array.isArray(lines) ||
        lines.length < 2
      ) {
        await transaction.rollback();
        res.status(400).json({
          error:
            "Missing required fields: date, description, and at least 2 journal lines",
        });
        return;
      }

      const journalEntries = lines.map((line: any) => ({
        accountCode: line.accountCode,
        debit: parseFloat(line.debit || 0),
        credit: parseFloat(line.credit || 0),
        description: line.description,
      }));

      const validation = JournalService.validateJournalBalance(journalEntries);
      if (!validation.isBalanced) {
        await transaction.rollback();
        res.status(400).json({
          error: "Journal entry is not balanced",
          details: `Total debits: ${validation.totalDebit.toFixed(
            2
          )}, Total credits: ${validation.totalCredit.toFixed(2)}`,
        });
        return;
      }

      for (const entry of journalEntries) {
        if (entry.debit < 0 || entry.credit < 0) {
          await transaction.rollback();
          res.status(400).json({
            error: "Debit and credit amounts must be non-negative",
          });
          return;
        }

        if (entry.debit > 0 && entry.credit > 0) {
          await transaction.rollback();
          res.status(400).json({
            error: "A journal line cannot have both debit and credit amounts",
          });
          return;
        }

        if (entry.debit === 0 && entry.credit === 0) {
          await transaction.rollback();
          res.status(400).json({
            error: "A journal line must have either a debit or credit amount",
          });
          return;
        }

        const account = await ChartOfAccount.findOne({
          where: { account_code: entry.accountCode, is_active: true },
          transaction,
        });

        if (!account) {
          await transaction.rollback();
          res.status(404).json({
            error: `Account ${entry.accountCode} not found or inactive`,
          });
          return;
        }
      }

      const journal = await GeneralJournal.create(
        {
          date: new Date(date),
          description,
        },
        { transaction }
      );

      await JournalService.createJournalLines(
        journal.id,
        journalEntries,
        transaction
      );

      await transaction.commit();

      try {
        const createdJournal = await GeneralJournal.findByPk(journal.id, {
          include: [
            {
              model: JournalLine,
              as: "journal_lines",
              include: [
                {
                  model: ChartOfAccount,
                  as: "account",
                  attributes: ["account_code", "account_name", "category"],
                },
              ],
            },
          ],
        });

        res.status(201).json({
          message: "Journal entry created successfully",
          journal: {
            id: createdJournal!.id,
            date: createdJournal!.date,
            description: createdJournal!.description,
            createdAt: createdJournal!.created_at,
            lines:
              (createdJournal as any)!.journal_lines?.map((line: any) => ({
                id: line.id,
                accountCode: line.account_code,
                accountName: line.account?.account_name,
                accountCategory: line.account?.category,
                debit: line.debit,
                credit: line.credit,
                description: line.description,
              })) || [],
          },
        });
      } catch (fetchError) {
        console.warn(
          "Journal entry created but failed to fetch details:",
          fetchError
        );
        res.status(201).json({
          message: "Journal entry created successfully",
          journal: {
            id: journal.id,
            date: new Date(date),
            description,
            lines: journalEntries.map((entry) => ({
              accountCode: entry.accountCode,
              debit: entry.debit,
              credit: entry.credit,
              description: entry.description,
            })),
          },
        });
      }
    } catch (error) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.warn(
          "Transaction already finished, skipping rollback:",
          rollbackError
        );
      }
      console.error("Error creating journal entry:", error);
      res.status(500).json({
        error: "Failed to create journal entry",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Get cash accounts (Checking & Saving accounts)
router.get(
  "/cash-accounts",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      // Try to query with sub_type first, fallback to account_type if sub_type doesn't exist
      let accounts;
      try {
        // Try querying with sub_type field (if it exists in the database)
        accounts = await ChartOfAccount.findAll({
          where: {
            is_active: true,
            [Op.or]: [
              { sub_type: "Checking & Saving" },
              { account_type: { [Op.like]: "%Checking%" } },
              { account_type: { [Op.like]: "%Saving%" } },
              { account_type: { [Op.like]: "%Cash%" } },
            ],
          },
          order: [["account_code", "ASC"]],
        });
      } catch (subTypeError: any) {
        // If sub_type field doesn't exist, fallback to account_type filtering
        console.log("sub_type field not found, using account_type filter");
        accounts = await ChartOfAccount.findAll({
          where: {
            is_active: true,
            [Op.or]: [
              { account_type: { [Op.like]: "%Checking%" } },
              { account_type: { [Op.like]: "%Saving%" } },
              { account_type: { [Op.like]: "%Cash%" } },
            ],
          },
          order: [["account_code", "ASC"]],
        });
      }

      res.json({
        accounts: accounts.map((account: any) => ({
          accountCode: account.account_code,
          accountName: account.account_name,
        })),
      });
    } catch (error) {
      console.error("Error getting cash accounts:", error);
      res.status(500).json({
        error: "Failed to get cash accounts",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

export default router;
