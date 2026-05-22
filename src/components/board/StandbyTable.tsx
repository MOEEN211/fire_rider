type StandbyTableProps = {
  rows?: number;
};

export default function StandbyTable({ rows = 12 }: StandbyTableProps) {
  return (
    <section className="border-2 border-ink">
      <div className="grid grid-cols-[42px_1fr] border-b-2 border-ink text-center text-[10px] font-black leading-5">
        <div className="border-r border-ink"> </div>
        <div>Standby</div>
      </div>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="grid min-h-6 grid-cols-[42px_1fr] border-b border-ink text-[10px] font-black leading-5 last:border-b-0">
          <div className="border-r border-ink px-1 text-center">{index + 1}</div>
          <div className="px-1"> </div>
        </div>
      ))}
    </section>
  );
}
