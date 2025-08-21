import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import UploadArea from '../UploadArea';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock react-dropzone
const mockGetRootProps = jest.fn(() => ({
  'data-testid': 'dropzone',
}));
const mockGetInputProps = jest.fn(() => ({
  'data-testid': 'file-input',
}));

jest.mock('react-dropzone', () => ({
  useDropzone: jest.fn(() => ({
    getRootProps: mockGetRootProps,
    getInputProps: mockGetInputProps,
    isDragActive: false,
  })),
}));

describe('UploadArea', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the upload area with correct initial state', () => {
    render(<UploadArea />);

    expect(screen.getByText('Upload PDF Bank Statement')).toBeInTheDocument();
    expect(screen.getByText('Drag and drop your PDF file here, or click to browse')).toBeInTheDocument();
    expect(screen.getByText('Supports PDF files up to 10MB')).toBeInTheDocument();
  });

  it('shows drag active state when dragging files', () => {
    const { useDropzone } = require('react-dropzone');
    useDropzone.mockReturnValue({
      getRootProps: mockGetRootProps,
      getInputProps: mockGetInputProps,
      isDragActive: true,
    });

    render(<UploadArea />);

    expect(screen.getByText('Drop PDF file here')).toBeInTheDocument();
    expect(screen.getByText('Release to upload and convert')).toBeInTheDocument();
  });

  it('displays error message for non-PDF files', async () => {
    const mockOnDrop = jest.fn();
    const { useDropzone } = require('react-dropzone');
    
    // Mock the onDrop callback to be accessible
    let onDropCallback: (files: File[]) => void;
    useDropzone.mockImplementation((options: any) => {
      onDropCallback = options.onDrop;
      return {
        getRootProps: mockGetRootProps,
        getInputProps: mockGetInputProps,
        isDragActive: false,
      };
    });

    render(<UploadArea />);

    // Simulate dropping a non-PDF file
    const nonPdfFile = new File(['content'], 'test.txt', { type: 'text/plain' });
    onDropCallback!([nonPdfFile]);

    await waitFor(() => {
      expect(screen.getByText('Conversion Failed')).toBeInTheDocument();
      expect(screen.getByText('Please upload a PDF file only.')).toBeInTheDocument();
    });
  });

  it('displays error message for oversized files', async () => {
    const { useDropzone } = require('react-dropzone');
    
    let onDropCallback: (files: File[]) => void;
    useDropzone.mockImplementation((options: any) => {
      onDropCallback = options.onDrop;
      return {
        getRootProps: mockGetRootProps,
        getInputProps: mockGetInputProps,
        isDragActive: false,
      };
    });

    render(<UploadArea />);

    // Simulate dropping an oversized file
    const oversizedFile = new File(['content'], 'large.pdf', { 
      type: 'application/pdf' 
    });
    Object.defineProperty(oversizedFile, 'size', {
      value: 11 * 1024 * 1024, // 11MB
    });
    
    onDropCallback!([oversizedFile]);

    await waitFor(() => {
      expect(screen.getByText('Conversion Failed')).toBeInTheDocument();
      expect(screen.getByText('File size must be less than 10MB.')).toBeInTheDocument();
    });
  });

  it('handles successful file upload and conversion', async () => {
    const mockResponse = {
      data: {
        success: true,
        message: 'PDF converted successfully',
        filename: 'statement_2024-01-01',
        conversionId: 'test-id',
        downloadUrls: {
          csv: '/api/convert/download/test-id/csv',
          xlsx: '/api/convert/download/test-id/xlsx',
        },
      },
    };

    mockedAxios.post.mockResolvedValue(mockResponse);

    const { useDropzone } = require('react-dropzone');
    
    let onDropCallback: (files: File[]) => void;
    useDropzone.mockImplementation((options: any) => {
      onDropCallback = options.onDrop;
      return {
        getRootProps: mockGetRootProps,
        getInputProps: mockGetInputProps,
        isDragActive: false,
      };
    });

    render(<UploadArea />);

    // Simulate dropping a valid PDF file
    const validPdf = new File(['pdf content'], 'statement.pdf', { 
      type: 'application/pdf' 
    });
    
    onDropCallback!([validPdf]);

    await waitFor(() => {
      expect(screen.getByText('Conversion Successful!')).toBeInTheDocument();
      expect(screen.getByText('File: statement_2024-01-01')).toBeInTheDocument();
      expect(screen.getByText('📊 Download CSV')).toBeInTheDocument();
      expect(screen.getByText('📈 Download XLSX')).toBeInTheDocument();
    });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      '/api/convert',
      expect.any(FormData),
      expect.objectContaining({
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: expect.any(Function),
      })
    );
  });

  it('handles API error responses', async () => {
    const mockError = {
      response: {
        data: {
          error: 'Conversion failed',
          message: 'Invalid PDF format',
        },
      },
    };

    mockedAxios.post.mockRejectedValue(mockError);

    const { useDropzone } = require('react-dropzone');
    
    let onDropCallback: (files: File[]) => void;
    useDropzone.mockImplementation((options: any) => {
      onDropCallback = options.onDrop;
      return {
        getRootProps: mockGetRootProps,
        getInputProps: mockGetInputProps,
        isDragActive: false,
      };
    });

    render(<UploadArea />);

    const validPdf = new File(['pdf content'], 'statement.pdf', { 
      type: 'application/pdf' 
    });
    
    onDropCallback!([validPdf]);

    await waitFor(() => {
      expect(screen.getByText('Conversion Failed')).toBeInTheDocument();
      expect(screen.getByText('Invalid PDF format')).toBeInTheDocument();
    });
  });

  it('handles file download functionality', async () => {
    // Setup successful conversion first
    const mockResponse = {
      data: {
        success: true,
        message: 'PDF converted successfully',
        filename: 'statement_2024-01-01',
        conversionId: 'test-id',
        downloadUrls: {
          csv: '/api/convert/download/test-id/csv',
          xlsx: '/api/convert/download/test-id/xlsx',
        },
      },
    };

    mockedAxios.post.mockResolvedValue(mockResponse);
    mockedAxios.get.mockResolvedValue({
      data: new Blob(['csv,content'], { type: 'text/csv' }),
    });

    const { useDropzone } = require('react-dropzone');
    
    let onDropCallback: (files: File[]) => void;
    useDropzone.mockImplementation((options: any) => {
      onDropCallback = options.onDrop;
      return {
        getRootProps: mockGetRootProps,
        getInputProps: mockGetInputProps,
        isDragActive: false,
      };
    });

    render(<UploadArea />);

    // Simulate file upload
    const validPdf = new File(['pdf content'], 'statement.pdf', { 
      type: 'application/pdf' 
    });
    
    onDropCallback!([validPdf]);

    await waitFor(() => {
      expect(screen.getByText('📊 Download CSV')).toBeInTheDocument();
    });

    // Mock DOM methods for download
    const mockLink = {
      href: '',
      download: '',
      click: jest.fn(),
    };
    document.createElement = jest.fn().mockReturnValue(mockLink);
    document.body.appendChild = jest.fn();
    document.body.removeChild = jest.fn();

    // Click download CSV button
    fireEvent.click(screen.getByText('📊 Download CSV'));

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/convert/download/test-id/csv',
        { responseType: 'blob' }
      );
    });
  });

  it('allows resetting the upload state', async () => {
    const { useDropzone } = require('react-dropzone');
    
    let onDropCallback: (files: File[]) => void;
    useDropzone.mockImplementation((options: any) => {
      onDropCallback = options.onDrop;
      return {
        getRootProps: mockGetRootProps,
        getInputProps: mockGetInputProps,
        isDragActive: false,
      };
    });

    render(<UploadArea />);

    // Simulate an error state
    const nonPdfFile = new File(['content'], 'test.txt', { type: 'text/plain' });
    onDropCallback!([nonPdfFile]);

    await waitFor(() => {
      expect(screen.getByText('Conversion Failed')).toBeInTheDocument();
    });

    // Click try again button
    fireEvent.click(screen.getByText('Try Again'));

    expect(screen.getByText('Upload PDF Bank Statement')).toBeInTheDocument();
    expect(screen.queryByText('Conversion Failed')).not.toBeInTheDocument();
  });
});