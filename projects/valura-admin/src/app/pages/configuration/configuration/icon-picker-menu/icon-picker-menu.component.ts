import { Component, EventEmitter, Output, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { ApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';

const MATERIAL_SYMBOL_FONT_SETTINGS = "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24";

export const ICON_MAPPING: { [key: string]: string } = {
  'Description': 'description',
  'document': 'edit_document',
  'profile': 'lab_profile',
  'note': 'edit_note',
  'square': 'edit_square',
  'Contract': 'contract_edit',
  'person': 'person_edit',
  'auto': 'auto_delete',
  'scan': 'scan_delete',
  'contract delete': 'contract_delete',
  'delete sweep': 'delete_sweep',
  'cloud download': 'cloud_download',
  'no account': 'no_accounts',
  'back hand': 'back_hand',
  'auto pause': 'autopause',
  'person raised hand': 'person_raised_hand',
  'Remove moderator': 'remove_moderator',
  'do not disturb on': 'do_not_disturb_on',
  'Docs': 'docs'
};
interface IconData {
  id: number;
  name: string;
  icon: string;
  materialIcon?: string;
}
@Component({
  selector: 'app-icon-picker-menu',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule, LoadingButtonComponent
  ],
  templateUrl: './icon-picker-menu.component.html',
  styleUrl: './icon-picker-menu.component.scss'
})
export class IconPickerMenuComponent {
  @Input() selectedIcons: string[] = [];
  @Output() iconSelected = new EventEmitter<string[]>();
  @Output() iconWithNameSelected = new EventEmitter<{ icon: string; name: string }>();
  @Output() closeMenu = new EventEmitter<void>();
  searchTerm = '';
  tempSelectedIcons: string[] = [];
  tempSelectedIconName: string = '';
  icons: IconData[] = [];
  isLoading = false;
  shimmerItems = Array(18).fill(0);
  readonly fontSettings = MATERIAL_SYMBOL_FONT_SETTINGS;
  private apiHelperService = inject(ApiHelperService);
  async ngOnInit(): Promise<void> {
    this.tempSelectedIcons = [...this.selectedIcons];
    await this.loadIcons();
  }
  async loadIcons(): Promise<void> {
    this.isLoading = true;
    try {
      const response = await this.apiHelperService.getIcons();
      if (response?.icons) {
        this.icons = response.icons.map((icon: any) => ({
          id: icon.id,
          name: icon.name,
          icon: icon.icon,
          materialIcon: ICON_MAPPING[icon.icon] || icon.icon
        }));
      }
    } catch (error) {
      console.error('Error loading icons:', error);
    } finally {
      this.isLoading = false;
    }
  }
  get filteredIcons(): IconData[] {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) return this.icons;
    return this.icons.filter(icon =>
      icon.name.toLowerCase().includes(term) ||
      icon.materialIcon?.toLowerCase().includes(term)
    );
  }
  get hasResults(): boolean {
    return this.filteredIcons.length > 0;
  }
  onIconSelect(icon: IconData): void {
    this.tempSelectedIcons = [icon.icon];
    this.tempSelectedIconName = icon.name;
  }
  onConfirm(): void {
    if (this.tempSelectedIcons.length > 0) {
      this.iconSelected.emit([...this.tempSelectedIcons]);
      this.iconWithNameSelected.emit({
        icon: this.tempSelectedIcons[0],
        name: this.tempSelectedIconName
      });
      this.closeMenu.emit();
    }
  }
  onCancel(): void {
    this.closeMenu.emit();
  }
  onClearSearch(): void {
    this.searchTerm = '';
  }
  isIconSelected(materialIcon: string): boolean {
    return this.tempSelectedIcons.includes(materialIcon);
  }
  get hasSelection(): boolean {
    return this.tempSelectedIcons.length > 0;
  }
  get selectionCount(): number {
    return this.tempSelectedIcons.length;
  }
  getMaterialIcon(friendlyName: string): string {
    return ICON_MAPPING[friendlyName] || friendlyName;
  }
}
