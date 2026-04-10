import { Component } from '@angular/core';

@Component({
  selector: 'app-not-found',
  imports: [],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss'
})
export class NotFoundComponent {

  imgHeight = '300px'
  mainHeading: string = "This page doesn't exist.";
  heading: string = "Check the URL or go back to the homepage";
}
