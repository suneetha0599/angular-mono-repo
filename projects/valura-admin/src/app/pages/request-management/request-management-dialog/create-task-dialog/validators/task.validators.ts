import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class TaskValidators {
  static getFieldErrorMessage(fieldName: string, errors: ValidationErrors): string {
    const fieldLabels: Record<string, string> = {
      title: 'Task name',
      description: 'Description',
      dueDate: 'Due date',
      priority: 'Priority',
      assignTo: 'Assignee',
      assigneeId: 'Assignee'
    };

    const fieldLabel = fieldLabels[fieldName] || fieldName;

    if (errors['required']) return `${fieldLabel} is required`;
    if (errors['minlength']) {
      return `${fieldLabel} must be at least ${errors['minlength'].requiredLength} characters`;
    }
    if (errors['maxlength']) {
      return `${fieldLabel} cannot exceed ${errors['maxlength'].requiredLength} characters`;
    }

    return `${fieldLabel} is invalid`;
  }

  static taskTitle(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const title = control.value.trim();
      if (title.length < 3) {
        return { minlength: { requiredLength: 3, actualLength: title.length } };
      }
      if (title.length > 100) {
        return { maxlength: { requiredLength: 100, actualLength: title.length } };
      }

      return null;
    };
  }

  static taskDescription(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const description = control.value.trim();
      if (description.length > 500) {
        return { maxlength: { requiredLength: 500, actualLength: description.length } };
      }

      return null;
    };
  }

  static futureDateOnly(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const selectedDate = new Date(control.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        return { pastDate: { selectedDate: selectedDate.toDateString() } };
      }

      return null;
    };
  }
}
