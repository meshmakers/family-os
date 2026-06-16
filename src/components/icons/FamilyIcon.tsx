export default function FamilyIcon() {
  return (
    <svg viewBox="0 0 52 36" fill="white" xmlns="http://www.w3.org/2000/svg">
      {/* Left adult */}
      <circle cx="7.5" cy="6" r="5"/>
      <ellipse cx="7.5" cy="21" rx="5" ry="8.5"/>

      {/* Left boy (shorter, smaller head) */}
      <circle cx="19" cy="12" r="3.8"/>
      <ellipse cx="19" cy="25" rx="3.8" ry="6.5"/>

      {/* Right boy */}
      <circle cx="31" cy="12" r="3.8"/>
      <ellipse cx="31" cy="25" rx="3.8" ry="6.5"/>

      {/* Right adult */}
      <circle cx="44.5" cy="6" r="5"/>
      <ellipse cx="44.5" cy="21" rx="5" ry="8.5"/>
    </svg>
  );
}
