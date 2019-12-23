// @ts-check
import typescript from "typescript";
import tsc from "@rollup/plugin-typescript";

const banner = `/**
* @stardazed/streams-text-encoding - implementation of text encoder and decoder streams
* Part of Stardazed
* (c) 2018-Present by Arthur Langereis - @zenmumbler
* https://github.com/stardazed/sd-streams
*/`;

export default [
	{
		input: "src/sd-streams-text-encoding.ts",
		output: [
			{
				file: "dist/sd-streams-text-encoding.esm.js",
				format: "es",
				sourcemap: false,
				intro: banner
			},
			{
				name: "sdStreamsTextEncoding",
				file: "dist/sd-streams-text-encoding.umd.js",
				format: "umd",
				sourcemap: false,
				intro: banner
			}
		],
		plugins: [
			tsc({
				typescript,
				include: ["src/**/*.ts"],
			})
		]
	}
];
