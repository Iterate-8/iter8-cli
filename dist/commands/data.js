"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const data = new commander_1.Command('data')
    .description('Data operations')
    .argument('<action>', 'Action to perform (list, get <type>)');
// .action(async (action) => { ... });
exports.default = data;
