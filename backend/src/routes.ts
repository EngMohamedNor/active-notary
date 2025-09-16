import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import DocumentTemplate from './models/documentTemplate.js';
import { Book, Document } from './models/index.js';
import { v4 as uuidv4 } from 'uuid';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import libre from 'libreoffice-convert';
import { promisify } from 'util';

const router = Router();

// Multer setup for DOCX uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads', 'templates'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});
const upload = multer({ storage });

// POST /api/templates/upload
router.post('/templates/upload', upload.single('template'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const { originalname, filename } = req.file;
    const { template_name } = req.body; // Get template name from form
    
    // Store relative path instead of absolute path
    const relativePath = `uploads/templates/${filename}`;
    
    console.log('Storing relative path:', relativePath);
    
    const template = await DocumentTemplate.create({
      template_id: uuidv4(),
      template_name: template_name || originalname, // Use form name or fallback to filename
      template_path: relativePath,
    });
    res.status(201).json({ message: 'Template uploaded', template });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload template', details: error });
  }
});

// GET /api/templates
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const templates = await DocumentTemplate.findAll();
    console.log('All templates:', templates.map(t => ({
      id: t.template_id,
      name: t.template_name,
      path: t.template_path
    })));
    console.log('Total templates found:', templates.length);
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates', details: error });
  }
});

// GET /api/templates/:id/download
router.get('/templates/:id/download', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = await DocumentTemplate.findByPk(id);
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    // Access data from dataValues since direct property access returns undefined
    const templateData = template.dataValues || template;
    const filePath = path.join(process.cwd(), templateData.template_path);
    const fileName = templateData.template_name.endsWith('.docx') 
      ? templateData.template_name 
      : `${templateData.template_name}.docx`;
    
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({ error: 'Failed to download file' });
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to download template', details: error });
  }
});

// DELETE /api/templates/:id
router.delete('/templates/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = await DocumentTemplate.findByPk(id);
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    // Access data from dataValues since direct property access returns undefined
    const templateData = template.dataValues || template;
    
    // Construct the full file path
    const filePath = path.join(process.cwd(), templateData.template_path);
    
    // Delete the physical file
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('Physical file deleted:', filePath);
      } else {
        console.log('Physical file not found:', filePath);
      }
    } catch (fileError) {
      console.error('Error deleting physical file:', fileError);
      // Continue with database deletion even if file deletion fails
    }
    
    // Delete the database record
    await template.destroy();
    
    res.json({ 
      message: 'Template deleted successfully',
      template: {
        id: templateData.template_id,
        name: templateData.template_name
      }
    });
  } catch (error) {
    console.error('Delete route error:', error);
    res.status(500).json({ error: 'Failed to delete template', details: error });
  }
});

// GET /api/templates/:id/analyze - Extract placeholders from template
router.get('/templates/:id/analyze', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log('Template analysis request for ID:', id);
    
    const template = await DocumentTemplate.findByPk(id);
    console.log('Found template:', template ? 'Yes' : 'No');
    
    if (!template) {
      console.log('Template not found for ID:', id);
      return res.status(404).json({ error: 'Template not found' });
    }
   
    
    // Access data from dataValues since direct property access returns undefined
    const templateData = template.dataValues || template;
    const templatePath = templateData.template_path;
    
   console.log('===================');
    console.log('Template path:', templatePath);
    if (!templatePath) {
      return res.status(400).json({ error: 'Template path is missing' });
    }
    
    const filePath = templatePath;
      console.log('filePath  :', filePath);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Template file not found' });
    }
    
    // Read the template file
    const content = fs.readFileSync(filePath, 'binary');
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
      placeholders: Array.from(placeholders)
    });
  } catch (error) {
    console.error('Template analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze template', details: error });
  }
});

