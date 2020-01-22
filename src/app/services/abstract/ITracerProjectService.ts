import { IProjectWriter } from 'shared/Tracer/lib/ts/IProjectWriter';
import { TutorBitsBaseModelApiService } from './tutor-bits-base-model-api.service';
import { CreateProject } from 'src/app/models/project/create-project';
import { UpdateProject } from 'src/app/models/project/update-project';
import { ViewProject } from 'src/app/models/project/view-project';
import { ITransactionWriter } from 'shared/Tracer/lib/ts/ITransactionWriter';
import { TraceTransactionLog, TraceProject } from 'shared/Tracer/models/ts/Tracer_pb';
import { IProjectReader } from 'shared/Tracer/lib/ts/IProjectReader';
import { ITransactionReader } from 'shared/Tracer/lib/ts/ITransactionReader';

export abstract class ITracerProjectService
    extends TutorBitsBaseModelApiService<CreateProject, UpdateProject, ViewProject>
    implements IProjectWriter, ITransactionWriter, IProjectReader, ITransactionReader {


    public async abstract CreateProject(id: string): Promise<boolean>;

    public async abstract ResetProject(id: string): Promise<boolean>;

    public async abstract DownloadProject(id: string): Promise<boolean>;

    public async abstract GetProjectJson(id: string): Promise<{ [key: string]: string }>;

    public async abstract UploadResource(id: string, resourceName: string, resourceData: Blob, authorize: boolean): Promise<string>;

    public async abstract GetResource(id: string, resourceId: string): Promise<string>;

    public async abstract WriteTransactionLog(transactionLog: TraceTransactionLog, data: Uint8Array, projectId: string): Promise<boolean>;

    public async abstract GetProject(id: string, cacheBuster: string): Promise<TraceProject>;

    // tslint:disable-next-line: max-line-length
    public async abstract GetPartitionsForRange(project: TraceProject, startTime: number, endTime: number, cacheBuster: string): Promise<{ [partition: string]: string; }>;

    public async abstract GetTransactionLog(project: TraceProject, partition: string, cacheBuster: string): Promise<TraceTransactionLog>;
}
