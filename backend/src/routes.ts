import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import DocumentTemplate from "./models/documentTemplate.js";
import {
  Book,
  Document,
  GeneralJournal,
  JournalLine,
  ChartOfAccount,
} from "./models/index.js";
import { JournalService, JournalEntry } from "./services/JournalService.js";
import sequelize from "./models/index.js";
import { v4 as uuidv4 } from "uuid";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import libre from "libreoffice-convert";
import { promisify } from "util";
import { authenticateToken } from "./middleware/auth.js";

const router = Router();

// Multer setup for DOCX uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads", "templates");
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// POST /api/templates/upload
router.post(
  "/templates/upload",
  upload.single("template"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const { originalname, filename } = req.file;
      const { template_name, category, sub_category } = req.body; // Get form data

      // Store only the filename in database
      console.log("Storing filename:", filename);
      console.log("Category:", category, "Sub Category:", sub_category);

      const template = await DocumentTemplate.create({
        template_id: uuidv4(),
        template_name: template_name || originalname, // Use form name or fallback to filename
        template_path: filename, // Store only filename
        category: category || "General", // Default category if not provided
        sub_category: sub_category || "Default", // Default sub category if not provided
      });
      res.status(201).json({ message: "Template uploaded", template });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to upload template", details: error });
    }
  }
);

// GET /api/templates
router.get(
  "/templates",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { category, sub_category } = req.query;

      let whereClause: any = {};

      // Filter by category if provided
      if (category) {
        whereClause.category = category;
      }

      // Filter by sub_category if provided
      if (sub_category) {
        whereClause.sub_category = sub_category;
      }

      const templates = await DocumentTemplate.findAll({
        where: whereClause,
        order: [["template_name", "ASC"]],
      });

      console.log(
        "Filtered templates:",
        templates.map((t) => ({
          id: t.template_id,
          name: t.template_name,
          category: t.category,
          sub_category: t.sub_category,
        }))
      );
      console.log("Total templates found:", templates.length);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res
        .status(500)
        .json({ error: "Failed to fetch templates", details: error });
    }
  }
);

// GET /api/templates/:id/download
router.get("/templates/:id/download", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = await DocumentTemplate.findByPk(id);

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    // Access data from dataValues since direct property access returns undefined
    const templateData = template.dataValues || template;
    // Construct full path from stored filename
    const filePath = path.join(
      process.cwd(),
      "uploads",
      "templates",
      templateData.template_path
    );
    const fileName = templateData.template_name.endsWith(".docx")
      ? templateData.template_name
      : `${templateData.template_name}.docx`;

    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error("Download error:", err);
        res.status(500).json({ error: "Failed to download file" });
      }
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to download template", details: error });
  }
});

// DELETE /api/templates/:id
router.delete("/templates/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = await DocumentTemplate.findByPk(id);

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    // Access data from dataValues since direct property access returns undefined
    const templateData = template.dataValues || template;

    // Construct the full file path from stored filename
    const filePath = path.join(
      process.cwd(),
      "uploads",
      "templates",
      templateData.template_path
    );

    // Delete the physical file
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log("Physical file deleted:", filePath);
      } else {
        console.log("Physical file not found:", filePath);
      }
    } catch (fileError) {
      console.error("Error deleting physical file:", fileError);
      // Continue with database deletion even if file deletion fails
    }

    // Delete the database record
    await template.destroy();

    res.json({
      message: "Template deleted successfully",
      template: {
        id: templateData.template_id,
        name: templateData.template_name,
      },
    });
  } catch (error) {
    console.error("Delete route error:", error);
    res
      .status(500)
      .json({ error: "Failed to delete template", details: error });
  }
});

// GET /api/templates/:id/analyze - Extract placeholders from template
router.get("/templates/:id/analyze", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log("Template analysis request for ID:", id);

    const template = await DocumentTemplate.findByPk(id);
    console.log("Found template:", template ? "Yes" : "No");

    if (!template) {
      console.log("Template not found for ID:", id);
      return res.status(404).json({ error: "Template not found" });
    }

    // Access data from dataValues since direct property access returns undefined
    const templateData = template.dataValues || template;
    const templateFilename = templateData.template_path;

    console.log("===================");
    console.log("Template filename:", templateFilename);
    if (!templateFilename) {
      return res.status(400).json({ error: "Template filename is missing" });
    }

    // Construct full path from stored filename
    const filePath = path.join(
      process.cwd(),
      "uploads",
      "templates",
      templateFilename
    );
    console.log("filePath  :", filePath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Template file not found" });
    }

    // Read the template file
    const content = fs.readFileSync(filePath, "binary");
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Extract placeholders from the template
    const placeholders = new Set<string>();
    const placeholderRegex = /\{([^}]+)\}/g;
    let match;

    // Get all text content from the document
    const fullText = doc.getFullText();

    while ((match = placeholderRegex.exec(fullText)) !== null) {
      placeholders.add(match[1].trim());
    }

    res.json({
      template_id: templateData.template_id,
      template_name: templateData.template_name,
      placeholders: Array.from(placeholders),
    });
  } catch (error) {
    console.error("Template analysis error:", error);
    res
      .status(500)
      .json({ error: "Failed to analyze template", details: error });
  }
});

