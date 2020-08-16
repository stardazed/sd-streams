// @ts-check
import typescript from "typescript";
import resolve from "@rollup/plugin-node-resolve";
import tsc from "@rollup/plugin-typescript";

const banner = `/*
@stardazed/streams-compression - implementation of compression streams
Part of Stardazed
(c) 2019-Present by @zenmumbler
https://github.com/stardazed/sd-streams
*/`;

export default [
	{
		external: id => id.startsWith("@stardazed/"),
		input: "src/sd-streams-compression.ts",
		output: [
			{
				file: "dist/sd-streams-compression.esm.js",
				format: "es",
				sourcemap: false,
				intro: banner
			},
			{
				name: "sdStreamsCompression",
				file: "dist/sd-streams-compression.umd.js",
				format: "umd",
				sourcemap: false,
				intro: banner,
				globals: {
					"@stardazed/zlib": "sdZlib"
				}
			}
		],
		plugins: [
			resolve({ browser: true }),
			tsc({
				typescript,
				include: ["src/**/*.ts"],
			})
		]
	}
];
