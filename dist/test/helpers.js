"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isOneOf = exports.delay = exports.resetNodeEnvironment = exports.getStream = exports.installTsNode = exports.ctxTsNode = exports.xfs = exports.tsSupportsMtsCtsExtensions = exports.tsSupportsStableNodeNextNode16 = exports.tsSupportsShowConfig = exports.tsSupportsTsconfigInheritanceViaNodePackages = exports.nodeSupportsImportingTransformedCjsFromEsm = exports.nodeSupportsImportAssertionsTypeJson = exports.nodeSupportsImportAssertions = exports.nodeUsesNewHooksApi = exports.nodeSupportsSpawningChildProcess = exports.nodeSupportsEsmHooks = exports.ts = exports.testsDirRequire = exports.CMD_ESM_LOADER_WITHOUT_PROJECT = exports.EXPERIMENTAL_MODULES_FLAG = exports.CMD_TS_NODE_WITHOUT_PROJECT_FLAG = exports.CMD_TS_NODE_WITH_PROJECT_TRANSPILE_ONLY_FLAG = exports.CMD_TS_NODE_WITH_PROJECT_FLAG = exports.BIN_ESM_PATH = exports.BIN_CWD_PATH = exports.BIN_SCRIPT_PATH = exports.BIN_PATH_JS = exports.BIN_PATH = exports.PROJECT_TRANSPILE_ONLY = exports.PROJECT = exports.TEST_DIR = exports.DIST_DIR = exports.ROOT_DIR = void 0;
const fslib_1 = require("@yarnpkg/fslib");
const child_process_1 = require("child_process");
const promisify = require("util.promisify");
const rimraf_1 = require("rimraf");
const fs_1 = require("fs");
const path_1 = require("path");
const fs = require("fs");
const proper_lockfile_1 = require("proper-lockfile");
const lodash_1 = require("lodash");
const semver = require("semver");
const createRequire = require('create-require');
//#region Paths
exports.ROOT_DIR = (0, path_1.resolve)(__dirname, '../..');
exports.DIST_DIR = (0, path_1.resolve)(__dirname, '..');
exports.TEST_DIR = (0, path_1.join)(__dirname, '../../tests');
exports.PROJECT = (0, path_1.join)(exports.TEST_DIR, 'tsconfig.json');
exports.PROJECT_TRANSPILE_ONLY = (0, path_1.join)(exports.TEST_DIR, 'tsconfig-transpile-only.json');
exports.BIN_PATH = (0, path_1.join)(exports.TEST_DIR, 'node_modules/.bin/ts-node');
exports.BIN_PATH_JS = (0, path_1.join)(exports.TEST_DIR, 'node_modules/ts-node/dist/bin.js');
exports.BIN_SCRIPT_PATH = (0, path_1.join)(exports.TEST_DIR, 'node_modules/.bin/ts-node-script');
exports.BIN_CWD_PATH = (0, path_1.join)(exports.TEST_DIR, 'node_modules/.bin/ts-node-cwd');
exports.BIN_ESM_PATH = (0, path_1.join)(exports.TEST_DIR, 'node_modules/.bin/ts-node-esm');
process.chdir(exports.TEST_DIR);
//#endregion
//#region command lines
/** Default `ts-node --project` invocation */
exports.CMD_TS_NODE_WITH_PROJECT_FLAG = `"${exports.BIN_PATH}" --project "${exports.PROJECT}"`;
/** Default `ts-node --project` invocation with transpile-only */
exports.CMD_TS_NODE_WITH_PROJECT_TRANSPILE_ONLY_FLAG = `"${exports.BIN_PATH}" --project "${exports.PROJECT_TRANSPILE_ONLY}"`;
/** Default `ts-node` invocation without `--project` */
exports.CMD_TS_NODE_WITHOUT_PROJECT_FLAG = `"${exports.BIN_PATH}"`;
exports.EXPERIMENTAL_MODULES_FLAG = semver.gte(process.version, '12.17.0')
    ? ''
    : '--experimental-modules';
exports.CMD_ESM_LOADER_WITHOUT_PROJECT = `node ${exports.EXPERIMENTAL_MODULES_FLAG} --loader ts-node/esm`;
//#endregion
// `createRequire` does not exist on older node versions
exports.testsDirRequire = createRequire((0, path_1.join)(exports.TEST_DIR, 'index.js'));
exports.ts = (0, exports.testsDirRequire)('typescript');
//#region version checks
exports.nodeSupportsEsmHooks = semver.gte(process.version, '12.16.0');
exports.nodeSupportsSpawningChildProcess = semver.gte(process.version, '12.17.0');
exports.nodeUsesNewHooksApi = semver.gte(process.version, '16.12.0');
exports.nodeSupportsImportAssertions = (semver.gte(process.version, '16.14.0') &&
    semver.lt(process.version, '17.0.0')) ||
    semver.gte(process.version, '17.1.0');
