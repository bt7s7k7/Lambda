export function isLetter(char: string) {
    return (char.charCodeAt(0) >= "a".charCodeAt(0) && char.charCodeAt(0) <= "z".charCodeAt(0))
        || (char.charCodeAt(0) >= "A".charCodeAt(0) && char.charCodeAt(0) <= "Z".charCodeAt(0));
}

export interface ICode {
    rootToken: IToken
    text: string
}

export enum TokenType {
    identifier,
    application,
    abstraction,
    grouping,
    binding
}

export interface IToken {
    start: number
    end: number
    argument: IToken
    /** Body of an abstraction, only needed when type == abstraction */
    body: IToken
    type: TokenType
    code: ICode
}
/*

   a a

   a : app [ a : ident ]

*/
export function parseCode(codeText: string) {
    var code = { text: codeText, rootToken: null } as ICode
    var rootToken = code.rootToken

    var stack = [] as IToken[]
    var groupStack = [] as number[]
    var curr = ""
    var currStart = -1
    let pos = 0

    var finishIdent = () => {
        if (curr != "") {
            let newToken = { start: currStart, end: pos, argument: null, type: TokenType.identifier, code, body: null } as IToken
            currStart = -1
            curr = ""

            if (stack.length != 0) {
                let parent = stack[stack.length - 1]
                if (parent.type == TokenType.identifier || parent.type == TokenType.application) {
                    parent.type = TokenType.application
                    parent.argument = newToken
                    stack.push(newToken)
                } else if (parent.type == TokenType.grouping) {
                    parent.type = TokenType.application
                    parent.body = newToken
                    stack.push(newToken)
                } else {
                    throw new Error("Wrong parent type")
                }
            } else stack.push(newToken)
            
        }
    }

    for (; pos < codeText.length; pos++) {
        let char = codeText[pos]

        if (isLetter(char)) {
            curr += char
            if (currStart == -1) currStart = pos
        } else {
            finishIdent()
            if (char == "(") {
                let newToken = { start: pos, end: pos + 1, argument: null, type: TokenType.grouping, code, body: null } as IToken

                if (stack.length != 0) {
                    let parent = stack[stack.length - 1]
                    if (parent.type == TokenType.identifier || parent.type == TokenType.application) {
                        parent.type = TokenType.application
                        parent.argument = newToken
                        stack.push(newToken)
                        groupStack.push(stack.length)
                    } else if (parent.type == TokenType.grouping) {
                        parent.type = TokenType.application
                        parent.body = newToken
                        stack.push(newToken)
                        groupStack.push(stack.length)
                    } else {
                        throw new Error("Wrong parent type")
                    }
                } else {
                    stack.push(newToken)
                    groupStack.push(stack.length)
                }

                stack.push(newToken)
            } else if (char == ")") {
                if (groupStack.length == 0) throw Error("Unbalanced bracket at " + pos)
                stack.length = groupStack[groupStack.length - 1]

            } else if(char == " ") {
                // Ignore spaces
            } else throw new Error("Invalid char at " + pos)
        }
    }

    finishIdent()

    code.rootToken = stack[0]
    return code
}

export function debugCode(code: ICode) {
    var ret = []
    ret.push(code.text)

    var visit = (token: IToken, path: string) => {
        ret.push(" ".repeat(token.start) + "-".repeat(token.end - token.start) + " ".repeat(code.text.length - token.end + 1) + path)
        if (token.argument) visit(token.argument, path + "/a")
        if (token.body) visit(token.body, path + "/b")
    }

    if (code.rootToken) visit(code.rootToken, "")

    return ret.join("\n")
}
