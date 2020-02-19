import { createInterface } from "readline"

var prompt = createInterface({
    input: process.stdin, 
    output: process.stdout
})

prompt.on("line", (line)=>{
    console.log(`Got: ${line}`)
})