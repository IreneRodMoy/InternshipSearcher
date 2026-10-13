import { useRef, useState, type DragEvent } from 'react';
import { api } from '../api';
import { formatDate } from '../lib/format';
import type { CvSummary } from '../types';
import { Flower } from './Doodles';
import { Modal } from './Modal';

interface CvModalProps {
  cv: CvSummary | null;
  onChange: (cv: CvSummary | null) => void;
  onClose: () => void;
}

export function CvModal({ cv, onChange, onClose }: CvModalProps) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      onChange((await api.uploadCv(file)).cv);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm('Delete your CV from InternshipSearcher? Match scores will disappear.')) return;
    await api.deleteCv();
    onChange(null);
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    void upload(event.dataTransfer.files[0]);
  };

  return (
    <Modal title="Your CV" onClose={onClose}>
      <div
        className={`dropzone${dragging ? ' is-dragging' : ''}`}
        onClick={() => input.current?.click()}
        onDragOver={(event) => (event.preventDefault(), setDragging(true))}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <Flower size={44} />
        <strong>{busy ? 'Reading your CV…' : cv ? 'Drop a new version to replace it' : 'Drop your CV here or click to browse'}</strong>
        <span>PDF, DOCX or TXT · up to 5 MB</span>
        <input
          ref={input}
          type="file"
          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          hidden
          onChange={(event) => void upload(event.target.files?.[0])}
        />
      </div>
      {error && <p className="form-error">{error}</p>}

      {cv && (
        <div className="cv-summary">
          <div className="cv-summary__file">
            <div>
              <strong>{cv.fileName}</strong>
              <span>
                Uploaded {formatDate(cv.uploadedAt)} · {cv.words} words
              </span>
            </div>
            <a className="button button--ghost" href="/api/profile/cv/file" target="_blank" rel="noreferrer">
              View
            </a>
            <button className="button button--ghost" onClick={remove}>
              Delete
            </button>
          </div>
          <h3>Skills I picked up</h3>
          <div className="tags">
            {cv.skills.length ? cv.skills.map((skill) => <span key={skill} className="tag">{skill}</span>) : <span className="muted">No known skills detected yet.</span>}
          </div>
        </div>
      )}

      <p className="fineprint privacy">
        Your CV is stored only in this site's private database, behind your password. It is never sent to any third-party service, and the match scores are computed on your own server.
      </p>
    </Modal>
  );
}
