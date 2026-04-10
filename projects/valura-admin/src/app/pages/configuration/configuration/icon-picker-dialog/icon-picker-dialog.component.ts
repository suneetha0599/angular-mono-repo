import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

const MATERIAL_SYMBOL_FONT_SETTINGS = "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24";
const ICON_CATEGORIES: IconCategory[] = [
  {
    name: 'Common',
    icons: [
      'home', 'search', 'settings', 'person', 'favorite', 'delete', 'info',
      'alarm', 'dashboard', 'logout', 'menu', 'close', 'check', 'add', 'remove'
    ]
  },
  {
    name: 'Actions',
    icons: [
      'edit', 'save', 'print', 'share', 'download', 'upload', 'refresh',
      'visibility', 'visibility_off', 'lock', 'lock_open', 'bookmark', 'star'
    ]
  },
  {
    name: 'Communication',
    icons: [
      'mail', 'call', 'chat', 'message', 'notifications', 'campaign',
      'forum', 'contact_mail', 'contact_phone', 'send', 'inbox'
    ]
  },
  {
    name: 'Content',
    icons: [
      'article', 'description', 'folder', 'file_copy', 'attachment',
      'link', 'image', 'videocam', 'audio_file', 'picture_as_pdf'
    ]
  },
  {
    name: 'Privacy & Security',
    icons: [
      'security', 'verified_user', 'privacy_tip', 'policy', 'gpp_good',
      'shield', 'admin_panel_settings', 'manage_accounts', 'key', 'fingerprint'
    ]
  },
  {
    name: 'Status',
    icons: [
      'check_circle', 'cancel', 'error', 'warning', 'help', 'pending',
      'schedule', 'update', 'published_with_changes', 'sync'
    ]
  }
];

interface IconCategory {
  name: string;
  icons: string[];
}

@Component({
  selector: 'app-icon-picker-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './icon-picker-dialog.component.html',
  styleUrl: './icon-picker-dialog.component.scss'
})
export class IconPickerDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<IconPickerDialogComponent>);

  searchTerm = '';
  selectedIcon: string | null = null;

  readonly fontSettings = MATERIAL_SYMBOL_FONT_SETTINGS;
  readonly iconCategories = ICON_CATEGORIES;

  get filteredCategories(): IconCategory[] {
    const term = this.searchTerm.toLowerCase().trim();

    if (!term) return this.iconCategories;

    return this.iconCategories
      .map(category => ({
        name: category.name,
        icons: category.icons.filter(icon => icon.includes(term))
      }))
      .filter(category => category.icons.length > 0);
  }


  get hasResults(): boolean {
    return this.filteredCategories.some(cat => cat.icons.length > 0);
  }

  onIconSelect(icon: string): void {
    this.selectedIcon = icon;
  }

  onConfirm(): void {
    if (this.selectedIcon) {
      this.dialogRef.close(this.selectedIcon);
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onClearSearch(): void {
    this.searchTerm = '';
  }

  isIconSelected(icon: string): boolean {
    return this.selectedIcon === icon;
  }
}
