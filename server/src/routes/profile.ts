import { Router } from 'express';
import multer from 'multer';
import { deleteCv, getCv, saveCv } from '../db/profile.js';
import { broadcast } from '../events.js';
import { CV_TYPES, extractCvText } from '../matching/cv.js';
import { candidateProfile } from '../matching/profile.js';
import { rescoreAll } from '../pipeline/ingest.js';

export const profileRouter = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } });

function summary() {
  const cv = getCv();
  const profile = candidateProfile();
  if (!cv || !profile) return { cv: null };
  return {
    cv: {
      fileName: cv.fileName,
      uploadedAt: cv.uploadedAt,
      skills: [...profile.skills],
      words: cv.text.split(/\s+/).filter(Boolean).length,
    },
  };
}

profileRouter.get('/', (_req, res) => {
  res.json(summary());
});

profileRouter.post('/cv', upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file received' });
  if (!CV_TYPES[file.mimetype]) return res.status(400).json({ error: 'Upload a PDF, DOCX or TXT file' });
  try {
    const text = await extractCvText(file.buffer, file.mimetype);
    if (text.trim().length < 50) return res.status(422).json({ error: "Couldn't read any text from that file" });
    saveCv({ fileName: file.originalname, fileType: file.mimetype, fileData: file.buffer, text, uploadedAt: Date.now() });
    rescoreAll();
    broadcast('refresh', { reason: 'cv' });
    res.json(summary());
  } catch (error) {
    res.status(422).json({ error: (error as Error).message });
  }
});

profileRouter.get('/cv/file', (_req, res) => {
  const cv = getCv();
  if (!cv) return res.status(404).json({ error: 'No CV uploaded' });
  res.setHeader('content-type', cv.fileType);
  res.setHeader('content-disposition', `inline; filename="${encodeURIComponent(cv.fileName)}"`);
  res.send(cv.fileData);
});

profileRouter.delete('/cv', (_req, res) => {
  deleteCv();
  broadcast('refresh', { reason: 'cv' });
  res.json({ cv: null });
});
