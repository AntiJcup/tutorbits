export interface ViewQuestion {
    id: string;
    title: string;
    topic: string;
    description: string;
    owner: string;
    ownerId: string;
    status: string;
    score: number;
    dateCreated: number;
    answerCount: number;
}
