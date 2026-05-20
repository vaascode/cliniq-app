import { Hono } from 'hono';
import { cors } from "hono/cors"
import { createGateway } from "ai";
import { generateText } from "ai";

const gateway = createGateway({
  baseURL: process.env.AI_GATEWAY_BASE_URL,
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

const app = new Hono()
  .basePath('api')
  .use(cors({ origin: (origin) => origin ?? "*", credentials: true, exposeHeaders: ["set-auth-token"] }))
  .get('/ping', (c) => c.json({ message: `Pong! ${Date.now()}` }))
  .get('/health', (c) => c.json({ status: 'ok' }))
  .post('/extract-address', async (c) => {
    try {
      const { mapsLink } = await c.req.json<{ mapsLink: string }>();
      if (!mapsLink) return c.json({ error: 'No link provided' }, 400);

      const { text } = await generateText({
        model: gateway("anthropic/claude-sonnet-4.6"),
        system: 'You extract address information from Google Maps URLs. Analyze the URL to extract any place name, address, and locality. Google Maps URLs contain encoded place names, coordinates, and search queries. Extract what you can. Return ONLY valid JSON, no markdown.',
        prompt: `Extract address details from this Google Maps link: ${mapsLink}

Return JSON with these fields (use empty string if not available):
{
  "clinicName": "extracted place/clinic name",
  "address": "full address",
  "locality": "area/locality/neighborhood"
}`,
        maxOutputTokens: 300,
        temperature: 0,
      });

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return c.json({
          clinicName: parsed.clinicName || '',
          address: parsed.address || '',
          locality: parsed.locality || '',
        });
      }

      return c.json({ error: 'Could not parse address' }, 500);
    } catch (err) {
      console.error('Extract address error:', err);
      return c.json({ error: 'Failed to extract address' }, 500);
    }
  });

export type AppType = typeof app;
export default app;