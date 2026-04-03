import * as z from "zod";
import { createAgent, tool } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
const env = process.env;

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
    const model = new ChatOpenAI({
        model: "local",
        configuration: {
            baseURL: env.CHAT_MODEL_URL,
            apiKey: "local",
        },
    });

    const agent = createAgent({
        model,                     // pass the model instance instead of a string
        tools: [getWeather],
        systemPrompt: "Return with the following format: city: weather. For example, Egypt: rainy"
    });

    const result = await agent.invoke({
        messages: [{ role: "user", content: "What's the weather in Tokyo?" }],
    });
    // for (const message of result.messages) {
    //     console.log(`[${message.constructor.name}]:`, message.content);
    //     console.log("-----");
    // }
    console.log(result.messages);
}


main()