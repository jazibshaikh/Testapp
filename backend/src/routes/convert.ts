import express from 'express';
import { uploadMiddleware } from '../middleware/upload';
import { PDFConverter } from '../services/pdfConverter';

const router: any = express.Router();
const pdfConverter = new PDFConverter();

router.post('/', uploadMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file provided',
        message: 'Please upload a PDF file'
      });
    }

    const { buffer, originalname } = req.file;
    
    // Convert PDF to CSV and XLSX
    const result = await pdfConverter.convertPDF(buffer, originalname);
    
    // For this implementation, we'll return the files directly
    // In production, you might want to upload to cloud storage and return URLs
    
    const response = {
      success: true,
      message: 'PDF converted successfully',
      filename: result.filename,
      formats: {
        csv: true,
        xlsx: true
      }
    };
    
    // Store the conversion result temporarily in memory
    // In production, use Redis or a proper cache
    const conversionId = Date.now().toString();
    (global as any).conversions = (global as any).conversions || {};
    (global as any).conversions[conversionId] = result;
    
    // Clean up after 10 minutes
    setTimeout(() => {
      delete (global as any).conversions[conversionId];
    }, 10 * 60 * 1000);
    
    res.json({
      ...response,
      conversionId,
      downloadUrls: {
        csv: `/api/convert/download/${conversionId}/csv`,
        xlsx: `/api/convert/download/${conversionId}/xlsx`
      }
    });
    
  } catch (error) {
    console.error('PDF conversion error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('No transactions found')) {
        return res.status(400).json({
          error: 'Invalid PDF content',
          message: error.message
        });
      }
      
      return res.status(500).json({
        error: 'Conversion failed',
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred during conversion'
    });
  }
});

// Download endpoint for converted files
router.get('/download/:conversionId/:format', (req: express.Request, res: express.Response) => {
  try {
    const { conversionId, format } = req.params;
    
    if (!['csv', 'xlsx'].includes(format)) {
      return res.status(400).json({
        error: 'Invalid format',
        message: 'Format must be csv or xlsx'
      });
    }
    
    const conversions = (global as any).conversions || {};
    const result = conversions[conversionId];
    
    if (!result) {
      return res.status(404).json({
        error: 'File not found',
        message: 'The requested file has expired or does not exist'
      });
    }
    
    const fileBuffer = result[format as keyof typeof result] as Buffer;
    const filename = result.filename;
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
    } else {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
    }
    
    res.send(fileBuffer);
    
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      error: 'Download failed',
      message: 'An error occurred while downloading the file'
    });
  }
});

export default router;