export function isLetter(char: string) {
    return (char.charCodeAt(0) >= "a".charCodeAt(0) && char.charCodeAt(0) <= "z".charCodeAt(0))
        || (char.charCodeAt(0) >= "A".charCodeAt(0) && char.charCodeAt(0) <= "Z".charCodeAt(0));
}

export interface ICode {
    rootToken: IToken
    text: string
}

export interface ICodeError {
    location: number
    message: string
    code: ICode
}

export enum TokenType {
    Identifier,
    Application,
    Abstraction,
    Grouping,
    Binding
}

export interface IToken {
    start: number
    end: number
    expEnd: number
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
            let newToken = { start: currStart, end: pos, argument: null, type: TokenType.Identifier, code, body: null } as IToken
            currStart = -1
            curr = ""

            if (stack.length != 0) {
                let parent = stack[stack.length - 1]
                if (parent.type == TokenType.Identifier || parent.type == TokenType.Application) {
                    parent.type = TokenType.Application
                    parent.argument = newToken
                    stack.push(newToken)
                } else if (parent.type == TokenType.Grouping || parent.type == TokenType.Binding) {
                    if (parent.type == TokenType.Grouping) parent.type = TokenType.Application
                    parent.body = newToken
                    stack.push(newToken)
                } else if (parent.type == TokenType.Abstraction) {
                    if (parent.argument == null) {
                        parent.argument = newToken
                    } else if (parent.body == null) {
                        parent.body = newToken
                        stack.push(newToken)
                    } else {
                        return makeError("For some unknown reason an abstraction has a body and argument but is still on the top of the stack")
                    }
                } else {
                    return makeError("Wrong parent type")
                }
            } else stack.push(newToken)

        }
        return false
    }

    var makeError = (message: string) => {
        return { message, location: pos, code: code } as ICodeError
    }

    for (; pos < codeText.length; pos++) {
        let char = codeText[pos]

        if (isLetter(char)) {
            curr += char
            if (currStart == -1) currStart = pos
        } else {
            {
                let ret = finishIdent()
                if (ret != false) return ret
            }
            if (char == "(") {
                let newToken = { start: pos, end: pos + 1, argument: null, type: TokenType.Grouping, code, body: null } as IToken

                if (stack.length != 0) {
                    let parent = stack[stack.length - 1]
                    if (parent.type == TokenType.Identifier || parent.type == TokenType.Application) {
                        parent.type = TokenType.Application
                        parent.argument = newToken
                        stack.push(newToken)
                        groupStack.push(stack.length)
                    } else if (parent.type == TokenType.Grouping || parent.type == TokenType.Binding) {
                        if (parent.type == TokenType.Grouping) parent.type = TokenType.Application
                        parent.body = newToken
                        stack.push(newToken)
                        groupStack.push(stack.length)
                    } else if (parent.type == TokenType.Abstraction) {
                        if (parent.argument == null) {
                            return makeError("Can't use grouping in function argument")
                        } else {
                            parent.body = newToken
                            stack.push(newToken)
                            groupStack.push(stack.length)
                        }
                    } else {
                        return makeError("Wrong parent type")
                    }
                } else {
                    stack.push(newToken)
                    groupStack.push(stack.length)
                }

                stack.push(newToken)
            } else if (char == ")") {
                let top = stack[stack.length - 1]
                if (top && top.type == TokenType.Abstraction) {
                    if (top.argument == null) return makeError("Abstraction missing argument identifier")
                    if (top.body == null) return makeError("Abstraction missing body tokens")
                }
                if (groupStack.length == 0) return makeError("Unbalanced bracket")
                stack.length = groupStack[groupStack.length - 1]
                groupStack.pop()
            } else if (char == " ") {
                // Ignore spaces
            } else if (char == ">") {
                let newToken = { start: pos, end: pos + 1, argument: null, type: TokenType.Abstraction, code, body: null } as IToken

                if (stack.length != 0) {
                    let parent = stack[stack.length - 1]
                    if (parent.type == TokenType.Identifier || parent.type == TokenType.Application) {
                        if (parent.type == TokenType.Identifier) parent.type = TokenType.Application
                        parent.argument = newToken
                        stack.push(newToken)
                    } else if (parent.type == TokenType.Grouping || parent.type == TokenType.Binding) {
                        if (parent.type == TokenType.Grouping) parent.type = TokenType.Application
                        parent.body = newToken
                        stack.push(newToken)
                    } else if (parent.type == TokenType.Abstraction) {
                        if (parent.argument == null) {
                            return makeError("Can't use abstraction in function argument")
                        } else {
                            parent.body = newToken
                            stack.push(newToken)
                        }
                    } else {
                        return makeError("Wrong parent type")
                    }
                } else {
                    stack.push(newToken)
                }

                stack.push(newToken)
            } else if (char == "=") {
                if (stack.length != 1) return makeError("Binding must be used after one identifier")
                let newToken = { start: pos, end: pos + 1, argument: null, type: TokenType.Binding, code, body: null } as IToken
                let ident = stack[0]
                if (ident.type == TokenType.Identifier) {
                    stack[0] = newToken
                    newToken.argument = ident
                } else return makeError("Binding must be used after one identifier")

            } else return makeError("Invalid char")
        }
    }

    {
        let ret = finishIdent()
        if (ret != false) return ret
    }

    code.rootToken = stack[0]

    var visitToken = (token: IToken, parent: IToken) => {
        if (token == null) return
        token.expEnd = token.end
        visitToken(token.body, token)
        visitToken(token.argument, token)

        if (parent)
            if (parent.expEnd < token.expEnd) parent.expEnd = token.expEnd
    }
    visitToken(code.rootToken, null)

    return code
}

export function isError(target: ICodeError | any): target is ICodeError {
    if (typeof target != "object" || target == null) return false
    return "message" in target && "location" in target
}

export function debugCode(target: ICode | ICodeError) {
    var ret = []
    
    if (isError(target)) {
        ret.push(target.code.text)
        ret.push(" ".repeat(target.location) + "^ " + target.message)
    } else {
        ret.push(target.text)
        var visit = (token: IToken, path: string) => {
            ret.push(" ".repeat(token.start) + "-".repeat(token.expEnd - token.start) + " ".repeat(target.text.length - token.expEnd + 1) + path)
            if (token.argument) visit(token.argument, path + "/a")
            if (token.body) visit(token.body, path + "/b")
        }

        if (target.rootToken) visit(target.rootToken, "")
    }

    return ret.join("\n")
}
