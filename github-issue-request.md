# Feature Request: Pass Payload API Instance to Task onSuccess and onFail Handlers

## Problem

When developing plugins that define custom tasks, the `onSuccess` and `onFail` handlers currently don't have access to a Payload API instance. This creates a significant limitation when trying to perform database operations or queue additional jobs from within these handlers.

Currently, to access the Payload API in these handlers, developers must:
1. Manually call `getPayload({ config: sanitizedConfig })`
2. Handle config sanitization themselves
3. Deal with complex deep cloning issues since `sanitizeConfig` mutates the original config object

This approach is problematic because:
- `sanitizeConfig` modifies the original config object, affecting plugin initialization
- Deep cloning config objects fails due to non-serializable functions
- It requires boilerplate code in every plugin that needs API access

## Proposed Solution

Pass a Payload API instance directly to `onSuccess` and `onFail` handlers, similar to how the main task `handler` receives `req.payload`.

### Current API
```typescript
const taskConfig: TaskConfig = {
  slug: 'myTask',
  onSuccess: async () => {
    // No access to Payload API - must manually create instance
    const payload = await getPayload({ config: await sanitizeConfig(config) })
    payload.jobs.run({ queue: 'my-queue', limit: 1 })
  },
  onFail: async () => {
    // Same issue here
  },
  handler: async ({ input, req }) => {
    const { payload } = req // ✅ API instance available
  }
}
```

### Proposed API
```typescript
const taskConfig: TaskConfig = {
  slug: 'myTask',
  onSuccess: async ({ payload }) => {
    // ✅ Payload API instance provided
    payload.jobs.run({ queue: 'my-queue', limit: 1 })
  },
  onFail: async ({ payload }) => {
    // ✅ Payload API instance provided
    payload.jobs.run({ queue: 'my-queue', limit: 1 })
  },
  handler: async ({ input, req }) => {
    const { payload } = req // ✅ Consistent API
  }
}
```

## Use Cases

This enhancement would enable:
- **Queue Management**: Triggering additional jobs on task completion/failure
- **Database Operations**: Updating records, logging task results
- **Notification Systems**: Sending alerts or updates based on task outcomes
- **Plugin Development**: Creating more sophisticated task workflows

## Benefits

1. **Consistency**: Aligns with the existing pattern used in task handlers
2. **Simplicity**: Eliminates boilerplate config sanitization code
3. **Reliability**: Avoids config mutation and cloning issues
4. **Developer Experience**: Makes plugin development more intuitive

## Implementation Notes

The Payload instance should be the same sanitized instance used by the task system, ensuring consistency and avoiding the config sanitization issues that currently plague plugin developers.