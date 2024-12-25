export default function Achievements({ badges }: { badges: string[] }) {
  return (
    <div className="mt-4">
      <h2 className="text-xl font-semibold">Achievements</h2>
      <ul className="list-disc ml-6 mt-2">
        {badges.map((badge, index) => (
          <li key={index} className="py-1">{badge}</li>
        ))}
      </ul>
    </div>
  );
}
