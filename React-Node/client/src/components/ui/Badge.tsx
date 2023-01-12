import type { ArticleStatus } from '../../types';
import { getStatusColor, getStatusLabel } from '../../lib/utils';

interface BadgeProps {
  status: ArticleStatus;
}

export default function Badge({ status }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}
