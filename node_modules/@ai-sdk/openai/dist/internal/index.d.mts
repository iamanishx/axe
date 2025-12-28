import { LanguageModelV3, LanguageModelV3CallOptions, LanguageModelV3GenerateResult, LanguageModelV3StreamResult, EmbeddingModelV3, ImageModelV3, TranscriptionModelV3CallOptions, TranscriptionModelV3, SpeechModelV3 } from '@ai-sdk/provider';
import * as _ai_sdk_provider_utils from '@ai-sdk/provider-utils';
import { InferSchema, FetchFunction } from '@ai-sdk/provider-utils';

type OpenAIChatModelId = 'o1' | 'o1-2024-12-17' | 'o3-mini' | 'o3-mini-2025-01-31' | 'o3' | 'o3-2025-04-16' | 'gpt-4.1' | 'gpt-4.1-2025-04-14' | 'gpt-4.1-mini' | 'gpt-4.1-mini-2025-04-14' | 'gpt-4.1-nano' | 'gpt-4.1-nano-2025-04-14' | 'gpt-4o' | 'gpt-4o-2024-05-13' | 'gpt-4o-2024-08-06' | 'gpt-4o-2024-11-20' | 'gpt-4o-mini' | 'gpt-4o-mini-2024-07-18' | 'gpt-4-turbo' | 'gpt-4-turbo-2024-04-09' | 'gpt-4' | 'gpt-4-0613' | 'gpt-4.5-preview' | 'gpt-4.5-preview-2025-02-27' | 'gpt-3.5-turbo-0125' | 'gpt-3.5-turbo' | 'gpt-3.5-turbo-1106' | 'chatgpt-4o-latest' | 'gpt-5' | 'gpt-5-2025-08-07' | 'gpt-5-mini' | 'gpt-5-mini-2025-08-07' | 'gpt-5-nano' | 'gpt-5-nano-2025-08-07' | 'gpt-5-chat-latest' | 'gpt-5.1' | 'gpt-5.1-chat-latest' | 'gpt-5.2' | 'gpt-5.2-chat-latest' | 'gpt-5.2-pro' | (string & {});
declare const openaiChatLanguageModelOptions: _ai_sdk_provider_utils.LazySchema<{
    logitBias?: Record<number, number> | undefined;
    logprobs?: number | boolean | undefined;
    parallelToolCalls?: boolean | undefined;
    user?: string | undefined;
    reasoningEffort?: "none" | "minimal" | "low" | "medium" | "high" | "xhigh" | undefined;
    maxCompletionTokens?: number | undefined;
    store?: boolean | undefined;
    metadata?: Record<string, string> | undefined;
    prediction?: Record<string, any> | undefined;
    serviceTier?: "default" | "auto" | "flex" | "priority" | undefined;
    strictJsonSchema?: boolean | undefined;
    textVerbosity?: "low" | "medium" | "high" | undefined;
    promptCacheKey?: string | undefined;
    promptCacheRetention?: "in_memory" | "24h" | undefined;
    safetyIdentifier?: string | undefined;
    systemMessageMode?: "remove" | "system" | "developer" | undefined;
    forceReasoning?: boolean | undefined;
}>;
type OpenAIChatLanguageModelOptions = InferSchema<typeof openaiChatLanguageModelOptions>;

type OpenAIChatConfig = {
    provider: string;
    headers: () => Record<string, string | undefined>;
    url: (options: {
        modelId: string;
        path: string;
    }) => string;
    fetch?: FetchFunction;
};
declare class OpenAIChatLanguageModel implements LanguageModelV3 {
    readonly specificationVersion = "v3";
    readonly modelId: OpenAIChatModelId;
    readonly supportedUrls: {
        'image/*': RegExp[];
    };
    private readonly config;
    constructor(modelId: OpenAIChatModelId, config: OpenAIChatConfig);
    get provider(): string;
    private getArgs;
    doGenerate(options: LanguageModelV3CallOptions): Promise<LanguageModelV3GenerateResult>;
    doStream(options: LanguageModelV3CallOptions): Promise<LanguageModelV3StreamResult>;
}

