export interface ViewComment {
    id: string;
    title: string;
    body: string;
    owner: string;
    ownerId: string;
    status: string;
    dateCreated: number;
    score: number; // May be null based on comment type
}
