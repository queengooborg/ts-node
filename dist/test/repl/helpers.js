"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.macroReplStderrContains = exports.macroReplNoErrorsAndStdoutContains = exports.ctxRepl = void 0;
const stream_1 = require("stream");
const helpers_1 = require("../helpers");
const testlib_1 = require("../testlib");
/**
 * pass to test.context() to get REPL testing helper functions
 */
async function ctxRepl(t) {
    const { tsNodeUnderTest } = t.context;
    return { createReplViaApi, executeInRepl };
    function createReplViaApi({ registerHooks, createReplOpts, createServiceOpts, }) {
        const stdin = new stream_1.PassThrough();
        const stdout = new stream_1.PassThrough();
        const stderr = new stream_1.PassThrough();
        const replService = tsNodeUnderTest.createRepl({
            stdin,
            stdout,
            stderr,
            ...createReplOpts,
        });
        const service = (registerHooks ? tsNodeUnderTest.register : tsNodeUnderTest.create)({
            ...replService.evalAwarePartialHost,
            project: `${helpers_1.TEST_DIR}/tsconfig.json`,
            ...createServiceOpts,
            tsTrace: replService.console.log.bind(replService.console),
        });
        replService.setService(service);
        t.teardown(async () => {
            service.enabled(false);
        });
        return { stdin, stdout, stderr, replService, service };
    }
    async function executeInRepl(input, options) {
        const { waitPattern, 
        // Wait longer if there's a signal to end it early
        waitMs = waitPattern != null ? 20e3 : 1e3, startInternalOptions, ...rest } = options;
        const { stdin, stdout, stderr, replService } = createReplViaApi(rest);
        if (startInternalOptions) {
            replService.startInternal(startInternalOptions);
        }
        else {
            replService.start();
        }
        stdin.write(input);
        stdin.end();
        const stdoutPromise = (0, helpers_1.getStream)(stdout, waitPattern);
        const stderrPromise = (0, helpers_1.getStream)(stderr, waitPattern);
        // Wait for expected output pattern or timeout, whichever comes first
        await Promise.race([(0, helpers_1.delay)(waitMs), stdoutPromise, stderrPromise]);
        stdout.end();
        stderr.end();
        return {
            stdin,
            stdout: await stdoutPromise,
            stderr: await stderrPromise,
        };
    }
}
exports.ctxRepl = ctxRepl;
exports.macroReplNoErrorsAndStdoutContains = testlib_1.test.macro((script, contains, options) => async (t) => {
    macroReplInternal(t, script, contains, undefined, contains, options);
});
exports.macroReplStderrContains = testlib_1.test.macro((script, errorContains, options) => async (t) => {
    macroReplInternal(t, script, undefined, errorContains, errorContains, options);
});
async function macroReplInternal(t, script, stdoutContains, stderrContains, waitPattern, options) {
    const { stdout, stderr } = await t.context.executeInRepl(script, {
        registerHooks: true,
        startInternalOptions: { useGlobal: false },
        waitPattern,
        ...options,
    });
    if (stderrContains)
        (0, testlib_1.expect)(stderr).toContain(stderrContains);
    else
        (0, testlib_1.expect)(stderr).toBe('');
    if (stdoutContains)
        (0, testlib_1.expect)(stdout).toContain(stdoutContains);
}
//# sourceMappingURL=helpers.js.map