export interface ApiError {
  error: string;
  message: string;
}

export interface ConversionResponse {
  success: boolean;
  message: string;
  filename: string;
  conversionId: string;
  formats: {
    csv: boolean;
    xlsx: boolean;
  };
  downloadUrls: {
    csv: string;
    xlsx: string;
  };
}