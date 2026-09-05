import { expect, it, vi } from "vitest";
const { streamText, getCityClimate } = vi.hoisted(() => ({
  streamText: vi.fn(() => ({ toUIMessageStreamResponse: () => new Response("ok") })),
  getCityClimate: vi.fn(),
}));
vi.mock("ai", async (importOriginal) => ({
  ...await importOriginal<typeof import("ai")>(), streamText,
}));
vi.mock("../city-profile-stack/lib/climate-queries", () => ({ getCityClimate }));
import { POST } from "../app/api/chat/route";

it("registers climate in the chat route with validated inputs, reporting rules and executable output", async () => {
  await POST(new Request("http://localhost/api/chat", {
    method: "POST", body: JSON.stringify({ messages: [] }),
  }));
  const config = streamText.mock.calls[0] as unknown as [{
    system: string;
    tools: { city_climate: {
      inputSchema: { safeParse: (input: unknown) => { success: boolean } };
      execute: (input: { city: string; month?: number; airQualityYear?: number }) => Promise<unknown>;
    } };
  }];
  const tool = config[0].tools.city_climate;
  expect(tool.inputSchema.safeParse({ city: "Elko, NV", month: 13 }).success).toBe(false);
  expect(tool.inputSchema.safeParse({ city: " " }).success).toBe(false);
  expect(tool.inputSchema.safeParse({ city: "Elko, NV", month: 7, airQualityYear: 2025 }).success).toBe(true);
  getCityClimate.mockResolvedValueOnce({ matched: true, airQuality: { year: 2025 } });
  expect(await tool.execute({ city: "Elko, NV", month: 7, airQualityYear: 2025 })).toMatchObject({ matched: true });
  expect(getCityClimate).toHaveBeenCalledWith("Elko, NV", 7, 2025);
  expect(config[0].system).toContain("observed days");
  expect(config[0].system).toContain("never quietly substitute another year");
  getCityClimate.mockRejectedValueOnce(new Error("private connection details"));
  const failure = await tool.execute({ city: "Elko, NV" });
  expect(failure).toHaveProperty("error");
  expect(JSON.stringify(failure)).not.toContain("private connection details");
});
