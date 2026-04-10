import { Component, DoCheck, inject } from '@angular/core';
import { LoadingBarService } from '@admin-coreservices/network/loading-bar.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'progress-bar',
  imports: [MatProgressBarModule],
  templateUrl: './progress-bar.component.html',
  styleUrl: './progress-bar.component.scss'
})
export class ProgressBarComponent implements DoCheck {

  showProgressBar = false; // to hide when dialog is open and there is a api request in progress
  showProgress = false; // To show api progress
  private loadingBarService = inject(LoadingBarService);

  constructor() { }


  ngOnInit(): void {
    this.loadingBarService.progressEmitter.subscribe((val: boolean) => this.showProgress = val);
  }

  ngDoCheck() {
    this.showProgressBar = !(document.getElementsByClassName('mat-mdc-dialog-component-host').length > 0);
  }

}