exports.nodeSupportsImportAssertionsTypeJson = (semver.gte(process.version, '16.15.0') &&
    semver.lt(process.version, '17.0.0')) ||
    semver.gte(process.version, '17.5.0');
// Node 14.13.0 has a bug where it tries to lex CJS files to discover named exports *before*
// we transform the code.
// In other words, it tries to parse raw TS as CJS and balks at `export const foo =`, expecting to see `exports.foo =`
// This lexing only happens when CJS TS is imported from the ESM loader.
exports.nodeSupportsImportingTransformedCjsFromEsm = semver.gte(process.version, '14.13.1');
/** Supports tsconfig "extends" >= v3.2.0 */
exports.tsSupportsTsconfigInheritanceViaNodePackages = semver.gte(exports.ts.version, '3.2.0');
/** Supports --showConfig: >= v3.2.0 */
exports.tsSupportsShowConfig = semver.gte(exports.ts.version, '3.2.0');
/** Supports module:nodenext and module:node16 as *stable* features */
exports.tsSupportsStableNodeNextNode16 = exports.ts.version.startsWith('4.7.') || semver.gte(exports.ts.version, '4.7.0');
// TS 4.5 is first version to understand .cts, .mts, .cjs, and .mjs extensions
exports.tsSupportsMtsCtsExtensions = semver.gte(exports.ts.version, '4.5.0');
//#endregion
exports.xfs = new fslib_1.NodeFS(fs);
/** Pass to `test.context()` to get access to the ts-node API under test */
exports.ctxTsNode = (0, lodash_1.once)(async () => {
    await installTsNode();
    const tsNodeUnderTest = (0, exports.testsDirRequire)('ts-node');
    return {
        tsNodeUnderTest,
    };
});
//#region install ts-node tarball
const ts_node_install_lock = process.env.ts_node_install_lock;
const lockPath = (0, path_1.join)(__dirname, ts_node_install_lock);
/**
 * Pack and install ts-node locally, necessary to test package "exports"
 * FS locking b/c tests run in separate processes
 */
async function installTsNode() {
    await lockedMemoizedOperation(lockPath, async () => {
        const totalTries = process.platform === 'win32' ? 5 : 1;
        let tries = 0;
        while (true) {
            try {
                (0, rimraf_1.sync)((0, path_1.join)(exports.TEST_DIR, 'node_modules'));
                await promisify(child_process_1.exec)(`npm install`, { cwd: exports.TEST_DIR });
                const packageLockPath = (0, path_1.join)(exports.TEST_DIR, 'package-lock.json');
                (0, fs_1.existsSync)(packageLockPath) && (0, fs_1.unlinkSync)(packageLockPath);
                break;
            }
            catch (e) {
                tries++;
                if (tries >= totalTries)
                    throw e;
            }
        }
    });
}
exports.installTsNode = installTsNode;
/**
 * Attempt an operation once across multiple processes, using filesystem locking.
 * If it was executed already by another process, and it errored, throw the same error message.
 */
async function lockedMemoizedOperation(lockPath, operation) {
    const releaseLock = await (0, proper_lockfile_1.lock)(lockPath, {
        realpath: false,
        stale: 120e3,
        retries: {
            retries: 120,
            maxTimeout: 1000,
        },
    });
    try {
        const operationHappened = (0, fs_1.existsSync)(lockPath);
        if (operationHappened) {
            const result = JSON.parse((0, fs_1.readFileSync)(lockPath, 'utf8'));
            if (result.error)
                throw result.error;
        }
        else {
            const result = { error: null };
            try {
                await operation();
            }
            catch (e) {
                result.error = `${e}`;
                throw e;
            }
            finally {
                (0, fs_1.writeFileSync)(lockPath, JSON.stringify(result));
            }
        }
    }
    finally {
        releaseLock();
    }
}
//#endregion
/**
 * Get a stream into a string.
 * Will resolve early if
 */