// POST /api/documents/generate - Generate document from template
router.post(
  "/documents/generate",
  authenticateToken,
  async (req: Request, res: Response) => {
    const transaction = await sequelize.transaction();
    try {
      const {
        template_id,
        data,
        document_name,
        description,
        user_id,
        customer_name,
        customer_phone,
        total,
        paid,
        payment_method,
        cash_account_code,
        customer_id,
      } = req.body;
      console.log("template_id:", template_id);
      console.log("data:", data);
      console.log("Request body:", {
        template_id,
        description,
        customer_name,
        customer_phone,
        total,
        paid,
        payment_method,
        cash_account_code,
        customer_id,
      });
      if (!template_id || !data) {
        console.log("Template ID and data are required");
        return res
          .status(400)
          .json({ error: "Template ID and data are required" });
      }

      const template = await DocumentTemplate.findByPk(template_id);

      if (!template) {
        console.log("Template not found");
        return res.status(404).json({ error: "Template not found" });
      }

      // Access data from dataValues since direct property access returns undefined
      const templateData = template.dataValues || template;
      const templateFilename = templateData.template_path;

      console.log("Template found for generation:", {
        id: templateData.template_id,
        name: templateData.template_name,
        filename: templateFilename,
      });

      if (!templateFilename) {
        console.log("Template filename is missing");
        return res.status(400).json({ error: "Template filename is missing" });
      }

      // Construct full path from stored filename
      const fullTemplatePath = path.join(
        process.cwd(),
        "uploads",
        "templates",
        templateFilename
      );

      // Step 1: Check if there's an active book, if not create one
      let activeBook;
      try {
        activeBook = await Book.findOne({ where: { status: "active" } });

        if (!activeBook) {
          console.log("No active book found, creating new book...");
          activeBook = await Book.create({
            status: "active",
          });
          console.log("Created new book:", activeBook.dataValues);
        } else {
          console.log("Found active book:", activeBook.dataValues);
        }
      } catch (bookError) {
        console.error("Error with book operations:", bookError);
        throw new Error("Failed to create or retrieve active book");
      }

      // Ensure we have a valid book_no
      const bookNo = activeBook.dataValues?.book_no || activeBook.book_no;
      if (!bookNo) {
        console.error("Book data:", activeBook);
        throw new Error("Failed to get valid book_no from active book");
      }

      console.log("Using book_no:", bookNo);
      if (!fs.existsSync(fullTemplatePath)) {
        console.log("Template file not found");
        return res.status(404).json({ error: "Template file not found" });
      }

      // Read the template file
      const content = fs.readFileSync(fullTemplatePath, "binary");
      const zip = new PizZip(content);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      // Step 2: Calculate next doc_serial for this book
      const maxDocSerial = (await Document.max("doc_serial", {
        where: { book_no: bookNo },
      })) as number | null;
      const nextDocSerial = (maxDocSerial || 0) + 1;

      // Step 3: Generate serial_number in format: REP. B{book_no}/{doc_serial}/{current_year}
      const currentYear = new Date().getFullYear();

      const serialNumber = `REP. B${bookNo}/${nextDocSerial}/${currentYear}`;

      console.log("Generated doc_serial:", nextDocSerial);
      console.log("Generated serial_number:", serialNumber);

      // Fill the template with data
      data.serial_number = serialNumber;

      doc.setData(data);

      try {
        doc.render();
      } catch (error) {
        console.error("Template rendering error:", error);
        return res.status(400).json({
          error: "Failed to fill template",
          details: "Check that all placeholders are provided with correct data",
        });
      }

      // Generate the filled DOCX
      const buf = doc.getZip().generate({
        type: "nodebuffer",
        compression: "DEFLATE",
        compressionOptions: {
          level: 4,
        },
      });

      // Create documents directory if it doesn't exist
      const documentsDir = path.join(process.cwd(), "documents");
      if (!fs.existsSync(documentsDir)) {
        fs.mkdirSync(documentsDir, { recursive: true });
      }

      // Generate filename using serial number
      const sanitizedSerialNumber = serialNumber.replace(
        /[^a-zA-Z0-9.-]/g,
        "_"
      );
      const docxFileName = `${sanitizedSerialNumber}.docx`;
      const pdfFileName = `${sanitizedSerialNumber}.pdf`;
      const docxPath = path.join(documentsDir, docxFileName);
      const pdfPath = path.join(documentsDir, pdfFileName);

      // Save the filled DOCX permanently in documents folder
      fs.writeFileSync(docxPath, buf);
      console.log("Document saved to:", docxPath);

      // Step 4: Create document record in database
      const documentRecord = await Document.create(
        {
          template_id: template_id,
          document_name: document_name || docxFileName,
          document_link: docxFileName, // Store only filename, not full path
          description:
            description ||
            `Generated from template: ${templateData.template_name}`,
          user_id: user_id || undefined,
          doc_serial: nextDocSerial,
          book_no: bookNo,
          serial_number: serialNumber,
          total: total ? parseFloat(total) : undefined,
          paid: paid ? parseFloat(paid) : undefined,
          balance:
            total && paid ? parseFloat(total) - parseFloat(paid) : undefined,
          customer_name: customer_name || undefined,
          customer_phone: customer_phone || undefined,
          field_values: data, // Store the field values as JSON
        },
        { transaction }
      );

      console.log("Document record created with ID:", documentRecord.id);

      console.log("About to check journal entry conditions...");

      // //REMOVE THIS LATER
      // let serialNumber = "";
      // let docxFileName = "";
      // let buf: Buffer | null = null;

      // Step 5: Create journal entry if payment method and total are provided
      const shouldCreateJournal = !!(
        payment_method &&
        total &&
        parseFloat(total) > 0
      );
      console.log("Journal entry check:", {
        payment_method,
        total,
        cash_account_code,
        customer_id,
        totalParsed: total ? parseFloat(total) : 0,
        condition1: !!payment_method,
        condition2: !!total,
        condition3: total ? parseFloat(total) > 0 : false,
        allConditions: shouldCreateJournal,
      });

      if (shouldCreateJournal) {
        console.log("Entering journal entry creation block...");
        try {
          const totalAmount = parseFloat(total);
          const journalDate = new Date();
          const journalDescription = `Document ${serialNumber ?? ""} - ${
            description || "Notary document"
          }`;

          let journalLines: JournalEntry[] = [];

          if (payment_method === "cash" && cash_account_code) {
            console.log("Creating cash journal entry");
            // Cash payment: Debit cash account, Credit revenue (using 4000 as default revenue account)
            const revenueAccountCode = "4000"; // Default revenue account, adjust as needed

            journalLines = [
              {
                accountCode: cash_account_code,
                debit: totalAmount,
                credit: 0,
                description: `Cash receipt for ${serialNumber}`,
              },
              {
                accountCode: revenueAccountCode,
                debit: 0,
                credit: totalAmount,
                description: `Revenue from ${serialNumber}`,
              },
            ];
          } else if (payment_method === "credit" && customer_id) {
            console.log("Creating credit journal entry");
            // Credit payment: Debit accounts receivable (1100), Credit revenue
            const accountsReceivableCode = "1100";
            const revenueAccountCode = "4000"; // Default revenue account, adjust as needed

            journalLines = [
              {
                accountCode: accountsReceivableCode,
                debit: totalAmount,
                credit: 0,
                description: `Accounts receivable for ${serialNumber} - Customer ID: ${customer_id}`,
                partyId: customer_id,
              },
              {
                accountCode: revenueAccountCode,
                debit: 0,
                credit: totalAmount,
                description: `Revenue from ${serialNumber} - Customer ID: ${customer_id}`,
                partyId: null,
              },
            ];
          }

          console.log("Journal lines prepared:", journalLines);
          console.log("Journal lines prepared:", journalLines.length);

          if (journalLines.length > 0) {
            // Validate that all accounts exist and are active
            const accountCodes = journalLines.map((line) => line.accountCode);
            const accounts = await ChartOfAccount.findAll({
              where: {
                account_code: accountCodes,
                is_active: true,
              },
              transaction,
            });

            const foundAccountCodes = accounts.map((acc) => acc.account_code);
            const missingAccounts = accountCodes.filter(
              (code) => !foundAccountCodes.includes(code)
            );

            if (missingAccounts.length > 0) {
              console.error("Missing or inactive accounts:", missingAccounts);
              throw new Error(
                `Accounts not found or inactive: ${missingAccounts.join(", ")}`
              );
            }

            // Validate journal balance
            const validation =
              JournalService.validateJournalBalance(journalLines);
            console.log("Journal validation:", validation);
            if (!validation.isBalanced) {
              console.warn(
                "Journal entry is not balanced, skipping journal creation",
                validation
              );
            } else {
              // Create journal entry
              console.log("Creating GeneralJournal...");
              const journal = await GeneralJournal.create(
                {
                  date: journalDate,
                  description: journalDescription,
                },
                { transaction }
              );

              console.log("GeneralJournal created with ID:", journal.id);
              console.log("Creating journal lines...");

              await JournalService.createJournalLines(
                journal.id,
                journalLines,
                transaction
              );

              console.log("Journal entry created for document:", serialNumber);
            }
          } else {
            console.log("No journal lines to create");
          }
        } catch (journalError) {
          console.error("Error creating journal entry:", journalError);
          console.error(
            "Error stack:",
            journalError instanceof Error
              ? journalError.stack
              : "No stack trace"
          );
          // Don't fail the document generation if journal entry fails
          // Just log the error
        }
      } else {
        console.log(
          "Journal entry skipped - missing payment_method, total, or total <= 0"
        );
      }

      await transaction.commit();

      // Return the DOCX file directly (no PDF conversion)
      console.log("Returning DOCX file:", docxFileName);
      console.log("Buffer size:", buf.length);

      // Return the DOCX file
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${docxFileName}"`
      );
      res.setHeader("Content-Length", buf.length);
      res.setHeader("X-Filename", docxFileName); // Additional header for filename
      console.log(
        "Setting Content-Disposition header:",
        `attachment; filename="${docxFileName}"`
      );
      console.log("Setting X-Filename header:", docxFileName);
      res.send(buf);

      // Document is now permanently saved in backend/documents folder and database
      console.log(
        "Document permanently saved in documents folder and database"
      );
    } catch (error) {
      await transaction.rollback();
      console.error("Document generation error:", error);
      res
        .status(500)
        .json({ error: "Failed to generate document", details: error });
    }
  }
);

