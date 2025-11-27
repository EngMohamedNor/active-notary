import { Router, Request, Response } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { Party, JournalLine, GeneralJournal } from "../models/index.js";
import { Sequelize, Op } from "sequelize";

const router = Router();

// All party routes require authentication
router.use(authenticateToken);

// Get all parties
router.get("/", async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50, isActive, partyType } = req.query;
    const whereClause: any = {};

    if (isActive !== undefined) whereClause.is_active = isActive === "true";
    if (partyType) whereClause.party_type = partyType;

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: parties } = await Party.findAndCountAll({
      where: whereClause,
      order: [
        ["party_type", "ASC"],
        ["name", "ASC"],
      ],
      limit: Number(limit),
      offset,
    });

    // Calculate balances for all parties
    // We need to calculate separately for customers vs vendors/employees
    const customerIds = parties
      .filter((p: any) => p.party_type === "customer")
      .map((p: any) => p.id);
    const vendorEmployeeIds = parties
      .filter(
        (p: any) => p.party_type === "vendor" || p.party_type === "employee"
      )
      .map((p: any) => p.id);

    const balanceMap = new Map<string, number>();

    // Calculate balance for customers: debit - credit
    if (customerIds.length > 0) {
      const customerBalances = await JournalLine.findAll({
        where: {
          party_id: { [Op.in]: customerIds },
        },
        attributes: [
          "party_id",
          [
            Sequelize.fn(
              "COALESCE",
              Sequelize.fn("SUM", Sequelize.literal("debit - credit")),
              0
            ),
            "balance",
          ],
        ],
        group: ["party_id"],
        raw: true,
      });

      customerBalances.forEach((result: any) => {
        const balance = parseFloat((result as any).balance || "0");
        balanceMap.set((result as any).party_id, balance);
      });
    }

    // Calculate balance for vendors and employees: credit - debit
    if (vendorEmployeeIds.length > 0) {
      const vendorEmployeeBalances = await JournalLine.findAll({
        where: {
          party_id: { [Op.in]: vendorEmployeeIds },
        },
        attributes: [
          "party_id",
          [
            Sequelize.fn(
              "COALESCE",
              Sequelize.fn("SUM", Sequelize.literal("credit - debit")),
              0
            ),
            "balance",
          ],
        ],
        group: ["party_id"],
        raw: true,
      });

      vendorEmployeeBalances.forEach((result: any) => {
        const balance = parseFloat((result as any).balance || "0");
        balanceMap.set((result as any).party_id, balance);
      });
    }

    res.json({
      data: parties.map((party: any) => ({
        id: party.id,
        partyType: party.party_type,
        name: party.name,
        code: party.code,
        email: party.email,
        phone: party.phone,
        address: party.address,
        city: party.city,
        state: party.state,
        zipCode: party.zip_code,
        country: party.country,
        taxId: party.tax_id,
        paymentTerms: party.payment_terms,
        creditLimit: party.credit_limit
          ? parseFloat(party.credit_limit.toString())
          : null,
        vendorNumber: party.vendor_number,
        employeeId: party.employee_id,
        department: party.department,
        hireDate: party.hire_date,
        isActive: party.is_active,
        balance: balanceMap.get(party.id) || 0,
        createdAt: party.created_at,
        updatedAt: party.updated_at,
      })),
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error getting parties:", error);
    res.status(500).json({
      error: "Failed to get parties",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get party by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const party = await Party.findByPk(id);

    if (!party) {
      res.status(404).json({ error: "Party not found" });
      return;
    }

    // Calculate balance for this party
    // Customers: debit - credit, Vendors/Employees: credit - debit
    const balanceFormula =
      party.party_type === "customer"
        ? Sequelize.literal("debit - credit")
        : Sequelize.literal("credit - debit");

    const balanceResult = await JournalLine.findAll({
      where: {
        party_id: id,
      },
      attributes: [
        [
          Sequelize.fn("COALESCE", Sequelize.fn("SUM", balanceFormula), 0),
          "balance",
        ],
      ],
      raw: true,
    });

    const balance =
      balanceResult.length > 0
        ? parseFloat((balanceResult[0] as any).balance || "0")
        : 0;

    res.json({
      id: party.id,
      partyType: party.party_type,
      name: party.name,
      code: party.code,
      email: party.email,
      phone: party.phone,
      address: party.address,
      city: party.city,
      state: party.state,
      zipCode: party.zip_code,
      country: party.country,
      taxId: party.tax_id,
      paymentTerms: party.payment_terms,
      creditLimit: party.credit_limit
        ? parseFloat(party.credit_limit.toString())
        : null,
      vendorNumber: party.vendor_number,
      employeeId: party.employee_id,
      department: party.department,
      hireDate: party.hire_date,
      isActive: party.is_active,
      balance: balance,
      createdAt: party.created_at,
      updatedAt: party.updated_at,
    });
  } catch (error) {
    console.error("Error getting party:", error);
    res.status(500).json({
      error: "Failed to get party",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Create party
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      partyType,
      name,
      code,
      email,
      phone,
      address,
      city,
      state,
      zipCode,
      country,
      taxId,
      paymentTerms,
      creditLimit,
      vendorNumber,
      employeeId,
      department,
      hireDate,
    } = req.body;

    // Validate required fields
    if (!partyType || !name || !code) {
      res.status(400).json({
        error: "Missing required fields: partyType, name, code",
      });
      return;
    }

    // Validate party type
    if (!["customer", "vendor", "employee"].includes(partyType)) {
      res.status(400).json({
        error: "Invalid party type. Must be customer, vendor, or employee",
      });
      return;
    }

    // Check if code already exists for this party type
    const existingParty = await Party.findOne({
      where: {
        party_type: partyType,
        code,
      },
    });

    if (existingParty) {
      res.status(409).json({
        error: `Party with code "${code}" already exists for this type`,
      });
      return;
    }

    // Validate email format if provided
    if (
      email &&
      email.trim() !== "" &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      res.status(400).json({ error: "Invalid email format" });
      return;
    }

    // Helper function to normalize empty strings to null for optional fields
    const normalizeValue = (value: any): any => {
      if (value === "" || value === null || value === undefined) return null;
      return value;
    };

    // Helper function to normalize numeric values
    const normalizeNumeric = (value: any): number | undefined => {
      if (value === "" || value === null || value === undefined)
        return undefined;
      const num = typeof value === "string" ? parseFloat(value) : value;
      return isNaN(num) ? undefined : num;
    };

    // Helper function to normalize date values
    const normalizeDate = (value: any): Date | undefined => {
      if (value === "" || value === null || value === undefined)
        return undefined;
      if (value instanceof Date) return value;
      const date = new Date(value);
      return isNaN(date.getTime()) ? undefined : date;
    };

    const party = await Party.create({
      party_type: partyType,
      name,
      code,
      email: normalizeValue(email),
      phone: normalizeValue(phone),
      address: normalizeValue(address),
      city: normalizeValue(city),
      state: normalizeValue(state),
      zip_code: normalizeValue(zipCode),
      country: normalizeValue(country),
      tax_id: normalizeValue(taxId),
      payment_terms: normalizeValue(paymentTerms),
      credit_limit: normalizeNumeric(creditLimit),
      vendor_number: normalizeValue(vendorNumber),
      employee_id: normalizeValue(employeeId),
      department: normalizeValue(department),
      hire_date: normalizeDate(hireDate),
      is_active: true,
    });

    res.status(201).json({
      message: "Party created successfully",
      party: {
        id: party.id,
        partyType: party.party_type,
        name: party.name,
        code: party.code,
        email: party.email,
        phone: party.phone,
        address: party.address,
        city: party.city,
        state: party.state,
        zipCode: party.zip_code,
        country: party.country,
        taxId: party.tax_id,
        paymentTerms: party.payment_terms,
        creditLimit: party.credit_limit
          ? parseFloat(party.credit_limit.toString())
          : null,
        vendorNumber: party.vendor_number,
        employeeId: party.employee_id,
        department: party.department,
        hireDate: party.hire_date,
        isActive: party.is_active,
        createdAt: party.created_at,
        updatedAt: party.updated_at,
      },
    });
  } catch (error) {
    console.error("Error creating party:", error);
    res.status(500).json({
      error: "Failed to create party",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Update party
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      code,
      email,
      phone,
      address,
      city,
      state,
      zipCode,
      country,
      taxId,
      paymentTerms,
      creditLimit,
      vendorNumber,
      employeeId,
      department,
      hireDate,
      isActive,
    } = req.body;

    const party = await Party.findByPk(id);
    if (!party) {
      res.status(404).json({ error: "Party not found" });
      return;
    }

    // Check if code already exists (if changed)
    if (code && code !== party.code) {
      const existingParty = await Party.findOne({
        where: {
          party_type: party.party_type,
          code,
        },
      });

      if (existingParty) {
        res.status(409).json({
          error: `Party with code "${code}" already exists for this type`,
        });
        return;
      }
    }

    // Validate email format if provided
    if (
      email !== undefined &&
      email &&
      email.trim() !== "" &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      res.status(400).json({ error: "Invalid email format" });
      return;
    }

    // Helper function to normalize empty strings to null for optional fields
    const normalizeValue = (value: any): any => {
      if (value === "" || value === null || value === undefined) return null;
      return value;
    };

    // Helper function to normalize numeric values
    const normalizeNumeric = (value: any): number | undefined => {
      if (value === "" || value === null || value === undefined)
        return undefined;
      const num = typeof value === "string" ? parseFloat(value) : value;
      return isNaN(num) ? undefined : num;
    };

    // Helper function to normalize date values
    const normalizeDate = (value: any): Date | undefined => {
      if (value === "" || value === null || value === undefined)
        return undefined;
      if (value instanceof Date) return value;
      const date = new Date(value);
      return isNaN(date.getTime()) ? undefined : date;
    };

    await party.update({
      ...(name && { name }),
      ...(code && { code }),
      ...(email !== undefined && { email: normalizeValue(email) }),
      ...(phone !== undefined && { phone: normalizeValue(phone) }),
      ...(address !== undefined && { address: normalizeValue(address) }),
      ...(city !== undefined && { city: normalizeValue(city) }),
      ...(state !== undefined && { state: normalizeValue(state) }),
      ...(zipCode !== undefined && { zip_code: normalizeValue(zipCode) }),
      ...(country !== undefined && { country: normalizeValue(country) }),
      ...(taxId !== undefined && { tax_id: normalizeValue(taxId) }),
      ...(paymentTerms !== undefined && {
        payment_terms: normalizeValue(paymentTerms),
      }),
      ...(creditLimit !== undefined && {
        credit_limit: normalizeNumeric(creditLimit),
      }),
      ...(vendorNumber !== undefined && {
        vendor_number: normalizeValue(vendorNumber),
      }),
      ...(employeeId !== undefined && {
        employee_id: normalizeValue(employeeId),
      }),
      ...(department !== undefined && {
        department: normalizeValue(department),
      }),
      ...(hireDate !== undefined && { hire_date: normalizeDate(hireDate) }),
      ...(isActive !== undefined && { is_active: isActive }),
    });

    res.json({
      message: "Party updated successfully",
      party: {
        id: party.id,
        partyType: party.party_type,
        name: party.name,
        code: party.code,
        email: party.email,
        phone: party.phone,
        address: party.address,
        city: party.city,
        state: party.state,
        zipCode: party.zip_code,
        country: party.country,
        taxId: party.tax_id,
        paymentTerms: party.payment_terms,
        creditLimit: party.credit_limit
          ? parseFloat(party.credit_limit.toString())
          : null,
        vendorNumber: party.vendor_number,
        employeeId: party.employee_id,
        department: party.department,
        hireDate: party.hire_date,
        isActive: party.is_active,
        createdAt: party.created_at,
        updatedAt: party.updated_at,
      },
    });
  } catch (error) {
    console.error("Error updating party:", error);
    res.status(500).json({
      error: "Failed to update party",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get party statement
router.get("/:id/statement", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { fromDate, toDate } = req.query;

    const party = await Party.findByPk(id);

    if (!party) {
      res.status(404).json({ error: "Party not found" });
      return;
    }

    // Build date filter
    const journalWhere: any = {};
    if (fromDate) {
      journalWhere.date = { [Op.gte]: new Date(fromDate as string) };
    }
    if (toDate) {
      journalWhere.date = {
        ...journalWhere.date,
        [Op.lte]: new Date(toDate as string),
      };
    }

    // Get all journal lines for this party, ordered by date (oldest first)
    const journalLines = await JournalLine.findAll({
      where: {
        party_id: id,
      },
      include: [
        {
          model: GeneralJournal,
          as: "journal",
          ...(Object.keys(journalWhere).length > 0 && { where: journalWhere }),
        },
      ],
      order: [
        [{ model: GeneralJournal, as: "journal" }, "date", "ASC"],
        [{ model: GeneralJournal, as: "journal" }, "created_at", "ASC"],
      ],
    });

    // Calculate running balance based on party type
    // Customers: debit - credit, Vendors/Employees: credit - debit
    const isCustomer = party.party_type === "customer";
    let runningBalance = 0;

    const statement = journalLines
      .filter((line: any) => (line as any).journal) // Only include lines with valid journal
      .map((line: any) => {
        const journal = (line as any).journal as GeneralJournal;
        const debit = parseFloat(line.debit.toString());
        const credit = parseFloat(line.credit.toString());

        // Calculate balance change based on party type
        const balanceChange = isCustomer ? debit - credit : credit - debit;

        runningBalance += balanceChange;

        return {
          id: line.id,
          date: journal?.date,
          memo: line.description || journal?.description || "",
          debit: debit,
          credit: credit,
          runningBalance: runningBalance,
        };
      });

    res.json({
      party: {
        id: party.id,
        partyType: party.party_type,
        name: party.name,
        code: party.code,
        email: party.email,
        phone: party.phone,
        address: party.address,
      },
      statement,
      summary: {
        totalDebit: statement.reduce((sum, item) => sum + item.debit, 0),
        totalCredit: statement.reduce((sum, item) => sum + item.credit, 0),
        endingBalance: runningBalance,
      },
    });
  } catch (error) {
    console.error("Error getting party statement:", error);
    res.status(500).json({
      error: "Failed to get party statement",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Delete party (soft delete - deactivate)
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const party = await Party.findByPk(id);

    if (!party) {
      res.status(404).json({ error: "Party not found" });
      return;
    }

    // Soft delete - deactivate party instead of deleting
    await party.update({ is_active: false });

    res.json({ message: "Party deactivated successfully" });
  } catch (error) {
    console.error("Error deleting party:", error);
    res.status(500).json({
      error: "Failed to delete party",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
