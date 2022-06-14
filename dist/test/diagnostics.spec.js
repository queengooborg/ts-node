"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
const testlib_1 = require("./testlib");
const semver = require("semver");
const lodash_1 = require("lodash");
const test = (0, testlib_1.context)(helpers_1.ctxTsNode);
test.suite('TSError diagnostics', ({ context }) => {
    const test = context((0, lodash_1.once)(async (t) => {
        const service = t.context.tsNodeUnderTest.create({
            compilerOptions: { target: 'es5' },
            skipProject: true,
        });
        try {
            service.compile('new Error(123)', 'test.ts');
        }
        catch (err) {
            return { service, err };
        }
        return { service, err: undefined };
    }));
    const diagnosticCode = 2345;
    const diagnosticMessage = semver.satisfies(helpers_1.ts.version, '2.7')
        ? "Argument of type '123' " +
            "is not assignable to parameter of type 'string | undefined'."
        : "Argument of type 'number' " +
            "is not assignable to parameter of type 'string'.";
    const diagnosticErrorMessage = `TS${diagnosticCode}: ${diagnosticMessage}`;
    const cwdBefore = process.cwd();
    test('should throw errors', ({ log, context: { err, service } }) => {
        log({
            version: helpers_1.ts.version,
            serviceVersion: service.ts.version,
            cwdBefore,
            cwd: process.cwd(),
            configFilePath: service.configFilePath,
            config: service.config.options,
        });
        (0, testlib_1.expect)(err).toBeDefined();
        (0, testlib_1.expect)(err.message).toMatch(diagnosticErrorMessage);
    });
    test('should throw errors with diagnostic text', ({ context: { err } }) => {
        (0, testlib_1.expect)(err.diagnosticText).toMatch(diagnosticErrorMessage);
    });
    test('should throw errors with diagnostic codes', ({ context: { err } }) => {
        (0, testlib_1.expect)(err.diagnosticCodes).toEqual([2345]);
    });
    test('should throw errors with complete diagnostic information', ({ context: { err }, }) => {
        const diagnostics = err.diagnostics;
        (0, testlib_1.expect)(diagnostics).toHaveLength(1);
        (0, testlib_1.expect)(diagnostics[0]).toMatchObject({
            code: 2345,
            start: 10,
            length: 3,
            messageText: testlib_1.expect.stringMatching(diagnosticMessage),
        });
    });
});
//# sourceMappingURL=diagnostics.spec.js.map