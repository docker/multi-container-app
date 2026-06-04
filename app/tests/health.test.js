const request = require("supertest");
const app = require("../server");

describe("Health endpoint", () => {
  test("GET /health returns 200 and JSON", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});
