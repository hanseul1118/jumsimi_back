const ErrorCode = {
    //성공
    OK: 200,
    //생성완료
    CREATED: 201,
    //인서트완료
    INSERTED: 203,
    //업데이트완료
    UPDATED: 204,
    //삭제완료
    DELETED: 205,
    //SELECT FOR UPDATE 오류
    UPDATEERROR: 301,
    //DELETE 오류
    DELETEERROR: 302,
    //ROLLBACK,COMMIT 오류
    TRANSACTIONERROR: 303,
    //INSERT ERROR
    INSERTEERROR: 304,
    //BAD REQUEST
    BADREQUEST: 400,
    //인증오류
    UNAUTHORIZED: 401,
    //데이터 조회실패 및 결과값없음
    NOTFOUND: 404,
    //키값 중복
    DUPLICATEERROR: 410,
    //서버 에러
    SERVERERROR: 500
  };
  
  module.exports = ErrorCode;
  