type OpenAICompletionModelId = 'gpt-3.5-turbo-instruct' | (string & {});
declare const openaiCompletionProviderOptions: _ai_sdk_provider_utils.LazySchema<{
    echo?: boolean | undefined;
    logitBias?: Record<string, number> | undefined;
    suffix?: string | undefined;
    user?: string | undefined;
    logprobs?: number | boolean | undefined;
}>;
type OpenAICompletionProviderOptions = InferSchema<typeof openaiCompletionProviderOptions>;

type OpenAICompletionConfig = {
    provider: string;
    headers: () => Record<string, string | undefined>;
    url: (options: {
        modelId: string;
        path: string;
    }) => string;
    fetch?: FetchFunction;
};
declare class OpenAICompletionLanguageModel implements LanguageModelV3 {
    readonly specificationVersion = "v3";
    readonly modelId: OpenAICompletionModelId;
    private readonly config;
    private get providerOptionsName();
    constructor(modelId: OpenAICompletionModelId, config: OpenAICompletionConfig);
    get provider(): string;
    readonly supportedUrls: Record<string, RegExp[]>;
    private getArgs;
    doGenerate(options: LanguageModelV3CallOptions): Promise<LanguageModelV3GenerateResult>;
    doStream(options: LanguageModelV3CallOptions): Promise<LanguageModelV3StreamResult>;
}

type OpenAIConfig = {
    provider: string;
    url: (options: {
        modelId: string;
        path: string;
    }) => string;
    headers: () => Record<string, string | undefined>;
    fetch?: FetchFunction;
    generateId?: () => string;
    /**
     * File ID prefixes used to identify file IDs in Responses API.
     * When undefined, all file data is treated as base64 content.
     *
     * Examples:
     * - OpenAI: ['file-'] for IDs like 'file-abc123'
     * - Azure OpenAI: ['assistant-'] for IDs like 'assistant-abc123'
     */
    fileIdPrefixes?: readonly string[];
};

type OpenAIEmbeddingModelId = 'text-embedding-3-small' | 'text-embedding-3-large' | 'text-embedding-ada-002' | (string & {});
declare const openaiEmbeddingProviderOptions: _ai_sdk_provider_utils.LazySchema<{
    dimensions?: number | undefined;
    user?: string | undefined;
}>;
type OpenAIEmbeddingProviderOptions = InferSchema<typeof openaiEmbeddingProviderOptions>;

declare class OpenAIEmbeddingModel implements EmbeddingModelV3 {
    readonly specificationVersion = "v3";
    readonly modelId: OpenAIEmbeddingModelId;
    readonly maxEmbeddingsPerCall = 2048;
    readonly supportsParallelCalls = true;
    private readonly config;
    get provider(): string;
    constructor(modelId: OpenAIEmbeddingModelId, config: OpenAIConfig);
    doEmbed({ values, headers, abortSignal, providerOptions, }: Parameters<EmbeddingModelV3['doEmbed']>[0]): Promise<Awaited<ReturnType<EmbeddingModelV3['doEmbed']>>>;
}

type OpenAIImageModelId = 'dall-e-3' | 'dall-e-2' | 'gpt-image-1' | 'gpt-image-1-mini' | 'gpt-image-1.5' | (string & {});
declare const modelMaxImagesPerCall: Record<OpenAIImageModelId, number>;
declare const hasDefaultResponseFormat: Set<string>;

interface OpenAIImageModelConfig extends OpenAIConfig {
    _internal?: {
        currentDate?: () => Date;
    };
}
declare class OpenAIImageModel implements ImageModelV3 {
    readonly modelId: OpenAIImageModelId;
    private readonly config;
    readonly specificationVersion = "v3";
    get maxImagesPerCall(): number;
    get provider(): string;
    constructor(modelId: OpenAIImageModelId, config: OpenAIImageModelConfig);
    doGenerate({ prompt, files, mask, n, size, aspectRatio, seed, providerOptions, headers, abortSignal, }: Parameters<ImageModelV3['doGenerate']>[0]): Promise<Awaited<ReturnType<ImageModelV3['doGenerate']>>>;
}

