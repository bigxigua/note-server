const RESULT_CODES = {
    /* 成功状态码 */
    SUCCESS: create(1, '成功'),

    /* 参数错误：10001-19999 */
    PARAM_IS_INVALID: create(10001, '参数无效'),
    PARAM_IS_BLANK: create(10002, '参数为空'),
    PARAM_NOT_COMPLETE: create(10003, '参数缺失'),

    /* 用户错误：20001-29999*/
    USER_NOT_LOGGED_IN: create(20001, '用户未登录'),
    USER_LOGIN_ERROR: create(20002, '账号不存在或密码错误'),
    USER_ACCOUNT_FORBIDDEN: create(20003, '账号已被禁用'),
    USER_NOT_EXIST: create(20004, '用户不存在'),
    USER_HAS_EXISTED: create(20005, '用户已存在'),

    /* 业务错误：30001-39999 */
    SPECIFIED_QUESTIONED_USER_NOT_EXIST: create(30001, '某业务出现问题'),

    /* 系统错误：40001-49999 */
    SYSTEM_INNER_ERROR: create(40001, '系统繁忙，请稍后重试500'),

    /* 数据错误：50001-599999 */
    RESULE_DATA_NONE: create(50001, '数据未找到'),
    DATA_IS_WRONG: create(50002, '数据有误'),
    DATA_ALREADY_EXISTED: create(50003, '数据已存在'),
    DATA_CREATE_FAILED: create(50004, '数据创建失败'),

    /* 接口错误：60001-69999 */
    INTERFACE_INNER_INVOKE_ERROR: create(60001, '内部系统接口调用异常'),
    INTERFACE_OUTTER_INVOKE_ERROR: create(60002, '外部系统接口调用异常'),
    INTERFACE_FORBID_VISIT: create(60003, '该接口禁止访问'),
    INTERFACE_ADDRESS_INVALID: create(60004, '接口地址无效'),
    INTERFACE_REQUEST_TIMEOUT: create(60005, '接口请求超时'),
    INTERFACE_EXCEED_LOAD: create(60006, '接口负载过高'),

    /* 权限错误：70001-79999 */
    PERMISSION_NO_ACCESS: create(70001, '无访问权限'),

    /* 业务错误 80001-99999 */
    USER_HAS_NOT_CREATED_NOTEBOOK: create(80001, '你暂未创建笔记哟'),
    SUBNOTEBOOK_NOT_EXIT:  create(80002, '未找到该笔记'),
};
const DEFAULT_RESULT = {
    message: '系统繁忙，请稍后再试',
    code: '00000'
};
function create(code, message) {
    return {
        message,
        code
    };
}
exports.serializReuslt = function (status, data = null, extra) {
    const {
        message,
        code
    } = RESULT_CODES[status] || DEFAULT_RESULT;
    return {
        data,
        status: status === 'SUCCESS' ? 'success' : 'failed',
        message,
        code,
        extra
    }
}