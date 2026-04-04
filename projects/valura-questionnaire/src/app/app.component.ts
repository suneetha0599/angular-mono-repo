import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ValuraLibService } from 'valura-lib';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'valura-questionnaire';

  constructor(private sharedService: ValuraLibService) {
    this.sharedService.setProjectName("QUESTINNARE");
    console.log(sharedService.projectName)
  }
}