type OpenAITranscriptionModelId = 'whisper-1' | 'gpt-4o-mini-transcribe' | 'gpt-4o-transcribe' | (string & {});
declare const openAITranscriptionProviderOptions: _ai_sdk_provider_utils.LazySchema<{
    include?: string[] | undefined;
    language?: string | undefined;
    prompt?: string | undefined;
    temperature?: number | undefined;
    timestampGranularities?: ("word" | "segment")[] | undefined;
}>;
type OpenAITranscriptionProviderOptions = InferSchema<typeof openAITranscriptionProviderOptions>;

type OpenAITranscriptionCallOptions = Omit<TranscriptionModelV3CallOptions, 'providerOptions'> & {
    providerOptions?: {
        openai?: OpenAITranscriptionProviderOptions;
    };
};
interface OpenAITranscriptionModelConfig extends OpenAIConfig {
    _internal?: {
        currentDate?: () => Date;
    };
}
declare class OpenAITranscriptionModel implements TranscriptionModelV3 {
    readonly modelId: OpenAITranscriptionModelId;
    private readonly config;
    readonly specificationVersion = "v3";
    get provider(): string;
    constructor(modelId: OpenAITranscriptionModelId, config: OpenAITranscriptionModelConfig);
    private getArgs;
    doGenerate(options: OpenAITranscriptionCallOptions): Promise<Awaited<ReturnType<TranscriptionModelV3['doGenerate']>>>;
}

type OpenAISpeechModelId = 'tts-1' | 'tts-1-hd' | 'gpt-4o-mini-tts' | (string & {});
declare const openaiSpeechProviderOptionsSchema: _ai_sdk_provider_utils.LazySchema<{
    instructions?: string | null | undefined;
    speed?: number | null | undefined;
}>;
type OpenAISpeechCallOptions = InferSchema<typeof openaiSpeechProviderOptionsSchema>;

interface OpenAISpeechModelConfig extends OpenAIConfig {
    _internal?: {
        currentDate?: () => Date;
    };
}
declare class OpenAISpeechModel implements SpeechModelV3 {
    readonly modelId: OpenAISpeechModelId;
    private readonly config;
    readonly specificationVersion = "v3";
    get provider(): string;
    constructor(modelId: OpenAISpeechModelId, config: OpenAISpeechModelConfig);
    private getArgs;
    doGenerate(options: Parameters<SpeechModelV3['doGenerate']>[0]): Promise<Awaited<ReturnType<SpeechModelV3['doGenerate']>>>;
}

type OpenAIResponsesModelId = 'chatgpt-4o-latest' | 'gpt-3.5-turbo-0125' | 'gpt-3.5-turbo-1106' | 'gpt-3.5-turbo' | 'gpt-4-0613' | 'gpt-4-turbo-2024-04-09' | 'gpt-4-turbo' | 'gpt-4.1-2025-04-14' | 'gpt-4.1-mini-2025-04-14' | 'gpt-4.1-mini' | 'gpt-4.1-nano-2025-04-14' | 'gpt-4.1-nano' | 'gpt-4.1' | 'gpt-4' | 'gpt-4o-2024-05-13' | 'gpt-4o-2024-08-06' | 'gpt-4o-2024-11-20' | 'gpt-4o-mini-2024-07-18' | 'gpt-4o-mini' | 'gpt-4o' | 'gpt-5.1' | 'gpt-5.1-chat-latest' | 'gpt-5.1-codex-mini' | 'gpt-5.1-codex' | 'gpt-5.1-codex-max' | 'gpt-5.2' | 'gpt-5.2-chat-latest' | 'gpt-5.2-pro' | 'gpt-5-2025-08-07' | 'gpt-5-chat-latest' | 'gpt-5-codex' | 'gpt-5-mini-2025-08-07' | 'gpt-5-mini' | 'gpt-5-nano-2025-08-07' | 'gpt-5-nano' | 'gpt-5-pro-2025-10-06' | 'gpt-5-pro' | 'gpt-5' | 'o1-2024-12-17' | 'o1' | 'o3-2025-04-16' | 'o3-mini-2025-01-31' | 'o3-mini' | 'o3' | (string & {});

