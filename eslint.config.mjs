import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const directory = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: directory });
const eslintConfig = [...compat.extends("next/core-web-vitals", "next/typescript")];
const finalConfig = [...eslintConfig, { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] }];

export default finalConfig;
