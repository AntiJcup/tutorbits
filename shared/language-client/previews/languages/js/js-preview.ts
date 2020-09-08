import { BasePreview } from "../../shared/base-preview";

export class JSPreview extends BasePreview {
    protected async executeCode(): Promise<void> {
        console.log(`INTERNAL - Executing script: ${this.targetPath}`);
        try {
            eval(this.targetSource!);
        } catch (e) {
            console.error(e);
        }
    }
}