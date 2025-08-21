import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import styles from './UploadArea.module.scss';

interface ConversionResult {
  success: boolean;
  message: string;
  filename: string;
  conversionId: string;
  downloadUrls: {
    csv: string;
    xlsx: string;
  };
}

interface UploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
  result: ConversionResult | null;
}

const UploadArea: React.FC = () => {
  const [uploadState, setUploadState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
    result: null,
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    
    if (!file) return;

    // Client-side validation
    if (file.type !== 'application/pdf') {
      setUploadState(prev => ({
        ...prev,
        error: 'Please upload a PDF file only.',
        result: null,
      }));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadState(prev => ({
        ...prev,
        error: 'File size must be less than 10MB.',
        result: null,
      }));
      return;
    }

    // Reset state
    setUploadState({
      uploading: true,
      progress: 0,
      error: null,
      result: null,
    });

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await axios.post<ConversionResult>('/api/convert', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total 
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setUploadState(prev => ({ ...prev, progress }));
        },
      });

      setUploadState({
        uploading: false,
        progress: 100,
        error: null,
        result: response.data,
      });
    } catch (error: any) {
      let errorMessage = 'An unexpected error occurred during conversion.';
      
      if (error.response) {
        errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setUploadState({
        uploading: false,
        progress: 0,
        error: errorMessage,
        result: null,
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    disabled: uploadState.uploading,
  });

  const handleDownload = async (format: 'csv' | 'xlsx') => {
    if (!uploadState.result) return;

    try {
      const response = await axios.get(uploadState.result.downloadUrls[format], {
        responseType: 'blob',
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${uploadState.result.filename}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      setUploadState(prev => ({
        ...prev,
        error: 'Download failed. Please try again.',
      }));
    }
  };

  const resetUpload = () => {
    setUploadState({
      uploading: false,
      progress: 0,
      error: null,
      result: null,
    });
  };

  return (
    <div className={styles.uploadArea}>
      {!uploadState.result && (
        <div
          {...getRootProps()}
          className={`${styles.dropzone} ${
            isDragActive ? styles.dragActive : ''
          } ${uploadState.uploading ? styles.uploading : ''}`}
        >
          <input {...getInputProps()} />
          
          <div className={styles.dropzoneContent}>
            <div className={styles.icon}>📄</div>
            
            {uploadState.uploading ? (
              <div className={styles.uploadingState}>
                <h3>Converting PDF...</h3>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${uploadState.progress}%` }}
                  />
                </div>
                <p>{uploadState.progress}% complete</p>
              </div>
            ) : isDragActive ? (
              <div className={styles.dragActiveState}>
                <h3>Drop PDF file here</h3>
                <p>Release to upload and convert</p>
              </div>
            ) : (
              <div className={styles.defaultState}>
                <h3>Upload PDF Bank Statement</h3>
                <p>Drag and drop your PDF file here, or click to browse</p>
                <p className={styles.fileInfo}>
                  Supports PDF files up to 10MB
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {uploadState.error && (
        <div className={styles.error}>
          <div className={styles.errorIcon}>⚠️</div>
          <div className={styles.errorContent}>
            <h4>Conversion Failed</h4>
            <p>{uploadState.error}</p>
            <button 
              onClick={resetUpload}
              className={styles.tryAgainButton}
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {uploadState.result && (
        <div className={styles.success}>
          <div className={styles.successIcon}>✅</div>
          <div className={styles.successContent}>
            <h3>Conversion Successful!</h3>
            <p>Your PDF has been converted and is ready for download.</p>
            <p className={styles.filename}>File: {uploadState.result.filename}</p>
            
            <div className={styles.downloadButtons}>
              <button
                onClick={() => handleDownload('csv')}
                className={`${styles.downloadButton} ${styles.csvButton}`}
              >
                📊 Download CSV
              </button>
              <button
                onClick={() => handleDownload('xlsx')}
                className={`${styles.downloadButton} ${styles.xlsxButton}`}
              >
                📈 Download XLSX
              </button>
            </div>
            
            <button
              onClick={resetUpload}
              className={styles.newUploadButton}
            >
              Convert Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadArea;