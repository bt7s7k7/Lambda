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



var codeModules = {
    std: `
I = >a a
K = >a>b a
KI = K I
C = >f>a>b f b a
M = >a a a
`,
    logic: `
true = K
false = KI
not = >a a false true
and = >a>b a (b true false) false
or = >a>b a true (b true false)
`
}

function importCode(name: string) {
    if (name in codeModules) {
        for (let line of codeModules[name].split("\n")) {
            let code = parseCode(line)
            if (!isError(code)) state.evalCode(code)
            else throw new Error("Error in module:\n" + debugCode(code))
        }
    } else console.log("Unknown module")
}

var debugLogging = false

importCode("std")

prompt.on("line", (line) => {
    if (line == "debug") {
        debugLogging = !debugLogging
        console.log(`\nDebug mode is now ${debugLogging ? "enabled" : "disabled"}\n`)
        return
    }
    
    {
        let split = line.split(" ")
        if (split[0] == "import") {
            importCode(split[1])
            console.log(`Imported ${split[1]}`)
            return
        }
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