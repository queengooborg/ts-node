"use strict";
// Misc regression tests go here if they do not have a better home
Object.defineProperty(exports, "__esModule", { value: true });
const exp = require("expect");
const path_1 = require("path");
const exec_helpers_1 = require("./exec-helpers");
const helpers_1 = require("./helpers");
const testlib_1 = require("./testlib");
const test = (0, testlib_1.context)(helpers_1.ctxTsNode);
const exec = (0, exec_helpers_1.createExecTester)({
    exec: (0, exec_helpers_1.createExec)({
        cwd: helpers_1.TEST_DIR,
    }),
});
test('#1488 regression test', async () => {
    // Scenario that caused the bug:
    // `allowJs` turned on
    // `skipIgnore` turned on so that ts-node tries to compile itself (not ideal but theoretically we should be ok with this)
    // Attempt to `require()` a `.js` file
    // `assertScriptCanLoadAsCJS` is triggered within `require()`
    // `./package.json` needs to be fetched into cache via `assertScriptCanLoadAsCJS` which caused a recursive `require()` call
    // Circular dependency warning is emitted by node
    const { stdout, stderr } = await exec({
        exec: (0, exec_helpers_1.createExec)({
            cwd: (0, path_1.join)(helpers_1.TEST_DIR, '1488'),
        }),
        cmd: `${helpers_1.CMD_TS_NODE_WITHOUT_PROJECT_FLAG} ./index.js`,
    });
    // Assert that we do *not* get `Warning: Accessing non-existent property 'getOptionValue' of module exports inside circular dependency`
    exp(stdout).toBe('foo\n'); // prove that it ran
    exp(stderr).toBe(''); // prove that no warnings
});
//# sourceMappingURL=regression.spec.js.map