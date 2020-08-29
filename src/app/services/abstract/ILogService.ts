export abstract class ILogService {
    public abstract LogToConsole(component: string, ...args: any[]): void;
    public abstract LogErrorToConsole(component: string, ...args: any[]): void;
}
