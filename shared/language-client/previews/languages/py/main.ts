import { BaseServerPreview } from "../../shared/server-preview";

async function init(): Promise<void> {
    const preview = new BaseServerPreview();
    await preview.initialize();
    await preview.start();
}

init().then();