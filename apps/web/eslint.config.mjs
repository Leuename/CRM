import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

const config = [
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] },
  ...nextCoreWebVitals,
  ...nextTypescript,
  // Turns off the stylistic rules Prettier owns. Must stay last.
  prettier,
  {
    rules: {
      // Every data hook in components/use*.ts opens its effect with
      // setState({ status: "loading" }) before firing the fetch. The rule
      // (new in eslint-plugin-react-hooks 7) flags all 28 of them. Silencing
      // it is deliberate: satisfying it means rewriting every fetch hook onto
      // use()/Suspense or a fetch library, which is a behaviour change, not a
      // lint fix. Re-enable when those hooks are migrated.
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default config;
