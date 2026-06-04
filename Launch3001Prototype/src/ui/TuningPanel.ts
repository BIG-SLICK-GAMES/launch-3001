export type TuningValues = {
  gravityMultiplier: number;
  steeringMultiplier: number;
  thrustMultiplier: number;
};

type SliderConfig = {
  id: string;
  label: string;
  min: number;
  max: number;
  value: number;
};

const sliders: SliderConfig[] = [
  { id: 'gravity', label: 'Gravity', min: 25, max: 200, value: 100 },
  { id: 'steering', label: 'Steering', min: 1, max: 100, value: 5 },
  { id: 'boost', label: 'Boost', min: 25, max: 200, value: 100 }
];

export class TuningPanel {
  private readonly inputs = new Map<string, HTMLInputElement>();
  private readonly outputs = new Map<string, HTMLOutputElement>();

  constructor(root: HTMLElement | null) {
    if (!root) {
      return;
    }

    root.innerHTML = '';

    for (const slider of sliders) {
      const row = document.createElement('label');
      row.className = 'tuning-row';
      row.htmlFor = `tuning-${slider.id}`;

      const label = document.createElement('span');
      label.textContent = slider.label;

      const output = document.createElement('output');
      output.value = `${slider.value}%`;

      const input = document.createElement('input');
      input.id = `tuning-${slider.id}`;
      input.type = 'range';
      input.min = String(slider.min);
      input.max = String(slider.max);
      input.value = String(slider.value);
      input.addEventListener('input', () => {
        output.value = `${input.value}%`;
      });

      row.append(label, output, input);
      root.append(row);
      this.inputs.set(slider.id, input);
      this.outputs.set(slider.id, output);
    }
  }

  getValues(): TuningValues {
    return {
      gravityMultiplier: this.readMultiplier('gravity'),
      steeringMultiplier: this.readMultiplier('steering'),
      thrustMultiplier: this.readMultiplier('boost')
    };
  }

  reset(): void {
    for (const slider of sliders) {
      const input = this.inputs.get(slider.id);
      const output = this.outputs.get(slider.id);

      if (input) {
        input.value = String(slider.value);
      }

      if (output) {
        output.value = `${slider.value}%`;
      }
    }
  }

  private readMultiplier(id: string): number {
    const value = Number(this.inputs.get(id)?.value ?? 100);
    return value / 100;
  }
}
