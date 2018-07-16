// start this mini-server with `node postsink` in this dir
// then you can run the upload-stream test in the browser

const http = require("http");

const server = http.createServer((request, response) => {
	console.info("REQUEST");
	let out = "";

	request.on("data", (chunk) => {
		console.info("DATA", chunk);
		out += chunk.toString();
	});
	request.on("end", () => {
		const shouldRespond = request.method == "DELETE" || request.method == "POST" || request.method == "PUT" || request.method == "GET";
		if (shouldRespond) {
			const str = `M: ${request.method}, D: ${out}\r\n`;
			response.writeHead(200, {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "POST, PUT, DELETE",
				"Access-Control-Allow-Headers": "Content-Type",
				"Content-Size": Buffer.byteLength(str),
				"Content-Type": "text/plain"
			});

			console.info(`END: ${str}`);
			response.write(str, () => {
				response.end();
			});
		}
		else {
			console.info("OPTIONS?");
			response.writeHead(200, {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "POST, PUT, DELETE",
				"Access-Control-Allow-Headers": "Content-Type"
			});
			response.end();
		}

	});
});

server.on("clientError", (err, socket) => {
	socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
});

server.listen(8123);
console.info("Now listening on localhost on port 8123.");
console.info("Hit Ctrl+C to quit this server.");
