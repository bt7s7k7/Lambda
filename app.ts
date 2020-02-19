import { createInterface } from "readline"
import { parseCode } from "./parser"
import { inspect } from "util"

var prompt = createInterface({
    input: process.stdin,
    output: process.stdout
})

prompt.on("line", (line) => {
    console.log(inspect(parseCode(line), false, 5000, true))
})