declare class OpenAIResponsesLanguageModel implements LanguageModelV3 {
    readonly specificationVersion = "v3";
    readonly modelId: OpenAIResponsesModelId;
    private readonly config;
    constructor(modelId: OpenAIResponsesModelId, config: OpenAIConfig);
    readonly supportedUrls: Record<string, RegExp[]>;
    get provider(): string;
    private getArgs;
    doGenerate(options: LanguageModelV3CallOptions): Promise<LanguageModelV3GenerateResult>;
    doStream(options: LanguageModelV3CallOptions): Promise<LanguageModelV3StreamResult>;
}

/**
 * Schema for the apply_patch input - what the model sends.
 *
 * Refer the official spec here: https://platform.openai.com/docs/api-reference/responses/create#responses_create-input-input_item_list-item-apply_patch_tool_call
 *
 */
declare const applyPatchInputSchema: _ai_sdk_provider_utils.LazySchema<{
    callId: string;
    operation: {
        type: "create_file";
        path: string;
        diff: string;
    } | {
        type: "delete_file";
        path: string;
    } | {
        type: "update_file";
        path: string;
        diff: string;
    };
}>;
/**
 * Schema for the apply_patch output - what we send back.
 */
declare const applyPatchOutputSchema: _ai_sdk_provider_utils.LazySchema<{
    status: "completed" | "failed";
    output?: string | undefined;
}>;
/**
 * Schema for tool arguments (configuration options).
 * The apply_patch tool doesn't require any configuration options.
 */
declare const applyPatchArgsSchema: _ai_sdk_provider_utils.LazySchema<Record<string, never>>;
/**
 * Type definitions for the apply_patch operations.
 */
type ApplyPatchOperation = {
    type: 'create_file';
    /**
     * Path of the file to create relative to the workspace root.
     */
    path: string;
    /**
     * Unified diff content to apply when creating the file.
     */
    diff: string;
} | {
    type: 'delete_file';
    /**
     * Path of the file to delete relative to the workspace root.
     */
    path: string;
} | {
    type: 'update_file';
    /**
     * Path of the file to update relative to the workspace root.
     */
    path: string;
    /**
     * Unified diff content to apply to the existing file.
     */
    diff: string;
};
/**
 * The apply_patch tool lets GPT-5.1 create, update, and delete files in your
 * codebase using structured diffs. Instead of just suggesting edits, the model
 * emits patch operations that your application applies and then reports back on,
 * enabling iterative, multi-step code editing workflows.
 *
 * The tool factory creates a provider-defined tool that:
 * - Receives patch operations from the model (create_file, update_file, delete_file)
 * - Returns the status of applying those patches (completed or failed)
 *
 */
declare const applyPatchToolFactory: _ai_sdk_provider_utils.ProviderToolFactoryWithOutputSchema<{
    /**
     * The unique ID of the apply patch tool call generated by the model.
     */
    callId: string;
    /**
     * The specific create, delete, or update instruction for the apply_patch tool call.
     */
    operation: ApplyPatchOperation;
}, {
    /**
     * The status of the apply patch tool call output.
     * - 'completed': The patch was applied successfully.
     * - 'failed': The patch failed to apply.
     */
    status: "completed" | "failed";
    /**
     * Optional human-readable log text from the apply patch tool
     * (e.g., patch results or errors).
     */
    output?: string;
}, {}>;
/**
 * The apply_patch tool lets GPT-5.1 create, update, and delete files in your
 * codebase using structured diffs. Instead of just suggesting edits, the model
 * emits patch operations that your application applies and then reports back on,
 * enabling iterative, multi-step code editing workflows.
 */
