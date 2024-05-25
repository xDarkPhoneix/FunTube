class ApiResponse {
constructor(
    statuscode,
    message="Sucess",
    data

){
    this.statuscode=statuscode,
    this.data=data,
    this.message=message,
    this.sucess=statuscode<400

}



}

export {ApiResponse}