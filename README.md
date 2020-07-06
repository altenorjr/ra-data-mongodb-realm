# Usage

```javascript
import * as RealmWeb from "realm-web";

const app = new RealmWeb.App({
  id: process.env.REACT_APP_REALM_APP_ID,
});

import buildMongoDbRealmProvider, {
  preparseDocument,
  oid,
} from "ra-data-mongodb-realm";

import app from "./realm-app";

export default buildMongoDbRealmProvider({
  app,
  service: process.env.REACT_APP_REALM_SERVICE_NAME,
  db: process.env.REACT_APP_REALM_DB_NAME,
});
```
