import { AfterViewInit, Directive, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import { SecureImgPipe } from '../../core/pipes/secure-img/secure-img.pipe';
import { ApiHelperService } from '../../core/services/network/api-helper.service';

@Directive({
  selector: '[secureImg]'
})
export class SecureImgDirective implements OnChanges {

  //TODO : refactor file and function names after implementing proper versioning - Wilson Pinto

  @Input() defaultImg = '/assets/images/placeholder.png'
  @Input() src: string = ''
  @Input() isLocal: boolean = false
  @Input() awsImage: boolean = false

  constructor(
    private imageRef: ElementRef,
    private secureImagePipe: SecureImgPipe,
    private apiHelperService: ApiHelperService
  ) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.getSecureImg()
  }

  async getSecureImg() {

    this.setImage()

    if (!this.src) {
      return
    }

    // If local then do not send request
    if (this.isLocal) {
      this.setImage(this.src)
      return
    }

    if (this.awsImage) {
      try {

        const params = { fileKey: this.src }
        const imageUrl = await this.apiHelperService.getPresignedUrl(params);
        this.setImage(imageUrl?.presignedUrl)
      } catch (error) {
        console.error('Error fetching pre-signed URL:', error);
      }
    }
    // else {
    //   const res = await this.secureImagePipe.transform(this.src)
    //     .toPromise()
    //     .then(res => res)
    //     .catch(e => null)

    //   this.setImage(res)
    // }
  }

  setImage(src: string = '') {
    this.imageRef.nativeElement.src = src ? src : this.defaultImg;
    this.imageRef.nativeElement.onerror = () => {
      this.imageRef.nativeElement.src = this.defaultImg
    };
  }

}