function getStream(stream, waitForPattern) {
    let resolve;
    const promise = new Promise((res) => {
        resolve = res;
    });
    const received = [];
    let combinedBuffer = Buffer.concat([]);
    let combinedString = '';
    stream.on('data', (data) => {
        received.push(data);
        combine();
        if ((typeof waitForPattern === 'string' &&
            combinedString.indexOf(waitForPattern) >= 0) ||
            (waitForPattern instanceof RegExp && combinedString.match(waitForPattern)))
            resolve(combinedString);
        combinedBuffer = Buffer.concat(received);
    });
    stream.on('end', () => {
        resolve(combinedString);
    });
    return promise;
    function combine() {
        combinedBuffer = Buffer.concat(received);
        combinedString = combinedBuffer.toString('utf8');
    }
}
exports.getStream = getStream;
//#region Reset node environment
const defaultRequireExtensions = captureObjectState(require.extensions);
// Avoid node deprecation warning for accessing _channel
const defaultProcess = captureObjectState(process, ['_channel']);
const defaultModule = captureObjectState(require('module'));
const defaultError = captureObjectState(Error);
const defaultGlobal = captureObjectState(global);
/**
 * Undo all of ts-node & co's installed hooks, resetting the node environment to default
 * so we can run multiple test cases which `.register()` ts-node.
 *
 * Must also play nice with `nyc`'s environmental mutations.
 */
function resetNodeEnvironment() {
    var _a;
    const sms = require('@cspotcode/source-map-support');
    // We must uninstall so that it resets its internal state; otherwise it won't know it needs to reinstall in the next test.
    sms.uninstall();
    // Must remove handlers to avoid a memory leak
    sms.resetRetrieveHandlers();
    // Modified by ts-node hooks
    resetObject(require.extensions, defaultRequireExtensions, undefined, undefined, undefined, true);
    // ts-node attaches a property when it registers an instance
    // source-map-support monkey-patches the emit function
    // Avoid node deprecation warnings for setting process.config or accessing _channel
    resetObject(process, defaultProcess, undefined, ['_channel'], ['config']);
    // source-map-support swaps out the prepareStackTrace function
    resetObject(Error, defaultError);
    // _resolveFilename et.al. are modified by ts-node, tsconfig-paths, source-map-support, yarn, maybe other things?
    resetObject(require('module'), defaultModule, undefined, ['wrap', 'wrapper']);
    // May be modified by REPL tests, since the REPL sets globals.
    // Avoid deleting nyc's coverage data.
    resetObject(global, defaultGlobal, ['__coverage__']);
    // Reset our ESM hooks
    (_a = process.__test_setloader__) === null || _a === void 0 ? void 0 : _a.call(process, undefined);
}
exports.resetNodeEnvironment = resetNodeEnvironment;
function captureObjectState(object, avoidGetters = []) {
    const descriptors = Object.getOwnPropertyDescriptors(object);
    const values = (0, lodash_1.mapValues)(descriptors, (_d, key) => {
        if (avoidGetters.includes(key))
            return descriptors[key].value;
        return object[key];
    });
    return {
        descriptors,
        values,
    };
}
// Redefine all property descriptors and delete any new properties
function resetObject(object, state, doNotDeleteTheseKeys = [], doNotSetTheseKeys = [], avoidSetterIfUnchanged = [], reorderProperties = false) {
    var _a;
    const currentDescriptors = Object.getOwnPropertyDescriptors(object);
    for (const key of Object.keys(currentDescriptors)) {
        if (doNotDeleteTheseKeys.includes(key))
            continue;
        if ((0, lodash_1.has)(state.descriptors, key))
            continue;
        delete object[key];
    }
    // Trigger nyc's setter functions
    for (const [key, value] of Object.entries(state.values)) {
        try {
            if (doNotSetTheseKeys === true || doNotSetTheseKeys.includes(key))
                continue;
            if (avoidSetterIfUnchanged.includes(key) && object[key] === value)
                continue;
            (_a = state.descriptors[key].set) === null || _a === void 0 ? void 0 : _a.call(object, value);
        }
        catch { }
    }
    // Reset descriptors
    Object.defineProperties(object, state.descriptors);
    if (reorderProperties) {
        // Delete and re-define each property so that they are in original order
        const originalOrder = Object.keys(state.descriptors);
        const properties = Object.getOwnPropertyDescriptors(object);
        const sortedKeys = (0, lodash_1.sortBy)(Object.keys(properties), (name) => originalOrder.includes(name) ? originalOrder.indexOf(name) : 999);
        for (const key of sortedKeys) {
            delete object[key];
            Object.defineProperty(object, key, properties[key]);
        }
    }
}
//#endregion
exports.delay = promisify(setTimeout);
/** Essentially Array:includes, but with tweaked types for checks on enums */
function isOneOf(value, arrayOfPossibilities) {
    return arrayOfPossibilities.includes(value);
}
exports.isOneOf = isOneOf;
//# sourceMappingURL=helpers.js.map