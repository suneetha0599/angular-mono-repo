import { Component, ViewChild, Input, OnChanges, SimpleChanges, OnInit, inject, signal } from '@angular/core';
import { RegulationBpaTableComponent } from '../../regulation-bpa-table/regulation-bpa-table.component';
import { ApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { LegalBasisService } from '@admin-core/services/legalBasis/legal-basis.service';

@Component({
  selector: 'app-bpa-legal-ground',
  imports: [RegulationBpaTableComponent],
  templateUrl: './bpa-legal-ground.component.html',
  styleUrl: './bpa-legal-ground.component.scss'
})
export class BpaLegalGroundComponent implements OnChanges, OnInit {
  @Input() searchQuery: string = '';
  @Input() actId!: number;
  @ViewChild(RegulationBpaTableComponent) tableComponent?: RegulationBpaTableComponent;
  private apiService = inject(ApiHelperService);
  private legalBasisService = inject(LegalBasisService);
  protected legalBasisData = signal<any[]>([]);
  private hasLoadedData = false;

  protected tableColumns = [
    { key: 'provision', label: 'Provision', sortable: true },
    { key: 'name', label: 'Legal Ground', sortable: true },
    { key: 'legalGround', label: 'Simplified Description', sortable: true }
  ];

  async ngOnInit() {
    if (this.actId && !this.hasLoadedData) {
      this.hasLoadedData = true;
      await this.loadLegalBasisData();
    }
  }

  public async loadLegalBasisData(forceLoad: boolean = false) {
    try {

      let legalBasisList = await this.legalBasisService.getLegalBasisByActId(this.actId);
      console.log('[Legal Basis] Retrieved records from IndexedDB:', legalBasisList?.length, 'records for actId:', this.actId);

      if (forceLoad) {
        const legalBasisResponse = await this.apiService.getLegalBasesByActId(this.actId);
        if (legalBasisResponse && legalBasisResponse.legalBasis && legalBasisResponse.legalBasis.length > 0) {
          legalBasisList = legalBasisResponse.legalBasis;

          await this.legalBasisService.replaceLegalBasisForActId(this.actId, legalBasisList);
        } else {
          await this.legalBasisService.replaceLegalBasisForActId(this.actId, []);
          legalBasisList = [];
        }
      }

      if (legalBasisList && legalBasisList.length > 0) {
        const mappedData = legalBasisList.map((item: any) => ({
          id: item.id,
          name: item.name || '',
          provision: item.provision || '',
          legalGround: item.description || '',
          simplifiedDescription: item.description || '',
          version: item.version
        }));
        this.legalBasisData.set(mappedData);
      } else {
        this.legalBasisData.set([]);
      }
    } catch (error) {
      console.error('Error loading legal ground master list:', error);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['searchQuery'] && this.tableComponent) {
      this.tableComponent.filterLegalGrounds(this.searchQuery);
    }
    if (changes['actId'] && !changes['actId'].firstChange && this.actId) {
      this.hasLoadedData = true;
      this.loadLegalBasisData();
    }
  }

  toggleSearch(isExpanded: boolean, searchText: string): void {
    if (this.tableComponent) {
      this.tableComponent.filterLegalGrounds(searchText);
    }
  }

  onSearchQueryChange(searchText: string): void {
    if (this.tableComponent) {
      this.tableComponent.filterLegalGrounds(searchText);
    }
  }

  async onDataChanged(): Promise<void> {
    await this.loadLegalBasisData(false);
  }
}
