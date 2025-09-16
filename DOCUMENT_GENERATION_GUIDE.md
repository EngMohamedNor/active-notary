# Document Generation System

This system allows you to create documents by filling Word templates with dynamic data and converting them to PDF.

## Features

- **Template Upload**: Upload Word (.docx) templates with placeholders
- **Template Analysis**: Automatically extract placeholders from templates
- **Dynamic Form Generation**: Create forms based on template placeholders
- **Document Generation**: Fill templates with user data and convert to PDF
- **PDF Download**: Download generated documents as PDF files

## How to Use

### 1. Upload a Template

1. Navigate to "Upload Template" in the sidebar
2. Select a Word document (.docx) file
3. Enter a template name
4. Click "Upload Template"

### 2. Create a Template

Your Word template should contain placeholders in the format `{placeholder_name}`. For example:

```
My name is {name}
My gender is {gender}
My age is {age}
I work at {company}
```

### 3. Generate a Document (Wizard Interface)

The document generation process is now organized into a 4-step wizard:

#### Step 1: Template Selection
1. Navigate to "Generate Document" in the sidebar
2. Select a template from the available list
3. The system will analyze the template and show required fields
4. Click "Next: Customer & Payment" to proceed

#### Step 2: Customer Information & Payment
1. Fill in the customer and payment details:
   - **Description** (required) - Document description
   - **Total Amount** (required) - Payment amount
   - **Customer Name** (required) - Customer's full name
   - **Customer Phone** (required) - Customer's phone number
2. Click "Next: Template Fields" to proceed

#### Step 3: Template Fields
1. Fill in all the template placeholder fields
2. The system automatically excludes `serial_number` (auto-generated)
3. Click "Generate DOCX" to create the document
4. The system will:
   - Fill the template with your data
   - Generate automatic serial numbers
   - Save the document with serial number as filename
   - Save the document in the database
   - Automatically move to Step 4

#### Step 4: Download Document
1. View the success confirmation with the generated filename
2. Click "Download Document" to download the generated DOCX file
3. The document is named using the serial number format: `REP._B{book_no}_{doc_serial}_{current_year}.docx`
4. Choose to:
   - **Generate Another Document** - Go back to Step 1 with current template selected
   - **Start Over** - Reset everything and start from the beginning

#### Navigation
- Use "Previous" and "Next" buttons to navigate between steps
- Use "Reset" button to start over from the beginning
- Progress indicator shows current step and completion status
- Automatic progression to download step after successful generation

### 4. View and Manage Documents

Navigate to "Documents List" in the sidebar to view all generated documents:

#### Features:
- **Document Overview** - See all generated documents in a table format
- **Search Functionality** - Search by document name, serial number, customer name, or description
- **Date Filtering** - Filter documents by creation date range
- **Download Documents** - Download any previously generated document
- **Edit Documents** - Edit placeholder values and save as new document
- **Document Details** - View customer information, amounts, and creation dates

#### Document Information Displayed:
- Document name and serial number
- Template used
- Customer name and phone
- Total amount, paid amount, and balance
- Creation date and time
- Download action button

#### Filtering Options:
- **Text Search** - Search across multiple fields
- **Date Range** - Filter by start and end dates
- **Clear Filters** - Reset all filters to show all documents

#### Edit Functionality:
- **Edit Button** - Click the green "Edit" button next to any document
- **Placeholder Editing** - Modify placeholder values in the edit modal
- **Update Existing Document** - Updates the existing document file with new values
- **File System Update** - Removes old file and saves new file with same name
- **Serial Number Preservation** - Keeps the same serial number
- **Template Preservation** - Uses the same template as the original document

## API Endpoints

### Backend Endpoints

