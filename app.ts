import { createInterface } from "readline"
import { parseCode, debugCode, isError } from "./parser"
import { State, debugValue } from "./evaluator"
import { inspect } from "util"

var prompt = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: ""
})

var state = new State()

prompt.on("line", (line) => {
    var code = parseCode(line)
    console.log("")
    console.log(debugCode(code))
    console.log("")
    if (!isError(code)) {
        let ret = state.evalCode(code)
        if (isError(ret)) console.log(debugCode(ret))
        else console.log(debugValue(ret))
    }
    console.log("")
})