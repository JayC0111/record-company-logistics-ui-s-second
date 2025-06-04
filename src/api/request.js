import axios from 'axios';
import { ElMessage, ElMessageBox } from 'element-plus';
import mockService from '@/mock'; // 您的mock服务统一出口

// 1. 确保 useMock 为 true
const useMock = true;

// 2. 从 realApiPaths 移除认证相关的路径，或确保它们不在此处，以便它们走mock
const realApiPaths = [
  // 原本可能包含 '/auth/login', '/auth/logout', '/auth/info'
  // 现在我们将它们移除，或者确保它们不在这里，除非您有特殊后端需要调用
  // 例如，如果后端登出接口已实现且需要调用，可以保留 '/auth/logout'
  '/auth/logout', // 假设登出接口是真实存在的，或者也想mock掉就移除
];

const isRealApiPath = (url) => {
  return realApiPaths.some(prefix => url.startsWith(prefix));
};

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000
});

// --- 请求拦截器 (保持不变) ---
service.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// --- 响应拦截器 (保持不变) ---
service.interceptors.response.use(
  response => {
    const res = response.data;
    if (res.code !== 200) {
      ElMessage({
        message: res.message || '请求失败',
        type: 'error',
        duration: 5 * 1000
      });
      if (res.code === 401) {
        ElMessageBox.confirm(
          '登录状态已过期，请重新登录',
          '系统提示',
          {
            confirmButtonText: '重新登录',
            cancelButtonText: '取消',
            type: 'warning'
          }
        ).then(() => {
          // 清除 Pinia store 中的用户状态
          // const userStore = useUserStore(); // 如果在此处无法直接使用pinia store
          // userStore.logout(); // 建议在auth.js的action中处理跳转和状态清除
          localStorage.removeItem('token');
          localStorage.removeItem('userInfo');
          window.location.href = '/login'; // 或者 router.push('/login')
        });
      }
      return Promise.reject(new Error(res.message || '请求失败'));
    } else {
      return res;
    }
  },
  error => {
    console.error('响应错误:', error);
    const message = error.response?.data?.message || error.message;
    ElMessage({
      message: message,
      type: 'error',
      duration: 5 * 1000
    });
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      window.location.href = '/login';
    }
    if (error.response?.status === 403) {
      // 可以在这里跳转到403页面
      // import router from '@/router'; // 可能需要引入router
      // router.push('/403');
      window.location.href = '/403';
    }
    return Promise.reject(error);
  }
);


