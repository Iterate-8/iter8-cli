"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const ask = new commander_1.Command('ask')
    .description('Ask a question to the API')
    .argument('<question>', 'Question to ask');
// .action(async (question) => { ... });
exports.default = ask;