// POST /api/documents/generate - Generate document from template
router.post('/documents/generate', async (req: Request, res: Response) => {
  try {
    const { template_id, data, document_name, description, user_id, customer_name, customer_phone, total, paid } = req.body;
    console.log('template_id:', template_id);
    console.log('data:', data);
    if (!template_id || !data) {
      return res.status(400).json({ error: 'Template ID and data are required' });
    }
    
    const template = await DocumentTemplate.findByPk(template_id);
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    // Access data from dataValues since direct property access returns undefined
    const templateData = template.dataValues || template;
    const templatePath = templateData.template_path;
    
    console.log('Template found for generation:', {
      id: templateData.template_id,
      name: templateData.template_name,
      path: templatePath
    });
    
    if (!templatePath) {
      return res.status(400).json({ error: 'Template path is missing' });
    }
    
    // Step 1: Check if there's an active book, if not create one
    let activeBook;
    try {
      activeBook = await Book.findOne({ where: { status: 'active' } });
      
      if (!activeBook) {
        console.log('No active book found, creating new book...');
        activeBook = await Book.create({
          status: 'active'
        });
        console.log('Created new book:', activeBook.dataValues);
      } else {
        console.log('Found active book:', activeBook.dataValues);
      }
    } catch (bookError) {
      console.error('Error with book operations:', bookError);
      throw new Error('Failed to create or retrieve active book');
    }
    
    // Ensure we have a valid book_no
    const bookNo = activeBook.dataValues?.book_no || activeBook.book_no;
    if (!bookNo) {
      console.error('Book data:', activeBook);
      throw new Error('Failed to get valid book_no from active book');
    }
    
    console.log('Using book_no:', bookNo);
    
    const fullTemplatePath = templatePath;
    
    if (!fs.existsSync(fullTemplatePath)) {
      return res.status(404).json({ error: 'Template file not found' });
    }
    
    // Read the template file
    const content = fs.readFileSync(fullTemplatePath, 'binary');
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });
    
   
    
    // Step 2: Calculate next doc_serial for this book
    const maxDocSerial = await Document.max('doc_serial', {
      where: { book_no: bookNo }
    }) as number | null;
    const nextDocSerial = (maxDocSerial || 0) + 1;
    
    // Step 3: Generate serial_number in format: REP. B{book_no}/{doc_serial}/{current_year}
    const currentYear = new Date().getFullYear();
    
    const serialNumber = `REP. B${bookNo}/${nextDocSerial}/${currentYear}`;
    
    console.log('Generated doc_serial:', nextDocSerial);
    console.log('Generated serial_number:', serialNumber);






 // Fill the template with data
 data.serial_number = serialNumber;

 doc.setData(data);
    
 try {
   doc.render();
 } catch (error) {
   console.error('Template rendering error:', error);
   return res.status(400).json({ 
     error: 'Failed to fill template', 
     details: 'Check that all placeholders are provided with correct data' 
   });
 }
 
 // Generate the filled DOCX
 const buf = doc.getZip().generate({
   type: 'nodebuffer',
   compression: 'DEFLATE',
   compressionOptions: {
     level: 4,
   },
 });
 
 // Create documents directory if it doesn't exist
 const documentsDir = path.join(process.cwd(), 'documents');
 if (!fs.existsSync(documentsDir)) {
   fs.mkdirSync(documentsDir, { recursive: true });
 }
 
 // Generate filename using serial number
 const sanitizedSerialNumber = serialNumber.replace(/[^a-zA-Z0-9.-]/g, '_');
 const docxFileName = `${sanitizedSerialNumber}.docx`;
 const pdfFileName = `${sanitizedSerialNumber}.pdf`;
 const docxPath = path.join(documentsDir, docxFileName);
 const pdfPath = path.join(documentsDir, pdfFileName);
 
 // Save the filled DOCX permanently in documents folder
 fs.writeFileSync(docxPath, buf);
 console.log('Document saved to:', docxPath);








    
    // Step 4: Create document record in database
    const documentRecord = await Document.create({
      template_id: template_id,
      document_name: document_name || docxFileName,
      document_link: docxPath,
      description: description || `Generated from template: ${templateData.template_name}`,
      user_id: user_id || undefined,
      doc_serial: nextDocSerial,
      book_no: bookNo,
      serial_number: serialNumber,
      total: total ? parseFloat(total) : undefined,
      paid: paid ? parseFloat(paid) : undefined,
      balance: total && paid ? parseFloat(total) - parseFloat(paid) : undefined,
      customer_name: customer_name || undefined,
      customer_phone: customer_phone || undefined,
    });
    
    console.log('Document record created with ID:', documentRecord.id);
    
    // Return the DOCX file directly (no PDF conversion)
    console.log('Returning DOCX file:', docxFileName);
    console.log('Buffer size:', buf.length);
    
    // Return the DOCX file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${docxFileName}"`);
    res.setHeader('Content-Length', buf.length);
    res.setHeader('X-Filename', docxFileName); // Additional header for filename
    console.log('Setting Content-Disposition header:', `attachment; filename="${docxFileName}"`);
    console.log('Setting X-Filename header:', docxFileName);
    res.send(buf);
    
    // Document is now permanently saved in backend/documents folder and database
    console.log('Document permanently saved in documents folder and database');
    
  } catch (error) {
    console.error('Document generation error:', error);
    res.status(500).json({ error: 'Failed to generate document', details: error });
  }
});