// PUT /api/documents/:id/update - Update existing document with new placeholder data
router.put(
  "/documents/:id/update",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { data } = req.body;

      console.log("Updating document ID:", id);
      console.log("New data:", data);

      if (!data) {
        return res.status(400).json({ error: "Data is required" });
      }

      // Find the existing document
      const existingDocument = await Document.findByPk(id, {
        include: [
          {
            model: DocumentTemplate,
            attributes: ["template_name", "template_id"],
          },
        ],
      });

      if (!existingDocument) {
        return res.status(404).json({ error: "Document not found" });
      }

      const docData = existingDocument.dataValues || existingDocument;
      const docObj = existingDocument as any;

      console.log("Found document:", {
        id: docData.id,
        template_id: docData.template_id,
        document_name: docData.document_name,
        document_link: docData.document_link,
      });

      // Get the template
      const template = await DocumentTemplate.findByPk(docData.template_id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      const templateData = template.dataValues || template;
      const templateFilename = templateData.template_path;

      if (!templateFilename) {
        return res.status(400).json({ error: "Template filename is missing" });
      }

      // Construct full path from stored filename
      const templatePath = path.join(
        process.cwd(),
        "uploads",
        "templates",
        templateFilename
      );

      if (!fs.existsSync(templatePath)) {
        return res.status(404).json({ error: "Template file not found" });
      }

      // Read the template file
      const content = fs.readFileSync(templatePath, "binary");
      const zip = new PizZip(content);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      // Add serial number to data (keep the same serial number)
      data.serial_number = docData.serial_number;

      // Fill the template with new data
      doc.setData(data);

      try {
        doc.render();
      } catch (error) {
        console.error("Template rendering error:", error);
        return res.status(400).json({
          error: "Failed to fill template",
          details: "Check that all placeholders are provided with correct data",
        });
      }

      // Generate the filled DOCX
      const buf = doc.getZip().generate({
        type: "nodebuffer",
        compression: "DEFLATE",
        compressionOptions: {
          level: 4,
        },
      });

      // Get the existing filename and construct full path
      const existingFilename = docData.document_link;

      if (!existingFilename) {
        return res.status(400).json({ error: "Document filename is missing" });
      }

      // Construct full path from stored filename
      const existingFilePath = path.join(
        process.cwd(),
        "documents",
        existingFilename
      );

      const documentsDir = path.join(process.cwd(), "documents");

      // Ensure documents directory exists
      if (!fs.existsSync(documentsDir)) {
        fs.mkdirSync(documentsDir, { recursive: true });
      }

      // Remove the old file if it exists
      if (fs.existsSync(existingFilePath)) {
        fs.unlinkSync(existingFilePath);
        console.log("Removed old file:", existingFilePath);
      }

      // Write the new file with the same name
      fs.writeFileSync(existingFilePath, buf);
      console.log("Updated file saved to:", existingFilePath);

      // Update the document record in database (update timestamp and field_values)
      await existingDocument.update({
        field_values: data, // Store the updated field values as JSON
        updated_at: new Date(),
      });

      console.log("Document updated successfully");

      // Return success response
      res.json({
        message: "Document updated successfully",
        document: {
          id: docData.id,
          document_name: docData.document_name,
          serial_number: docData.serial_number,
        },
      });
    } catch (error) {
      console.error("Document update error:", error);
      res
        .status(500)
        .json({ error: "Failed to update document", details: error });
    }
  }
);

