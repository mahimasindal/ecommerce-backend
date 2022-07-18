class ErrorHandler extends Error{
    constructor(message,statusCode){
        super(message);
        this.name="not_found"
        this.statusCode = statusCode

        Error.captureStackTrace(this,this.constructor);
    }
   
}

module.exports = ErrorHandler