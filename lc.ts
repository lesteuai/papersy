import * as z from "zod";
import { createAgent, tool, initChatModel } from "langchain";
// npm install @langchain/openai
// (using OpenAI-compatible interface to talk to your local server)

function getWeatherReal ({ city }: {city:string}) {
    return `It's always sunny in ${city}!`;
}

async function main() {
    const getWeather = tool(
        getWeatherReal,
        {
            name: "get_weather",
            description: "Get the weather for a given city",
            schema: z.object({
            city: z.string(),
            }),
        },
    );

    // Point to your local model server instead of a cloud provider
    const model = await initChatModel("your-local-model-name", {
    modelProvider: "openai",   // use the OpenAI-compatible interface
    baseUrl: "http://localhost:8033/v1",
    apiKey: "not-needed",      // most local servers don't check this, but the field is required
    });

    const agent = createAgent({
        model,                     // pass the model instance instead of a string
        tools: [getWeather],
        systemPrompt: "Return with the following format: city: weather. For example, Egypt: rainy"
    });

    const result = await agent.invoke({
        messages: [{ role: "user", content: "What's the weather in Tokyo?" }],
    });
    console.log(result.messages);
}


main()