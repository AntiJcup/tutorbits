import { BehaviorSubject } from 'rxjs';

export abstract class ITitleService {
    public abstract GetTitleObs(): BehaviorSubject<string>;
    public abstract SetTitle(title: string): void;
}
