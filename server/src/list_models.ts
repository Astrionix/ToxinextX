import { groq } from './config/groq';

async function listModels() {
    try {
        const models = await groq.models.list();
        console.log(models.data.map((m: any) => m.id));
    } catch (e) {
        console.error(e);
    }
}

listModels();
