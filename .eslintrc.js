{
    "ignorePatterns": [
        "build",
        "dist",
        "out",
        "**/*.d.ts"
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": 6,
        "sourceType": "module"
    },
    "plugins": [
        "@typescript-eslint"
    ],
    "root": true,
    "rules": {
        "@typescript-eslint/naming-convention": "warn",
        "@typescript-eslint/semi": "warn",
        "curly": "warn",
        "eqeqeq": "warn",
        "no-throw-literal": "warn",
        "semi": "off"
    }
}
