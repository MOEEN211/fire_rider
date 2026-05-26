import { CSSProperties, ReactNode } from 'react';
import { useDraggable } from '@dnd-kit/core';

type DraggablePersonProps = {
  personId: string;
  disabled?: boolean;
  children: ReactNode;
};

export default function DraggablePerson({ personId, disabled = false, children }: DraggablePersonProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `person:${personId}`,
    disabled,
  });

  const style: CSSProperties = {
    opacity: isDragging ? 0.3 : 1,
    cursor: disabled ? 'default' : 'grab',
    touchAction: 'none',
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="min-h-[28px]">
      {children}
    </div>
  );
}
