require("../../dist/sd-streams-polyfill.min.js");

// this file is a modified version of simple-random-stream

// create empty string in which to store result
let result = "";
let interval = 0;
let count = 0;

// function to generate random character string
function randomChars() {
	let string = "";
	let choices = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";

	for (let i = 0; i < 8; i++) {
		string += choices.charAt(Math.floor(Math.random() * choices.length));
	}
	return string;
}

const stream = new ReadableStream({
	start(controller) {
		interval = setInterval(() => {
			let string = randomChars();

			// Add the string to the stream
			controller.enqueue(string);

			// show it on the screen
			console.info("append to list 1: " + string);

			if (++count === 3) {
				clearInterval(interval);
				readStream();
				controller.close();
			}
		}, 1000);
	},
	pull(controller) {
		// We don't really need a pull in this example
	},
	cancel() {
		// This is called if the reader cancels,
		// so we should stop generating strings
		clearInterval(interval);
	}
});

function readStream() {
	const reader = stream.getReader();
	let charsReceived = 0;

	// read() returns a promise that resolves
	// when a value has been received
	reader.read().then(function processText({ done, value }) {
		// Result objects contain two properties:
		// done  - true if the stream has already given you all its data.
		// value - some data. Always undefined when done is true.
		if (done) {
			console.log("Stream complete");
			console.info("Result =", result);
			return;
		}

		charsReceived += value.length;
		const chunk = value;
		console.info('Read ' + charsReceived + ' characters so far. Current chunk = ' + chunk);
		result += chunk;

		// Read some more, and call this function again
		return reader.read().then(processText);
	});
}
