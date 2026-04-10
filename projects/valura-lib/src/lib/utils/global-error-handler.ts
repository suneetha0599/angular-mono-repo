import { ErrorHandler, Injectable, Injector } from "@angular/core";
import { NGXLogger } from "ngx-logger";

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {

    constructor(private readonly injector: Injector) { }

    private get logger() {
        return this.injector.get(NGXLogger);
    }

    handleError(error: any): void {
        const chunkFailedMessage = /Loading chunk [\d]+ failed/;
        const dynamicChunkFailedMessage = `Failed to fetch dynamically imported module`
        const errorMessage = error?.message || '';
        this.logger.error(error);
        if (chunkFailedMessage.test(errorMessage) || errorMessage.includes(dynamicChunkFailedMessage)) {
            this.logger.warn('Chunk loading failed. Reloading window...');
            window.location.reload();
        }
    }
}
