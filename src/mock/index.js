// src/mock/index.js
import salesOrdersMock from './salesOrders';
import productsMock from './products'; // products.js 应该导出其数据和mock服务对象
import customersMock from './customers';
import usersMock from './users'; // 引入完整的 usersMock 对象
import suppliersMock from './suppliers';
import outboundOrdersMock from './outboundOrders';
import shipmentOrdersMock from './shipmentOrders';
import purchaseRequisitionsMock from './purchaseRequisitions';
import purchaseOrdersMock from './purchaseOrders';
import inboundOrdersMock from './inboundOrders';

// 统一导出所有Mock服务
// 确保每个 mock 文件都默认导出一个包含其所有 mock 方法的对象
export default {
  // 认证 & 用户管理 (从 usersMock 中解构或直接用 usersMock 的方法)
  login: usersMock.login,
  getCurrentUser: usersMock.getCurrentUser,
  getUserList: usersMock.getUserList,
  createUser: usersMock.createUser,
  updateUser: usersMock.updateUser,
  deleteUser: usersMock.deleteUser,
  getRolesList: usersMock.getRolesList, // 新增，用于获取角色列表
  assignRolesToUser: usersMock.assignRolesToUser, // 新增，用于分配角色

  // 其他模块的 Mock 服务
  ...salesOrdersMock,
  ...productsMock,
  ...customersMock,
  ...suppliersMock,
  ...outboundOrdersMock,
  ...shipmentOrdersMock,
  ...purchaseRequisitionsMock,
  ...purchaseOrdersMock,
  ...inboundOrdersMock,
};

// 辅助函数：随机ID生成
export function generateId(prefix = '') {
  const randomPart = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  return prefix ? `${prefix}-${randomPart}` : randomPart;
}

// 辅助函数：分页处理
export function paginateData(data, page = 0, size = 10) {
  const pageNumber = Number(page) || 0;
  const pageSize = Number(size) || 10;
  
  const startIndex = pageNumber * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = data.slice(startIndex, endIndex);

  return {
    content: paginatedData,
    totalElements: data.length,
    totalPages: Math.ceil(data.length / pageSize),
    size: pageSize,
    number: pageNumber,
    numberOfElements: paginatedData.length,
    first: pageNumber === 0,
    last: endIndex >= data.length
  };
}

// 辅助函数：过滤数据
export function filterData(data, filters) {
  if (!filters || Object.keys(filters).length === 0) {
    return data; 
  }
  return data.filter(item => {
    for (const key in filters) {
      const filterValue = String(filters[key]).trim().toLowerCase(); // 转小写以便不区分大小写比较
      if (filterValue !== '' && item.hasOwnProperty(key) && item[key] !== null && item[key] !== undefined) { // 确保属性存在且有值
        const itemValue = String(item[key]).toLowerCase(); // 转小写
        if (!itemValue.includes(filterValue)) {
          return false;
        }
      }
    }
    return true;
  });
}