declare const applyPatch: _ai_sdk_provider_utils.ProviderToolFactoryWithOutputSchema<{
    /**
     * The unique ID of the apply patch tool call generated by the model.
     */
    callId: string;
    /**
     * The specific create, delete, or update instruction for the apply_patch tool call.
     */
    operation: ApplyPatchOperation;
}, {
    /**
     * The status of the apply patch tool call output.
     * - 'completed': The patch was applied successfully.
     * - 'failed': The patch failed to apply.
     */
    status: "completed" | "failed";
    /**
     * Optional human-readable log text from the apply patch tool
     * (e.g., patch results or errors).
     */
    output?: string;
}, {}>;

declare const codeInterpreterInputSchema: _ai_sdk_provider_utils.LazySchema<{
    containerId: string;
    code?: string | null | undefined;
}>;
declare const codeInterpreterOutputSchema: _ai_sdk_provider_utils.LazySchema<{
    outputs?: ({
        type: "logs";
        logs: string;
    } | {
        type: "image";
        url: string;
    })[] | null | undefined;
}>;
declare const codeInterpreterArgsSchema: _ai_sdk_provider_utils.LazySchema<{
    container?: string | {
        fileIds?: string[] | undefined;
    } | undefined;
}>;
type CodeInterpreterArgs = {
    /**
     * The code interpreter container.
     * Can be a container ID
     * or an object that specifies uploaded file IDs to make available to your code.
     */
    container?: string | {
        fileIds?: string[];
    };
};
declare const codeInterpreterToolFactory: _ai_sdk_provider_utils.ProviderToolFactoryWithOutputSchema<{
    /**
     * The code to run, or null if not available.
     */
    code?: string | null;
    /**
     * The ID of the container used to run the code.
     */
    containerId: string;
}, {
    /**
     * The outputs generated by the code interpreter, such as logs or images.
     * Can be null if no outputs are available.
     */
    outputs?: Array<{
        type: "logs";
        /**
         * The logs output from the code interpreter.
         */
        logs: string;
    } | {
        type: "image";
        /**
         * The URL of the image output from the code interpreter.
         */
        url: string;
    }> | null;
}, CodeInterpreterArgs>;
declare const codeInterpreter: (args?: CodeInterpreterArgs) => _ai_sdk_provider_utils.Tool<{
    /**
     * The code to run, or null if not available.
     */
    code?: string | null;
    /**
     * The ID of the container used to run the code.
     */
    containerId: string;
}, {
    /**
     * The outputs generated by the code interpreter, such as logs or images.
     * Can be null if no outputs are available.
     */
    outputs?: Array<{
        type: "logs";
        /**
         * The logs output from the code interpreter.
         */
        logs: string;
    } | {
        type: "image";
        /**
         * The URL of the image output from the code interpreter.
         */
        url: string;
    }> | null;
}>;

/**
 * A filter used to compare a specified attribute key to a given value using a defined comparison operation.
 */
type OpenAIResponsesFileSearchToolComparisonFilter = {
    /**
     * The key to compare against the value.
     */
    key: string;
    /**
     * Specifies the comparison operator: eq, ne, gt, gte, lt, lte, in, nin.
     */
    type: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin';
    /**
     * The value to compare against the attribute key; supports string, number, boolean, or array of string types.
     */
    value: string | number | boolean | string[];
};
/**
 * Combine multiple filters using and or or.
 */
type OpenAIResponsesFileSearchToolCompoundFilter = {
    /**
     * Type of operation: and or or.
     */
    type: 'and' | 'or';
    /**
     * Array of filters to combine. Items can be ComparisonFilter or CompoundFilter.
     */
    filters: Array<OpenAIResponsesFileSearchToolComparisonFilter | OpenAIResponsesFileSearchToolCompoundFilter>;
};

