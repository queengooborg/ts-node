"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.project = exports.tempdirProject = exports.jsonFile = exports.file = void 0;
const helpers_1 = require("./helpers");
const fs = require("fs");
const Path = require("path");
function file(path, content = '') {
    return { path, content };
}
exports.file = file;
function jsonFile(path, obj) {
    const file = {
        path,
        obj,
        get content() {
            return JSON.stringify(obj, null, 2);
        },
    };
    return file;
}
exports.jsonFile = jsonFile;
function tempdirProject(name = '') {
    const rootTmpDir = `${helpers_1.TEST_DIR}/tmp/`;
    fs.mkdirSync(rootTmpDir, { recursive: true });
    const tmpdir = fs.mkdtempSync(`${helpers_1.TEST_DIR}/tmp/${name}`);
    return projectInternal(tmpdir);
}
exports.tempdirProject = tempdirProject;
function project(name) {
    return projectInternal(`${helpers_1.TEST_DIR}/tmp/${name}`);
}
exports.project = project;
function projectInternal(cwd) {
    const files = [];
    function write() {
        for (const file of files) {
            fs.mkdirSync(Path.dirname(file.path), { recursive: true });
            fs.writeFileSync(file.path, file.content);
        }
    }
    function rm() {
        try {
            fs.rmdirSync(cwd, { recursive: true });
        }
        catch (err) {
            if (fs.existsSync(cwd))
                throw err;
        }
    }
    const { add, addFile, addJsonFile, dir } = createDirectory(cwd);
    function createDirectory(dirPath, cb) {
        function add(file) {
            file.path = Path.join(dirPath, file.path);
            files.push(file);
            return file;
        }
        function addFile(...args) {
            return add(file(...args));
        }
        function addJsonFile(...args) {
            return add(jsonFile(...args));
        }
        function dir(path, cb) {
            return createDirectory(Path.join(dirPath, path), cb);
        }
        const _dir = {
            add,
            addFile,
            addJsonFile,
            dir,
        };
        cb === null || cb === void 0 ? void 0 : cb(_dir);
        return _dir;
    }
    return {
        cwd,
        files: [],
        dir,
        add,
        addFile,
        addJsonFile,
        write,
        rm,
    };
}
//# sourceMappingURL=fs-helpers.js.map