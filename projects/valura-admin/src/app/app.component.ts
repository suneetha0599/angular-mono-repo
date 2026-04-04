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
  title = 'valura-admin';


  constructor(private sharedService: ValuraLibService) {
    this.sharedService.setProjectName("ADMIN");
    console.log(sharedService.projectName)
  }
}
