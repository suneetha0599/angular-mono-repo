import {
  Component,
  ViewChild,
  Input,
  OnChanges,
  SimpleChanges,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import {
  MatPaginator,
  MatPaginatorModule,
  PageEvent
} from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { ApiHelperService } from '@admin-core/services/network/assessment/api-helper.service';
import { ItemNotFoundComponent } from '@valura-lib/components//item-not-found/item-not-found.component';
@Component({
  selector: 'app-related-information',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatMenuModule,
    LoadingButtonComponent,
    ItemNotFoundComponent
  ],
  templateUrl: './related-information.component.html',
  styleUrls: ['./related-information.component.scss']
})
export class RelatedInformationComponent implements OnChanges {

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @Input() assessmentId!: number;

  private apiHelperService = inject(ApiHelperService);

  assessmentDataSource = new MatTableDataSource<any>([]);
  VendorDataSource = new MatTableDataSource<any>([]);
  assetDataSource = new MatTableDataSource<any>([]);

  expandedSection: string | null = 'assessment';

  requestLoading = false;
  hasApiError = false;

  triggeredCount = 0;
  vendorCount = 0;
  assetCount = 0;

  assessmentColumns: string[] = ['id', 'name', 'status', 'actions'];
  vendorColumns: string[] = ['vendorId', 'vendor', 'asset', 'bpa', 'poc'];
  assetColumns: string[] = ['assetId', 'name', 'vendor', 'bpa'];

  shimmerDataSource = Array(5).fill({});

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['assessmentId']?.currentValue) {
      this.getRelatedInformation(this.assessmentId);
    }
  }

  async getRelatedInformation(assessmentId: number) {
    this.requestLoading = true;
    this.hasApiError = false;

    try {
      const res = await this.apiHelperService.getAssessmentRelatedInfo(assessmentId);
      if (res.success === false) {
        this.hasApiError = true;
        return;
      }

      const relatedAssessments = res.relatedAssessments ?? [];

      this.assessmentDataSource.data = relatedAssessments.map((item: any) => ({
        id: item.assessmentId,
        name: item.assessmentTitle,
        status: item.status
      }));

      const relatedAssets = res.relatedAssets ?? [];
      const relatedVendors = res.relatedVendors ?? [];

      this.assetDataSource.data = relatedAssets.map((item: any) => ({
        assetId: item.assetId,
        name: item.assetName,
        vendor: item.vendorName,
        bpa: item.bpaName && item.bpaName.trim() !== '' ? item.bpaName : '-'
      }));

      this.VendorDataSource.data = relatedVendors.map((item: any) => ({
        vendorId: item.vendorId,
        vendor: item.vendorName,
        asset: item.assetName || '-',
        bpa: item.bpaName && item.bpaName.trim() !== '' ? item.bpaName : '-',
        poc: item.poc || '-'
      }));

      this.triggeredCount = relatedAssessments.length;
      this.assetCount = relatedAssets.length;
      this.vendorCount = relatedVendors.length;

    } catch (error) {
      this.hasApiError = true;
    } finally {
      this.requestLoading = false;
    }
  }

  expandedSections: string[] = [];

  toggleSection(section: string) {
    const index = this.expandedSections.indexOf(section);
    if (index > -1) {
      this.expandedSections.splice(index, 1);
    } else {
      this.expandedSections.push(section);
    }
  }

  isExpanded(section: string): boolean {
    return this.expandedSections.includes(section);
  }

  getStatusStyle(status: string) {
    return {
      'background-color':
        status === 'NOT_STARTED' ? '#E5F2FA' : '#E6F4EA',
      color:
        status === 'NOT_STARTED' ? '#2563EB' : '#000000'
    };
  }

  getStatus(status: string): string {
    return status
      ?.toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  onPageChange(event: PageEvent) { }
}