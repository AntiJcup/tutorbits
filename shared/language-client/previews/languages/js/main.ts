import { JSPreview } from "./js-preview";

async function init(): Promise<void> {
    const preview = new JSPreview();
    await preview.initialize();
    await preview.start();
}

init().then();