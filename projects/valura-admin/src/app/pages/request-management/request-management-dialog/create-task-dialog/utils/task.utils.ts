import { FormGroup } from '@angular/forms';
import moment from 'moment';

export class TaskUtils {
  static formatDate(date: Date | null): string {
    if (!date) return '';
    return moment(date).format('YYYY-MM-DDTHH:mm:ss');
  }

  static markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        TaskUtils.markFormGroupTouched(control);
      }
    });
  }

  static generateUniqueId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  static truncateFileName(fileName: string, maxLength: number = 30): string {
    if (fileName.length <= maxLength) return fileName;

    const extension = fileName.split('.').pop();
    const nameWithoutExtension = fileName.substring(0, fileName.lastIndexOf('.'));
    const truncatedName = nameWithoutExtension.substring(0, maxLength - extension!.length - 4);

    return `${truncatedName}...${extension}`;
  }

  static getFileIcon(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'pdf':
        return 'picture_as_pdf';
      case 'doc':
      case 'docx':
        return 'description';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return 'image';
      default:
        return 'insert_drive_file';
    }
  }

static parseDate(dateString: string | Date | null): Date | null {
  if (!dateString) return null;

  if (dateString instanceof Date) {
    return dateString;
  }

  if (typeof dateString === 'string') {
    if (dateString.trim() === '') return null;

    const isoDate = new Date(dateString);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }

    const momentDate = moment(dateString);
    if (momentDate.isValid()) {
      return momentDate.toDate();
    }

    const dateOnly = dateString.split('T')[0];
    const dateOnlyParsed = new Date(dateOnly + 'T00:00:00');
    if (!isNaN(dateOnlyParsed.getTime())) {
      return dateOnlyParsed;
    }
  }

  return null;
}
}
