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
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0 : 1,
    cursor: disabled ? 'default' : 'grab',
    touchAction: 'none',
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="min-h-[28px]">
      {children}
    </div>
  );
}
