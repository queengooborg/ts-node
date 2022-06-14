/// <reference types="node" />
import { PassThrough } from 'stream';
import { tsNodeTypes, ctxTsNode } from '../helpers';
import type { ExecutionContext } from 'ava';
export interface CreateReplViaApiOptions {
    registerHooks: boolean;
    createReplOpts?: Partial<tsNodeTypes.CreateReplOptions>;
    createServiceOpts?: Partial<tsNodeTypes.CreateOptions>;
}
export interface ExecuteInReplOptions extends CreateReplViaApiOptions {
    waitMs?: number;
    waitPattern?: string | RegExp;
    /** When specified, calls `startInternal` instead of `start` and passes options */
    startInternalOptions?: Parameters<tsNodeTypes.ReplService['startInternal']>[0];
}
export declare namespace ctxRepl {
    type Ctx = ctxTsNode.Ctx & Awaited<ReturnType<typeof ctxRepl>>;
    type T = ExecutionContext<Ctx>;
}
/**
 * pass to test.context() to get REPL testing helper functions
 */
export declare function ctxRepl(t: ctxTsNode.T): Promise<{
    createReplViaApi: ({ registerHooks, createReplOpts, createServiceOpts, }: CreateReplViaApiOptions) => {
        stdin: PassThrough;
        stdout: PassThrough;
        stderr: PassThrough;
        replService: tsNodeTypes.ReplService;
        service: tsNodeTypes.Service;
    };
    executeInRepl: (input: string, options: ExecuteInReplOptions) => Promise<{
        stdin: PassThrough;
        stdout: string;
        stderr: string;
    }>;
}>;
export declare const macroReplNoErrorsAndStdoutContains: import("../testlib").AvaMacro<[script: string, contains: string, options?: Partial<ExecuteInReplOptions> | undefined], ctxRepl.Ctx>;
export declare const macroReplStderrContains: import("../testlib").AvaMacro<[script: string, errorContains: string, options?: Partial<ExecuteInReplOptions> | undefined], ctxRepl.Ctx>;
