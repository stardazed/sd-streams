// @ts-check
import typescript from "typescript";
import tsc from "rollup-plugin-typescript";

export default [
	{
		input: "src/sd-streams.ts",
		output: [
			{
				file: "dist/sd-streams.esm.js",
				format: "es",
				sourcemap: false,
				compact: true,
				banner: `/**
* @stardazed/streams - implementation of the web streams standard
* Part of Stardazed
* (c) 2018 by Arthur Langereis - @zenmumbler
* https://github.com/stardazed/sd-streams
*/`
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
