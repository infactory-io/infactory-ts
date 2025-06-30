# Migration Guide: Infactory SDK v1.x.x to v2.0.0

This guide outlines the breaking changes and necessary updates when migrating your applications from Infactory SDK v1.x.x to v2.0.0.

## Overview of Major Changes

In v2.0.0, the SDK has undergone a significant restructuring to align with new backend services and improve clarity and consistency. Key changes include:

- **Client Restructuring**: The `InfactoryClient` now exposes new top-level clients (`client.build`, `client.run`, `client.connect`) to better categorize functionality.
- **Method Renames**: Several methods across various clients have been renamed for improved clarity and consistency.
- **Parameter Renames**: Some method parameters have been renamed.

---

## Breaking Changes

### 1. Database Client Changes

The `DatasourcesClient` methods related to database operations have been moved to the new `DatabaseClient` and renamed for better clarity.

**Old Methods (v1.x.x - `client.datasources`):**

- `testDatabaseConnection`
- `sampleDatabaseTables`
- `executeCustomSql`
- `validateSqlQuery`
- `validateSqlSyntax`
- `extractSqlParameters`

**New Methods (v2.0.0 - `client.database`):**

- `testConnection`
- `sampleTables`
- `executeSql`
- `validateQuery`
- `validateSyntax`
- `extractParameters`

**Example:**

**v1.x.x:**

```typescript
// src/clients/datasources-client.ts
await client.datasources.testDatabaseConnection(connectionString);
await client.datasources.sampleDatabaseTables({
  connectionString,
  tableNames,
  projectId,
  datasourceId,
  name,
});
await client.datasources.executeCustomSql({
  connectionString,
  sqlQuery,
  samplingSqlQuery,
  projectId,
  datasourceId,
  name,
});
await client.datasources.validateSqlQuery({ connectionString, sqlQuery });
await client.datasources.validateSqlSyntax({ connectionString, sqlQuery });
await client.datasources.extractSqlParameters(sqlQuery);
```

**v2.0.0:**

```typescript
// src/clients/database-client.ts
await client.database.testConnection(connectionString);
await client.database.sampleTables({
  connectionString,
  tableNames,
  projectId,
  datasourceId,
  name,
});
await client.database.executeSql({
  connectionString,
  sqlQuery,
  samplingSqlQuery,
  projectId,
  datasourceId,
  name,
});
await client.database.validateQuery({ connectionString, sqlQuery });
await client.database.validateSyntax({ connectionString, sqlQuery });
await client.database.extractParameters(sqlQuery);
```

---

### 2. APIs Client Changes

The `createApi` method on the `APIsClient` has been updated to use `slug` instead of `basePath` and `name` is now an optional parameter.

**BREAKING CHANGE: API Creation Parameter**
The `createApi` method on the `APIsClient` has been updated. The `basePath` parameter has been renamed to `slug`, and `name` is now optional.

**v1.x.x:**

```typescript
// src/clients/apis-client.ts
await client.apis.createApi({
  name: 'My API',
  projectId: 'project-id',
  basePath: 'my-api',
  version: 'v1',
  description: 'Description of my API',
});
```

**v2.0.0:**

```typescript
// src/clients/apis-client.ts
await client.apis.createApi({
  slug: 'my-api',
  projectId: 'project-id',
  version: 'v1',
  description: 'Description of my API',
});
```

---

### 3. Query Programs Client Changes

The `createQueryProgram` method on the `QueryProgramsClient` has been updated, renaming `query` and `queryProgram` parameters to `cue` and `code` respectively. Additionally, the `evaluateQueryProgramSync` method has been moved to the `client.run` client.

**BREAKING CHANGE: Query Program Creation Parameters**
The `createQueryProgram` method on the `QueryProgramsClient` has been updated. The `query` and `queryProgram` parameters have been renamed to `cue` and `code` respectively.

**v1.x.x:**

```typescript
// src/clients/queryprograms-client.ts
await client.queryPrograms.createQueryProgram({
  name: 'My Query Program',
  projectId: 'project-id',
  query: 'Show me the total number of users',
  queryProgram:
    'class AnswerQueryProgram(QueryProgram):\n    def run(self):\n        (self.load(At.A).count().max().move(At.A, At.MAIN))',
  published: false,
});
```

**v2.0.0:**

```typescript
// src/clients/queryprograms-client.ts
await client.queryPrograms.createQueryProgram({
  name: 'My Query Program',
  projectId: 'project-id',
  cue: 'Show me the total number of users',
  code: 'class AnswerQueryProgram(QueryProgram):\n    def run(self):\n        (self.load(At.A).count().max().move(At.A, At.MAIN))',
  published: false,
});
```

**BREAKING CHANGE: Query Program Evaluation Endpoint**
The `evaluateQueryProgramSync` method has been moved from `client.queryPrograms` to `client.run`.

**v1.x.x:**

```typescript
// src/clients/queryprograms-client.ts
const evaluateResponse = await client.queryPrograms.evaluateQueryProgramSync(
  projectId,
  queryProgramId,
);
```

**v2.0.0:**

```typescript
// src/clients/run-client.ts
const evaluateResponse = await client.run.evaluateQueryProgram(
  projectId,
  queryProgramId,
);
```

---

### 4. Generate Client Changes

The `generateQueryProgram` method on the `GenerateClient` has been moved to the `client.build` client and renamed to `createQueryProgram`.

**BREAKING CHANGE: Query Program Generation Endpoint**
The `generateQueryProgram` method has been moved from `client.generate` to `client.build` and renamed to `createQueryProgram`.

**v1.x.x:**

```typescript
// src/clients/generate-client.ts
const queryProgramResponse = await client.generate.generateQueryProgram({
  projectId,
  naturalLanguageQuery: 'Show me the top 5 products by sales revenue',
});
```

**v2.0.0:**

```typescript
// src/clients/build-client.ts
const queryProgramResponse = await client.build.createQueryProgram({
  projectId,
  naturalLanguageQuery: 'Show me the top 5 products by sales revenue',
});
```

---

### 5. Datasources Client Changes

The `connect` method on the `ActionsClient` (which is now deprecated) has been replaced by `uploadCsvFile` on the `DatasourcesClient`.

**BREAKING CHANGE: CSV Upload Method**
The `connect` method for CSV uploads has been removed. Use `client.datasources.uploadCsvFile` instead.

**v1.x.x:**

```typescript
// examples/connect-csv-generate-questions.ts
const connectResponse = await client.actions.connect({
  projectId: project.id,
  name: 'Mental Health Data',
  type: 'csv',
  filePath: csvFilePath,
});
```

**v2.0.0:**

```typescript
// examples/connect-csv-generate-questions.ts
const uploadResult = await client.datasources.uploadCsvFile(
  project.id,
  csvFilePath,
  'Mental Health Data',
);
const datasource = uploadResult.datasource;
```
