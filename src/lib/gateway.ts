import { createGateway } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';


export async function createGATEWAY(apiKey: string, baseurl: string) {
    const gateway = createOpenAICompatible({
        name: "docker",
        baseURL: baseurl,
        apiKey: apiKey,
    });
    return gateway;
}