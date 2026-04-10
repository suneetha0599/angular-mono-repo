import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { LoadingButtonComponent } from '../loading-button/loading-button.component';

@Component({
  selector: 'app-export-drawer',
  imports: [MatIconModule, MatButtonModule, MatRadioModule, MatCheckboxModule, LoadingButtonComponent],
  templateUrl: './export-drawer.component.html',
   styleUrl: './export-drawer.component.scss'
})
export class ExportDrawerComponent {

  @Input() columns: { key: string; label: string; selected: boolean }[] = [];
  @Output() onDownload = new EventEmitter<{ type: 'NORMAL' | 'CUSTOM'; columns: string[] }>();
  @Output() onClose = new EventEmitter<void>();

  downloadType: 'NORMAL' | 'CUSTOM' = 'NORMAL';

  onDownloadTypeChange(type: 'NORMAL' | 'CUSTOM') {
    this.downloadType = type;
  }

  onColumnToggle(column: any, checked: boolean) {
    column.selected = checked;
  }

  applyDownload() {
    if (this.downloadType === 'NORMAL') {
      this.onDownload.emit({ type: 'NORMAL', columns: [] });
    } else {
      const selectedColumns = this.columns
        .filter(c => c.selected)
        .map(c => c.key);
      this.onDownload.emit({ type: 'CUSTOM', columns: selectedColumns });
    }
    this.reset();
  }

  close() {
    this.reset();
    this.onClose.emit();
  }

  private reset() {
    this.downloadType = 'NORMAL';
    this.columns.forEach(c => c.selected = true);
  }
}
