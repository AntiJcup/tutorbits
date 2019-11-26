import { ProjectWriter } from 'shared/Tracer/lib/ts/ProjectWriter';

export abstract class ITracerProjectService extends ProjectWriter {
    public async abstract DownloadProject(id: string): Promise<boolean>;

    public async abstract GetProjectJson(id: string): Promise<{ [key: string]: string }>;

    public async abstract UploadResource(id: string, resourceName: string, resourceData: Blob): Promise<string>;
}