// PUT /api/documents/:id/update - Update existing document with new placeholder data
router.put('/documents/:id/update', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data } = req.body;
    
    console.log('Updating document ID:', id);
    console.log('New data:', data);
    
    if (!data) {
      return res.status(400).json({ error: 'Data is required' });
    }
    
    // Find the existing document
    const existingDocument = await Document.findByPk(id, {
      include: [
        {
          model: DocumentTemplate,
          attributes: ['template_name', 'template_id']
        }
      ]
    });
    
    if (!existingDocument) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    const docData = existingDocument.dataValues || existingDocument;
    const docObj = existingDocument as any;
    
    console.log('Found document:', {
      id: docData.id,
      template_id: docData.template_id,
      document_name: docData.document_name,
      document_link: docData.document_link
    });
    
    // Get the template
    const template = await DocumentTemplate.findByPk(docData.template_id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    const templateData = template.dataValues || template;
    const templatePath = templateData.template_path;
    
    if (!templatePath) {
      return res.status(400).json({ error: 'Template path is missing' });
    }
    
    if (!fs.existsSync(templatePath)) {
      return res.status(404).json({ error: 'Template file not found' });
    }
    
    // Read the template file
    const content = fs.readFileSync(templatePath, 'binary');
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
      console.error('Template rendering error:', error);
      return res.status(400).json({ 
        error: 'Failed to fill template', 
        details: 'Check that all placeholders are provided with correct data' 
      });
    }
    
    // Generate the filled DOCX
    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 4,
      },
    });
    
    // Get the existing file path
    const existingFilePath = docData.document_link;
    
    if (!existingFilePath) {
      return res.status(400).json({ error: 'Document file path is missing' });
    }
    
    const documentsDir = path.join(process.cwd(), 'documents');
    
    // Ensure documents directory exists
    if (!fs.existsSync(documentsDir)) {
      fs.mkdirSync(documentsDir, { recursive: true });
    }
    
    // Remove the old file if it exists
    if (fs.existsSync(existingFilePath)) {
      fs.unlinkSync(existingFilePath);
      console.log('Removed old file:', existingFilePath);
    }
    
    // Write the new file with the same name
    fs.writeFileSync(existingFilePath, buf);
    console.log('Updated file saved to:', existingFilePath);
    
    // Update the document record in database (update timestamp)
    await existingDocument.update({
      updated_at: new Date()
    });
    
    console.log('Document updated successfully');
    
    // Return success response
    res.json({ 
      message: 'Document updated successfully',
      document: {
        id: docData.id,
        document_name: docData.document_name,
        serial_number: docData.serial_number
      }
    });
    
  } catch (error) {
    console.error('Document update error:', error);
    res.status(500).json({ error: 'Failed to update document', details: error });
  }
});

// GET /api/documents - List all generated documents
router.get('/documents', async (req: Request, res: Response) => {
  try {
    const documentsDir = path.join(process.cwd(), 'documents');
    
    if (!fs.existsSync(documentsDir)) {
      return res.json([]);
    }
    
    const files = fs.readdirSync(documentsDir);
    const documents = files
      .filter(file => file.endsWith('.docx'))
      .map(file => {
        const filePath = path.join(documentsDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      })
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
    
    res.json(documents);
  } catch (error) {
    console.error('Error listing documents:', error);
    res.status(500).json({ error: 'Failed to list documents', details: error });
  }
});

// GET /api/documents/:filename/download - Download a specific generated document
router.get('/documents/:filename/download', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const documentsDir = path.join(process.cwd(), 'documents');
    const filePath = path.join(documentsDir, filename);
    
    console.log('Download request:', { filename, filePath, exists: fs.existsSync(filePath) });
    
    if (!fs.existsSync(filePath)) {
      console.log('File not found:', filePath);
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({ error: 'Failed to download document' });
      } else {
        console.log('Download successful:', filename);
      }
    });
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ error: 'Failed to download document', details: error });
  }
});

// GET /api/books - List all books
router.get('/books', async (req: Request, res: Response) => {
  try {
    const books = await Book.findAll({
      order: [['created_at', 'DESC']]
    });
    res.json(books);
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ error: 'Failed to fetch books', details: error });
  }
});

// GET /api/books/active - Get active book
router.get('/books/active', async (req: Request, res: Response) => {
  try {
    const activeBook = await Book.findOne({ where: { status: 'active' } });
    if (!activeBook) {
      return res.status(404).json({ error: 'No active book found' });
    }
    console.log('Active book data:', activeBook.dataValues);
    res.json(activeBook);
  } catch (error) {
    console.error('Error fetching active book:', error);
    res.status(500).json({ error: 'Failed to fetch active book', details: error });
  }
});

// POST /api/books - Create new book
router.post('/books', async (req: Request, res: Response) => {
  try {
    const { status = 'active' } = req.body;
    const book = await Book.create({ status });
    res.status(201).json(book);
  } catch (error) {
    console.error('Error creating book:', error);
    res.status(500).json({ error: 'Failed to create book', details: error });
  }
});

// GET /api/documents/db - List all documents from database
router.get('/documents/db', async (req: Request, res: Response) => {
  try {
    const documents = await Document.findAll({
      include: [
        {
          model: DocumentTemplate,
          attributes: ['template_name','template_id']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    console.log('Documents with template_ids:', documents.map(d => {
      const docData = d.dataValues || d;
      const docObj = d as any; // Type assertion for associated data
      return {
        id: docData.id,
        template_id: docData.template_id,
        template_name: docObj.DocumentTemplate?.template_name
      };
    }));
    
    res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents', details: error });
  }
});

// GET /api/documents/db/:id - Get specific document from database
router.get('/documents/db/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const document = await Document.findByPk(id, {
      include: [
        {
          model: DocumentTemplate,
          attributes: ['template_name']
        }
      ]
    });
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document', details: error });
  }
});

// Example users route
router.get('/users', (req: Request, res: Response) => {
  res.json([{ id: 1, name: 'John Doe' }]);
});

export default router;
