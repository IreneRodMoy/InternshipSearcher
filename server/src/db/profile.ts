import { db } from './index.js';

export interface StoredCv {
  fileName: string;
  fileType: string;
  fileData: Buffer;
  text: string;
  uploadedAt: number;
}

export function getCv(): StoredCv | undefined {
  const row = db()
    .prepare('SELECT file_name, file_type, file_data, text, uploaded_at FROM profile WHERE id = 1')
    .get() as { file_name: string; file_type: string; file_data: Buffer; text: string; uploaded_at: number } | undefined;
  return (
    row && {
      fileName: row.file_name,
      fileType: row.file_type,
      fileData: row.file_data,
      text: row.text,
      uploadedAt: row.uploaded_at,
    }
  );
}

export function saveCv(cv: StoredCv) {
  db()
    .prepare(
      `INSERT INTO profile (id, file_name, file_type, file_data, text, uploaded_at) VALUES (1, ?, ?, ?, ?, ?)
       ON CONFLICT (id) DO UPDATE SET file_name = excluded.file_name, file_type = excluded.file_type,
       file_data = excluded.file_data, text = excluded.text, uploaded_at = excluded.uploaded_at`,
    )
    .run(cv.fileName, cv.fileType, cv.fileData, cv.text, cv.uploadedAt);
}

export function deleteCv() {
  db().prepare('DELETE FROM profile WHERE id = 1').run();
  db().prepare('UPDATE jobs SET match = NULL').run();
}
