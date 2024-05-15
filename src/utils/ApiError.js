class API_ERROR extends Error {
    constructor(
        statuscode,
        message="something went wrong",
        errors=[],
        stack=""
    ){
        super(message)
        this.statuscode=statuscode,
        this.errors=errors,
        this.message=message,
        this.success=false,
        this.data=null

        if(stack){
            this.stack=stack;

        }else{
            Error.captureStackTrace(this,this.constructor)

        }
    }
}

export {API_ERROR}