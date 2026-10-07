import {
  FileText, Handshake, UserCheck, PackageCheck, Truck,
  CheckCircle2, ClipboardCheck,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { formatTime, formatDateShort } from '../utils/formatDate';

const TIMELINE_STEPS = [
  { key: 'POSTED', label: 'Donation Posted', icon: FileText },
  { key: 'MATCHED', label: 'Matched', icon: Handshake },
  { key: 'ASSIGNED', label: 'Volunteer Assigned', icon: UserCheck },
  { key: 'PICKED_UP', label: 'Food Picked Up', icon: PackageCheck },
  { key: 'IN_TRANSIT', label: 'In Transit', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle2 },
  { key: 'CONFIRMED', label: 'Delivery Confirmed', icon: ClipboardCheck },
];

const STATUS_ORDER = ['POSTED', 'MATCHED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CONFIRMED'];

export default function DeliveryTimeline({ currentStatus, timestamps = {}, className }) {
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);

  return (
    <div className={cn('delivery-timeline', className)}>
      {TIMELINE_STEPS.map((step, idx) => {
        const isDone = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isPending = idx > currentIdx;
        const Icon = step.icon;
        const ts = timestamps[step.key];

        return (
          <div
            key={step.key}
            className={cn(
              'delivery-timeline__item',
              isDone && 'delivery-timeline__item--done',
              isCurrent && 'delivery-timeline__item--current',
              isPending && 'delivery-timeline__item--pending'
            )}
          >
            <div className="delivery-timeline__marker-wrap">
              <div className="delivery-timeline__marker">
                <Icon size={16} />
              </div>
              {idx < TIMELINE_STEPS.length - 1 && (
                <div className={cn('delivery-timeline__line', isDone && 'delivery-timeline__line--done')} />
              )}
            </div>
            <div className="delivery-timeline__content">
              <span className="delivery-timeline__label">{step.label}</span>
              {ts && (
                <span className="delivery-timeline__time">{formatDateShort(ts)} · {formatTime(ts)}</span>
              )}
              {isCurrent && !ts && (
                <span className="delivery-timeline__time delivery-timeline__time--current">In progress</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
