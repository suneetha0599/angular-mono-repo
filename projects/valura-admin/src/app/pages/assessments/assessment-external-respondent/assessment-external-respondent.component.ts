import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, Output, SimpleChanges } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AssessmentService } from '@admin-core/services/assessment/assessment.service';
import { ErrorLoadingItemsComponent } from '@valura-lib/components//error-loading-items/error-loading-items.component';

@Component({
  selector: 'assessment-external-respondent',
  imports: [NgTemplateOutlet, ErrorLoadingItemsComponent],
  templateUrl: './assessment-external-respondent.component.html',
  styleUrl: './assessment-external-respondent.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush

})
export class AssessmentExternalRespondentComponent {

  @Input() assessmentLink: string = '';
  @Output() onPostExternalLink = new EventEmitter<any>()


  externalLink!: SafeResourceUrl;
  isLoading: boolean = true;
  hasError: boolean = false;
  private assessmentService = inject(AssessmentService);

  constructor(private sanitizer: DomSanitizer) { }

  ngOnInit(): void { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['assessmentLink'] && this.assessmentLink) {
      this.getAssessmentExternalLink();
    }
  }

  async getAssessmentExternalLink() {
    this.hasError = false;
    this.isLoading = true;
    try {
      const url = this.assessmentLink;
      if (url) {
        const externalUrl = await this.assessmentService.navigateToQuestionnare(url, false);
        if (externalUrl) {
          this.externalLink = this.sanitizer.bypassSecurityTrustResourceUrl(externalUrl) as SafeResourceUrl;
          this.onPostExternalLink.emit({ loaded: true });
          return
        }
      }
      this.hasError = true;
    }
    catch (e) {
      this.hasError = true;
      console.error(e)
    }
    finally {
      this.isLoading = false;
    }
  }
}