declare const fileSearchArgsSchema: _ai_sdk_provider_utils.LazySchema<{
    vectorStoreIds: string[];
    maxNumResults?: number | undefined;
    ranking?: {
        ranker?: string | undefined;
        scoreThreshold?: number | undefined;
    } | undefined;
    filters?: any;
}>;
declare const fileSearchOutputSchema: _ai_sdk_provider_utils.LazySchema<{
    queries: string[];
    results: {
        attributes: Record<string, unknown>;
        fileId: string;
        filename: string;
        score: number;
        text: string;
    }[] | null;
}>;
declare const fileSearch: _ai_sdk_provider_utils.ProviderToolFactoryWithOutputSchema<{}, {
    /**
     * The search query to execute.
     */
    queries: string[];
    /**
     * The results of the file search tool call.
     */
    results: null | {
        /**
         * Set of 16 key-value pairs that can be attached to an object.
         * This can be useful for storing additional information about the object
         * in a structured format, and querying for objects via API or the dashboard.
         * Keys are strings with a maximum length of 64 characters.
         * Values are strings with a maximum length of 512 characters, booleans, or numbers.
         */
        attributes: Record<string, unknown>;
        /**
         * The unique ID of the file.
         */
        fileId: string;
        /**
         * The name of the file.
         */
        filename: string;
        /**
         * The relevance score of the file - a value between 0 and 1.
         */
        score: number;
        /**
         * The text that was retrieved from the file.
         */
        text: string;
    }[];
}, {
    /**
     * List of vector store IDs to search through.
     */
    vectorStoreIds: string[];
    /**
     * Maximum number of search results to return. Defaults to 10.
     */
    maxNumResults?: number;
    /**
     * Ranking options for the search.
     */
    ranking?: {
        /**
         * The ranker to use for the file search.
         */
        ranker?: string;
        /**
         * The score threshold for the file search, a number between 0 and 1.
         * Numbers closer to 1 will attempt to return only the most relevant results,
         * but may return fewer results.
         */
        scoreThreshold?: number;
    };
    /**
     * A filter to apply.
     */
    filters?: OpenAIResponsesFileSearchToolComparisonFilter | OpenAIResponsesFileSearchToolCompoundFilter;
}>;

declare const imageGenerationArgsSchema: _ai_sdk_provider_utils.LazySchema<{
    background?: "auto" | "transparent" | "opaque" | undefined;
    inputFidelity?: "low" | "high" | undefined;
    inputImageMask?: {
        fileId?: string | undefined;
        imageUrl?: string | undefined;
    } | undefined;
    model?: string | undefined;
    moderation?: "auto" | undefined;
    outputCompression?: number | undefined;
    outputFormat?: "png" | "jpeg" | "webp" | undefined;
    partialImages?: number | undefined;
    quality?: "auto" | "low" | "medium" | "high" | undefined;
    size?: "auto" | "1024x1024" | "1024x1536" | "1536x1024" | undefined;
}>;
declare const imageGenerationOutputSchema: _ai_sdk_provider_utils.LazySchema<{
    result: string;
}>;
type ImageGenerationArgs = {
    /**
     * Background type for the generated image. Default is 'auto'.
     */
    background?: 'auto' | 'opaque' | 'transparent';
    /**
     * Input fidelity for the generated image. Default is 'low'.
     */
    inputFidelity?: 'low' | 'high';
    /**
     * Optional mask for inpainting.
     * Contains image_url (string, optional) and file_id (string, optional).
     */
    inputImageMask?: {
        /**
         * File ID for the mask image.
         */
        fileId?: string;
        /**
         * Base64-encoded mask image.
         */
        imageUrl?: string;
    };
    /**
     * The image generation model to use. Default: gpt-image-1.
     */
    model?: string;
    /**
     * Moderation level for the generated image. Default: auto.
     */
    moderation?: 'auto';
    /**
     * Compression level for the output image. Default: 100.
     */
    outputCompression?: number;
    /**
     * The output format of the generated image. One of png, webp, or jpeg.
     * Default: png
     */
    outputFormat?: 'png' | 'jpeg' | 'webp';
    /**
     * Number of partial images to generate in streaming mode, from 0 (default value) to 3.
     */
    partialImages?: number;
    /**
     * The quality of the generated image.
     * One of low, medium, high, or auto. Default: auto.
     */
    quality?: 'auto' | 'low' | 'medium' | 'high';
    /**
     * The size of the generated image.
     * One of 1024x1024, 1024x1536, 1536x1024, or auto.
     * Default: auto.
     */
    size?: 'auto' | '1024x1024' | '1024x1536' | '1536x1024';
};
declare const imageGeneration: (args?: ImageGenerationArgs) => _ai_sdk_provider_utils.Tool<{}, {
    /**
     * The generated image encoded in base64.
     */
    result: string;
}>;

