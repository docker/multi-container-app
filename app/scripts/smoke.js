const http = require("http");
const port = process.env.PORT || 3000;

const options = {
  hostname: "localhost",
  port: port,
  path: "/",
  method: "GET",
  timeout: 2000,
};

const req = http.request(options, (res) => {
  console.log(`Smoke test: GET / -> status ${res.statusCode}`);
  res.on("data", () => {});
  res.on("end", () => process.exit(res.statusCode === 200 ? 0 : 2));
});

req.on("error", (e) => {
  console.error(`Smoke test failed: ${e.message}`);
  process.exit(3);
});

req.end();
