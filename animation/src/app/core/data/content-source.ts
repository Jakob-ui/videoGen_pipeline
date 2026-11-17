import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { parseContent, type ContentData } from '../model/content.schema';

@Injectable({ providedIn: 'root' })
export class ContentSource {
  private readonly http = inject(HttpClient);

  async load(): Promise<ContentData> {
    return parseContent(await firstValueFrom(this.http.get<unknown>(environment.contentUrl)));
  }
}