// GET /api/documents - List all generated documents
router.get("/documents", async (req: Request, res: Response) => {
  try {
    const documentsDir = path.join(process.cwd(), "documents");

    if (!fs.existsSync(documentsDir)) {
      return res.json([]);
    }

    const files = fs.readdirSync(documentsDir);
    const documents = files
      .filter((file) => file.endsWith(".docx"))
      .map((file) => {
        const filePath = path.join(documentsDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
        };
      })
      .sort(
        (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
      );

    res.json(documents);
  } catch (error) {
    console.error("Error listing documents:", error);
    res.status(500).json({ error: "Failed to list documents", details: error });
  }
});

// GET /api/documents/:filename/download - Download a specific generated document
router.get(
  "/documents/:filename/download",
  async (req: Request, res: Response) => {
    try {
      const { filename } = req.params;
      const documentsDir = path.join(process.cwd(), "documents");
      const filePath = path.join(documentsDir, filename);

      console.log("Download request:", {
        filename,
        filePath,
        exists: fs.existsSync(filePath),
      });

      if (!fs.existsSync(filePath)) {
        console.log("File not found:", filePath);
        return res.status(404).json({ error: "Document not found" });
      }

      res.download(filePath, filename, (err) => {
        if (err) {
          console.error("Download error:", err);
          res.status(500).json({ error: "Failed to download document" });
        } else {
          console.log("Download successful:", filename);
        }
      });
    } catch (error) {
      console.error("Error downloading document:", error);
      res
        .status(500)
        .json({ error: "Failed to download document", details: error });
    }
  }
);

// GET /api/books - List all books
router.get("/books", async (req: Request, res: Response) => {
  try {
    const books = await Book.findAll({
      order: [["created_at", "DESC"]],
    });
    res.json(books);
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).json({ error: "Failed to fetch books", details: error });
  }
});

