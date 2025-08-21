import { PDFConverter } from '../services/pdfConverter';
import * as fs from 'fs';
import * as path from 'path';

// Mock pdf-parse module
jest.mock('pdf-parse', () => {
  return jest.fn().mockImplementation((buffer: Buffer) => {
    if (buffer.toString().includes('EMPTY')) {
      return Promise.resolve({
        numpages: 1,
        numrender: 1,
        info: {},
        metadata: {},
        text: '', // Empty text should trigger no transactions found
        version: '1.0'
      });
    }
    
    if (buffer.toString().includes('MALFORMED')) {
      return Promise.reject(new Error('Invalid PDF format'));
    }
    
    // Mock successful PDF with bank statement data
    return Promise.resolve({
      numpages: 2,
      numrender: 2,
      info: { title: 'Bank Statement' },
      metadata: {},
      text: `
        Date         Description                Amount     Balance
        01/15/2024   Opening Balance                      $1,000.00
        01/16/2024   Direct Deposit - Salary   $2,500.00  $3,500.00
        01/17/2024   ATM Withdrawal            -$100.00   $3,400.00
        01/18/2024   Grocery Store             -$85.50    $3,314.50
        01/19/2024   Online Transfer           -$500.00   $2,814.50
      `,
      version: '1.10'
    });
  });
});

describe('PDFConverter', () => {
  let converter: PDFConverter;

  beforeEach(() => {
    converter = new PDFConverter();
  });

  describe('convertPDF', () => {
    it('should successfully convert a PDF with bank statement data', async () => {
      const mockPdfBuffer = Buffer.from('Mock PDF content with bank data', 'utf-8');
      const filename = 'statement.pdf';

      const result = await converter.convertPDF(mockPdfBuffer, filename);

      expect(result).toHaveProperty('csv');
      expect(result).toHaveProperty('xlsx');
      expect(result).toHaveProperty('filename');
      expect(result.csv).toBeInstanceOf(Buffer);
      expect(result.xlsx).toBeInstanceOf(Buffer);
      expect(result.filename).toMatch(/statement_\d{4}-\d{2}-\d{2}/);
    });

    it('should handle PDF with no transactions found', async () => {
      const mockPdfBuffer = Buffer.from('EMPTY PDF content', 'utf-8');
      const filename = 'empty.pdf';

      await expect(
        converter.convertPDF(mockPdfBuffer, filename)
      ).rejects.toThrow('No transactions found in PDF');
    });

    it('should handle malformed PDF files', async () => {
      const mockPdfBuffer = Buffer.from('MALFORMED PDF content', 'utf-8');
      const filename = 'malformed.pdf';

      await expect(
        converter.convertPDF(mockPdfBuffer, filename)
      ).rejects.toThrow('PDF conversion failed: Invalid PDF format');
    });

    it('should generate proper CSV format', async () => {
      const mockPdfBuffer = Buffer.from('Mock PDF content with bank data', 'utf-8');
      const filename = 'statement.pdf';

      const result = await converter.convertPDF(mockPdfBuffer, filename);
      const csvContent = result.csv.toString('utf-8');

      expect(csvContent).toContain('date,description,amount,balance,type');
      expect(csvContent).toContain('Direct Deposit - Salary');
      expect(csvContent).toContain('Credit');
      expect(csvContent).toContain('Debit');
    });

    it('should generate proper XLSX format', async () => {
      const mockPdfBuffer = Buffer.from('Mock PDF content with bank data', 'utf-8');
      const filename = 'statement.pdf';

      const result = await converter.convertPDF(mockPdfBuffer, filename);

      // XLSX files start with PK (ZIP header)
      expect(result.xlsx.subarray(0, 2)).toEqual(Buffer.from('PK'));
      expect(result.xlsx.length).toBeGreaterThan(0);
    });

    it('should handle edge cases with special characters', async () => {
      // Mock PDF parse to return data with special characters
      const pdfParse = require('pdf-parse');
      pdfParse.mockImplementationOnce(() => Promise.resolve({
        numpages: 1,
        numrender: 1,
        info: {},
        metadata: {},
        text: `
          01/15/2024   Store "ABC & Co."     -$50.00    $950.00
          01/16/2024   Café Français         -$25.50    $924.50
        `,
        version: '1.0'
      }));

      const mockPdfBuffer = Buffer.from('Mock PDF with special chars', 'utf-8');
      const filename = 'special.pdf';

      const result = await converter.convertPDF(mockPdfBuffer, filename);
      const csvContent = result.csv.toString('utf-8');

      expect(csvContent).toContain('Store "ABC & Co."');
      expect(csvContent).toContain('Café Français');
    });
  });
});