- `GET /api/templates` - Get all templates
- `POST /api/templates/upload` - Upload a new template
- `GET /api/templates/:id/analyze` - Analyze template and extract placeholders
- `POST /api/documents/generate` - Generate document from template
- `GET /api/templates/:id/download` - Download template file
- `DELETE /api/templates/:id` - Delete template
- `GET /api/documents` - List all generated documents (file system)
- `GET /api/documents/:filename/download` - Download a specific generated document
- `GET /api/books` - List all books
- `GET /api/books/active` - Get active book
- `POST /api/books` - Create new book
- `GET /api/documents/db` - List all documents from database
- `GET /api/documents/db/:id` - Get specific document from database

### Template Analysis Response

```json
{
  "template_id": "uuid",
  "template_name": "Template Name",
  "placeholders": ["name", "gender", "age", "company"]
}
```

### Document Generation Request

```json
{
  "template_id": "uuid",
  "data": {
    "name": "John Doe",
    "gender": "Male",
    "age": "30",
    "company": "Acme Corp"
  },
  "document_name": "Contract Document",
  "description": "Employment contract for John Doe",
  "user_id": 1,
  "customer_name": "John Doe",
  "customer_phone": "+1234567890",
  "total": 1000.00,
  "paid": 500.00
}
```

## Technical Details

### Backend Dependencies

- `docxtemplater` - Fill Word templates with data
- `pizzip` - Handle Word document structure
- `libreoffice-convert` - Convert DOCX to PDF
- `express` - Web server
- `multer` - File upload handling
- `sequelize` - Database ORM

### Frontend Dependencies

- `react` - UI framework
- `react-hook-form` - Form handling
- `lucide-react` - Icons
- `tailwindcss` - Styling

### File Structure

```
backend/
├── src/
│   ├── routes.ts          # API endpoints
│   ├── models/            # Database models
│   └── index.ts           # Server entry point
├── uploads/templates/     # Uploaded templates
└── documents/             # Generated documents

frontend/
├── src/
│   ├── pages/
│   │   ├── Templates.tsx           # Template management
│   │   ├── UploadTemplate.tsx      # Template upload
│   │   └── GenerateDocument.tsx    # Document generation
│   └── layout/
│       └── AppSidebar.tsx          # Navigation
```

## Installation

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Requirements

- Node.js 18+
- MySQL database
- LibreOffice (for PDF conversion) - **Optional but recommended**

## PDF Conversion Setup

The system currently returns DOCX files by default. To enable PDF conversion:

### Windows:
1. Download and install LibreOffice from https://www.libreoffice.org/
2. Make sure LibreOffice is in your system PATH
3. Restart the backend server

### Linux/Mac:
```bash
# Ubuntu/Debian
sudo apt-get install libreoffice

# macOS
brew install --cask libreoffice
```

### Testing PDF Conversion:
After installing LibreOffice, the system will automatically attempt PDF conversion. If it fails, it will fall back to DOCX format.

## Database Integration

The system now integrates with two main database tables:

### Books Table
- Automatically creates an "active" book if none exists
- Each document is associated with a book number
- Books track the status of document collections

### Documents Table
- Stores metadata for each generated document
- Links to the template used and the book number
- Tracks customer information, payments, and document details
- Includes file path for the generated document
- `doc_serial` field for document serial numbering

## Document Generation Process

1. **Check for Active Book**: System checks if there's an active book, creates one if needed
2. **Calculate Document Serial**: Finds the maximum `doc_serial` for the current book and adds 1
3. **Generate Serial Number**: Creates serial number in format `REP. B{book_no}/{doc_serial}/{current_year}`
4. **Generate Document**: Fills template with provided data
5. **Save File**: Stores DOCX file in `backend/documents/` folder
6. **Create Database Record**: Saves document metadata with auto-generated serials
7. **Return File**: Downloads the generated document to user

## Notes

- Templates must be in .docx format
- Placeholders must use the format `{placeholder_name}`
- Generated DOCX files are automatically downloaded
- All generated documents are permanently stored in the `backend/documents/` folder
- Document metadata is stored in the database for tracking and management
- Each document is automatically assigned to an active book
- Document serial numbers are auto-generated in format: `REP. B{book_no}/{doc_serial}/{current_year}`
- Document serials are automatically incremented per book
- You can list and re-download previously generated documents using the API
