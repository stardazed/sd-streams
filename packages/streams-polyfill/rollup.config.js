// @ts-check
import resolve from "@rollup/plugin-node-resolve";
import typescript from "typescript";
import tsc from "@rollup/plugin-typescript";
import { terser } from "rollup-plugin-terser";

const banner = `/*
@stardazed/streams-polyfill - drop-in polyfill for Web Streams with fetch and encoding integration
Part of Stardazed
(c) 2018-Present by @zenmumbler
https://github.com/stardazed/sd-streams
*/`;

export default [
	{
		input: "src/sd-streams-polyfill.ts",
		output: [
			{
				file: "dist/sd-streams-polyfill.min.js",
				format: "iife",
				sourcemap: false,
				banner
			}
		],
		plugins: [
			resolve({ browser: true }),
			tsc({
				typescript,
				include: ["src/**/*.ts"],
			}),
			terser({
				keep_classnames: true,
				keep_fnames: true,
				mangle: true,
				safari10: true,
				output: { comments: /streams\-polyfill/ }
			})
		]
	}
];
