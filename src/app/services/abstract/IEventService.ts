export abstract class IEventService {
    public abstract TriggerPageView(url: string): void;
    public abstract TriggerError(component: string, error: string): void;
    public abstract TriggerButtonClick(component: string, buttonName: string);
}
