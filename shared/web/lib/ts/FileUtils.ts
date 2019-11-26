export interface FileData {
    name: string;
    data: Blob;
}

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

    public static async SelectFile(): Promise<FileData> {
        let finishCallback: (b: FileData) => void = null;
        let errorCallback: (err: any) => void = null;
        const inputEle = document.createElement('input');
        inputEle.type = 'file';
        inputEle.hidden = true;
        inputEle.onchange = (e) => {
            const file = inputEle.files[0];
            FileUtils.FileToBlob(file).then((blob: Blob) => {
                finishCallback({
                    name: file.name,
                    data: blob
                } as FileData);
            }).catch((err) => {
                errorCallback(err);
            }).finally(() => {
                document.body.removeChild(inputEle);
            });
        };
        document.body.appendChild(inputEle);
        inputEle.click();

        const finishPromise = new Promise<FileData>((resolve, reject) => {
            finishCallback = resolve;
            errorCallback = reject;
        });
        return await finishPromise;
    }
}
