import { IToken, ICode, TokenType, isError, ICodeError, debugCode } from "./parser";

export interface IValue {
    names: string[]
    function: IToken
    functionScope: Scope
    base: IToken
}

/*

    (>a a) x

*/

export class Scope {
    public values: { [index: string]: IValue } = {}

    constructor(public parent: Scope = null) { }
    public find(key: string): IValue | null {
        if (key in this.values) return this.values[key]
        else if (this.parent != null) return this.parent.find(key)
        else return null
    }

    public bind(key: string, value: IValue) {
        this.values[key] = value
    }
}


export class State {

    protected boundValues = new Scope()

    public evalCode(code: ICode, debugLog = (line: string) => {}) {
        if (code.rootToken == null) return null

        var evalFunc = (func: IValue, arg: IValue) => {
            var argName = func.base.argument.code.text.substr(func.base.argument.start, func.base.argument.end - func.base.argument.start)
            var newScope = new Scope(func.functionScope)
            newScope.bind(argName, arg)
            debugLog(debugCode({ code: func.base.argument.code, message: "Binding argument...", location: func.base.argument.start } as ICodeError))
            debugLog(debugCode({ code: arg.base.code, message: "...from here", location: arg.base.start } as ICodeError))

            return evalToken(func.base.body, newScope)
        }

        var evalToken = (token: IToken, scope: Scope): ICodeError | IValue => {
            let tokenText = token.code.text.substr(token.start, token.end - token.start)
            switch (token.type) {
                case TokenType.Identifier: {
                    let found = scope.find(tokenText)
                    if (found) {
                        debugLog(debugCode({ code: token.code, message: "Dereferencing bound identifier", location: token.start } as ICodeError))
                        return found
                    }
                    else {
                        debugLog(debugCode({ code: token.code, message: "Free identifier, creating new value", location: token.start } as ICodeError))
                        return { names: [tokenText], function: null, base: token } as IValue
                    }
                    break;
                }
                case TokenType.Application: {
                    let func = token.body == null ? scope.find(tokenText) : evalToken(token.body, scope)
                    if (isError(func)) return func
                    else if (func == null) return { code, location: token.start, message: "Identifier is not bound" } as ICodeError
                    else if (func.function == null) return { code, location: token.start, message: "Identifier is not bound to a function" } as ICodeError

                    if (token.argument) {
                        let arg = evalToken(token.argument, scope)
                        if (isError(arg)) return arg

                        return evalFunc(func, arg)
                    } else {
                        return func
                    }

                    break;
                }
                case TokenType.Abstraction: {
                    debugLog(debugCode({ code: token.code, message: "Creating new function", location: token.start } as ICodeError))
                    return { base: token, function: token, names: [], functionScope: scope } as IValue
                }
                case TokenType.Binding: {
                    let name = token.argument.code.text.substr(token.argument.start, token.argument.end - token.argument.start)
                    let value = evalToken(token.body, scope)
                    if (isError(value)) return value
                    value.names.push(name)
                    this.boundValues.bind(name, value)
                    return value
                }

                default:
                    break;
            }
        }

        return evalToken(code.rootToken, this.boundValues)
    }
}

export function debugValue(value: IValue) {
    if (value == null) return "No value returned"
    var ret = [] as string[]
    ret.push("Value names: " + value.names.join(", "))
    if (value.function) {
        ret.push(debugCode({ code: value.function.code, message: "Value is a function defined here", location: value.function.start } as ICodeError))
    } else if (value.base) {
        ret.push(debugCode({ code: value.base.code, message: "Value is a free identifier created here", location: value.base.start } as ICodeError))
    }

    return ret.join("\n")
}