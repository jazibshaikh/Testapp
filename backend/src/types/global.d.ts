declare module 'pdf-parse' {
  function pdfParse(buffer: Buffer, options?: any): Promise<{
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    text: string;
    version: string;
  }>;
  export = pdfParse;
}

declare namespace Express {
  export interface Request {
    file?: Multer.File;
  }
}

declare namespace Multer {
  export interface File {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination?: string;
    filename?: string;
    path?: string;
    buffer: Buffer;
  }
}

declare namespace NodeJS {
  interface ProcessEnv {
    PORT?: string;
    NODE_ENV?: string;
  }
}

declare const global: NodeJS.Global & {
  conversions?: any;
};