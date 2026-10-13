import mammoth from 'mammoth';
import { extractText, getDocumentProxy } from 'unpdf';

export const CV_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
};

export async function extractCvText(buffer: Buffer, mimeType: string): Promise<string> {
  switch (CV_TYPES[mimeType]) {
    case 'pdf': {
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const { text } = await extractText(pdf, { mergePages: true });
      return text;
    }
    case 'docx':
      return (await mammoth.extractRawText({ buffer })).value;
    case 'txt':
      return buffer.toString('utf8');
    default:
      throw new Error('Unsupported file type. Upload a PDF, DOCX or TXT file.');
  }
}
