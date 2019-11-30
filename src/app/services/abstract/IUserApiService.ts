import { ViewUser } from 'src/app/models/user/view-user';

export abstract class IUserApiService {
    public abstract GetUserInfo(): Promise<ViewUser>;
}
