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

for (let line of `
I = >a a
K = >a>b a
KI = K I
C = >f>a>b f b a
`.split("\n")) {
    let code = parseCode(line)
    if (!isError(code)) state.evalCode(code)
    else throw new Error("Error in bootstraper:\n" + debugCode(code))
}

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