export interface IStorageService {
    GetItem(key: string): any;
    SetItem(key: string, item: any): void;
    DeleteItem(key: string): void;
    CheckExists(key: string): boolean;
}
