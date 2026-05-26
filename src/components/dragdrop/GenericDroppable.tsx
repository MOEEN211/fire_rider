import { useDroppable } from '@dnd-kit/core';
import { ReactNode } from 'react';

type DroppableProps = {
  id: string;
  children: ReactNode;
  className?: string;
};

export default function GenericDroppable({ id, children, className }: DroppableProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver ? 'bg-white/20' : ''}`}
    >
      {children}
    </div>
  );
}
