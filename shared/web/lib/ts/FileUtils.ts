export class FileUtils {
    public static async FileToBlob(file: File): Promise<Blob> {
        const fileReader = new FileReader();
        let finishCallback: (b: Blob) => void = null;

        fileReader.onloadend = (e) => {
            const arrayBuffer: ArrayBuffer = fileReader.result as ArrayBuffer;
            finishCallback(new Blob([arrayBuffer]));
        };

        const finishPromise = new Promise<Blob>((resolve, reject) => {
            finishCallback = resolve;
        });
        fileReader.readAsArrayBuffer(file);

        return await finishPromise;
    }
}
