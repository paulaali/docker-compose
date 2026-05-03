const http = require("http");

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Node app is running Successfully");
});

server.listen(3000, "0.0.0.0", () => {
  console.log("Server running on port 3000");
});