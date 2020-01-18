export class DateUtils {
    static timeZoneOffset: number = ((new Date()).getTimezoneOffset() * 60 * 1000);
    constructor() {
    }

    public static ConvertServerMSToLocal(serverMilliseconds: number): Date {
        return new Date(serverMilliseconds - this.timeZoneOffset);
    }
}