export abstract class IErrorService {
    public abstract HandleError(component: string, error: any): void;
    public abstract ClearError(): void;
}
