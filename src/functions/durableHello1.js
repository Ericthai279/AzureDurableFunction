const { app } = require('@azure/functions');
const df = require('durable-functions');

const activityName = 'durableHello1';

df.app.orchestration('durableHello1Orchestrator', function* (context) {
    const tasks = [];
    tasks.push(context.df.callActivity(activityName, 'Tokyo'));
    tasks.push(context.df.callActivity(activityName, 'Seattle'));
    tasks.push(context.df.callActivity(activityName, 'Cairo'));

    const outputs = yield context.df.Task.all(tasks);

    return outputs;
});

df.app.activity(activityName, {
    handler: (input, context) => {
        const result = `Hello, ${input}`;
        context.log(`Activity processed: ${input} → ${result}`);
        return result;
    },
});

app.http('durableHello1HttpStart', {
    route: 'orchestrators/{orchestratorName}',
    extraInputs: [df.input.durableClient()],
    handler: async (request, context) => {
        const client = df.getClient(context);
        const body = await request.text();
        const instanceId = await client.startNew(request.params.orchestratorName, { input: body });

        context.log(`Started orchestration with ID = '${instanceId}'.`);

        return client.createCheckStatusResponse(request, instanceId);
    },
});
