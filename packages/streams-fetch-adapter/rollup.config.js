// @ts-check
import typescript from "typescript";
import tsc from "rollup-plugin-typescript";

const banner = `/**
 * @stardazed/streams-fetch-adapter - patch fetch and Response to work with custom stream implementations
 * Part of Stardazed
 * (c) 2018 by Arthur Langereis - @zenmumbler
 * https://github.com/stardazed/sd-streams-fetch-adapter
 */
`;

export default [
	{
		input: "src/sd-streams-fetch-adapter.ts",
		output: [
			{
				file: "dist/sd-streams-fetch-adapter.esm.js",
				format: "es",
				sourcemap: false,
				intro: banner
			},
			{
				name: "sdStreamsFetchAdapter",
				file: "dist/sd-streams-fetch-adapter.umd.js",
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
