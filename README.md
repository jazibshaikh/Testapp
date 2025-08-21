# Bank Statement PDF to CSV/XLS Converter

A full-stack web application that converts PDF bank statements to CSV and XLSX formats using React, Node.js, and TypeScript.

## Features

- **Drag & Drop Upload**: Easy PDF file upload with visual feedback
- **File Validation**: Client and server-side validation (PDF type, 10MB limit)
- **PDF Processing**: Extracts transaction data using intelligent parsing
- **Multiple Formats**: Converts to both CSV and XLSX formats
- **Progress Tracking**: Real-time upload and conversion progress
- **Error Handling**: User-friendly error messages for various scenarios
- **Responsive Design**: Works on desktop and mobile devices

## Architecture

- **Frontend**: React with Next.js, TypeScript, SCSS, react-dropzone
- **Backend**: Node.js with Express, TypeScript, multer, pdf-parse
- **Testing**: Jest with comprehensive test coverage
- **Deployment**: Docker containerization for easy deployment

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Testapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   npm run install:all
   ```

3. **Start development servers**
   ```bash
   npm run dev
   ```

   This starts both frontend (port 3000) and backend (port 4000) concurrently.

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000

### Docker Setup

```bash
docker-compose up
```

## API Endpoints

### POST /api/convert
Upload and convert PDF file

**Request**: `multipart/form-data` with PDF file
**Response**: 
```json
{
  "success": true,
  "message": "PDF converted successfully",
  "filename": "statement_2024-01-01",
  "conversionId": "12345",
  "downloadUrls": {
    "csv": "/api/convert/download/12345/csv",
    "xlsx": "/api/convert/download/12345/xlsx"
  }
}
```

### GET /api/convert/download/:id/:format
Download converted file (CSV or XLSX)

### GET /api/health
Health check endpoint

## Error Handling

- **400**: Invalid file type or missing file
- **413**: File too large (>10MB)
- **500**: Conversion failure or server error

## Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Run All Tests
```bash
npm run test
```

## Project Structure

```
├── frontend/                 # React/Next.js frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Next.js pages
│   │   └── styles/          # SCSS stylesheets
│   └── package.json
├── backend/                  # Node.js/Express backend
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Express middleware
│   │   └── __tests__/       # Test files
│   └── package.json
├── docker-compose.yml        # Docker configuration
└── README.md
```

## Features Implemented

✅ **Frontend (React + Dropzone.js)**
- Drag-and-drop file upload with visual feedback
- Client-side validation (PDF type, 10MB limit)
- Progress tracking and error handling
- Download buttons for CSV/XLSX files
- Responsive design with SCSS styling

✅ **Backend (Node.js + Express)**
- POST `/api/convert` endpoint with multer file upload
- PDF parsing using pdf-parse library
- CSV generation using @json2csv/plainjs
- XLSX generation using exceljs
- Comprehensive error handling (400/413/500)
- File streaming with proper headers

✅ **Testing**
- Unit tests for PDF conversion logic
- Integration tests for API endpoints
- Frontend component testing
- Error scenario coverage
- Performance and edge case testing

✅ **Deployment Ready**
- Docker containerization
- TypeScript configuration
- Environment-based configuration
- Production build optimization

## Acceptance Criteria Met

- ✅ Upload PDF, see progress, download CSV/XLSX
- ✅ Invalid files yield user-friendly errors
- ✅ Automated tests cover conversion functionality

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## License

MIT License