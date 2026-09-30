// Multi-select as checkbox "chips". Works uncontrolled (server forms, defaultChecked)
// or controlled (client forms: pass `selected` + `onToggle`).

export interface ChipOption {
  id: string;
  label: string;
}

export default function ChipGroup({
  name,
  options,
  selected = [],
  onToggle,
}: {
  name: string;
  options: ChipOption[];
  selected?: string[];
  onToggle?: (id: string) => void;
}) {
  return (
    <div className="chips">
      {options.map((o) => (
        <label key={o.id} className="chip">
          <input
            type="checkbox"
            name={name}
            value={o.id}
            {...(onToggle
              ? { checked: selected.includes(o.id), onChange: () => onToggle(o.id) }
              : { defaultChecked: selected.includes(o.id) })}
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}
