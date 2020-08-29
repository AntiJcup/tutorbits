export abstract class IStorageService {
    public abstract GetItem(key: string): any;
    public abstract SetItem(key: string, item: any): void;
    public abstract DeleteItem(key: string): void;
    public abstract CheckExists(key: string): boolean;
}
