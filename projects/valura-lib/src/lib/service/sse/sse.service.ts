import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SseClient } from 'ngx-sse-client';
import { NGXLogger } from 'ngx-logger';
@Injectable({
  providedIn: 'root'
})
export class SseService {
  private logger =inject(NGXLogger)
  constructor(private sseClient: SseClient) { }

  // connectWithRetry(url: string, token: string = ''): Observable<MessageEvent> {
  //   return new Observable(observer => {
  //     let source: EventSource | null = null;

  //     const openConnection = () => {
  //       const fullUrl = `${url}?token=${token}`;
  //       source = new EventSource(fullUrl);

  //       source.onmessage = event => observer.next(event);

  //       source.onerror = () => {
  //         if (source) {
  //           source.close();
  //         }
  //         // setTimeout(() => openConnection(), 3000);
  //       };
  //     };

  //     openConnection();
  //     return () => {
  //       if (source) {
  //         source.close();
  //       }
  //     };
  //   });
  // }

  connect(url: string, token: string = ''): Observable<any> {
    const headers = {
      Authorization: `Bearer ${token}`
    };

    return new Observable(observer => {
      const stream$ = this.sseClient.stream(
        url,
        { responseType: 'event', reconnectionDelay: 30000 },
        { headers },
        'GET'
      );

      const sub = stream$.subscribe(
        event => observer.next(event),
        err => {
          this.logger.error('SSE Stream Error:', err);
          observer.error(err);
        },
        () => observer.complete()
      );

      return () => sub.unsubscribe();
    });
  }
}