declare const webSearchPreviewArgsSchema: _ai_sdk_provider_utils.LazySchema<{
    searchContextSize?: "low" | "medium" | "high" | undefined;
    userLocation?: {
        type: "approximate";
        country?: string | undefined;
        city?: string | undefined;
        region?: string | undefined;
        timezone?: string | undefined;
    } | undefined;
}>;
declare const webSearchPreviewInputSchema: _ai_sdk_provider_utils.LazySchema<Record<string, never>>;
declare const webSearchPreview: _ai_sdk_provider_utils.ProviderToolFactoryWithOutputSchema<{}, {
    /**
     * An object describing the specific action taken in this web search call.
     * Includes details on how the model used the web (search, open_page, find_in_page).
     */
    action: {
        /**
         * Action type "search" - Performs a web search query.
         */
        type: "search";
        /**
         * The search query.
         */
        query?: string;
    } | {
        /**
         * Action type "openPage" - Opens a specific URL from search results.
         */
        type: "openPage";
        /**
         * The URL opened by the model.
         */
        url?: string | null;
    } | {
        /**
         * Action type "findInPage": Searches for a pattern within a loaded page.
         */
        type: "findInPage";
        /**
         * The URL of the page searched for the pattern.
         */
        url?: string | null;
        /**
         * The pattern or text to search for within the page.
         */
        pattern?: string | null;
    };
}, {
    /**
     * Search context size to use for the web search.
     * - high: Most comprehensive context, highest cost, slower response
     * - medium: Balanced context, cost, and latency (default)
     * - low: Least context, lowest cost, fastest response
     */
    searchContextSize?: "low" | "medium" | "high";
    /**
     * User location information to provide geographically relevant search results.
     */
    userLocation?: {
        /**
         * Type of location (always 'approximate')
         */
        type: "approximate";
        /**
         * Two-letter ISO country code (e.g., 'US', 'GB')
         */
        country?: string;
        /**
         * City name (free text, e.g., 'Minneapolis')
         */
        city?: string;
        /**
         * Region name (free text, e.g., 'Minnesota')
         */
        region?: string;
        /**
         * IANA timezone (e.g., 'America/Chicago')
         */
        timezone?: string;
    };
}>;

export { type ApplyPatchOperation, OpenAIChatLanguageModel, type OpenAIChatLanguageModelOptions, type OpenAIChatModelId, OpenAICompletionLanguageModel, type OpenAICompletionModelId, type OpenAICompletionProviderOptions, OpenAIEmbeddingModel, type OpenAIEmbeddingModelId, type OpenAIEmbeddingProviderOptions, OpenAIImageModel, type OpenAIImageModelId, OpenAIResponsesLanguageModel, type OpenAISpeechCallOptions, OpenAISpeechModel, type OpenAISpeechModelId, type OpenAITranscriptionCallOptions, OpenAITranscriptionModel, type OpenAITranscriptionModelId, type OpenAITranscriptionProviderOptions, applyPatch, applyPatchArgsSchema, applyPatchInputSchema, applyPatchOutputSchema, applyPatchToolFactory, codeInterpreter, codeInterpreterArgsSchema, codeInterpreterInputSchema, codeInterpreterOutputSchema, codeInterpreterToolFactory, fileSearch, fileSearchArgsSchema, fileSearchOutputSchema, hasDefaultResponseFormat, imageGeneration, imageGenerationArgsSchema, imageGenerationOutputSchema, modelMaxImagesPerCall, openAITranscriptionProviderOptions, openaiChatLanguageModelOptions, openaiCompletionProviderOptions, openaiEmbeddingProviderOptions, openaiSpeechProviderOptionsSchema, webSearchPreview, webSearchPreviewArgsSchema, webSearchPreviewInputSchema };
