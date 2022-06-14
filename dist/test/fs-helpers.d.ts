export interface File {
    path: string;
    content: string;
}
export interface JsonFile<T> extends File {
    obj: T;
}
export interface DirectoryApi {
    add(file: File): File;
    addFile(...args: Parameters<typeof file>): File;
    addJsonFile(...args: Parameters<typeof jsonFile>): JsonFile<any>;
    dir(dirPath: string, cb?: (dir: DirectoryApi) => void): DirectoryApi;
}
export declare type ProjectAPI = ReturnType<typeof projectInternal>;
export declare function file(path: string, content?: string): {
    path: string;
    content: string;
};
export declare function jsonFile<T>(path: string, obj: T): JsonFile<T>;
export declare function tempdirProject(name?: string): {
    cwd: string;
    files: never[];
    dir: (dirPath: string, cb?: ((dir: DirectoryApi) => void) | undefined) => DirectoryApi;
    add: (file: File) => File;
    addFile: (path: string, content?: string | undefined) => File;
    addJsonFile: (path: string, obj: unknown) => JsonFile<any>;
    write: () => void;
    rm: () => void;
};
export declare type Project = ReturnType<typeof project>;
export declare function project(name: string): {
    cwd: string;
    files: never[];
    dir: (dirPath: string, cb?: ((dir: DirectoryApi) => void) | undefined) => DirectoryApi;
    add: (file: File) => File;
    addFile: (path: string, content?: string | undefined) => File;
    addJsonFile: (path: string, obj: unknown) => JsonFile<any>;
    write: () => void;
    rm: () => void;
};
declare function projectInternal(cwd: string): {
    cwd: string;
    files: never[];
    dir: (dirPath: string, cb?: ((dir: DirectoryApi) => void) | undefined) => DirectoryApi;
    add: (file: File) => File;
    addFile: (path: string, content?: string | undefined) => File;
    addJsonFile: (path: string, obj: unknown) => JsonFile<any>;
    write: () => void;
    rm: () => void;
};
export {};
