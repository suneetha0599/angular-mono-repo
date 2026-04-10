import { Component, Inject, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { CdkAccordionModule } from '@angular/cdk/accordion';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { LoadingButtonComponent } from '@valura-lib/components/loading-button/loading-button.component';
import * as XLSX from 'xlsx';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface DataSubject {
  name: string;
  data: any[];
  dataSource: MatTableDataSource<any>;
  expanded: boolean;
}

@Component({
  selector: 'app-data-inventory-dialog',
  standalone: true,
  imports: [
    CommonModule, CdkAccordionModule, MatTableModule, MatIconModule, MatButtonModule, MatCheckboxModule, FormsModule,
    MatProgressSpinnerModule, LoadingButtonComponent, MatDialogModule
  ],
  templateUrl: './data-inventory-dialog.component.html',
  styleUrl: './data-inventory-dialog.component.scss'
})
export class DataInventoryDialogComponent {
  fileName: string | null = null;
  dataSubjects: DataSubject[] = [];
  isAcknowledged: boolean = false;
  validationError: string | null = null;
  isLoading: boolean = false;

  private requiredColumns = [
    'Personal Data Element', 'Data Category', 'Classification of data',
    'Purpose Of processing', 'Asset'
  ];

  displayedColumns: string[] = this.requiredColumns;

  private apiHelper = inject(ApiHelperService);

  constructor(
    public dialogRef: MatDialogRef<DataInventoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  getValue(row: any, key: string): string {
    const keyToFind = key.toLowerCase().replace(/\s/g, '');
    const foundKey = Object.keys(row).find(k => k.toLowerCase().replace(/\s/g, '') === keyToFind);
    let value = foundKey ? String(row[foundKey]) : '-';

    if (value.includes('/')) {
      value = value.split('/').map(s => s.trim()).join(', ');
    }

    return value;
  }

  formatMultiValue(value: string | null | undefined): string {
    if (!value || value === '-') return '-'
    const res = value.split(',').map(v => v.trim()).filter(v => v.length > 0)
    if (res.length <= 1) return res[0];
    return ` ${res[0]}+ ${res.length - 1}`;
  }

  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    if (element.files && element.files.length > 0) {
      this.processFile(element.files[0]);
    }
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.processFile(event.dataTransfer.files[0]);
    }
  }

  getFirstValue(value: string | null | undefined): string {
    if (!value || value === '-') return '-';

    return value.split(',')[0].trim();
  }

  getExtraCount(value: string | null | undefined): number {
    if (!value || value === '-') return 0;

    const parts = value
      .split(',')
      .map(v => v.trim())
      .filter(v => v.length > 0);

    return parts.length > 1 ? parts.length - 1 : 0;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  private processFile(file: File): void {
    this.fileName = file.name;
    this.validationError = null;
    this.dataSubjects = [];

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });

      const firstSheetName = wb.SheetNames[0];
      const firstSheet = wb.Sheets[firstSheetName];
      const headers = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })[1] as string[];

      const missingColumns = this.validateHeaders(headers);
      if (missingColumns.length > 0) {
        this.validationError = `The uploaded Excel is missing required columns: ${missingColumns.join(', ')}. Please use the correct template.`;
        return;
      }

      this.dataSubjects = wb.SheetNames.map((sheetName: string) => {
        const ws: XLSX.WorkSheet = wb.Sheets[sheetName];
        let range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
        range.s.r = 1;
        const data = XLSX.utils.sheet_to_json(ws, { range: range });
        return {
          name: sheetName, data: data,
          dataSource: new MatTableDataSource(data), expanded: false
        };
      });
    };
    reader.readAsBinaryString(file);
  }

  private validateHeaders(headers: string[]): string[] {
    if (!headers) return this.requiredColumns;
    const headerSet = new Set(headers.map(h => h.trim()));
    return this.requiredColumns.filter(col => !headerSet.has(col));
  }

  toggleDataSubject(subject: DataSubject): void {
    subject.expanded = !subject.expanded;
  }

  async prepareAndUpload(): Promise<void> {
    if (!this.isAcknowledged || this.validationError) return;
    this.isLoading = true;

    const allRows = this.dataSubjects.flatMap(ds => ds.data);
    const pdElementSet = new Map<string, { name: string; pdCategoryName: string[]; classification: string[]; }>();
    const purposeSet = new Set<string>();

    allRows.forEach(row => {

      const pdName = this.getValue(row, 'Personal Data Element');
      if (pdName && pdName !== '-') {
        pdElementSet.set(pdName, {
          name: pdName,
          pdCategoryName: this.getValue(row, 'Data Category').split(',').map((c: string) => c.trim()),
          classification: this.getValue(row, 'Classification of data').split(',').map((c: string) => c.trim())
        });
      }

      const purpose = this.getValue(row, 'Purpose Of processing');
      if (purpose && purpose !== '-') purposeSet.add(purpose);

    });

    const dsPayload = { dataSubjects: this.dataSubjects.map(ds => ds.name) };

    const pdPayload = { pdElementList: Array.from(pdElementSet.values()) };

    try {
      const dsResponse = await this.apiHelper.importDataSubjects(dsPayload);
      const dsMap = new Map(
        dsResponse.dataSubjects.map((ds: { name: string; id: any; }) => [ds.name.toLowerCase(), ds.id])
      );

      const pdResponse = await this.apiHelper.importPdElements(pdPayload);
      const pdList = pdResponse.pdElements;

      const finalInventory: any[] = [];

      for (const sheet of this.dataSubjects) {
        const dsId = dsMap.get(sheet.name.toLowerCase());
        if (!dsId) continue;

        for (const row of sheet.data) {
          const pdName = this.getValue(row, 'Personal Data Element');
          const pdCategory = this.getValue(row, 'Data Category');
          const purpose = this.getValue(row, 'Purpose Of processing');

          if (!pdName || pdName === '-') continue;

          const pdId = this.findPdId(pdName, pdCategory, pdList);
          if (!pdId) continue;

          const internalAssets = this.getValue(row, 'Asset');

          if (internalAssets && internalAssets !== '-') {
            internalAssets
              .split(',')
              .map(a => a.replace(/\s+/g, ' ').trim())
              .filter(a => a.length > 0)
              .forEach(asset => {
                finalInventory.push({
                  dsId,
                  pdId,
                  assetName: asset,
                  assetType: "INTERNAL",
                  purpose
                });
              });

          }
        }
      }

      const finalPayload = { dataInventories: finalInventory };
      await this.apiHelper.pdInventory(finalPayload);


      this.closeDialog({ success: true });
    } catch (error) {
      console.error("Bulk import failed:", error);
    } finally {
      this.isLoading = false;
    }
  }

  closeDialog(data: any = null): void {
    this.dialogRef.close(data);
  }


  private findPdId(
    name: string,
    category: string,
    pdList: any[]
  ): number | null {
    return (
      (pdList ?? []).find(
        x =>
          x.name.trim().toLowerCase() === name.trim().toLowerCase() &&
          x.pdCategoryName.trim().toLowerCase() === category.trim().toLowerCase()
      )?.id || null
    );
  }

}

