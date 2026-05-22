import { ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';

type DroppableDutyProps = {
  dutyId: string;
  children: ReactNode;
};

export default function DroppableDuty({ dutyId, children }: DroppableDutyProps) {
  const { isOver, setNodeRef } = useDroppable({ id: `duty:${dutyId}` });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-full px-2 py-1 text-[11px] font-bold uppercase leading-5 transition ${
        isOver ? 'bg-white/35 ring-2 ring-inset ring-ink' : ''
      }`}
    >
      {children}
    </div>
  );
}