// GET /api/books/active - Get active book
router.get("/books/active", async (req: Request, res: Response) => {
  try {
    const activeBook = await Book.findOne({ where: { status: "active" } });
    if (!activeBook) {
      return res.status(404).json({ error: "No active book found" });
    }
    console.log("Active book data:", activeBook.dataValues);
    res.json(activeBook);
  } catch (error) {
    console.error("Error fetching active book:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch active book", details: error });
  }
});

// POST /api/books - Create new book
router.post("/books", async (req: Request, res: Response) => {
  try {
    const { status = "active" } = req.body;
    const book = await Book.create({ status });
    res.status(201).json(book);
  } catch (error) {
    console.error("Error creating book:", error);
    res.status(500).json({ error: "Failed to create book", details: error });
  }
});

// GET /api/documents/db - List all documents from database
router.get(
  "/documents/db",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const documents = await Document.findAll({
        include: [
          {
            model: DocumentTemplate,
            attributes: ["template_name", "template_id"],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      console.log(
        "Documents with template_ids:",
        documents.map((d) => {
          const docData = d.dataValues || d;
          const docObj = d as any; // Type assertion for associated data
          return {
            id: docData.id,
            template_id: docData.template_id,
            template_name: docObj.DocumentTemplate?.template_name,
          };
        })
      );

      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res
        .status(500)
        .json({ error: "Failed to fetch documents", details: error });
    }
  }
);

// GET /api/documents/db/:id - Get specific document from database
router.get(
  "/documents/db/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const document = await Document.findByPk(id, {
        include: [
          {
            model: DocumentTemplate,
            attributes: ["template_name"],
          },
        ],
      });

      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      res.json(document);
    } catch (error) {
      console.error("Error fetching document:", error);
      res
        .status(500)
        .json({ error: "Failed to fetch document", details: error });
    }
  }
);

// Example users route
router.get("/users", (req: Request, res: Response) => {
  res.json([{ id: 1, name: "John Doe" }]);
});

export default router;
