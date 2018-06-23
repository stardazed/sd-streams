// @ts-check
import typescript from "typescript";
import tsc from "rollup-plugin-typescript2";

export default [
	{
		input: "src/index.ts",
		output: [
			{
				file: "dist/index.esm.js",
				format: "es",
				sourcemap: false,
			}
		],
		plugins: [
			tsc({
				typescript,
				cacheRoot: "./build",
				include: ["src/**/*.ts"],
			})
		]
	}
];
