const ExtendableError = require("./ExtendableError").ExtendableError;
class FSError extends ExtendableError {}
class CommandExecutionError extends ExtendableError {}
class MissingParamsError extends ExtendableError {}
module.exports = {
    FSError,
    CommandExecutionError,
    MissingParamsError
}