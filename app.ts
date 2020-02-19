import { createInterface } from "readline"
import { parseCode, debugCode } from "./parser"
import { inspect } from "util"

var prompt = createInterface({
    input: process.stdin,
    output: process.stdout
})

prompt.on("line", (line) => {
    console.log(debugCode(parseCode(line)))
})