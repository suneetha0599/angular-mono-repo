import { Component, Input, Output, EventEmitter, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { Risk, OverallRiskSummary, RiskLevel, RiskCategory, RiskTableRow } from '../models/risk-summary-model';
import { SnackbarService } from '@valura-lib/service/snackbar/snackbar.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-risk-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatChipsModule,
  ],
  templateUrl: './risk-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RiskTableComponent {
  @Input() risks: Risk[] = [];
  @Input() overallSummary!: OverallRiskSummary;
  @Output() riskDeleted = new EventEmitter<Risk>();
  @Output() riskEdited = new EventEmitter<Risk>();

  private snackbarService = inject(SnackbarService);
  protected readonly isDeleting = signal<string | null>(null);
  protected readonly isEditing = signal<string | null>(null);

  protected readonly groupedRisks = computed(() => {
    const grouped = this.risks.reduce((acc: Record<string, Risk[]>, risk: Risk) => {
      const categoryKey = this.getCategoryDisplayKey(risk.category);
      if (!acc[categoryKey]) {
        acc[categoryKey] = [];
      }
      acc[categoryKey].push(risk);
      return acc;
    }, {});

    return grouped;
  });

  protected readonly tableDataSource = computed((): RiskTableRow[] => {
    const grouped = this.groupedRisks();
    const processingRisks = grouped['Processing Risk'] || [];
    const transferRisks = grouped['Transfer Risk'] || [];
    const aiRisks = grouped['AI Risk'] || [];

    const maxRows = Math.max(
      processingRisks.length,
      transferRisks.length,
      aiRisks.length,
      1
    );

    const tableRows: RiskTableRow[] = [];
    for (let i = 0; i < maxRows; i++) {
      tableRows.push({
        rowIndex: i,
        processingRisk: processingRisks[i] || undefined,
        transferRisk: transferRisks[i] || undefined,
        aiRisk: aiRisks[i] || undefined
      });
    }

    return tableRows;
  });

  protected readonly categoryStats = computed(() => {
    const grouped = this.groupedRisks();
    return {
      processingCount: grouped['Processing Risk']?.length || 0,
      transferCount: grouped['Transfer Risk']?.length || 0,
      aiCount: grouped['AI Risk']?.length || 0
    };
  });

  protected readonly displayedColumns: string[] = ['processingRisk', 'transferRisk', 'aiRisk'];

  private getCategoryDisplayKey(category: RiskCategory): string {
    switch (category) {
      case RiskCategory.PROCESSING_RISK:
        return 'Processing Risk';
      case RiskCategory.TRANSFER_RISK:
        return 'Transfer Risk';
      case RiskCategory.AI_RISK:
        return 'AI Risk';
      default:
        return 'Processing Risk';
    }
  }

  protected getRiskLevelColorClass(riskLevel: RiskLevel): string {
    const colorMap: Record<RiskLevel, string> = {
      [RiskLevel.HIGH]: 'bg-red-100 text-red-800 border border-red-200',
      [RiskLevel.MEDIUM]: 'bg-amber-100 text-amber-800 border border-amber-200',
      [RiskLevel.LOW]: 'bg-emerald-100 text-emerald-800 border border-emerald-200'
    };

    return colorMap[riskLevel] || 'bg-gray-100 text-gray-600 border border-gray-200';
  }

  protected getCategoryIcon(category: string): string {
    const iconMap: Record<string, string> = {
      'Processing Risk': 'settings',
      'Transfer Risk': 'swap_horiz',
      'AI Risk': 'smart_toy'
    };

    return iconMap[category] || 'category';
  }

  protected truncateText(text: string, maxLength: number = 80): string {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  }

  protected formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  protected async onEditRisk(risk: Risk): Promise<void> {
    if (!risk) {
      return;
    }

    this.isEditing.set(risk.id);

    try {
      this.riskEdited.emit(risk);
      this.snackbarService.openSnack('Risk editing initiated', 'OK', 2000);
    } catch (error) {
      this.snackbarService.openSnack('Failed to initiate risk editing', 'OK', 3000);
    } finally {
      setTimeout(() => this.isEditing.set(null), 300);
    }
  }

  protected async onDeleteRisk(risk: Risk): Promise<void> {
    if (!risk || !confirm('Are you sure you want to delete this risk? This action cannot be undone.')) {
      this.snackbarService.openSnack('Risk deletion cancelled', 'OK', 2000);
      return;
    }

    this.isDeleting.set(risk.id);

    try {
      this.riskDeleted.emit(risk);
      this.snackbarService.openSnack('Risk deleted successfully', 'OK', 3000);
    } catch (error) {
      this.snackbarService.openSnack('Failed to delete risk. Please try again.', 'OK', 4000);
    } finally {
      setTimeout(() => this.isDeleting.set(null), 300);
    }
  }

  protected trackByRowIndex(index: number, item: RiskTableRow): number {
    return item.rowIndex;
  }

  protected hasAnyRisks(): boolean {
    return this.risks.length > 0;
  }

  protected getImpactSeverityClass(impact: string): string {
    const impactLower = impact.toLowerCase();
    if (impactLower.includes('high') || impactLower.includes('severe') || impactLower.includes('critical')) {
      return 'text-red-600 font-semibold';
    } else if (impactLower.includes('medium') || impactLower.includes('moderate')) {
      return 'text-amber-600 font-semibold';
    } else if (impactLower.includes('low') || impactLower.includes('minor')) {
      return 'text-emerald-600 font-semibold';
    }
    return 'text-gray-600 font-medium';
  }
}
