import { FormGroup } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import { TriggerLabel } from './trigger-drawer.models';

export function filterLabels(availableLabels: TriggerLabel[], query: string): TriggerLabel[] {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return [...availableLabels];
  return availableLabels.filter(label => label.name.toLowerCase().includes(q));
}

export function addTypedLabelToForm(
  form: FormGroup,
  availableLabels: TriggerLabel[],
  event: MatChipInputEvent
): { updatedLabels: TriggerLabel[], searchTerm: string } {
  const value = (event.value || '').trim();
  if (!value) return { updatedLabels: availableLabels, searchTerm: '' };

  const control = form.get('labels');
  const current = control?.value || [];

  const exists = current.some((l: any) =>
    l.name.toLowerCase() === value.toLowerCase()
  );

  let updatedLabels = availableLabels;

  if (!exists) {
    const newLabel: TriggerLabel = { id: 0, name: value, isDeleted: false };
    control?.setValue([...current, newLabel]);
    updatedLabels = [...availableLabels, newLabel];
  }

  if (event.input) {
    event.input.value = '';
  }

  return { updatedLabels, searchTerm: '' };
}

export function removeLabelAt(form: FormGroup, index: number): void {
  const control = form.get('labels');
  const current = control?.value || [];
  current.splice(index, 1);
  control?.setValue([...current]);
}

export function toggleLabelSelection(form: FormGroup, labelObj: TriggerLabel): void {
  if (!labelObj) return;

  const control = form.get('labels');
  const current = control?.value || [];

  const exists = current.some((l: any) =>
    (l.id && l.id === labelObj.id) ||
    l.name.toLowerCase() === labelObj.name.toLowerCase()
  );

  if (!exists) {
    control?.setValue([...current, labelObj]);
  }
}

export function isLabelSelected(form: FormGroup, label: TriggerLabel): boolean {
  const selected = form.get('labels')?.value || [];
  return selected.some((l: any) =>
    (l.id && l.id === label.id) ||
    (l.name && label.name && l.name.toLowerCase() === label.name.toLowerCase())
  );
}

export function getLabelDisplayName(availableLabels: TriggerLabel[], labelObj: any): string {
  if (typeof labelObj === 'number') {
    return availableLabels.find(l => l.id === labelObj)?.name || '';
  }
  return labelObj?.name || '';
}
