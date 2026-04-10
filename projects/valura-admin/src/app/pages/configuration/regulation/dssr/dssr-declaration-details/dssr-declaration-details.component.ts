import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ApiHelperService } from '@admin-core/services/network/configuration/api-helper.service';
import { LoadingButtonComponent } from '@valura-lib/components//loading-button/loading-button.component';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { DeclarationService } from '@admin-core/services/declaration/declaration.service';
import { Declaration } from '@admin-core/models/configuration/regulation';
import { CustomMatTextareaComponent } from '@valura-lib/components//custom-mat-text-input/custom-mat-textarea.component';

@Component({
  selector: 'app-dssr-declaration-details',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    LoadingButtonComponent,
    CustomMatTextareaComponent
  ],
  templateUrl: './dssr-declaration-details.component.html',
  styleUrls: ['./dssr-declaration-details.component.scss']
})
export class DssrDeclarationDetailsComponent implements OnInit {
  isLoading: boolean = true;
  declarationId!: number;
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private apiHelperService = inject(ApiHelperService);
  private snackbarService = inject(SnackbarService);
  private declarationService = inject(DeclarationService);

  declaration: Declaration | null = null;

  constructor() { }

  ngOnInit(): void {
    this.declarationId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadDeclarationDetails();
  }

  async loadDeclarationDetails(): Promise<void> {
    this.isLoading = true;
    try {
      // Try to get from local DB first
      let declaration = await this.declarationService.getDeclarationById(this.declarationId);

      // If not in DB, fetch from API
      if (!declaration) {
        const response = await this.apiHelperService.getDeclarationById(this.declarationId);
        declaration = response?.generalDeclaration || response;

        // Save to local DB
        if (declaration) {
          await this.declarationService.addDeclaration(declaration);
        }
      }

      if (declaration) {
        this.declaration = declaration;
      }
    } catch (error) {
      console.error('Error loading declaration details:', error);
      this.snackbarService.openSnack('Failed to load declaration details');
    } finally {
      this.isLoading = false;
    }
  }

  goBack(): void {
    const entityId = this.declaration?.entityId || 0;
    this.router.navigate(['/admin/configuration/regulation/details', entityId], {
      queryParams: { tab: 'dssr', subTab: 'declaration' }
    });
  }

  getTypeLabel(): string {
    if (!this.declaration?.type) return '';
    return this.declaration.type.includes('REGULATION')
      ? 'Regulation Specific'
      : 'Right Specific';
  }

  getEntityTypeLabel(): string {
    if (!this.declaration?.entityType) return '';
    return this.declaration.entityType === 'REGULATION'
      ? 'Regulation'
      : 'Right';
  }
}
