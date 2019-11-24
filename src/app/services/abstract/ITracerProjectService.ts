import { ProjectWriter } from 'shared/Tracer/lib/ts/ProjectWriter';

export abstract class ITracerProjectService extends ProjectWriter {
    public async abstract DownloadProject(id: string): Promise<boolean>;
}
