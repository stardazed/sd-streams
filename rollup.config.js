// @ts-check
import typescript from "typescript";
import tsc from "rollup-plugin-typescript";

const banner = `/**
* @stardazed/streams - implementation of the web streams standard
* Part of Stardazed
* (c) 2018 by Arthur Langereis - @zenmumbler
* https://github.com/stardazed/sd-streams
*/`;

export default [
	{
		input: "src/sd-streams.ts",
		output: [
			{
				file: "dist/sd-streams.esm.js",
				format: "es",
				sourcemap: false,
				intro: banner
			},
			{
				name: "sdStreams",
				file: "dist/sd-streams.umd.js",
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
