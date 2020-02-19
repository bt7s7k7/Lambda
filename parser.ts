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
    var curr = ""
    var currStart = -1
    let pos = 0

    var finish = () => {
        if (curr != "") {
            let newToken = { start: currStart, end: pos, argument: null, type: TokenType.identifier, code, body: null } as IToken
            currStart = -1

            if (stack.length != 0) {
                let parent = stack[stack.length - 1]
                if (parent.type == TokenType.identifier) {
                    parent.type = TokenType.application
                    parent.argument = newToken
                } else {
                    throw new Error("Wrong parent type")
                }
            }

            stack.push(newToken)
        }
    }

    for (; pos < codeText.length; pos++) {
        let char = codeText[pos]

        if (isLetter(char)) {
            curr += char
            if (currStart == -1) currStart = pos
        } else {
            finish()
        }
    }

    finish()

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
