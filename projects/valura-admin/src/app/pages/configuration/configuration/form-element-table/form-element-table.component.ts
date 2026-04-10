import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  SimpleChanges,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { EllipsisTooltipDirective } from '@valura-lib/directives/ellipsis-tooltip.directive';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { ItemNotFoundComponent } from '@valura-lib/components//item-not-found/item-not-found.component';
import { FormElementsConfig } from '../constants';

@Component({
  selector: 'app-form-element-table',
  imports: [
    MatTooltipModule,
    EllipsisTooltipDirective,
    MatIconModule,
    CommonModule,
    MatButtonModule,
    MatTableModule,
    ItemNotFoundComponent,
    MatSortModule,
  ],
  templateUrl: './form-element-table.component.html',
  styleUrl: './form-element-table.component.scss',
})
export class FormElementTableComponent {

  @Input() columns: any[] = [];
  @Input() dataSource = new MatTableDataSource<any>([]);
  @Input() loading: boolean = true;
  @Input() noDataMessage: string = 'No records found';
  @Input() tableHeading: string = 'Heading';
  @Input() isAdd: boolean = false;
  @Input() shimmerRows: number[] = [];
  @Input() AddHeading: string = '';
  @Input() key: string = '';
  @Input() dataUpdated: string = '';
  @Input() formElementFullAcess: boolean = false;


  @Output() edit = new EventEmitter<{ row: any, key: string }>();
  @Output() delete = new EventEmitter<{ row: any, key: string }>();
  @Output() sortChange = new EventEmitter<Sort>();
  @Output() onViewToggle = new EventEmitter<{ row: any, key: string }>();

  FormElementsConfig = FormElementsConfig;

  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dataUpdated'] && this.dataUpdated) {
      this.dataSource.data = [...this.dataSource.data];
    }
  }

  get displayedColumns() {
    return this.columns.map((c) => c.columnDef);
  }

  onSortChange(event: Sort) {
    this.sortChange.emit(event);
  }

  onEdit(row: any, key: any) {

    this.edit.emit({ row, key });
  }

  onDelete(row: any, key: any) {
    this.delete.emit({ row, key });
  }

  onToggleView(row: any, key: any) {
    row.displayInForm = !row.displayInForm
    this.onViewToggle.emit({ row, key });
  }

  getColumnWidth(col: any): string | null {
    return col?.width ?? null;
  }
}
