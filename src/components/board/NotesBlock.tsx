import { useState } from 'react';
import { X } from 'lucide-react';
import type { CalendarEvent } from '../../types/board';

type NotesBlockProps = {
  events: CalendarEvent[];
  onAddEvent: (time: string, title: string) => void;
  onDeleteEvent?: (eventId: string) => void;
};

export default function NotesBlock({ events, onAddEvent, onDeleteEvent }: NotesBlockProps) {
  const [time, setTime] = useState('');
  const [title, setTitle] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onAddEvent(time.trim(), title.trim());
    setTime('');
    setTitle('');
  }

  function handleDelete(eventId: string) {
    if (onDeleteEvent) {
      onDeleteEvent(eventId);
    }
  }

  return (
    <section className="border-2 border-ink border-l-0 h-full flex flex-col">
      <div className="border-b-2 border-ink px-1 text-[10px] font-black leading-5">Notes:</div>
      <div className="flex-1 min-h-[200px] space-y-1 p-2 text-[11px] font-semibold leading-4">
        {events.map((event) => (
          <div key={event.id} className="flex items-center justify-between gap-2 group">
            <div className="flex-1">
              <span className="font-black">{event.time}</span> {event.title}
            </div>
            {onDeleteEvent && (
              <button
                onClick={() => handleDelete(event.id)}
                className="p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                title="Delete note"
              >
                <X size={14} className="text-red-600" />
              </button>
            )}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="border-t-2 border-ink p-2">
        <div className="flex gap-1">
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-[72px] border-2 border-ink bg-board px-1 text-[10px] font-semibold text-ink focus:outline-none"
          />
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add note..."
            className="flex-1 border-2 border-ink bg-board px-1 text-[10px] font-semibold text-ink placeholder:text-ink/50 focus:outline-none"
          />
          <button
            type="submit"
            className="border-2 border-ink bg-ink px-2 text-[10px] font-black uppercase text-board hover:bg-ink/90"
          >
            Add
          </button>
        </div>
      </form>
    </section>
  );
}
