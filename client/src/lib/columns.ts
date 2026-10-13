import type { Status } from '../types';

export interface ColumnConfig {
  status: Status;
  title: string;
  hint: string;
  accent: string;
  icon: 'heart' | 'letter' | 'cloud' | 'star' | 'ghost';
}

export const BOARD_COLUMNS: ColumnConfig[] = [
  { status: 'will_apply', title: 'Will apply', hint: 'Saved for later', accent: 'var(--pink-400)', icon: 'heart' },
  { status: 'applied', title: 'Applied', hint: 'Fingers crossed', accent: 'var(--navy-500)', icon: 'letter' },
  { status: 'rejected', title: 'Rejected', hint: 'Their loss', accent: 'var(--rose-300)', icon: 'cloud' },
  { status: 'accepted', title: 'Accepted', hint: 'You did it!', accent: 'var(--butter-400)', icon: 'star' },
  { status: 'ghosted', title: 'Ghosted', hint: 'No news after a while', accent: 'var(--lavender-400)', icon: 'ghost' },
];

export const STATUS_LABELS: Record<Status, string> = {
  new: 'Fresh finds',
  will_apply: 'Will apply',
  applied: 'Applied',
  rejected: 'Rejected',
  accepted: 'Accepted',
  ghosted: 'Ghosted',
  hidden: 'Not interested',
};
