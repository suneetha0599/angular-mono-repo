import { Injectable } from '@angular/core';
import { SecureImgPipe } from '../../pipes/secure-img/secure-img.pipe';
import { DomSanitizer } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class SecureImgService {
  //TODO : refactor file and function names after implementing proper versioning - Wilson Pinto

  constructor(private secureImagePipe: SecureImgPipe, private _sanitizer: DomSanitizer) { }

  async getSecureMediaUrl(url: string) {
    return await this.secureImagePipe.transform(url)
      .toPromise()
      .then(res => res)
      .catch(e => null)
  }

  async getDomSanitizedMediaUrl(url: string) {
    const response: any = await this.getSecureMediaUrl(url)
    return response ? this._sanitizer.bypassSecurityTrustUrl(response) : null
  }

}
