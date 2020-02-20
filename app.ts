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

var debugLogging = false

prompt.on("line", (line) => {
    if (line == "debug") {
        debugLogging = !debugLogging
        console.log(`\nDebug mode is now ${debugLogging ? "enabled" : "disabled"}\n`)
        return
     }
    var code = parseCode(line)
    console.log("")
    if (debugLogging || isError(code)) {
        console.log(debugCode(code))
        console.log("")
    }
    if (!isError(code)) {
        let ret = state.evalCode(code, (l) => { if (debugLogging) console.log(l) })
        if (debugLogging) console.log("")
        if (isError(ret)) console.log(debugCode(ret))
        else console.log(debugValue(ret))
    }
    console.log("")
})