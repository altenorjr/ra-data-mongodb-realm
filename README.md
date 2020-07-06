# Usage

```javascript
import * as RealmWeb from "realm-web";

import buildMongoDbRealmProvider, {
  preparseDocument,
  oid,
} from "ra-data-mongodb-realm";

const app = new RealmWeb.App({
  id: process.env.REACT_APP_REALM_APP_ID,
});

export default buildMongoDbRealmProvider({
  app,
  service: process.env.REACT_APP_REALM_SERVICE_NAME,
  db: process.env.REACT_APP_REALM_DB_NAME,
});
```
