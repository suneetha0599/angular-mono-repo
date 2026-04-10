import { Component, inject } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DownloadConfigService } from '@admin-core/services/download/download-config.service';
import { LoadingButtonComponent } from '../loading-button/loading-button.component';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-download-layout',
  imports: [MatProgressBarModule, LoadingButtonComponent, MatIconModule],
  templateUrl: './download-layout.component.html',
  styleUrl: './download-layout.component.scss'
})
export class DownloadLayoutComponent {

  progressValue: number = 0;
  downloadText: string = "Configuration is downloading..."
  retryLoading: boolean = false;
  showRetryButton: boolean = false;
  private requestSubjectSubscription!: Subscription;
  private retryLoadingSubscription!: Subscription;

  private downloadConfigService = inject(DownloadConfigService);

  constructor() {
    this.requestSubjectSubscription = this.downloadConfigService.requestSubject$.subscribe(res => {
      if (res) {
        this.calculateProgress(res)
      }
    });
    this.retryLoadingSubscription = this.downloadConfigService.retryLoading$.subscribe(res => {
      if (res) {
        this.retryLoading = true;
        return
      }
      this.retryLoading = false;
    });
  }

  get showProgress() {
    return this.downloadConfigService.showProgressBar
  }

  ngOnInit(): void {
    this.clearData();
    this.onInitPage();
  }

  ngOnDestroy(): void {
    this.requestSubjectSubscription?.unsubscribe();
    this.retryLoadingSubscription?.unsubscribe();
  }

  async onInitPage() {
    this.downloadConfigService.startDownload()
  }

  calculateProgress(res: any) {
    const totalCount = res.totalCount;
    const downloadIsCompleted = res.downloadIsCompleted;
    const successRequestCount = res.totalSuccesRequestCount;
    const allAreSuccess = this.downloadConfigService.totalRequestCount == successRequestCount;
    const percentage = Math.floor((successRequestCount / totalCount) * 100);
    this.progressValue = percentage;
    if (downloadIsCompleted) {
      this.downloadText = allAreSuccess ? 'Download is completed' : `Configuration download is failed... ${this.progressValue}%`;
      this.showRetryButton = allAreSuccess ? false : true;
    }
    else {
      this.downloadText = `Configuration is downloading... ${this.progressValue}%`;
      if (this.showRetryButton) {
        this.showRetryButton = false
      }
    }
  }

  retryFailedRequest() {
    this.downloadConfigService.retryFailed();
  }

  clearData() {
    this.progressValue = 0;
    this.downloadText = '';
    this.downloadConfigService.resetDownloadCountData();
    this.showRetryButton = false
  }
}
