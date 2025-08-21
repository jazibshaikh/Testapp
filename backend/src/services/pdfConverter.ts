import pdfParse from 'pdf-parse';
import { Parser } from '@json2csv/plainjs';
import ExcelJS from 'exceljs';

export interface ConversionResult {
  csv: Buffer;
  xlsx: Buffer;
  filename: string;
}

export interface BankTransaction {
  date: string;
  description: string;
  amount: number;
  balance?: number;
  type?: string;
}

export class PDFConverter {
  async convertPDF(pdfBuffer: Buffer, originalFilename: string): Promise<ConversionResult> {
    try {
      // Parse PDF
      const pdfData = await pdfParse(pdfBuffer);
      
      // Extract transactions from text
      const transactions = this.extractTransactions(pdfData.text);
      
      if (transactions.length === 0) {
        throw new Error('No transactions found in PDF. Please ensure the PDF contains bank statement data.');
      }
      
      // Generate CSV
      const csv = await this.generateCSV(transactions);
      
      // Generate XLSX
      const xlsx = await this.generateXLSX(transactions);
      
      // Generate filename based on original
      const baseFilename = originalFilename.replace('.pdf', '');
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${baseFilename}_${timestamp}`;
      
      return {
        csv,
        xlsx,
        filename
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`PDF conversion failed: ${error.message}`);
      }
      throw new Error('PDF conversion failed: Unknown error');
    }
  }
  
  private extractTransactions(text: string): BankTransaction[] {
    const transactions: BankTransaction[] = [];
    const lines = text.split('\n');
    
    // Common bank statement patterns
    const datePattern = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\b/;
    const amountPattern = /[+\-]?\$?\d{1,3}(?:,\d{3})*\.?\d{0,2}/;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) continue;
      
      const dateMatch = line.match(datePattern);
      const amountMatches = line.match(new RegExp(amountPattern.source, 'g'));
      
      if (dateMatch && amountMatches) {
        // Extract date
        const date = dateMatch[1];
        
        // Extract description (text between date and amount)
        let description = line
          .replace(dateMatch[0], '')
          .replace(amountMatches[amountMatches.length - 1], '')
          .trim();
        
        // Clean up description
        description = description.replace(/\s+/g, ' ').trim();
        
        if (description.length === 0) {
          description = 'Transaction';
        }
        
        // Extract amount (last amount found is usually the transaction amount)
        const amountStr = amountMatches[amountMatches.length - 1];
        const amount = this.parseAmount(amountStr);
        
        // Extract balance if available (usually the last amount if there are multiple)
        const balance = amountMatches.length > 1 ? 
          this.parseAmount(amountMatches[amountMatches.length - 2]) : undefined;
        
        // Determine transaction type
        const type = amount >= 0 ? 'Credit' : 'Debit';
        
        transactions.push({
          date,
          description,
          amount,
          balance,
          type
        });
      }
    }
    
    // If no transactions found with the pattern above, try a simpler approach
    if (transactions.length === 0) {
      return this.extractSimpleTransactions(text);
    }
    
    return transactions;
  }
  
  private extractSimpleTransactions(text: string): BankTransaction[] {
    const transactions: BankTransaction[] = [];
    const lines = text.split('\n');
    
    // Look for lines with dollar amounts
    const simpleAmountPattern = /\$[\d,]+\.?\d*/g;
    
    for (const line of lines) {
      const amounts = line.match(simpleAmountPattern);
      if (amounts && amounts.length > 0) {
        const amount = this.parseAmount(amounts[0]);
        const description = line.replace(simpleAmountPattern, '').trim() || 'Transaction';
        
        transactions.push({
          date: new Date().toLocaleDateString(), // Use current date as fallback
          description,
          amount,
          type: amount >= 0 ? 'Credit' : 'Debit'
        });
      }
    }
    
    return transactions;
  }
  
  private parseAmount(amountStr: string): number {
    // Remove currency symbols and clean up
    const cleaned = amountStr.replace(/[$,\s]/g, '');
    const amount = parseFloat(cleaned);
    return isNaN(amount) ? 0 : amount;
  }
  
  private async generateCSV(transactions: BankTransaction[]): Promise<Buffer> {
    try {
      const parser = new Parser({
        fields: ['date', 'description', 'amount', 'balance', 'type']
      });
      
      const csv = parser.parse(transactions);
      return Buffer.from(csv, 'utf-8');
    } catch (error) {
      throw new Error(`CSV generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  private async generateXLSX(transactions: BankTransaction[]): Promise<Buffer> {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Bank Statement');
      
      // Add headers
      worksheet.columns = [
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Description', key: 'description', width: 30 },
        { header: 'Amount', key: 'amount', width: 15 },
        { header: 'Balance', key: 'balance', width: 15 },
        { header: 'Type', key: 'type', width: 10 }
      ];
      
      // Add data
      transactions.forEach(transaction => {
        worksheet.addRow(transaction);
      });
      
      // Style headers
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6E6' }
      };
      
      // Format amount columns
      worksheet.getColumn('amount').numFmt = '$#,##0.00';
      worksheet.getColumn('balance').numFmt = '$#,##0.00';
      
      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    } catch (error) {
      throw new Error(`XLSX generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}