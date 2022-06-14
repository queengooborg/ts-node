/// <reference types="node" />
/// <reference types="node" />
import { NodeFS } from '@yarnpkg/fslib';
import type { Readable } from 'stream';
/**
 * types from ts-node under test
 */
import type * as tsNodeTypes from '../index';
import type { ExecutionContext } from './testlib';
export { tsNodeTypes };
export declare const ROOT_DIR: string;
export declare const DIST_DIR: string;
export declare const TEST_DIR: string;
export declare const PROJECT: string;
export declare const PROJECT_TRANSPILE_ONLY: string;
export declare const BIN_PATH: string;
export declare const BIN_PATH_JS: string;
export declare const BIN_SCRIPT_PATH: string;
export declare const BIN_CWD_PATH: string;
export declare const BIN_ESM_PATH: string;
/** Default `ts-node --project` invocation */
export declare const CMD_TS_NODE_WITH_PROJECT_FLAG: string;
/** Default `ts-node --project` invocation with transpile-only */
export declare const CMD_TS_NODE_WITH_PROJECT_TRANSPILE_ONLY_FLAG: string;
/** Default `ts-node` invocation without `--project` */
export declare const CMD_TS_NODE_WITHOUT_PROJECT_FLAG: string;
export declare const EXPERIMENTAL_MODULES_FLAG: string;
export declare const CMD_ESM_LOADER_WITHOUT_PROJECT: string;
export declare const testsDirRequire: NodeRequire;
export declare const ts: any;
export declare const nodeSupportsEsmHooks: boolean;
export declare const nodeSupportsSpawningChildProcess: boolean;
export declare const nodeUsesNewHooksApi: boolean;
export declare const nodeSupportsImportAssertions: boolean;
export declare const nodeSupportsImportAssertionsTypeJson: boolean;
export declare const nodeSupportsImportingTransformedCjsFromEsm: boolean;
/** Supports tsconfig "extends" >= v3.2.0 */
export declare const tsSupportsTsconfigInheritanceViaNodePackages: boolean;
/** Supports --showConfig: >= v3.2.0 */
export declare const tsSupportsShowConfig: boolean;
/** Supports module:nodenext and module:node16 as *stable* features */
export declare const tsSupportsStableNodeNextNode16: any;
export declare const tsSupportsMtsCtsExtensions: boolean;
export declare const xfs: NodeFS;
/** Pass to `test.context()` to get access to the ts-node API under test */
export declare const ctxTsNode: () => Promise<{
    tsNodeUnderTest: typeof tsNodeTypes;
}>;
export declare namespace ctxTsNode {
    type Ctx = Awaited<ReturnType<typeof ctxTsNode>>;
    type T = ExecutionContext<Ctx>;
}
/**
 * Pack and install ts-node locally, necessary to test package "exports"
 * FS locking b/c tests run in separate processes
 */
export declare function installTsNode(): Promise<void>;
/**
 * Get a stream into a string.
 * Will resolve early if
 */
export declare function getStream(stream: Readable, waitForPattern?: string | RegExp): Promise<string>;
/**
 * Undo all of ts-node & co's installed hooks, resetting the node environment to default
 * so we can run multiple test cases which `.register()` ts-node.
 *
 * Must also play nice with `nyc`'s environmental mutations.
 */
export declare function resetNodeEnvironment(): void;
export declare const delay: typeof setTimeout.__promisify__;
/** Essentially Array:includes, but with tweaked types for checks on enums */
export declare function isOneOf<V>(value: V, arrayOfPossibilities: ReadonlyArray<V>): boolean;
