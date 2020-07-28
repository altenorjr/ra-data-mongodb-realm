export const GET_LIST = "getList";
export const GET_ONE = "getOne";
export const GET_MANY = "getMany";
export const GET_MANY_REFERENCE = "getManyReference";
export const CREATE = "create";
export const UPDATE = "update";
export const UPDATE_MANY = "updateMany";
export const DELETE = "delete";
export const DELETE_MANY = "deleteMany";

export const ALL_READS = [
  GET_LIST,
  GET_ONE,
  GET_MANY,
  GET_MANY_REFERENCE,
];

export const ALL_LISTS = [
  GET_LIST,
  GET_MANY,
  GET_MANY_REFERENCE,
];

export const ALL_WRITES = [
  CREATE,
  UPDATE,
  UPDATE_MANY,
  DELETE,
  DELETE_MANY,
];

export const ALL = [
  ...ALL_READS,
  ...ALL_LISTS,
  ...ALL_WRITES,
];
