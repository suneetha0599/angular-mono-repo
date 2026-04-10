import { Component, OnInit, ViewChild, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiHelperService } from '@admin-core/services/network/api-helper.service';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { MatDialog } from '@angular/material/dialog';
import { DataInventoryDialogComponent } from '../data-inventory-dialog/data-inventory-dialog.component';
import { MatMenuModule } from '@angular/material/menu';
import { PopupDialogComponent } from '@valura-lib/components//popup-dialog/popup-dialog.component';
import { ApiHelperService as ConfigApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { CategoryService } from '@admin-core/services/category/category.service';
import { PdElementService } from '@admin-core/services/pdElement/pd-element.service';
import { GLOBAL_DIALOG_DEFAULTS } from '@admin-core/constants/constants';

interface Category {
  id: number;
  name: string;
  sensitivity: string;
}

interface DataElement {
  id: number;
  name: string;
  categoryName: string;
  sensitivity: string;
}

@Component({
  selector: 'app-category-details',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    LoadingButtonComponent,
    MatMenuModule
  ],
  templateUrl: './category-details.component.html',
  styleUrl: './category-details.component.scss'
})
export class CategoryDetailsComponent implements OnInit, AfterViewInit {
  currentPath: string = '';
  selectedTabIndex: number = 0;
  isLoading: boolean = true;
  private location = inject(Location);
  private dialog = inject(MatDialog);

  shimmerDataElements: any[] = Array.from({ length: 5 }, (_, i) => ({ shimmerIndex: i }));

  category: Category = {
    id: 0,
    name: '',
    sensitivity: ''
  };

  dataElementsColumns: string[] = ['name', 'categoryName', 'sensitivity', 'actions'];
  dataElementsDataSource: MatTableDataSource<DataElement>;
  private configApiHelperService = inject(ConfigApiHelperService);
  private pdElementService = inject(PdElementService);
  private pdCategoryService = inject(CategoryService);

  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private apiHelper: ApiHelperService
  ) {
    this.dataElementsDataSource = new MatTableDataSource<DataElement>([]);
  }

  ngOnInit(): void {
    this.onInitPage();
    this.loadCategoryDetails();
  }

  onInitPage(): void {
    this.currentPath = this.router.url.split('/').slice(0, -1).join('/');
  }

  async loadCategoryDetails(): Promise<void> {
    this.isLoading = true;
    try {
      const categoryId = +(this.route.snapshot.params['id']);
      const params = { categoryIds: [categoryId] };
      const elementsResponse = await this.pdElementService.getPdElementByCategoryId(categoryId);
      const categoryResponse = await this.configApiHelperService.getCategoryDetails(categoryId);
      // const elementsResponse = await this.configApiHelperService.getPDElements(params);

      if (categoryResponse) {
        this.category = {
          id: categoryId,
          name: categoryResponse?.pdCategory?.name || 'N/A',
          sensitivity: categoryResponse?.pdCategory?.sensitivity || 'N/A'
        };
      }

      if (elementsResponse) {


        const dataElements: DataElement[] = elementsResponse.map((element: any) => ({
          id: element.id || 0,
          name: element.name || 'Unknown',
          categoryName: element.categoryName || this.category.name || 'Unknown',
          sensitivity: element.sensitivity || 'Unknown'
        }));

        this.dataElementsDataSource.data = dataElements;
      } else {

        this.dataElementsDataSource.data = [];
      }

    } catch (error) {
      console.error(' Error loading category details:', error);
      this.dataElementsDataSource.data = [];
    } finally {
      this.isLoading = false;
    }
  }

  openAddPDElementDialog(): void {
    const categoryId = +(this.category.id);

    const dialogRef = this.dialog.open(DataInventoryDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      data: {
        dialogType: 'pdElement',
        categoryId: categoryId
      },
      disableClose: true,
      panelClass: 'dialog-wrapper'
    });


    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {

        this.loadCategoryDetails();
      }
    });
  }

  ngAfterViewInit(): void {
    this.dataElementsDataSource.sort = this.sort;
  }

  deletePDElement(row: DataElement): void {
    const dialogRef = this.dialog.open(PopupDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      data: {
        type: 'confirmation',
        title: 'Delete PD Element',
        content: 'Are you sure you want to delete this PD element?',
        confirmationDetail: row.name,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        showIcon: true,
        iconName: 'warning',
        iconColor: 'text-red-600'
      },
      panelClass: 'dialog-wrapper'
    });


    dialogRef.afterClosed().subscribe(async (confirmed: boolean) => {
      if (confirmed) {
        await this.performDeletePDElement(row.id);
      }
    });
  }

  async performDeletePDElement(id: number): Promise<void> {
    try {
      await this.configApiHelperService.deletePDElement(id);
      await this.pdElementService.deletPdElement(id)

      await this.loadCategoryDetails();
    } catch (error) {
      console.error('Error deleting PD element:', error);
    }
  }

  editPDElement(element: any): void {
    const categoryId = +(this.category.id);

    const dialogRef = this.dialog.open(DataInventoryDialogComponent, {
      ...GLOBAL_DIALOG_DEFAULTS,
      data: {
        dialogType: 'pdElement',
        editMode: true,
        itemData: element,
        categoryId: categoryId
      },
      disableClose: true,
      panelClass: 'dialog-wrapper'
    });


    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.loadCategoryDetails();
      }
    });
  }

  getSensitivityClass(sensitivity: string): string {
    const lowerSensitivity = sensitivity?.toLowerCase() || '';
    switch (lowerSensitivity) {
      case 'high':
        return 'high-sensitivity';
      case 'medium':
        return 'medium-sensitivity';
      case 'low':
        return 'low-sensitivity';
      default:
        return 'default-sensitivity';
    }
  }

  getSensitivityLabel(sensitivity: string): string {
    return sensitivity ? sensitivity.charAt(0).toUpperCase() + sensitivity.slice(1) : 'Not Set';
  }

  goBack(): void {
    this.location.back();
  }


}
