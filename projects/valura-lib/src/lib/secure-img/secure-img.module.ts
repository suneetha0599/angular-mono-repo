import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SecureImgPipe } from '../../core/pipes/secure-img/secure-img.pipe';
import { SecureImgDirective } from '../../directives/secure-img/secure-img.directive';



@NgModule({
  declarations: [],
  providers: [SecureImgPipe],
  imports: [
    CommonModule,
    SecureImgPipe,
    SecureImgDirective
  ],
  exports: [
    SecureImgPipe,
    SecureImgDirective
  ]
})
export class SecureImgModule { }
