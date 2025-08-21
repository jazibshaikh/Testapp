import request from 'supertest';
import app from '../index';
import * as fs from 'fs';
import * as path from 'path';

// Mock pdf-parse for integration tests
jest.mock('pdf-parse', () => {
  return jest.fn().mockImplementation((buffer: Buffer) => {
    const content = buffer.toString();
    
    if (content.includes('EMPTY_PDF')) {
      return Promise.resolve({
        numpages: 1,
        numrender: 1,
        info: {},
        metadata: {},
        text: 'No transaction data here',
        version: '1.0'
      });
    }
    
    if (content.includes('MALFORMED_PDF')) {
      return Promise.reject(new Error('Invalid PDF structure'));
    }
    
    // Default successful response
    return Promise.resolve({
      numpages: 1,
      numrender: 1,
      info: { title: 'Bank Statement' },
      metadata: {},
      text: `
        Date         Description                Amount     Balance
        01/15/2024   Opening Balance                      $1,000.00
        01/16/2024   Direct Deposit - Salary   $2,500.00  $3,500.00
        01/17/2024   ATM Withdrawal            -$100.00   $3,400.00
      `,
      version: '1.10'
    });
  });
});

describe('/api/convert', () => {
  beforeEach(() => {
    // Clean up global conversions before each test
    (global as any).conversions = {};
  });

  describe('POST /api/convert', () => {
    it('should successfully convert a valid PDF file', async () => {
      const pdfBuffer = Buffer.from('Valid PDF content', 'utf-8');

      const response = await request(app)
        .post('/api/convert')
        .attach('pdf', pdfBuffer, 'test-statement.pdf')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'PDF converted successfully');
      expect(response.body).toHaveProperty('filename');
      expect(response.body).toHaveProperty('conversionId');
      expect(response.body).toHaveProperty('downloadUrls');
      expect(response.body.downloadUrls).toHaveProperty('csv');
      expect(response.body.downloadUrls).toHaveProperty('xlsx');
    });

    it('should reject non-PDF files', async () => {
      const textBuffer = Buffer.from('This is not a PDF file', 'utf-8');

      const response = await request(app)
        .post('/api/convert')
        .attach('pdf', textBuffer, 'test.txt')
        .set('Content-Type', 'multipart/form-data')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid file');
      expect(response.body.message).toContain('Only PDF files are allowed');
    });

    it('should reject files larger than 10MB', async () => {
      // Create a buffer larger than 10MB
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024, 'a');

      const response = await request(app)
        .post('/api/convert')
        .attach('pdf', largeBuffer, 'large.pdf')
        .expect(413);

      expect(response.body).toHaveProperty('error', 'File too large');
      expect(response.body.message).toContain('File size must be less than 10MB');
    });

    it('should return 400 when no file is uploaded', async () => {
      const response = await request(app)
        .post('/api/convert')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'No file provided');
      expect(response.body.message).toContain('Please upload a PDF file');
    });

    it('should handle PDF parsing errors', async () => {
      const malformedPdf = Buffer.from('MALFORMED_PDF content', 'utf-8');

      const response = await request(app)
        .post('/api/convert')
        .attach('pdf', malformedPdf, 'malformed.pdf')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Conversion failed');
      expect(response.body.message).toContain('Invalid PDF structure');
    });

    it('should handle PDFs with no transactions', async () => {
      const emptyPdf = Buffer.from('EMPTY_PDF content', 'utf-8');

      const response = await request(app)
        .post('/api/convert')
        .attach('pdf', emptyPdf, 'empty.pdf')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid PDF content');
      expect(response.body.message).toContain('No transactions found');
    });
  });

  describe('GET /api/convert/download/:conversionId/:format', () => {
    let conversionId: string;

    beforeEach(async () => {
      // First create a successful conversion
      const pdfBuffer = Buffer.from('Valid PDF content', 'utf-8');
      const response = await request(app)
        .post('/api/convert')
        .attach('pdf', pdfBuffer, 'test-statement.pdf');

      conversionId = response.body.conversionId;
    });

    it('should download CSV file successfully', async () => {
      const response = await request(app)
        .get(`/api/convert/download/${conversionId}/csv`)
        .expect(200);

      expect(response.headers['content-type']).toBe('text/csv');
      expect(response.headers['content-disposition']).toContain('.csv');
      expect(response.body).toBeDefined();
    });

    it('should download XLSX file successfully', async () => {
      const response = await request(app)
        .get(`/api/convert/download/${conversionId}/xlsx`)
        .expect(200);

      expect(response.headers['content-type']).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      expect(response.headers['content-disposition']).toContain('.xlsx');
      expect(response.body).toBeDefined();
    });

    it('should return 400 for invalid format', async () => {
      const response = await request(app)
        .get(`/api/convert/download/${conversionId}/pdf`)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid format');
      expect(response.body.message).toContain('Format must be csv or xlsx');
    });

    it('should return 404 for non-existent conversion ID', async () => {
      const response = await request(app)
        .get('/api/convert/download/nonexistent/csv')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'File not found');
      expect(response.body.message).toContain('expired or does not exist');
    });
  });

  describe('File validation', () => {
    it('should accept PDF with correct MIME type', async () => {
      const pdfBuffer = Buffer.from('Valid PDF content', 'utf-8');

      await request(app)
        .post('/api/convert')
        .attach('pdf', pdfBuffer, 'test.pdf')
        .expect(200);
    });

    it('should reject file with wrong extension but correct MIME type', async () => {
      const pdfBuffer = Buffer.from('Valid PDF content', 'utf-8');

      const response = await request(app)
        .post('/api/convert')
        .attach('pdf', pdfBuffer, 'test.doc')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});

describe('Health check', () => {
  it('should return OK status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body).toEqual({ status: 'ok' });
  });
});