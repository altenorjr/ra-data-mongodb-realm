import buildMongoDbRealmDataProvider from "./src";
import {
  cleanObj,
  cleanArray,
  cleanValue,
  preparseDocument,
  preparsePath,
  oid,
} from "./src/utils";

export default buildMongoDbRealmDataProvider;

import * as constants from "./src/constants";

export {
  cleanObj,
  cleanArray,
  cleanValue,
  preparseDocument,
  preparsePath,
  oid,
  constants,
};