// 3. Mock方法映射 - 确保覆盖所有需要的接口，特别是认证接口
const mockMethodMap = {
  get: (url, params) => {
    const pathParts = url.split('/');
    console.log('[request.js MOCK] GET:', url, 'Params:', params);

    // --- 新增/确认 /auth/info 的Mock ---
    if (url === '/auth/info') {
      // 假设 mockService.getCurrentUser() 定义在 src/mock/users.js 或 src/mock/index.js
      // 并且返回类似 { code: 200, message: '...', data: { id: '...', username: '...', roles: ['...'] } } 的结构
      return mockService.getCurrentUser ? mockService.getCurrentUser() : Promise.resolve({ code: 500, message: 'Mock for getCurrentUser not found' });
    }
    // --- 结束 /auth/info 的Mock ---

    if (url.startsWith('/sales/orders')) {
      if (pathParts.length === 3) return mockService.getSalesOrderList(params);
      if (pathParts.length === 4) return mockService.getSalesOrderDetail(pathParts[3]);
    }
    if (url === '/products') return mockService.getProductList(params); // [cite: 1]
    if (url.startsWith('/products/')) return mockService.getProductDetail(pathParts[2]); // [cite: 1]
    if (url === '/customers') return mockService.getCustomerList(params); // [cite: 1]
    if (url.startsWith('/customers/')) return mockService.getCustomerDetail(pathParts[2]); // [cite: 1]

    if (url === '/purchase/requisitions') return mockService.getPurchaseRequisitionList(params); // [cite: 1]
    if (url.startsWith('/purchase/requisitions/')) return mockService.getPurchaseRequisitionDetail(pathParts[3]); // [cite: 1]
    if (url === '/purchase/orders') return mockService.getPurchaseOrderList(params); // [cite: 1]
    if (url.startsWith('/purchase/orders/')) return mockService.getPurchaseOrderDetail(pathParts[3]); // [cite: 1]

    if (url === '/basedata/suppliers') return mockService.getSupplierList(params); // [cite: 1]
    if (url.startsWith('/basedata/suppliers/')) return mockService.getSupplierDetail(pathParts[3]); // [cite: 1]

    if (url === '/inventory/inbound-orders') return mockService.getInboundOrderList(params); // [cite: 1]
    if (url.startsWith('/inventory/inbound-orders/')) return mockService.getInboundOrderDetail(pathParts[3]); // [cite: 1]
    if (url === '/inventory/pending-outbound-lines') return mockService.getPendingOutboundSalesOrderLines(params); // [cite: 1]
    if (url === '/inventory/outbound-orders/ready-to-ship') return mockService.getReadyToShipOutboundOrders(params); // [cite: 1]
    if (url === '/inventory/outbound-orders' && pathParts.length === 3) return mockService.getOutboundOrderList(params); // [cite: 1]
    if (url.startsWith('/inventory/outbound-orders/')) return mockService.getOutboundOrderDetail(pathParts[3]); // [cite: 1]
    if (url === '/sales/shipments') return mockService.getShipmentOrderList(params); // [cite: 1]
    if (url.startsWith('/sales/shipments/')) return mockService.getShipmentOrderDetail(pathParts[3]); // [cite: 1]
    if (url === '/basedata/logistics-carriers') return mockService.getLogisticsCarriers(params); // [cite: 1]

    // 系统管理部分
    if (url === '/system/users' && params) return mockService.getUserList(params); // 假设mockService有getUserList
     if (url.startsWith('/system/roles')) { // 假设获取所有角色列表
      return mockService.getRolesList ? mockService.getRolesList(params) : Promise.resolve({ code: 200, data: { content: [{id:'ROLE_ADMIN', name:'管理员'},{id:'ROLE_SALES', name:'销售员'}] }, message: 'Mock角色列表' });
    }


    console.warn(`[request.js MOCK] GET for ${url} not found.`);
    return Promise.resolve({ code: 404, message: `Mock API不存在: GET ${url}`, data: null });
  },
  post: (url, data) => {
    const pathParts = url.split('/');
    console.log('[request.js MOCK] POST:', url, 'Data:', data);

    // --- 新增 /auth/login 的Mock ---
    if (url === '/auth/login') {
      // 假设 mockService.login() 定义在 src/mock/users.js 或 src/mock/index.js
      // 它应该返回类似 { code: 200, message: '登录成功', data: { token: 'mock-token-xxxx' } } 的结构
      return mockService.login ? mockService.login(data) : Promise.resolve({ code: 200, data: { token: 'mock-jwt-token-12345' }, message: 'Mock登录成功' });
    }
    // --- 结束 /auth/login 的Mock ---

    if (url === '/sales/orders') return mockService.createSalesOrder(data); // [cite: 1]
    if (url.endsWith('/submit') && url.includes('/sales/orders/')) return mockService.submitSalesOrder(pathParts[3]); // [cite: 1]
    if (url.endsWith('/approve') && url.includes('/sales/orders/')) return mockService.approveSalesOrder(pathParts[3], data.approved, data.comment); // [cite: 1]

    if (url === '/purchase/requisitions') return mockService.createPurchaseRequisition(data); // [cite: 1]
    if (url.endsWith('/submit') && url.includes('/purchase/requisitions/')) return mockService.submitPurchaseRequisition(pathParts[3]); // [cite: 1]
    if (url.endsWith('/approve') && url.includes('/purchase/requisitions/')) return mockService.approvePurchaseRequisition(pathParts[3], data); // [cite: 1]
    if (url === '/purchase/orders') return mockService.createPurchaseOrder(data); // [cite: 1]
    if (url.endsWith('/receive') && url.includes('/purchase/orders/')) return mockService.confirmReceipt(pathParts[3], data); // [cite: 1]

    if (url === '/inventory/inbound-orders') return mockService.createInboundOrder(data); // [cite: 1]
    if (url.endsWith('/cancel') && url.includes('/inventory/inbound-orders/')) return mockService.cancelInboundOrder(pathParts[3]); // [cite: 1]
    if (url === '/inventory/outbound-orders') return mockService.createOutboundOrder(data); // [cite: 1]
    if (url === '/sales/shipments') return mockService.createShipmentOrder(data); // [cite: 1]
    if (url.endsWith('/delivered') && url.includes('/sales/shipments/')) return mockService.confirmShipmentDelivery(pathParts[3]); // [cite: 1]

    // 系统管理
    if (url === '/system/users') return mockService.createUser ? mockService.createUser(data) : Promise.resolve({ code: 200, data: {id: 'new-user', ...data}, message:'用户创建成功(Mock)'});
    if (url.startsWith('/system/users/') && url.endsWith('/roles')) return mockService.assignRolesToUser ? mockService.assignRolesToUser(pathParts[3], data) : Promise.resolve({code: 200, message: '角色分配成功(Mock)'});


    console.warn(`[request.js MOCK] POST for ${url} not found.`);
    return Promise.resolve({ code: 404, message: `Mock API不存在: POST ${url}`, data: null });
  },
  put: (url, data) => {
    const pathParts = url.split('/');
    console.log('[request.js MOCK] PUT:', url, 'Data:', data);

    if (url.startsWith('/sales/orders/')) return mockService.updateSalesOrder(pathParts[3], data); // [cite: 1]

    if (url.startsWith('/purchase/requisitions/')) return mockService.updatePurchaseRequisition(pathParts[3], data); // [cite: 1]
    if (url.startsWith('/purchase/orders/')) return mockService.updatePurchaseOrder(pathParts[3], data); // [cite: 1]

    if (url.startsWith('/inventory/inbound-orders/')) return mockService.updateInboundOrder(pathParts[3], data); // [cite: 1]
    if (url.startsWith('/inventory/outbound-orders/')) return mockService.updateOutboundOrder(pathParts[3], data); // [cite: 1]
    if (url.startsWith('/sales/shipments/')) return mockService.updateShipmentOrder(pathParts[3], data); // [cite: 1]

    // 系统管理
    if (url.startsWith('/system/users/') && !url.includes('/status') && !url.includes('/roles')) return mockService.updateUser ? mockService.updateUser(pathParts[3], data) : Promise.resolve({ code: 200, data: {id: pathParts[3], ...data}, message:'用户更新成功(Mock)'});
    if (url.startsWith('/system/users/') && url.endsWith('/status')) return mockService.changeUserStatus ? mockService.changeUserStatus(pathParts[3], data.enabled) : Promise.resolve({code: 200, message: '用户状态更新成功(Mock)'});


    console.warn(`[request.js MOCK] PUT for ${url} not found.`);
    return Promise.resolve({ code: 404, message: `Mock API不存在: PUT ${url}`, data: null });
  },
  delete: (url, params) => { // 注意：Axios的delete方法第二个参数通常是config，如果想传params，应该是 config.params
    const pathParts = url.split('/');
    console.log('[request.js MOCK] DELETE:', url, 'Params:', params);

    if (url.startsWith('/sales/orders/')) return mockService.deleteSalesOrder(pathParts[3]); // [cite: 1]
    if (url.startsWith('/purchase/requisitions/')) return mockService.deletePurchaseRequisition(pathParts[3]); // [cite: 1]
    if (url.startsWith('/purchase/orders/')) return mockService.deletePurchaseOrder(pathParts[3]); // [cite: 1]

    if (url.startsWith('/inventory/outbound-orders/')) return mockService.deleteOutboundOrder(pathParts[3]); // [cite: 1]
    if (url.startsWith('/sales/shipments/')) return mockService.deleteShipmentOrder(pathParts[3]); // [cite: 1]

    // 系统管理
    if (url.startsWith('/system/users/')) return mockService.deleteUser ? mockService.deleteUser(pathParts[3]) : Promise.resolve({ code: 200, message:'用户删除成功(Mock)'});

    console.warn(`[request.js MOCK] DELETE for ${url} not found.`);
    return Promise.resolve({ code: 404, message: `Mock API不存在: DELETE ${url}`, data: null });
  }
};

// 请求封装
const request = {
  async get(url, params) {
    // 如果是真实API路径，或者全局关闭Mock，则走真实请求
    if (isRealApiPath(url) || !useMock) {
      return service({ url, method: 'get', params });
    }
    // 否则，走Mock逻辑
    return mockMethodMap.get(url, params);
  },
  async post(url, data, config) { // 添加config参数
    if (isRealApiPath(url) || !useMock) {
      return service({ url, method: 'post', data, ...config }); // 将config展开
    }
    return mockMethodMap.post(url, data); // Mock时通常不处理config
  },
  async put(url, data, config) { // 添加config参数
    if (isRealApiPath(url) || !useMock) {
      return service({ url, method: 'put', data, ...config }); // 将config展开
    }
    return mockMethodMap.put(url, data);
  },
  async delete(url, params, config) { // 修改为params, config
    if (isRealApiPath(url) || !useMock) {
      // 对于axios.delete, 如果要传递查询参数，应该放在config.params中
      return service({ url, method: 'delete', params: params, ...config });
    }
    // Mock时，params可能直接就是ID，或者是一个对象，取决于mockMethodMap.delete的实现
    return mockMethodMap.delete(url, params);
  }
};

export default request;