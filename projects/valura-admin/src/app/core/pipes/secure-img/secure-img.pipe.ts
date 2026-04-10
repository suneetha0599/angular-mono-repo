import { Pipe, PipeTransform } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SafeUrl } from '@angular/platform-browser';
import { map, } from 'rxjs/operators';
import { Observable, } from 'rxjs';
import { ApiConfigService } from '@admin-core/services/api-config.service';


@Pipe({
  name: 'secureImgPipe'
})
export class SecureImgPipe implements PipeTransform {

  constructor(private http: HttpClient, private apiConfigService: ApiConfigService) { }

  transform(url: any): Observable<SafeUrl> {

    let fullUrl = ''

    if (url.includes('http')) {
      fullUrl = url
    } else {
      fullUrl = this.apiConfigService + url;
    }

    return this.http
      .get(fullUrl, {
        responseType: 'blob',
      })
      .pipe(
        map(val => URL.createObjectURL(val)),
      )
  }

}
