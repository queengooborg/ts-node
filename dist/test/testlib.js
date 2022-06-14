"use strict";
/*
 * Extensions to ava, for declaring and running test cases and suites
 * Utilities specific to testing ts-node, for example handling streams and exec-ing processes,
 * should go in a separate module.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.context = exports.test = exports.expect = void 0;
const ava_1 = require("ava");
const assert = require("assert");
const throat_1 = require("throat");
const expect = require("expect");
exports.expect = expect;
// HACK ensure ts-node-specific bootstrapping is executed
require("./helpers");
// NOTE: this limits concurrency within a single process, but AVA launches
// each .spec file in its own process, so actual concurrency is higher.
const concurrencyLimiter = (0, throat_1.default)(16);
function errorPostprocessor(fn) {
    return async function () {
        try {
            return await fn.call(this, arguments);
        }
        catch (error) {
            error === null || error === void 0 ? true : delete error.matcherResult;
            // delete error?.matcherResult?.message;
            if (error === null || error === void 0 ? void 0 : error.message)
                error.message = `\n${error.message}\n`;
            throw error;
        }
    };
}
function once(func) {
    let run = false;
    let ret = undefined;
    return function (...args) {
        if (run)
            return ret;
        run = true;
        ret = func(...args);
        return ret;
    };
}
exports.test = createTestInterface({
    beforeEachFunctions: [],
    mustDoSerial: false,
    automaticallyDoSerial: false,
    automaticallySkip: false,
    // The little right chevron used by ava
    separator: ' \u203a ',
    titlePrefix: undefined,
});
// In case someone wants to `const test = context()`
exports.context = exports.test.context;
function createTestInterface(opts) {
    var _a;
    const { titlePrefix, separator = ' > ' } = opts;
    const beforeEachFunctions = [...((_a = opts.beforeEachFunctions) !== null && _a !== void 0 ? _a : [])];
    let { mustDoSerial, automaticallyDoSerial, automaticallySkip } = opts;
    let hookDeclared = false;
    let suiteOrTestDeclared = false;
    function computeTitle(title, macros, ...args) {
        for (const macro of macros !== null && macros !== void 0 ? macros : []) {
            if (macro.title) {
                title = macro.title(title, ...args);
            }
        }
        assert(title);
        // return `${ titlePrefix }${ separator }${ title }`;
        if (titlePrefix != null && title != null) {
            return `${titlePrefix}${separator}${title}`;
        }
        if (titlePrefix == null && title != null) {
            return title;
        }
    }
    function parseArgs(args) {
        const title = typeof args[0] === 'string' ? args.shift() : undefined;
        const macros = typeof args[0] === 'function'
            ? [args.shift()]
            : Array.isArray(args[0])
                ? args.shift()
                : [];
        return { title, macros, args };
    }
    function assertOrderingForDeclaringTest() {
        suiteOrTestDeclared = true;
    }
    function assertOrderingForDeclaringHook() {
        if (suiteOrTestDeclared) {
            throw new Error('Hooks must be declared before declaring sub-suites or tests');
        }
        hookDeclared = true;
    }
    function assertOrderingForDeclaringSkipUnless() {
        if (suiteOrTestDeclared) {
            throw new Error('skipUnless or runIf must be declared before declaring sub-suites or tests');
        }
    }
    /**
     * @param avaDeclareFunction either test or test.serial
     */
    function declareTest(title, macros, avaDeclareFunction, args, skip = false) {
        const wrappedMacros = macros.map((macro) => {
            return async function (t, ...args) {
                return concurrencyLimiter(errorPostprocessor(async () => {
                    let i = 0;
                    for (const func of beforeEachFunctions) {
                        await func(t);
                        i++;
                    }
                    return macro(t, ...args);
                }));
            };
        });
        const computedTitle = computeTitle(title, macros, ...args);
        (automaticallySkip || skip ? avaDeclareFunction.skip : avaDeclareFunction)(computedTitle, wrappedMacros, ...args);
    }
    function test(...inputArgs) {
        assertOrderingForDeclaringTest();
        // TODO is this safe to disable?
        // X parallel tests will each invoke the beforeAll hook, but once()ification means each invocation will return the same promise, and tests cannot
        // start till it finishes.
        // HOWEVER if it returns a single shared state, can tests concurrently use this shared state?
        // if(!automaticallyDoSerial && mustDoSerial) throw new Error('Cannot declare non-serial tests because you have declared a beforeAll() hook for this test suite.');
        const { args, macros, title } = parseArgs(inputArgs);
        return declareTest(title, macros, automaticallyDoSerial ? ava_1.default.serial : ava_1.default, args);
    }
    test.serial = function (...inputArgs) {
        assertOrderingForDeclaringTest();
        const { args, macros, title } = parseArgs(inputArgs);
        return declareTest(title, macros, ava_1.default.serial, args);
    };
    test.skip = function (...inputArgs) {
        assertOrderingForDeclaringTest();
        const { args, macros, title } = parseArgs(inputArgs);
        return declareTest(title, macros, ava_1.default, args, true);
    };
    test.beforeEach = function (cb) {
        assertOrderingForDeclaringHook();
        beforeEachFunctions.push(cb);
    };
    test.context = function (cb) {
        assertOrderingForDeclaringHook();
        beforeEachFunctions.push(async (t) => {
            const addedContextFields = await cb(t);
            Object.assign(t.context, addedContextFields);
        });
        return test;
    };
    test.beforeAll = function (cb) {
        assertOrderingForDeclaringHook();
        mustDoSerial = true;
        beforeEachFunctions.push(once(cb));
    };
    test.macro = function (cb) {
        function macro(testInterface, ...args) {
            const ret = cb(...args);
            const macroFunction = Array.isArray(ret) ? ret[1] : ret;
            return macroFunction(testInterface);
        }
        macro.title = function (givenTitle, ...args) {
            const ret = cb(...args);
            return Array.isArray(ret)
                ? typeof ret[0] === 'string'
                    ? ret[0]
                    : ret[0](givenTitle)
                : givenTitle;
        };
        return macro;
    };
    test.suite = function (title, cb) {
        suiteOrTestDeclared = true;
        const newApi = createTestInterface({
            mustDoSerial,
            automaticallyDoSerial,
            automaticallySkip,
            separator,
            titlePrefix: computeTitle(title),
            beforeEachFunctions,
        });
        cb(newApi);
    };
    test.runSerially = function () {
        automaticallyDoSerial = true;
    };
    test.skipUnless = test.runIf = function (runIfTrue) {
        assertOrderingForDeclaringSkipUnless();
        automaticallySkip = automaticallySkip || !runIfTrue;
    };
    test.skipIf = function (skipIfTrue) {
        test.runIf(!skipIfTrue);
    };
    return test;
}
//# sourceMappingURL=testlib.js.map